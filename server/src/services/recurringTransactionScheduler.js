const mongoose = require("mongoose");
const { randomUUID } = require("crypto");

const RecurringTransaction = require("../models/RecurringTransaction");
const RecurringTransactionExecution = require("../models/RecurringTransactionExecution");
const Transaction = require("../models/Transaction");
const Category = require("../models/Category");
const Wallet = require("../models/Wallet");

const { calculateNextRunDate } = require("../utils/dateUtils");

const { toMinorUnits, fromMinorUnits } = require("../utils/moneyUtils");

const { createLedgerEntry } = require("./ledgerService");

const LOCK_DURATION_MS = 2 * 60 * 1000;
const HEARTBEAT_INTERVAL_MS = 30 * 1000;
const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 50;

const TRANSACTION_OPTIONS = {
  readPreference: "primary",
  readConcern: { level: "snapshot" },
  writeConcern: { w: "majority" },
};

const getIdempotencyKey = (scheduleId, scheduledFor) => {
  const dateKey = scheduledFor.toISOString().slice(0, 10);
  return `${scheduleId}:${dateKey}`;
};

const getRetryDelay = (attempts) => {
  const delay = 60 * 1000 * Math.pow(2, attempts - 1);
  return Math.min(delay, 30 * 60 * 1000);
};

const runInTransaction = async (callback) => {
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      result = await callback(session);
    }, TRANSACTION_OPTIONS);

    return result;
  } finally {
    await session.endSession();
  }
};

const claimDueSchedule = async () => {
  const now = new Date();
  const lockToken = randomUUID();

  return RecurringTransaction.findOneAndUpdate(
    {
      status: "active",
      nextRunDate: { $lte: now },
      $or: [
        { lockedUntil: null },
        { lockedUntil: { $exists: false } },
        { lockedUntil: { $lte: now } },
      ],
    },
    {
      $set: {
        lockToken,
        lockedUntil: new Date(now.getTime() + LOCK_DURATION_MS),
      },
    },
    {
      returnDocument: "after",
      sort: { nextRunDate: 1, _id: 1 },
    },
  );
};

const renewScheduleLock = async (schedule) => {
  const now = new Date();

  const updatedSchedule = await RecurringTransaction.findOneAndUpdate(
    {
      _id: schedule._id,
      status: "active",
      nextRunDate: schedule.nextRunDate,
      lockToken: schedule.lockToken,
      lockedUntil: { $gt: now },
    },
    {
      $set: {
        lockedUntil: new Date(now.getTime() + LOCK_DURATION_MS),
      },
    },
    { returnDocument: "after" },
  );

  return Boolean(updatedSchedule);
};

const assertScheduleLockOwnership = async (schedule) => {
  const ownsLock = await renewScheduleLock(schedule);

  if (!ownsLock) {
    const error = new Error("Schedule lock ownership was lost.");
    error.code = "SCHEDULE_LOCK_LOST";
    throw error;
  }
};

const validateExecutionCategory = async (schedule) => {
  const category = await Category.findOne({
    _id: schedule.category,
    type: schedule.type,
    isActive: true,
    $or: [
      { isDefault: true },
      {
        user: schedule.user,
        isDefault: false,
      },
    ],
  }).select("_id");

  if (!category) {
    throw new Error(
      "The recurring transaction category is unavailable or inactive.",
    );
  }
};

const validateExecutionWallet = async (schedule) => {
  if (!schedule.wallet) {
    return null;
  }

  const wallet = await Wallet.findOne({
    _id: schedule.wallet,
    user: schedule.user,
    status: "active",
  }).select("_id type");

  if (!wallet) {
    throw new Error(
      "The recurring transaction wallet is unavailable or inactive.",
    );
  }

  if (wallet.type === "credit_card" && schedule.type === "income") {
    throw new Error(
      "Income cannot be generated directly into a credit card wallet.",
    );
  }

  return wallet;
};

const getOrCreateExecution = async (schedule, scheduledFor, idempotencyKey) => {
  let execution = await RecurringTransactionExecution.findOne({
    idempotencyKey,
  });

  if (execution) {
    return execution;
  }

  try {
    return await RecurringTransactionExecution.create({
      recurringTransaction: schedule._id,
      user: schedule.user,
      scheduledFor,
      idempotencyKey,
      status: "failed",
      attempts: 0,
    });
  } catch (error) {
    if (error.code === 11000) {
      execution = await RecurringTransactionExecution.findOne({
        idempotencyKey,
      });

      if (execution) {
        return execution;
      }
    }

    throw error;
  }
};

const claimExecution = async (executionId) => {
  const now = new Date();
  const lockToken = randomUUID();

  return RecurringTransactionExecution.findOneAndUpdate(
    {
      _id: executionId,
      status: { $in: ["failed", "processing"] },
      attempts: { $lt: MAX_ATTEMPTS },
      $or: [
        { lockedUntil: null },
        { lockedUntil: { $exists: false } },
        { lockedUntil: { $lte: now } },
      ],
    },
    {
      $set: {
        status: "processing",
        lockToken,
        lockedUntil: new Date(now.getTime() + LOCK_DURATION_MS),
        lastError: null,
      },
      $inc: {
        attempts: 1,
      },
    },
    { returnDocument: "after" },
  );
};

const renewExecutionLock = async (execution) => {
  const now = new Date();

  const updatedExecution = await RecurringTransactionExecution.findOneAndUpdate(
    {
      _id: execution._id,
      status: "processing",
      lockToken: execution.lockToken,
      lockedUntil: { $gt: now },
    },
    {
      $set: {
        lockedUntil: new Date(now.getTime() + LOCK_DURATION_MS),
      },
    },
    { returnDocument: "after" },
  );

  return Boolean(updatedExecution);
};

const assertExecutionLockOwnership = async (execution) => {
  const ownsLock = await renewExecutionLock(execution);

  if (!ownsLock) {
    const error = new Error("Execution lock ownership was lost.");
    error.code = "EXECUTION_LOCK_LOST";
    throw error;
  }
};

const createLedgerForTransaction = async (
  transaction,
  idempotencyKey,
  session,
  requireActiveWallet = true,
) => {
  if (!transaction.wallet) {
    return;
  }

  const amount = toMinorUnits(transaction.amount.toString());

  const signedAmount = transaction.type === "income" ? amount : -amount;

  await createLedgerEntry(
    transaction.user,
    {
      wallet: transaction.wallet,
      amount: fromMinorUnits(signedAmount),
      entryType: transaction.type,
      sourceType: "recurring",
      sourceId: transaction._id,
      idempotencyKey: `recurring:${idempotencyKey}`,
    },
    {
      session,
      requireActiveWallet,
    },
  );
};

const reconcileExistingTransaction = async (transaction, idempotencyKey) => {
  return runInTransaction(async (session) => {
    const currentTransaction = await Transaction.findOne({
      _id: transaction._id,
      recurrenceKey: idempotencyKey,
    }).session(session);

    if (!currentTransaction) {
      throw new Error(
        "Previously generated recurring transaction could not be recovered.",
      );
    }

    await createLedgerForTransaction(
      currentTransaction,
      idempotencyKey,
      session,
      false,
    );

    return currentTransaction;
  });
};

const createOrRecoverTransaction = async (
  schedule,
  scheduledFor,
  idempotencyKey,
) => {
  try {
    return await runInTransaction(async (session) => {
      let transaction = await Transaction.findOne({
        recurrenceKey: idempotencyKey,
      }).session(session);

      if (transaction) {
        await createLedgerForTransaction(
          transaction,
          idempotencyKey,
          session,
          false,
        );

        return transaction;
      }

      await validateExecutionCategory(schedule);
      await validateExecutionWallet(schedule);

      const transactionPayload = {
        user: schedule.user,
        title: schedule.title,
        amount: schedule.amount,
        type: schedule.type,
        category: schedule.category,
        description: schedule.description,
        paymentMethod: schedule.paymentMethod,
        date: scheduledFor,
        wallet: schedule.wallet ?? null,
        recurrenceKey: idempotencyKey,
      };

      const [createdTransaction] = await Transaction.create(
        [transactionPayload],
        { session },
      );

      await createLedgerForTransaction(
        createdTransaction,
        idempotencyKey,
        session,
        true,
      );

      transaction = createdTransaction;

      return transaction;
    });
  } catch (error) {
    if (error.code === 11000) {
      const existingTransaction = await Transaction.findOne({
        recurrenceKey: idempotencyKey,
      });

      if (existingTransaction) {
        return reconcileExistingTransaction(
          existingTransaction,
          idempotencyKey,
        );
      }
    }

    throw error;
  }
};

const advanceSchedule = async (schedule, scheduledFor) => {
  const nextRunDate = calculateNextRunDate(scheduledFor, schedule.frequency);

  const shouldComplete = schedule.endDate && nextRunDate > schedule.endDate;

  return RecurringTransaction.findOneAndUpdate(
    {
      _id: schedule._id,
      status: "active",
      nextRunDate: scheduledFor,
      lockToken: schedule.lockToken,
      lockedUntil: { $gt: new Date() },
    },
    {
      $set: {
        lastRunDate: scheduledFor,
        nextRunDate,
        status: shouldComplete ? "completed" : "active",
        completedAt: shouldComplete ? new Date() : null,
        lockedUntil: null,
        lockToken: null,
      },
    },
    { returnDocument: "after" },
  );
};

const deferScheduleUntil = async (schedule, lockedUntil) => {
  return RecurringTransaction.findOneAndUpdate(
    {
      _id: schedule._id,
      status: "active",
      lockToken: schedule.lockToken,
      lockedUntil: { $gt: new Date() },
    },
    {
      $set: {
        lockedUntil,
        lockToken: null,
      },
    },
  );
};

const markExecutionFailed = async (execution, error) => {
  if (!execution) return null;

  return RecurringTransactionExecution.findOneAndUpdate(
    {
      _id: execution._id,
      status: "processing",
      lockToken: execution.lockToken,
      lockedUntil: { $gt: new Date() },
    },
    {
      $set: {
        status: "failed",
        lastError: String(error.message).slice(0, 1000),
        lockedUntil: null,
        lockToken: null,
      },
    },
    { returnDocument: "after" },
  );
};

const pauseAfterMaxAttempts = async (schedule) => {
  return RecurringTransaction.findOneAndUpdate(
    {
      _id: schedule._id,
      status: "active",
      lockToken: schedule.lockToken,
      lockedUntil: { $gt: new Date() },
    },
    {
      $set: {
        status: "paused",
        pausedAt: new Date(),
        lockedUntil: null,
        lockToken: null,
      },
    },
  );
};

const processClaimedSchedule = async (schedule) => {
  const scheduledFor = schedule.nextRunDate;

  const idempotencyKey = getIdempotencyKey(schedule._id, scheduledFor);

  let execution = null;
  let heartbeat = null;
  let heartbeatInProgress = false;
  let lockLost = false;
  let heartbeatError = null;

  try {
    await assertScheduleLockOwnership(schedule);

    const existingExecution = await getOrCreateExecution(
      schedule,
      scheduledFor,
      idempotencyKey,
    );

    if (existingExecution.status === "completed") {
      const recoveredSchedule = await advanceSchedule(schedule, scheduledFor);

      if (!recoveredSchedule) {
        throw new Error("Completed execution reconciliation failed.");
      }

      return {
        success: true,
        recovered: true,
      };
    }

    if (existingExecution.attempts >= MAX_ATTEMPTS) {
      const paused = await pauseAfterMaxAttempts(schedule);

      if (!paused) {
        throw new Error("Could not pause schedule after maximum attempts.");
      }

      return {
        success: false,
        paused: true,
      };
    }

    execution = await claimExecution(existingExecution._id);

    if (!execution) {
      if (
        existingExecution.lockedUntil &&
        existingExecution.lockedUntil > new Date()
      ) {
        await deferScheduleUntil(schedule, existingExecution.lockedUntil);
      } else {
        await deferScheduleUntil(schedule, new Date(Date.now() + 5000));
      }

      return {
        success: false,
        executionClaimedElsewhere: true,
      };
    }

    heartbeat = setInterval(async () => {
      if (heartbeatInProgress || lockLost) return;

      heartbeatInProgress = true;

      try {
        const [scheduleLock, executionLock] = await Promise.all([
          renewScheduleLock(schedule),
          renewExecutionLock(execution),
        ]);

        if (!scheduleLock || !executionLock) {
          lockLost = true;

          console.warn(
            `Worker lost lock ownership for schedule ${schedule._id}`,
          );
        }
      } catch (error) {
        heartbeatError = error;

        console.error("Scheduler heartbeat failed:", error.message);
      } finally {
        heartbeatInProgress = false;
      }
    }, HEARTBEAT_INTERVAL_MS);

    heartbeat.unref?.();

    await assertScheduleLockOwnership(schedule);
    await assertExecutionLockOwnership(execution);

    let transaction = await Transaction.findOne({
      recurrenceKey: idempotencyKey,
    });

    if (!transaction) {
      await validateExecutionCategory(schedule);
      await validateExecutionWallet(schedule);

      await assertScheduleLockOwnership(schedule);
      await assertExecutionLockOwnership(execution);

      transaction = await createOrRecoverTransaction(
        schedule,
        scheduledFor,
        idempotencyKey,
      );
    } else {
      transaction = await createOrRecoverTransaction(
        schedule,
        scheduledFor,
        idempotencyKey,
      );
    }

    if (lockLost || heartbeatError) {
      const error = new Error(
        "Scheduler heartbeat failed or lock ownership was lost.",
      );

      error.code = "EXECUTION_LOCK_LOST";
      throw error;
    }

    await assertScheduleLockOwnership(schedule);
    await assertExecutionLockOwnership(execution);

    const completedExecution =
      await RecurringTransactionExecution.findOneAndUpdate(
        {
          _id: execution._id,
          status: "processing",
          lockToken: execution.lockToken,
          lockedUntil: { $gt: new Date() },
        },
        {
          $set: {
            transaction: transaction._id,
            status: "completed",
            lastError: null,
            processedAt: new Date(),
            lockToken: null,
            lockedUntil: null,
          },
        },
        { returnDocument: "after" },
      );

    if (!completedExecution) {
      const error = new Error("Execution ownership lost before completion.");

      error.code = "EXECUTION_LOCK_LOST";
      throw error;
    }

    execution = completedExecution;

    const advancedSchedule = await advanceSchedule(schedule, scheduledFor);

    if (!advancedSchedule) {
      throw new Error(
        "Schedule advancement failed. Execution will be reconciled.",
      );
    }

    return {
      success: true,
      transactionId: transaction._id,
    };
  } catch (error) {
    if (
      lockLost ||
      error.code === "SCHEDULE_LOCK_LOST" ||
      error.code === "EXECUTION_LOCK_LOST"
    ) {
      console.warn(`Stale worker stopped for schedule ${schedule._id}`);

      return {
        success: false,
        lockLost: true,
      };
    }

    const scheduleOwnsLock = await renewScheduleLock(schedule).catch(
      () => false,
    );

    const executionOwnsLock = execution
      ? await renewExecutionLock(execution).catch(() => false)
      : false;

    if (!scheduleOwnsLock) {
      return {
        success: false,
        lockLost: true,
      };
    }

    if (execution && execution.status === "completed") {
      await deferScheduleUntil(schedule, new Date(Date.now() + 5000));

      console.error(
        "Execution completed; schedule advancement deferred:",
        error.message,
      );

      return {
        success: false,
        reconciliationPending: true,
      };
    }

    if (!executionOwnsLock) {
      return {
        success: false,
        lockLost: true,
      };
    }

    const attempts = execution.attempts;

    const failedExecution = await markExecutionFailed(execution, error);

    if (!failedExecution) {
      return {
        success: false,
        lockLost: true,
      };
    }

    const shouldPause = attempts >= MAX_ATTEMPTS;

    const retryAt = new Date(Date.now() + getRetryDelay(attempts));

    const scheduleUpdate = await RecurringTransaction.findOneAndUpdate(
      {
        _id: schedule._id,
        status: "active",
        lockToken: schedule.lockToken,
        lockedUntil: { $gt: new Date() },
      },
      {
        $set: {
          status: shouldPause ? "paused" : "active",
          pausedAt: shouldPause ? new Date() : null,
          lockedUntil: shouldPause ? null : retryAt,
          lockToken: null,
        },
      },
    );

    if (!scheduleUpdate) {
      console.error(
        "Schedule retry update failed because lock ownership was lost.",
      );

      return {
        success: false,
        lockLost: true,
      };
    }

    console.error(`Recurring schedule ${schedule._id} failed:`, error.message);

    return {
      success: false,
      error: error.message,
      attempts,
      retryAt: shouldPause ? null : retryAt,
      paused: shouldPause,
    };
  } finally {
    if (heartbeat) {
      clearInterval(heartbeat);

      while (heartbeatInProgress) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }
  }
};

const processDueRecurringTransactions = async ({
  batchSize = BATCH_SIZE,
} = {}) => {
  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  while (processed < batchSize) {
    const schedule = await claimDueSchedule();

    if (!schedule) break;

    const result = await processClaimedSchedule(schedule);

    processed += 1;

    if (result.success) {
      succeeded += 1;
    } else {
      failed += 1;
    }
  }

  return {
    processed,
    succeeded,
    failed,
  };
};

module.exports = {
  processDueRecurringTransactions,
  claimDueSchedule,
  claimExecution,
  processClaimedSchedule,
  renewScheduleLock,
  renewExecutionLock,
};

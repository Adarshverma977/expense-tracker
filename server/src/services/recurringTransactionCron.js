const cron = require("node-cron");

const {
  processDueRecurringTransactions,
} = require("./recurringTransactionScheduler");

let schedulerTask = null;
let isRunning = false;

const startRecurringTransactionCron = () => {
  if (schedulerTask) {
    console.log("Recurring transaction scheduler is already running.");
    return schedulerTask;
  }

  schedulerTask = cron.schedule(
    "* * * * *",
    async () => {
      if (isRunning) {
        return;
      }

      isRunning = true;

      try {
        const result = await processDueRecurringTransactions();

        if (result.processed > 0) {
          console.log("Recurring transaction scheduler completed:", result);
        }
      } catch (error) {
        console.error("Recurring transaction scheduler error:", error.message);
      } finally {
        isRunning = false;
      }
    },
    {
      timezone: "UTC",
    },
  );

  console.log("Recurring transaction scheduler started (every minute, UTC).");

  return schedulerTask;
};

const stopRecurringTransactionCron = () => {
  if (schedulerTask) {
    schedulerTask.stop();
    schedulerTask = null;
  }

  console.log("Recurring transaction scheduler stopped.");
};

module.exports = {
  startRecurringTransactionCron,
  stopRecurringTransactionCron,
};

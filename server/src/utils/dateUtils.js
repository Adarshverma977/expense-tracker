const AppError = require("./AppError");

const VALID_FREQUENCIES = ["daily", "weekly", "monthly", "yearly"];

const cloneDate = (date) => new Date(date.getTime());

const getUtcStartOfDay = (date) => {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
};

// Validate strict YYYY-MM-DD calendar dates.
const parseDateOnly = (value, message) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new AppError(message, 400);
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new AppError(message, 400);
  }

  return date;
};

const addDays = (date, days) => {
  const result = cloneDate(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

const addMonths = (date, months) => {
  const originalDay = date.getUTCDate();

  const result = cloneDate(date);
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);

  const lastDayOfMonth = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate();

  result.setUTCDate(Math.min(originalDay, lastDayOfMonth));

  return result;
};

const addYears = (date, years) => {
  const originalMonth = date.getUTCMonth();
  const originalDay = date.getUTCDate();

  const result = cloneDate(date);
  result.setUTCDate(1);
  result.setUTCFullYear(result.getUTCFullYear() + years);
  result.setUTCMonth(originalMonth);

  const lastDayOfMonth = new Date(
    Date.UTC(result.getUTCFullYear(), originalMonth + 1, 0),
  ).getUTCDate();

  result.setUTCDate(Math.min(originalDay, lastDayOfMonth));

  return result;
};

const validateDate = (date, message) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new AppError(message, 400);
  }
};

const validateFrequency = (frequency) => {
  if (!VALID_FREQUENCIES.includes(frequency)) {
    throw new AppError("Invalid recurrence frequency.", 400);
  }
};

const calculateNextRunDate = (currentDate, frequency) => {
  validateDate(currentDate, "Invalid recurrence date.");
  validateFrequency(frequency);

  switch (frequency) {
    case "daily":
      return addDays(currentDate, 1);

    case "weekly":
      return addDays(currentDate, 7);

    case "monthly":
      return addMonths(currentDate, 1);

    case "yearly":
      return addYears(currentDate, 1);

    default:
      throw new AppError("Unsupported recurrence frequency.", 400);
  }
};

const calculateNextFutureRunDate = (
  currentDate,
  frequency,
  referenceDate = new Date(),
) => {
  validateDate(currentDate, "Invalid recurrence date.");
  validateDate(referenceDate, "Invalid reference date.");
  validateFrequency(frequency);

  const referenceDay = getUtcStartOfDay(referenceDate);

  let nextDate = cloneDate(currentDate);

  // Today's occurrence is still valid.
  while (getUtcStartOfDay(nextDate) < referenceDay) {
    nextDate = calculateNextRunDate(nextDate, frequency);
  }

  return nextDate;
};

const validateScheduleDates = (startDate, endDate) => {
  let start;
  let end = null;

  if (startDate instanceof Date) {
    start = startDate;
    validateDate(start, "Invalid schedule start date.");
  } else {
    start = parseDateOnly(startDate, "Invalid schedule start date.");
  }

  if (endDate !== null && endDate !== undefined) {
    if (endDate instanceof Date) {
      end = endDate;
      validateDate(end, "Invalid schedule end date.");
    } else {
      end = parseDateOnly(endDate, "Invalid schedule end date.");
    }

    if (end < start) {
      throw new AppError("End date cannot be before the start date.", 400);
    }
  }

  return true;
};

module.exports = {
  VALID_FREQUENCIES,
  addDays,
  addMonths,
  addYears,
  calculateNextRunDate,
  calculateNextFutureRunDate,
  validateScheduleDates,
};

const AppError = require("./AppError");

const CSV_HEADERS = [
  "title",
  "amount",
  "type",
  "category",
  "description",
  "date",
  "paymentMethod",
];

const MAX_AMOUNT_PAISE = 99999999999999n;
const INDIA_UTC_OFFSET_MINUTES = 330;

const normalizeHeader = (header) => {
  return String(header || "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
};

// Parse monetary values without floating-point calculations.
const parseCsvAmount = (value) => {
  const amount = String(value ?? "").trim();

  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(amount)) {
    throw new Error(
      "Amount must be a positive number with at most 2 decimal places.",
    );
  }

  const [wholePart, decimalPart = ""] = amount.split(".");

  const paise = BigInt(wholePart + decimalPart.padEnd(2, "0"));

  if (paise <= 0n || paise > MAX_AMOUNT_PAISE) {
    throw new Error("Amount is outside the allowed range.");
  }

  return amount;
};

// Validate a calendar date without JavaScript date normalization.
const isValidCalendarDate = (year, month, day) => {
  if (month < 1 || month > 12 || day < 1) {
    return false;
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const parseCsvDate = (value) => {
  const dateValue = String(value ?? "").trim();

  if (!dateValue) {
    throw new Error("Transaction date is required.");
  }

  // Accept YYYY-MM-DD as an India calendar date.
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);

  if (dateOnlyMatch) {
    const [, yearString, monthString, dayString] = dateOnlyMatch;

    const year = Number(yearString);
    const month = Number(monthString);
    const day = Number(dayString);

    if (!isValidCalendarDate(year, month, day)) {
      throw new Error("Invalid transaction date.");
    }

    // IST midnight converted to UTC.
    return new Date(
      Date.UTC(year, month - 1, day) - INDIA_UTC_OFFSET_MINUTES * 60 * 1000,
    );
  }

  // Accept ISO datetime with an explicit timezone.
  const isoDateTime =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|([+-])(\d{2}):(\d{2}))$/;

  const match = isoDateTime.exec(dateValue);

  if (!match) {
    throw new Error("Date must use YYYY-MM-DD or ISO datetime with timezone.");
  }

  const [
    ,
    yearString,
    monthString,
    dayString,
    hourString,
    minuteString,
    secondString = "0",
    ,
    timezone,
    offsetSign,
    offsetHourString,
    offsetMinuteString,
  ] = match;

  const year = Number(yearString);
  const month = Number(monthString);
  const day = Number(dayString);
  const hour = Number(hourString);
  const minute = Number(minuteString);
  const second = Number(secondString);

  if (
    !isValidCalendarDate(year, month, day) ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    throw new Error("Invalid transaction date.");
  }

  if (timezone !== "Z") {
    const offsetHour = Number(offsetHourString);
    const offsetMinute = Number(offsetMinuteString);

    if (offsetHour > 23 || offsetMinute > 59) {
      throw new Error("Invalid transaction timezone offset.");
    }

    // RFC 3339 offsets are limited to 14 hours.
    if (offsetHour > 14 || (offsetHour === 14 && offsetMinute !== 0)) {
      throw new Error("Invalid transaction timezone offset.");
    }

    // Reject negative zero offset.
    if (offsetSign === "-" && offsetHour === 0 && offsetMinute === 0) {
      throw new Error("Invalid transaction timezone offset.");
    }
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid transaction date.");
  }

  return date;
};

const normalizePaymentMethod = (value) => {
  const paymentMethod = String(value || "other")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  const allowedMethods = ["cash", "upi", "card", "bank_transfer", "other"];

  if (!allowedMethods.includes(paymentMethod)) {
    throw new Error("Invalid payment method.");
  }

  return paymentMethod;
};

// Prevent spreadsheet formula execution.
const protectCsvFormula = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);

  // Detect formula characters after leading whitespace/control characters.
  if (/^[\s\u0000-\u001F]*[=+\-@]/.test(text)) {
    return `'${text}`;
  }

  return text;
};

const validateCsvHeaders = (headers) => {
  if (!Array.isArray(headers) || headers.length === 0) {
    throw new AppError("CSV file must contain a header row.", 400);
  }

  const normalizedHeaders = headers.map(normalizeHeader);

  if (
    normalizedHeaders.some((header) => !header) ||
    new Set(normalizedHeaders).size !== normalizedHeaders.length
  ) {
    throw new AppError("CSV contains empty or duplicate column headers.", 400);
  }

  const requiredHeaders = ["title", "amount", "type", "category", "date"];

  const missingHeaders = requiredHeaders.filter(
    (header) => !normalizedHeaders.includes(header),
  );

  if (missingHeaders.length > 0) {
    throw new AppError(
      `Missing required CSV columns: ${missingHeaders.join(", ")}.`,
      400,
    );
  }

  const allowedHeaders = CSV_HEADERS.map(normalizeHeader);

  const unsupportedHeaders = normalizedHeaders.filter(
    (header) => !allowedHeaders.includes(header),
  );

  if (unsupportedHeaders.length > 0) {
    throw new AppError(
      `Unsupported CSV columns: ${unsupportedHeaders.join(", ")}.`,
      400,
    );
  }

  return normalizedHeaders;
};

module.exports = {
  CSV_HEADERS,
  normalizeHeader,
  parseCsvAmount,
  parseCsvDate,
  normalizePaymentMethod,
  protectCsvFormula,
  validateCsvHeaders,
};

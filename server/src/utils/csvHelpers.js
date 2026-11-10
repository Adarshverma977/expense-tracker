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

const MAX_AMOUNT = 999999999999.99;

const normalizeHeader = (header) => {
  return String(header || "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
};

const parseCsvAmount = (value) => {
  const amount = String(value ?? "").trim();

  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(amount)) {
    throw new Error(
      "Amount must be a positive number with at most 2 decimal places.",
    );
  }

  const [wholePart] = amount.split(".");

  if (
    wholePart.length > 12 ||
    Number(amount) <= 0 ||
    Number(amount) > MAX_AMOUNT
  ) {
    throw new Error("Amount is outside the allowed range.");
  }

  return amount;
};

const parseCsvDate = (value) => {
  const dateValue = String(value ?? "").trim();

  if (!dateValue) {
    throw new Error("Transaction date is required.");
  }

  // Accept YYYY-MM-DD without timezone ambiguity.
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;

    const date = new Date(
      Date.UTC(Number(year), Number(month) - 1, Number(day)),
    );

    if (
      date.getUTCFullYear() !== Number(year) ||
      date.getUTCMonth() !== Number(month) - 1 ||
      date.getUTCDate() !== Number(day)
    ) {
      throw new Error("Invalid transaction date.");
    }

    return date;
  }

  // Accept ISO datetime with timezone.
  const isoDateTime =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;

  if (!isoDateTime.test(dateValue)) {
    throw new Error("Date must use YYYY-MM-DD or ISO datetime with timezone.");
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

const protectCsvFormula = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);

  // Prevent spreadsheet formula execution.
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

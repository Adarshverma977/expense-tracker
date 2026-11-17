const mongoose = require("mongoose");
const AppError = require("./AppError");

const MAX_AMOUNT_PAISE = 99999999999999n;

const parseAmount = (value, options = {}) => {
  const { allowZero = false, allowNegative = false } = options;

  if (typeof value !== "string" && typeof value !== "number") {
    throw new AppError("A valid monetary amount is required.", 400);
  }

  const amount = String(value).trim();
  const pattern = allowNegative
    ? /^-?(?:0|[1-9]\d*)(?:\.\d{1,2})?$/
    : /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;

  if (amount.length > 16 || !pattern.test(amount)) {
    throw new AppError(
      "Amount must be a valid number with at most 2 decimal places.",
      400,
    );
  }

  const isNegative = amount.startsWith("-");
  const unsignedAmount = isNegative ? amount.slice(1) : amount;
  const [whole, fraction = ""] = unsignedAmount.split(".");

  let minorUnits = BigInt(whole + fraction.padEnd(2, "0"));

  if (!allowZero && minorUnits === 0n) {
    throw new AppError("Amount must be greater than zero.", 400);
  }

  if (minorUnits > MAX_AMOUNT_PAISE) {
    throw new AppError("Amount exceeds the allowed limit.", 400);
  }

  if (isNegative && minorUnits > 0n) {
    minorUnits = -minorUnits;
  }

  return minorUnits;
};

const toMinorUnits = (value, options = {}) => {
  if (typeof value === "bigint") {
    const absolute = value < 0n ? -value : value;

    if (
      (!options.allowZero && value === 0n) ||
      (!options.allowNegative && value < 0n) ||
      absolute > MAX_AMOUNT_PAISE
    ) {
      throw new AppError("Invalid monetary amount.", 400);
    }

    return value;
  }

  if (value instanceof mongoose.Types.Decimal128) {
    return parseAmount(value.toString(), {
      ...options,
      allowZero: true,
    });
  }

  return parseAmount(value, options);
};

const fromMinorUnits = (minorUnits) => {
  if (typeof minorUnits !== "bigint") {
    throw new AppError("Invalid minor unit value.", 400);
  }

  const sign = minorUnits < 0n ? "-" : "";
  const absolute = minorUnits < 0n ? -minorUnits : minorUnits;

  if (absolute > MAX_AMOUNT_PAISE) {
    throw new AppError("Amount exceeds the allowed limit.", 400);
  }

  const whole = absolute / 100n;
  const fraction = (absolute % 100n).toString().padStart(2, "0");

  return `${sign}${whole}.${fraction}`;
};

const toDecimal128 = (value, options = {}) => {
  const minorUnits = toMinorUnits(value, options);

  return mongoose.Types.Decimal128.fromString(fromMinorUnits(minorUnits));
};

const decimal128ToMinorUnits = (value) => {
  if (!(value instanceof mongoose.Types.Decimal128)) {
    throw new AppError("A valid Decimal128 value is required.", 400);
  }

  return toMinorUnits(value, { allowZero: true, allowNegative: true });
};

const addMoney = (first, second) => {
  return (
    toMinorUnits(first, { allowZero: true, allowNegative: true }) +
    toMinorUnits(second, { allowZero: true, allowNegative: true })
  );
};

const subtractMoney = (first, second) => {
  return (
    toMinorUnits(first, { allowZero: true, allowNegative: true }) -
    toMinorUnits(second, { allowZero: true, allowNegative: true })
  );
};

const compareMoney = (first, second) => {
  const firstValue = toMinorUnits(first, {
    allowZero: true,
    allowNegative: true,
  });

  const secondValue = toMinorUnits(second, {
    allowZero: true,
    allowNegative: true,
  });

  if (firstValue > secondValue) return 1;
  if (firstValue < secondValue) return -1;

  return 0;
};

module.exports = {
  MAX_AMOUNT_PAISE,
  parseAmount,
  toMinorUnits,
  fromMinorUnits,
  toDecimal128,
  decimal128ToMinorUnits,
  addMoney,
  subtractMoney,
  compareMoney,
};

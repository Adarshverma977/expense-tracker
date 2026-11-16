
import { motion } from "framer-motion";
import {
  Pencil,
  Trash2,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
} from "lucide-react";

const INTEGER_CURRENCY_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const parseMinorUnits = (value) => {
  const amount = String(value ?? "").trim();

  const match = amount.match(
    /^([+-]?)(\d+)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/
  );

  if (!match) return null;

  const [, sign, whole, fraction = "", exponentText = "0"] = match;
  const exponent = Number(exponentText);

  if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > 100) {
    return null;
  }

  const digits = whole + fraction;
  const scale = fraction.length - exponent;

  let minorUnits;

  if (scale <= 2) {
    minorUnits = BigInt(digits) * 10n ** BigInt(2 - scale);
  } else {
    const divisor = 10n ** BigInt(scale - 2);
    const rawValue = BigInt(digits);

    if (rawValue % divisor !== 0n) return null;

    minorUnits = rawValue / divisor;
  }

  return sign === "-" ? -minorUnits : minorUnits;
};

const formatCurrency = (amount) => {
  const minorUnits = parseMinorUnits(amount);

  if (minorUnits === null) {
    return "₹0.00";
  }

  const isNegative = minorUnits < 0n;
  const absoluteAmount = isNegative ? -minorUnits : minorUnits;

  const whole = absoluteAmount / 100n;
  const fraction = String(absoluteAmount % 100n).padStart(2, "0");

  const formattedWhole = INTEGER_CURRENCY_FORMATTER.format(
    isNegative ? -whole : whole
  );

  return `${formattedWhole}.${fraction}`;
};

const getSafeNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const getStatus = (budget, spent, limit, percentage) => {
  if (spent > limit || budget.status === "exceeded") {
    return {
      label: "Exceeded",
      className: "exceeded",
      Icon: CircleAlert,
    };
  }

  if (budget.status === "warning" || percentage >= 80) {
    return {
      label: "Near limit",
      className: "warning",
      Icon: AlertTriangle,
    };
  }

  return {
    label: "On track",
    className: "safe",
    Icon: CheckCircle2,
  };
};

const BudgetCard = ({ budget, onEdit, onDelete }) => {
  const spent = parseMinorUnits(budget?.spentAmount) ?? 0n;
  const allocated = parseMinorUnits(budget?.amount) ?? 0n;

  const remaining =
    parseMinorUnits(budget?.remainingAmount) ??
    allocated - spent;

  const percentage = getSafeNumber(
    budget?.utilizationPercentage
  );

  const progress = Math.min(Math.max(percentage, 0), 100);

  const status = getStatus(
    budget || {},
    spent,
    allocated,
    percentage
  );

  const StatusIcon = status.Icon;

  const category =
    budget?.category && typeof budget.category === "object"
      ? budget.category
      : {};

  const categoryName =
    typeof category.name === "string" && category.name.trim()
      ? category.name.trim()
      : "Unknown category";

  const categoryColor =
    typeof category.color === "string" && category.color.trim()
      ? category.color
      : "var(--color-primary)";

  const remainingLabel =
    remaining < 0n ? "Over budget" : "Remaining";

  const absoluteRemaining =
    remaining < 0n ? -remaining : remaining;

  return (
    <motion.article
      className={`budget-card budget-card-${status.className}`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{
        duration: 0.25,
        ease: "easeOut",
      }}
    >
      <div className="budget-card-header">
        <div className="budget-category-info">
          <div
            className="budget-category-icon"
            style={{
              "--budget-category-color": categoryColor,
            }}
          >
            <Wallet size={21} strokeWidth={1.9} />
          </div>

          <div>
            <h3 title={categoryName}>{categoryName}</h3>
            <span>Monthly budget</span>
          </div>
        </div>

        <div className="budget-card-actions">
          <button
            type="button"
            onClick={() => onEdit?.(budget)}
            aria-label={`Edit ${categoryName} budget`}
            title="Edit budget"
          >
            <Pencil size={16} />
          </button>

          <button
            type="button"
            onClick={() => onDelete?.(budget)}
            aria-label={`Delete ${categoryName} budget`}
            title="Delete budget"
            className="budget-delete-action"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="budget-card-amounts">
        <div>
          <span>Spent</span>
          <strong>{formatCurrency(spent.toString())}</strong>
        </div>

        <div className="budget-card-limit">
          <span>Budget limit</span>
          <strong>{formatCurrency(allocated.toString())}</strong>
        </div>
      </div>

      <div className="budget-card-progress">
        <div className="budget-card-progress-heading">
          <span>Budget utilization</span>
          <strong>{percentage.toFixed(1)}%</strong>
        </div>

        <div
          className="budget-progress-track"
          role="progressbar"
          aria-label={`${categoryName} budget utilization`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-valuetext={`${percentage.toFixed(1)} percent utilized`}
        >
          <motion.div
            className="budget-progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{
              duration: 0.7,
              ease: "easeOut",
            }}
          />
        </div>
      </div>

      <div className="budget-card-footer">
        <div className={`budget-status ${status.className}`}>
          <StatusIcon size={15} />
          <span>{status.label}</span>
        </div>

        <div className="budget-remaining">
          <span>{remainingLabel}</span>
          <strong>
            {formatCurrency(absoluteRemaining.toString())}
          </strong>
        </div>
      </div>
    </motion.article>
  );
};

export default BudgetCard;

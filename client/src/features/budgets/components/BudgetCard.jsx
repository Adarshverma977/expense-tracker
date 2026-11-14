
import { motion } from "framer-motion";
import {
  Pencil,
  Trash2,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
} from "lucide-react";

const formatCurrency = (amount) => {
  const value = Number(amount);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
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
  const spent = getSafeNumber(budget?.spentAmount);
  const allocated = getSafeNumber(budget?.amount);

  const remaining = getSafeNumber(
    budget?.remainingAmount,
    allocated - spent
  );

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
    remaining < 0 ? "Over budget" : "Remaining";

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
          <strong>{formatCurrency(spent)}</strong>
        </div>

        <div className="budget-card-limit">
          <span>Budget limit</span>
          <strong>{formatCurrency(allocated)}</strong>
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
          <strong>{formatCurrency(Math.abs(remaining))}</strong>
        </div>
      </div>
    </motion.article>
  );
};

export default BudgetCard;

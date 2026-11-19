
import { motion, useReducedMotion } from "framer-motion";
import {
  Pencil,
  Archive,
  Wallet,
  CalendarDays,
  CreditCard,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  Clock3,
  IndianRupee,
} from "lucide-react";
import "./BillCard.css";

const INTEGER_CURRENCY_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const parseMinorUnits = (value) => {
  const amount = String(value ?? "").trim();

  if (!amount || amount.length > 100) return null;

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

  try {
    if (scale <= 2) {
      minorUnits =
        BigInt(digits) * 10n ** BigInt(2 - scale);
    } else {
      const divisor = 10n ** BigInt(scale - 2);
      const rawValue = BigInt(digits);

      if (rawValue % divisor !== 0n) return null;

      minorUnits = rawValue / divisor;
    }
  } catch {
    return null;
  }

  return sign === "-" ? -minorUnits : minorUnits;
};

const formatCurrency = (value) => {
  const minorUnits = parseMinorUnits(value);

  if (minorUnits === null) return "₹0.00";

  const isNegative = minorUnits < 0n;
  const absoluteAmount = isNegative ? -minorUnits : minorUnits;

  const whole = absoluteAmount / 100n;
  const fraction = String(absoluteAmount % 100n).padStart(2, "0");

  const formattedWhole = INTEGER_CURRENCY_FORMATTER.format(
    isNegative ? -whole : whole
  );

  return `${formattedWhole}.${fraction}`;
};

const parseCalendarDate = (value) => {
  if (!value) return null;

  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date;
};

const formatDate = (value) => {
  const date = parseCalendarDate(value);

  if (!date) return "Date unavailable";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getDaysUntilDue = (dueDate) => {
  const due = parseCalendarDate(dueDate);

  if (!due) return null;

  const today = new Date();

  const dueDay = Date.UTC(
    due.getFullYear(),
    due.getMonth(),
    due.getDate()
  );

  const todayDay = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  return Math.round((dueDay - todayDay) / 86400000);
};

const getFrequencyLabel = (frequency) => {
  const labels = {
    one_time: "One time",
    weekly: "Weekly",
    monthly: "Monthly",
    quarterly: "Quarterly",
    yearly: "Yearly",
  };

  return labels[frequency] || "Other";
};

const getStatusDetails = (status, daysUntilDue) => {
  if (status === "paid") {
    return {
      label: "Paid",
      className: "paid",
      Icon: CheckCircle2,
    };
  }

  if (status === "archived") {
    return {
      label: "Archived",
      className: "archived",
      Icon: Archive,
    };
  }

  if (status === "paused") {
    return {
      label: "Paused",
      className: "paused",
      Icon: Clock3,
    };
  }

  if (daysUntilDue !== null && daysUntilDue < 0) {
    return {
      label: "Overdue",
      className: "overdue",
      Icon: CircleAlert,
    };
  }

  if (daysUntilDue === 0) {
    return {
      label: "Due today",
      className: "due-today",
      Icon: AlertTriangle,
    };
  }

  if (daysUntilDue !== null && daysUntilDue <= 3) {
    return {
      label: "Due soon",
      className: "due-soon",
      Icon: AlertTriangle,
    };
  }

  return {
    label: "Upcoming",
    className: "upcoming",
    Icon: CheckCircle2,
  };
};

const BillCard = ({ bill, onEdit, onArchive, onPay }) => {
  const shouldReduceMotion = useReducedMotion();

  if (!bill) return null;

  const daysUntilDue = getDaysUntilDue(bill.dueDate);
  const status = getStatusDetails(bill.status, daysUntilDue);
  const StatusIcon = status.Icon;

  const category =
    bill.category && typeof bill.category === "object"
      ? bill.category
      : {};

  const wallet =
    bill.wallet && typeof bill.wallet === "object"
      ? bill.wallet
      : null;

  const title =
    typeof bill.title === "string" && bill.title.trim()
      ? bill.title.trim()
      : "Untitled bill";

  const categoryName = category.name || "Uncategorized";
  const categoryColor = category.color || "var(--color-primary)";

  const isPayable = bill.status === "active";
  const isArchived = bill.status === "archived";
  const isPaid = bill.status === "paid";

  const dueLabel =
    daysUntilDue === null
      ? "Due date unavailable"
      : daysUntilDue < 0
        ? `${Math.abs(daysUntilDue)} days overdue`
        : daysUntilDue === 0
          ? "Due today"
          : daysUntilDue === 1
            ? "Due tomorrow"
            : `Due in ${daysUntilDue} days`;

  return (
    <motion.article
      className={`bill-card bill-card-${status.className}`}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      whileHover={shouldReduceMotion ? undefined : { y: -4 }}
      transition={{
        duration: 0.25,
        ease: "easeOut",
      }}
    >
      <div className="bill-card-header">
        <div className="bill-card-title-group">
          <div
            className="bill-category-icon"
            style={{
              "--bill-category-color": categoryColor,
            }}
          >
            <Receipt size={21} strokeWidth={1.9} />
          </div>

          <div className="bill-card-title-info">
            <h3 title={title}>{title}</h3>
            <span>{bill.payee || categoryName}</span>
          </div>
        </div>

        <div className="bill-card-actions">
          <button
            type="button"
            onClick={() => onEdit?.(bill)}
            aria-label={`Edit ${title}`}
            title="Edit bill"
            disabled={isArchived || isPaid}
          >
            <Pencil size={16} />
          </button>

          {!isArchived && (
            <button
              type="button"
              onClick={() => onArchive?.(bill)}
              aria-label={`Archive ${title}`}
              title="Archive bill"
              className="bill-archive-action"
            >
              <Archive size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="bill-card-amount-section">
        <span>Bill amount</span>
        <strong>{formatCurrency(bill.amount)}</strong>
      </div>

      <div className="bill-card-details">
        <div className="bill-card-detail">
          <div className="bill-detail-icon">
            <CalendarDays size={16} />
          </div>

          <div>
            <span>Due date</span>
            <strong>{formatDate(bill.dueDate)}</strong>
          </div>
        </div>

        <div className="bill-card-detail">
          <div className="bill-detail-icon">
            {wallet?.type === "credit_card" ? (
              <CreditCard size={16} />
            ) : (
              <Wallet size={16} />
            )}
          </div>

          <div>
            <span>Payment wallet</span>
            <strong>{wallet?.name || "Not assigned"}</strong>
          </div>
        </div>
      </div>

      <div className="bill-card-meta">
        <span className="bill-frequency">
          <Clock3 size={14} />
          {getFrequencyLabel(bill.frequency)}
        </span>

        <span className="bill-due-label">{dueLabel}</span>
      </div>

      <div className="bill-card-footer">
        <div className={`bill-status bill-status-${status.className}`}>
          <StatusIcon size={15} />
          <span>{status.label}</span>
        </div>

        {isPayable && (
          <motion.button
            type="button"
            className="bill-pay-button"
            onClick={() => onPay?.(bill)}
            whileHover={shouldReduceMotion ? undefined : { y: -2 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
          >
            <IndianRupee size={15} />
            Pay now
          </motion.button>
        )}
      </div>
    </motion.article>
  );
};

export default BillCard;

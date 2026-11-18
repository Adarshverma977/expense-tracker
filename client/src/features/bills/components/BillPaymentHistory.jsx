
import { motion } from "framer-motion";
import {
  Receipt,
  CalendarDays,
  Wallet,
  CheckCircle2,
  RotateCcw,
  Clock3,
} from "lucide-react";

const INTEGER_CURRENCY_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const parseMinorUnits = (value) => {
  const amount = String(value ?? "").trim();
  const match = amount.match(/^([+-]?)(\d+)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/);

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

const formatDate = (value) => {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getPaymentStatus = (status) => {
  if (status === "reversed") {
    return {
      label: "Reversed",
      className: "reversed",
      Icon: RotateCcw,
    };
  }

  return {
    label: "Completed",
    className: "completed",
    Icon: CheckCircle2,
  };
};

const BillPaymentHistory = ({
  payments = [],
  isLoading = false,
  error = "",
  onRetry,
}) => {
  const safePayments = Array.isArray(payments) ? payments : [];

  if (isLoading) {
    return (
      <section className="bill-payment-history">
        <div className="bill-history-heading">
          <div>
            <span className="bill-modal-eyebrow">PAYMENT ACTIVITY</span>
            <h3>Payment history</h3>
          </div>
        </div>

        <div className="bill-history-loading" role="status">
          <div className="bill-history-skeleton" />
          <div className="bill-history-skeleton" />
          <div className="bill-history-skeleton" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bill-payment-history">
        <div className="bill-history-error" role="alert">
          <Receipt size={22} />
          <p>{error}</p>

          {onRetry && (
            <button type="button" onClick={onRetry}>
              Try again
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="bill-payment-history">
      <div className="bill-history-heading">
        <div>
          <span className="bill-modal-eyebrow">PAYMENT ACTIVITY</span>
          <h3>Payment history</h3>
          <p>Review payments recorded against this bill.</p>
        </div>

        <span className="bill-history-count">
          {safePayments.length}{" "}
          {safePayments.length === 1 ? "payment" : "payments"}
        </span>
      </div>

      {safePayments.length > 0 ? (
        <div className="bill-history-list">
          {safePayments.map((payment, index) => {
            const status = getPaymentStatus(payment.status);
            const StatusIcon = status.Icon;

            const wallet =
              payment.wallet && typeof payment.wallet === "object"
                ? payment.wallet
                : null;

            return (
              <motion.article
                key={payment._id || index}
                className="bill-history-item"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.25,
                  delay: index * 0.05,
                }}
              >
                <div className="bill-history-item-icon">
                  <Receipt size={19} />
                </div>

                <div className="bill-history-item-content">
                  <div className="bill-history-item-top">
                    <div>
                      <strong>
                        {formatCurrency(payment.amount)}
                      </strong>

                      <span>
                        <CalendarDays size={13} />
                        {formatDate(payment.paidAt)}
                      </span>
                    </div>

                    <span
                      className={`bill-history-status ${status.className}`}
                    >
                      <StatusIcon size={13} />
                      {status.label}
                    </span>
                  </div>

                  <div className="bill-history-item-bottom">
                    <span>
                      <Wallet size={14} />
                      {wallet?.name || "Wallet unavailable"}
                    </span>

                    {payment.notes && (
                      <span className="bill-history-notes">
                        {payment.notes}
                      </span>
                    )}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      ) : (
        <div className="bill-history-empty">
          <div className="bill-history-empty-icon">
            <Clock3 size={25} />
          </div>

          <h4>No payments recorded yet</h4>
          <p>
            Payments made against this bill will appear here.
          </p>
        </div>
      )}
    </section>
  );
};

export default BillPaymentHistory;


import { motion } from "framer-motion";
import {
  Wallet,
  TrendingDown,
  PiggyBank,
  ChartNoAxesCombined,
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

const getSafeNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const summaryItems = [
  {
    key: "totalBudget",
    label: "Total Budget",
    description: "Your allocated monthly limit",
    icon: Wallet,
    className: "budget-summary-allocated",
  },
  {
    key: "totalSpent",
    label: "Total Spent",
    description: "Amount spent this month",
    icon: TrendingDown,
    className: "budget-summary-spent",
  },
  {
    key: "totalRemaining",
    label: "Remaining",
    description: "Budget available to spend",
    icon: PiggyBank,
    className: "budget-summary-remaining",
  },
];

const BudgetSummary = ({ summary = {} }) => {
  const actualUtilization = getSafeNumber(
    summary.utilizationPercentage
  );

  const utilization = Math.min(
    Math.max(actualUtilization, 0),
    100
  );

  const status = ["safe", "warning", "exceeded"].includes(
    summary.status
  )
    ? summary.status
    : "safe";

  const totalBudget = summary.totalBudget ?? "0.00";
  const totalSpent = summary.totalSpent ?? "0.00";

  return (
    <section
      className="budget-summary-section"
      aria-label="Budget overview"
    >
      <div className="budget-summary-grid">
        {summaryItems.map((item, index) => {
          const Icon = item.icon;

          return (
            <motion.article
              key={item.key}
              className={`budget-summary-card ${item.className}`}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.35,
                delay: index * 0.08,
                ease: "easeOut",
              }}
            >
              <div className="budget-summary-top">
                <span>{item.label}</span>

                <div className="budget-summary-icon">
                  <Icon size={20} strokeWidth={1.9} />
                </div>
              </div>

              <h3>{formatCurrency(summary[item.key])}</h3>

              <p>{item.description}</p>
            </motion.article>
          );
        })}
      </div>

      <motion.div
        className={`budget-utilization-card status-${status}`}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          delay: 0.25,
          ease: "easeOut",
        }}
      >
        <div className="budget-utilization-heading">
          <div>
            <span className="budget-utilization-eyebrow">
              MONTHLY UTILIZATION
            </span>

            <h3>Budget usage</h3>
          </div>

          <div className="budget-utilization-percentage">
            <ChartNoAxesCombined size={17} />

            <strong>{actualUtilization.toFixed(1)}%</strong>
          </div>
        </div>

        <div
          className="budget-progress-track budget-overall-track"
          role="progressbar"
          aria-label="Overall budget utilization"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={utilization}
          aria-valuetext={`${actualUtilization.toFixed(1)} percent utilized`}
        >
          <motion.div
            className="budget-progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${utilization}%` }}
            transition={{
              duration: 0.8,
              ease: "easeOut",
            }}
          />
        </div>

        <div className="budget-utilization-footer">
          <span>
            {formatCurrency(totalSpent)} spent
          </span>

          <span>
            {formatCurrency(totalBudget)} allocated
          </span>
        </div>
      </motion.div>
    </section>
  );
};

export default BudgetSummary;

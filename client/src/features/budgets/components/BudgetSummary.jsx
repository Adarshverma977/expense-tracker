
import { motion } from "framer-motion";
import {
  Wallet,
  TrendingDown,
  PiggyBank,
  ChartNoAxesCombined,
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

  const totalBudget = getSafeNumber(summary.totalBudget);
  const totalSpent = getSafeNumber(summary.totalSpent);

  return (
    <section className="budget-summary-section" aria-label="Budget overview">
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

            <strong>
              {actualUtilization.toFixed(1)}%
            </strong>
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

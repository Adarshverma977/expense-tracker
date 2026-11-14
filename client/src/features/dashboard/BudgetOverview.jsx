
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  PiggyBank,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getBudgets } from "../budgets/budgetService";
import "./BudgetOverview.css";

const formatCurrency = (amount) => {
  const numericAmount = Number(amount ?? 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(numericAmount) ? numericAmount : 0);
};

const getNumericValue = (value) => {
  const numericValue = Number(value ?? 0);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const getBudgetStatus = (budget) => {
  const percentage = getNumericValue(budget.utilizationPercentage);

  if (budget.status === "exceeded" || percentage > 100) {
    return "exceeded";
  }

  if (budget.status === "warning" || percentage >= 80) {
    return "warning";
  }

  return "safe";
};

const getProgressWidth = (percentage) => {
  return `${Math.min(Math.max(getNumericValue(percentage), 0), 100)}%`;
};

const BudgetLoading = () => (
  <section className="budget-overview-panel">
    <div className="budget-overview-heading">
      <div>
        <span className="dashboard-eyebrow">BUDGET TRACKER</span>
        <h3>Monthly budget overview</h3>
      </div>
    </div>

    <div className="budget-overview-loading" aria-label="Loading budgets">
      <div className="budget-loading-line" />
      <div className="budget-loading-line" />
      <div className="budget-loading-line" />
    </div>
  </section>
);

const BudgetError = ({ message, onRetry }) => (
  <section className="budget-overview-panel">
    <div className="budget-overview-heading">
      <div>
        <span className="dashboard-eyebrow">BUDGET TRACKER</span>
        <h3>Monthly budget overview</h3>
      </div>
    </div>

    <div className="budget-overview-message budget-overview-error" role="alert">
      <AlertTriangle size={22} />
      <p>{message}</p>
      <button type="button" onClick={onRetry}>
        <RefreshCw size={14} />
        Try again
      </button>
    </div>
  </section>
);

const BudgetOverview = () => {
  const navigate = useNavigate();

  const [budgets, setBudgets] = useState([]);
  const [summary, setSummary] = useState({
    totalBudget: "0.00",
    totalSpent: "0.00",
    totalRemaining: "0.00",
    utilizationPercentage: 0,
    status: "safe",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    const fetchBudgetOverview = async () => {
      setIsLoading(true);
      setError("");

      try {
        const currentDate = new Date();
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();

        const response = await getBudgets(month, year);
        const result = response?.data || {};
        const resultSummary = result.summary || {};

        if (!active) return;

        setBudgets(
          Array.isArray(result.budgets) ? result.budgets : []
        );

        setSummary({
          totalBudget: resultSummary.totalBudget ?? "0.00",
          totalSpent: resultSummary.totalSpent ?? "0.00",
          totalRemaining: resultSummary.totalRemaining ?? "0.00",
          utilizationPercentage: getNumericValue(
            resultSummary.utilizationPercentage
          ),
          status: resultSummary.status || "safe",
        });
      } catch (err) {
        if (!active) return;

        setError(
          err.response?.data?.message ||
          "Unable to load budget overview."
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchBudgetOverview();

    return () => {
      active = false;
    };
  }, [refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((previous) => previous + 1);
  };

  if (isLoading) {
    return <BudgetLoading />;
  }

  if (error) {
    return <BudgetError message={error} onRetry={handleRefresh} />;
  }

  const overallStatus = getBudgetStatus({
    status: summary.status,
    utilizationPercentage: summary.utilizationPercentage,
  });

  const visibleBudgets = budgets.slice(0, 4);
  const utilizationPercentage = getNumericValue(
    summary.utilizationPercentage
  );

  return (
    <motion.section
      className="budget-overview-panel"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="budget-overview-heading">
        <div>
          <span className="dashboard-eyebrow">BUDGET TRACKER</span>
          <h3>Monthly budget overview</h3>
          <p>Keep your monthly spending under control.</p>
        </div>

        <button
          type="button"
          className="budget-view-all"
          onClick={() => navigate("/budgets")}
        >
          Manage budgets
          <ArrowRight size={15} />
        </button>
      </div>

      {budgets.length === 0 ? (
        <div className="budget-overview-empty">
          <div className="budget-empty-icon">
            <PiggyBank size={27} />
          </div>

          <div>
            <h4>No budgets created yet</h4>
            <p>
              Set monthly spending limits for your expense categories
              and start tracking your money.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/budgets")}
          >
            Create your first budget
            <ArrowRight size={15} />
          </button>
        </div>
      ) : (
        <>
          <div className="budget-overview-summary">
            <article>
              <span>Total budget</span>
              <strong>{formatCurrency(summary.totalBudget)}</strong>
            </article>

            <article>
              <span>Total spent</span>
              <strong className="expense-text">
                {formatCurrency(summary.totalSpent)}
              </strong>
            </article>

            <article>
              <span>Remaining</span>
              <strong className="budget-remaining-value">
                {formatCurrency(summary.totalRemaining)}
              </strong>
            </article>
          </div>

          <div className="budget-overall-progress">
            <div className="budget-overall-progress-heading">
              <div>
                <span>Overall utilization</span>
                <strong>{utilizationPercentage.toFixed(1)}%</strong>
              </div>

              <span className={`budget-status-label ${overallStatus}`}>
                {overallStatus === "safe" ? (
                  <CheckCircle2 size={13} />
                ) : (
                  <AlertTriangle size={13} />
                )}

                {overallStatus === "exceeded"
                  ? "Over budget"
                  : overallStatus === "warning"
                    ? "Near limit"
                    : "On track"}
              </span>
            </div>

            <div
              className="budget-progress-track"
              role="progressbar"
              aria-label="Overall budget utilization"
              aria-valuenow={Math.min(
                Math.max(utilizationPercentage, 0),
                100
              )}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <motion.div
                className={`budget-progress-fill ${overallStatus}`}
                initial={{ width: 0 }}
                animate={{ width: getProgressWidth(utilizationPercentage) }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>

          <div className="budget-category-section">
            <div className="budget-category-heading">
              <h4>Category budgets</h4>
              <span>
                {budgets.length}{" "}
                {budgets.length === 1 ? "category" : "categories"}
              </span>
            </div>

            <div className="budget-category-list">
              {visibleBudgets.map((budget) => {
                const status = getBudgetStatus(budget);
                const percentage = getNumericValue(
                  budget.utilizationPercentage
                );

                const safePercentage = Math.min(
                  Math.max(percentage, 0),
                  100
                );

                return (
                  <article
                    className="budget-category-item"
                    key={budget._id}
                  >
                    <div className="budget-category-icon">
                      <Wallet size={18} />
                    </div>

                    <div className="budget-category-content">
                      <div className="budget-category-top">
                        <strong>
                          {budget.category?.name || "Uncategorized"}
                        </strong>

                        <span className={`budget-status-label ${status}`}>
                          {status === "exceeded"
                            ? "Exceeded"
                            : status === "warning"
                              ? "Near limit"
                              : "On track"}
                        </span>
                      </div>

                      <div className="budget-category-amounts">
                        <span>
                          {formatCurrency(budget.spentAmount)} spent
                        </span>
                        <span>
                          of {formatCurrency(budget.amount)}
                        </span>
                      </div>

                      <div
                        className="budget-progress-track"
                        role="progressbar"
                        aria-label={`${budget.category?.name || "Category"} budget utilization`}
                        aria-valuenow={safePercentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <motion.div
                          className={`budget-progress-fill ${status}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${safePercentage}%` }}
                          transition={{ duration: 0.7, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {budgets.length > 4 && (
              <button
                type="button"
                className="budget-show-more"
                onClick={() => navigate("/budgets")}
              >
                View all {budgets.length} budgets
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </>
      )}
    </motion.section>
  );
};

export default BudgetOverview;

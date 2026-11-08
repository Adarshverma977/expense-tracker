
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

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const getBudgetStatus = (budget) => {
  const percentage = Number(budget.utilizationPercentage || 0);

  if (budget.status === "exceeded" || percentage > 100) {
    return "exceeded";
  }

  if (budget.status === "warning" || percentage >= 80) {
    return "warning";
  }

  return "safe";
};

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
      try {
        setIsLoading(true);
        setError("");

        const currentDate = new Date();
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();

        const response = await getBudgets(month, year);
        const result = response?.data || {};

        if (!active) return;

        setBudgets(
          Array.isArray(result.budgets) ? result.budgets : []
        );

        setSummary({
          totalBudget: result.summary?.totalBudget ?? "0.00",
          totalSpent: result.summary?.totalSpent ?? "0.00",
          totalRemaining: result.summary?.totalRemaining ?? "0.00",
          utilizationPercentage:
            result.summary?.utilizationPercentage ?? 0,
          status: result.summary?.status || "safe",
        });
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
            "Unable to load budget overview."
          );
        }
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

  const overallStatus = getBudgetStatus({
    status: summary.status,
    utilizationPercentage: summary.utilizationPercentage,
  });

  const visibleBudgets = budgets.slice(0, 4);

  if (isLoading) {
    return (
      <section className="budget-overview-panel">
        <div className="budget-overview-heading">
          <div>
            <span className="dashboard-eyebrow">BUDGET TRACKER</span>
            <h3>Monthly budget overview</h3>
          </div>
        </div>

        <div className="budget-overview-loading">
          <div className="budget-loading-line" />
          <div className="budget-loading-line" />
          <div className="budget-loading-line" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="budget-overview-panel">
        <div className="budget-overview-heading">
          <div>
            <span className="dashboard-eyebrow">BUDGET TRACKER</span>
            <h3>Monthly budget overview</h3>
          </div>
        </div>

        <div className="budget-overview-message budget-overview-error">
          <AlertTriangle size={22} />
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setRefreshKey((prev) => prev + 1)}
          >
            <RefreshCw size={14} />
            Try again
          </button>
        </div>
      </section>
    );
  }

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
          Manage budgets <ArrowRight size={15} />
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
            Create your first budget <ArrowRight size={15} />
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
                <strong>
                  {Number(summary.utilizationPercentage || 0).toFixed(1)}%
                </strong>
              </div>

              <span className={`budget-status-label ${overallStatus}`}>
                {overallStatus === "exceeded" ? (
                  <AlertTriangle size={13} />
                ) : overallStatus === "warning" ? (
                  <AlertTriangle size={13} />
                ) : (
                  <CheckCircle2 size={13} />
                )}
                {overallStatus === "exceeded"
                  ? "Over budget"
                  : overallStatus === "warning"
                    ? "Near limit"
                    : "On track"}
              </span>
            </div>

            <div className="budget-progress-track">
              <div
                className={`budget-progress-fill ${overallStatus}`}
                style={{
                  width: `${Math.min(
                    Math.max(Number(summary.utilizationPercentage || 0), 0),
                    100
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="budget-category-section">
            <div className="budget-category-heading">
              <h4>Category budgets</h4>
              <span>
                {budgets.length} {budgets.length === 1 ? "category" : "categories"}
              </span>
            </div>

            <div className="budget-category-list">
              {visibleBudgets.map((budget) => {
                const status = getBudgetStatus(budget);
                const percentage = Number(
                  budget.utilizationPercentage || 0
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

                      <div className="budget-progress-track">
                        <div
                          className={`budget-progress-fill ${status}`}
                          style={{
                            width: `${Math.min(
                              Math.max(percentage, 0),
                              100
                            )}%`,
                          }}
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

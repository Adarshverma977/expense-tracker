
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Wallet,
  RefreshCw,
  Receipt,
  CalendarDays,
  AlertCircle,
} from "lucide-react";
import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
} from "./budgetService";
import BudgetSummary from "./components/BudgetSummary";
import BudgetCard from "./components/BudgetCard";
import BudgetModal from "./components/BudgetModal";
import DeleteBudgetModal from "./components/DeleteBudgetModal";
import "./BudgetPage.css";

const getCurrentPeriod = () => {
  const now = new Date();

  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
};

const formatMonth = (month, year) =>
  new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.message ||
  fallback;

const BudgetSkeleton = () => (
  <div className="budget-skeleton">
    <div className="budget-skeleton-heading skeleton" />

    <div className="budget-skeleton-summary">
      {[1, 2, 3].map((item) => (
        <div className="budget-skeleton-card skeleton" key={item} />
      ))}
    </div>

    <div className="budget-skeleton-content skeleton" />

    <div className="budget-skeleton-grid">
      {[1, 2].map((item) => (
        <div className="budget-skeleton-card skeleton" key={item} />
      ))}
    </div>
  </div>
);

const BudgetPage = () => {
  const initialPeriod = getCurrentPeriod();

  const [month, setMonth] = useState(initialPeriod.month);
  const [year, setYear] = useState(initialPeriod.year);
  const [budgets, setBudgets] = useState([]);
  const [summary, setSummary] = useState({
    totalBudget: "0.00",
    totalSpent: "0.00",
    totalRemaining: "0.00",
    utilizationPercentage: 0,
    status: "safe",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const requestIdRef = useRef(0);

  const fetchBudgets = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    try {
      setIsLoading(true);
      setPageError("");

      const response = await getBudgets(month, year);

      if (requestId !== requestIdRef.current) return;

      const result = response?.data || {};

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
    } catch (error) {
      if (requestId !== requestIdRef.current) return;

      setPageError(
        getErrorMessage(
          error,
          "Unable to load your budgets. Please try again."
        )
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [month, year]);

  useEffect(() => {
    fetchBudgets();

    return () => {
      requestIdRef.current += 1;
    };
  }, [fetchBudgets, refreshKey]);

  const refreshBudgets = () => {
    setRefreshKey((current) => current + 1);
  };

  const openCreateModal = () => {
    setSelectedBudget(null);
    setIsBudgetModalOpen(true);
  };

  const openEditModal = (budget) => {
    setSelectedBudget(budget);
    setIsBudgetModalOpen(true);
  };

  const closeBudgetModal = () => {
    if (isSubmitting) return;

    setIsBudgetModalOpen(false);
    setSelectedBudget(null);
  };

  const handleBudgetSubmit = async (budgetData) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      if (selectedBudget) {
        await updateBudget(selectedBudget._id, {
          amount: budgetData.amount,
        });
      } else {
        await createBudget(budgetData);
      }

      setIsBudgetModalOpen(false);
      setSelectedBudget(null);
      refreshBudgets();
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (budget) => {
    setBudgetToDelete(budget);
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;

    setBudgetToDelete(null);
  };

  const handleDeleteBudget = async () => {
    if (!budgetToDelete || isDeleting) return;

    try {
      setIsDeleting(true);

      await deleteBudget(budgetToDelete._id);

      setBudgetToDelete(null);
      refreshBudgets();
    } catch (error) {
      setPageError(
        getErrorMessage(
          error,
          "Unable to delete this budget. Please try again."
        )
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const changeMonth = (direction) => {
    const date = new Date(year, month - 1 + direction, 1);

    setMonth(date.getMonth() + 1);
    setYear(date.getFullYear());
  };

  const goToCurrentMonth = () => {
    const current = getCurrentPeriod();

    setMonth(current.month);
    setYear(current.year);
  };

  const currentPeriod = getCurrentPeriod();
  const isCurrentMonth =
    month === currentPeriod.month && year === currentPeriod.year;

  if (isLoading && budgets.length === 0 && !pageError) {
    return <BudgetSkeleton />;
  }

  return (
    <motion.div
      className="budget-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <section className="budget-page-heading">
        <div>
          <span className="budget-page-eyebrow">
            PLAN YOUR FINANCES
          </span>

          <h2>Budget management</h2>

          <p>
            Set spending limits and stay in control of your money.
          </p>
        </div>

        <motion.button
          type="button"
          className="budget-create-button"
          onClick={openCreateModal}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
        >
          <Plus size={18} />
          Create budget
        </motion.button>
      </section>

      <section className="budget-period-navigation">
        <div className="budget-period-title">
          <div className="budget-period-icon">
            <CalendarDays size={19} />
          </div>

          <div>
            <span>SELECTED PERIOD</span>
            <h3>{formatMonth(month, year)}</h3>
          </div>
        </div>

        <div className="budget-period-actions">
          {!isCurrentMonth && (
            <button
              type="button"
              className="budget-current-month-button"
              onClick={goToCurrentMonth}
            >
              Current month
            </button>
          )}

          <button
            type="button"
            className="budget-period-arrow"
            onClick={() => changeMonth(-1)}
            aria-label="Previous month"
          >
            <ArrowLeft size={18} />
          </button>

          <button
            type="button"
            className="budget-period-arrow"
            onClick={() => changeMonth(1)}
            aria-label="Next month"
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {pageError && (
        <div className="budget-page-error" role="alert">
          <AlertCircle size={18} />

          <span>{pageError}</span>

          <button type="button" onClick={refreshBudgets}>
            <RefreshCw size={15} />
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="budget-inline-loading" role="status">
          <RefreshCw size={19} className="budget-loading-icon" />
          Updating budget information...
        </div>
      ) : (
        <>
          <BudgetSummary summary={summary} />

          <section className="budget-list-section">
            <div className="budget-list-heading">
              <div>
                <span className="budget-page-eyebrow">
                  CATEGORY ALLOCATION
                </span>

                <h3>Your category budgets</h3>

                <p>
                  Track how much you spend in each category.
                </p>
              </div>

              <span className="budget-count">
                {budgets.length}{" "}
                {budgets.length === 1 ? "budget" : "budgets"}
              </span>
            </div>

            {budgets.length > 0 ? (
              <div className="budget-card-grid">
                {budgets.map((budget) => (
                  <BudgetCard
                    key={budget._id}
                    budget={budget}
                    onEdit={openEditModal}
                    onDelete={openDeleteModal}
                  />
                ))}
              </div>
            ) : (
              <div className="budget-empty-state">
                <div className="budget-empty-icon">
                  <Wallet size={30} />
                </div>

                <h3>No budgets for this month</h3>

                <p>
                  Start planning your spending by creating your
                  first category budget.
                </p>

                <button
                  type="button"
                  className="budget-create-button"
                  onClick={openCreateModal}
                >
                  <Plus size={17} />
                  Create your first budget
                </button>
              </div>
            )}
          </section>

          {budgets.length > 0 && (
            <div className="budget-page-tip">
              <div className="budget-tip-icon">
                <Receipt size={19} />
              </div>

              <p>
                <strong>Stay on track.</strong> Keep an eye on your
                category spending throughout the month to avoid
                exceeding your planned limits.
              </p>
            </div>
          )}
        </>
      )}

      <BudgetModal
        isOpen={isBudgetModalOpen}
        budget={selectedBudget}
        month={month}
        year={year}
        onClose={closeBudgetModal}
        onSubmit={handleBudgetSubmit}
        isSubmitting={isSubmitting}
      />

      <DeleteBudgetModal
        isOpen={Boolean(budgetToDelete)}
        budget={budgetToDelete}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteBudget}
        isDeleting={isDeleting}
      />
    </motion.div>
  );
};

export default BudgetPage;

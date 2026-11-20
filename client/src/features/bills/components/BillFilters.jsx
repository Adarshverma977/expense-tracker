
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import "./BillFilters.css";

const getFilterValue = (value) =>
  typeof value === "string" ? value : "";

function BillFilters({
  filters = {},
  categories = [],
  wallets = [],
  onChange,
  onReset,
}) {
  const shouldReduceMotion = Boolean(useReducedMotion());

  const safeFiltersObject =
    filters && typeof filters === "object" && !Array.isArray(filters)
      ? filters
      : {};

  const safeCategories = Array.isArray(categories)
    ? categories.filter(
      (category) =>
        category &&
        typeof category === "object" &&
        category.type === "expense",
    )
    : [];

  const safeWallets = Array.isArray(wallets)
    ? wallets.filter(
      (wallet) => wallet && typeof wallet === "object",
    )
    : [];

  const safeFilters = {
    status: getFilterValue(safeFiltersObject.status),
    paymentStatus: getFilterValue(safeFiltersObject.paymentStatus),
    frequency: getFilterValue(safeFiltersObject.frequency),
    category: getFilterValue(safeFiltersObject.category),
    wallet: getFilterValue(safeFiltersObject.wallet),
    due: getFilterValue(safeFiltersObject.due),
    startDate: getFilterValue(safeFiltersObject.startDate),
    endDate: getFilterValue(safeFiltersObject.endDate),
    search: getFilterValue(safeFiltersObject.search),
  };

  const activeFilterCount = [
    safeFilters.status,
    safeFilters.paymentStatus,
    safeFilters.frequency,
    safeFilters.category,
    safeFilters.wallet,
    safeFilters.due,
    safeFilters.startDate,
    safeFilters.endDate,
    safeFilters.search.trim(),
  ].filter(Boolean).length;

  const hasFilters = activeFilterCount > 0;

  const updateFilter = (key, value) => {
    if (typeof onChange !== "function") return;

    const nextFilters = {
      ...safeFiltersObject,
      [key]: value,
      page: 1,
    };

    if (
      key === "startDate" &&
      safeFilters.endDate &&
      value &&
      value > safeFilters.endDate
    ) {
      nextFilters.endDate = "";
    }

    if (
      key === "endDate" &&
      safeFilters.startDate &&
      value &&
      value < safeFilters.startDate
    ) {
      nextFilters.startDate = "";
    }

    onChange(nextFilters);
  };

  const animationProps = shouldReduceMotion
    ? {
      initial: false,
      animate: undefined,
      exit: undefined,
      transition: { duration: 0 },
    }
    : {};

  return (
    <motion.section
      className="bill-filters"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { duration: 0.4, delay: 0.12 }
      }
      aria-label="Bill filters"
    >
      <div className="bill-filter-heading">
        <div className="bill-filter-title">
          <SlidersHorizontal size={17} aria-hidden="true" />
          <span>Filters</span>

          <AnimatePresence>
            {hasFilters && (
              <motion.span
                className="bill-filter-count"
                key={activeFilterCount}
                {...animationProps}
                initial={
                  shouldReduceMotion
                    ? false
                    : { opacity: 0, scale: 0.7 }
                }
                animate={{ opacity: 1, scale: 1 }}
                exit={
                  shouldReduceMotion
                    ? undefined
                    : { opacity: 0, scale: 0.7 }
                }
              >
                {activeFilterCount} active
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {hasFilters && (
            <motion.button
              type="button"
              className="bill-reset-button"
              {...animationProps}
              initial={
                shouldReduceMotion
                  ? false
                  : { opacity: 0, x: 8 }
              }
              animate={{ opacity: 1, x: 0 }}
              exit={
                shouldReduceMotion
                  ? undefined
                  : { opacity: 0, x: 8 }
              }
              onClick={() => onReset?.()}
              whileHover={
                shouldReduceMotion ? undefined : { x: -2 }
              }
              whileTap={
                shouldReduceMotion ? undefined : { scale: 0.96 }
              }
            >
              <X size={14} aria-hidden="true" />
              Clear all
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="bill-filter-grid">
        <label className="bill-search-field">
          <Search size={17} aria-hidden="true" />

          <input
            type="search"
            placeholder="Search bills..."
            value={safeFilters.search}
            onChange={(event) =>
              updateFilter("search", event.target.value)
            }
            aria-label="Search bills"
          />

          {safeFilters.search && (
            <button
              type="button"
              className="bill-search-clear"
              aria-label="Clear search"
              onClick={() => updateFilter("search", "")}
            >
              <X size={15} aria-hidden="true" />
            </button>
          )}
        </label>

        <select
          value={safeFilters.status}
          onChange={(event) =>
            updateFilter("status", event.target.value)
          }
          aria-label="Bill status"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="archived">Archived</option>
        </select>

        <select
          value={safeFilters.paymentStatus}
          onChange={(event) =>
            updateFilter("paymentStatus", event.target.value)
          }
          aria-label="Payment status"
        >
          <option value="">All payment statuses</option>
          <option value="paid">Paid</option>
          <option value="partially_paid">Partially paid</option>
          <option value="unpaid">Unpaid</option>
        </select>

        <select
          value={safeFilters.frequency}
          onChange={(event) =>
            updateFilter("frequency", event.target.value)
          }
          aria-label="Bill frequency"
        >
          <option value="">All frequencies</option>
          <option value="one_time">One-time</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="yearly">Yearly</option>
        </select>

        <select
          value={safeFilters.category}
          onChange={(event) =>
            updateFilter("category", event.target.value)
          }
          aria-label="Bill category"
        >
          <option value="">All categories</option>

          {safeCategories.map((category) => {
            const categoryId = category._id || category.id;

            if (!categoryId) return null;

            return (
              <option key={categoryId} value={String(categoryId)}>
                {category.name || "Unnamed category"}
              </option>
            );
          })}
        </select>

        <select
          value={safeFilters.wallet}
          onChange={(event) =>
            updateFilter("wallet", event.target.value)
          }
          aria-label="Payment wallet"
        >
          <option value="">All wallets</option>

          {safeWallets.map((wallet) => {
            const walletId = wallet._id || wallet.id;

            if (!walletId) return null;

            return (
              <option key={walletId} value={String(walletId)}>
                {wallet.name || "Unnamed wallet"}
              </option>
            );
          })}
        </select>

        <select
          value={safeFilters.due}
          onChange={(event) =>
            updateFilter("due", event.target.value)
          }
          aria-label="Due date status"
        >
          <option value="">All due dates</option>
          <option value="today">Due today</option>
          <option value="upcoming">Upcoming</option>
          <option value="overdue">Overdue</option>
        </select>

        <label className="bill-date-field">
          <span>From</span>

          <input
            type="date"
            value={safeFilters.startDate}
            max={safeFilters.endDate || undefined}
            onChange={(event) =>
              updateFilter("startDate", event.target.value)
            }
            aria-label="Start due date"
          />
        </label>

        <label className="bill-date-field">
          <span>To</span>

          <input
            type="date"
            value={safeFilters.endDate}
            min={safeFilters.startDate || undefined}
            onChange={(event) =>
              updateFilter("endDate", event.target.value)
            }
            aria-label="End due date"
          />
        </label>
      </div>
    </motion.section>
  );
}

export default BillFilters;

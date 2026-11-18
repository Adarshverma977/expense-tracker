
import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";

function BillFilters({
  filters = {},
  categories = [],
  wallets = [],
  onChange,
  onReset,
}) {
  const safeCategories = Array.isArray(categories)
    ? categories.filter(Boolean)
    : [];

  const safeWallets = Array.isArray(wallets)
    ? wallets.filter(Boolean)
    : [];

  const safeFilters = {
    status: filters.status || "",
    frequency: filters.frequency || "",
    category: filters.category || "",
    wallet: filters.wallet || "",
    due: filters.due || "",
    startDate: filters.startDate || "",
    endDate: filters.endDate || "",
    search: filters.search || "",
  };

  const activeFilterCount = [
    safeFilters.status,
    safeFilters.frequency,
    safeFilters.category,
    safeFilters.wallet,
    safeFilters.due,
    safeFilters.startDate,
    safeFilters.endDate,
    safeFilters.search.trim(),
  ].filter(Boolean).length;

  const hasFilters = activeFilterCount > 0;

  const filteredCategories = useMemo(
    () => safeCategories.filter((category) => category.type === "expense"),
    [safeCategories],
  );

  const updateFilter = (key, value) => {
    const nextFilters = {
      ...filters,
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

    onChange?.(nextFilters);
  };

  return (
    <motion.section
      className="bill-filters"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.12 }}
      aria-label="Bill filters"
    >
      <div className="bill-filter-heading">
        <div className="bill-filter-title">
          <SlidersHorizontal size={17} />
          <span>Filters</span>

          <AnimatePresence>
            {hasFilters && (
              <motion.span
                className="bill-filter-count"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                key={activeFilterCount}
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
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              onClick={() => onReset?.()}
              whileHover={{ x: -2 }}
              whileTap={{ scale: 0.96 }}
            >
              <X size={14} />
              Clear all
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="bill-filter-grid">
        <motion.label
          className="bill-search-field"
          whileFocus={{ scale: 1.01 }}
        >
          <Search size={17} />

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
              <X size={15} />
            </button>
          )}
        </motion.label>

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

          {filteredCategories.map((category) => {
            const categoryId = category._id || category.id;

            if (!categoryId) return null;

            return (
              <option key={categoryId} value={categoryId}>
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
              <option key={walletId} value={walletId}>
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

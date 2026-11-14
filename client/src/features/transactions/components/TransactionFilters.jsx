
import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";

function TransactionFilters({
  filters = {},
  categories = [],
  onChange,
  onReset,
}) {
  const safeCategories = Array.isArray(categories)
    ? categories.filter(Boolean)
    : [];

  const safeFilters = {
    type: filters.type || "",
    category: filters.category || "",
    startDate: filters.startDate || "",
    endDate: filters.endDate || "",
    search: filters.search || "",
  };

  const filteredCategories = useMemo(
    () =>
      safeCategories.filter(
        (category) =>
          !safeFilters.type || category.type === safeFilters.type
      ),
    [safeCategories, safeFilters.type]
  );

  const activeFilterCount = [
    safeFilters.type,
    safeFilters.category,
    safeFilters.startDate,
    safeFilters.endDate,
    safeFilters.search.trim(),
  ].filter(Boolean).length;

  const hasFilters = activeFilterCount > 0;

  const updateFilter = (key, value) => {
    const nextFilters = {
      ...filters,
      [key]: value,
      page: 1,
    };

    if (key === "type" && safeFilters.category) {
      const selectedCategory = safeCategories.find(
        (category) =>
          String(category._id || category.id) === safeFilters.category
      );

      if (
        selectedCategory &&
        value &&
        selectedCategory.type !== value
      ) {
        nextFilters.category = "";
      }
    }

    if (
      key === "startDate" &&
      safeFilters.endDate &&
      value &&
      value > safeFilters.endDate
    ) {
      nextFilters.endDate = "";
    }

    onChange(nextFilters);
  };

  const handleReset = () => {
    onReset?.();
  };

  return (
    <motion.section
      className="transaction-filters"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.12 }}
      aria-label="Transaction filters"
    >
      <div className="transaction-filter-heading">
        <div className="transaction-filter-title">
          <SlidersHorizontal size={17} />
          <span>Filters</span>

          <AnimatePresence>
            {hasFilters && (
              <motion.span
                className="transaction-filter-count"
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
              className="transaction-reset-button"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              onClick={handleReset}
              whileHover={{ x: -2 }}
              whileTap={{ scale: 0.96 }}
            >
              <X size={14} />
              Clear all
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="transaction-filter-grid">
        <motion.label
          className="transaction-search-field"
          whileFocus={{ scale: 1.01 }}
        >
          <Search size={17} />

          <input
            type="search"
            placeholder="Search this page..."
            value={safeFilters.search}
            onChange={(event) =>
              updateFilter("search", event.target.value)
            }
            aria-label="Search transactions on this page"
          />

          {safeFilters.search && (
            <button
              type="button"
              className="transaction-search-clear"
              aria-label="Clear search"
              onClick={() => updateFilter("search", "")}
            >
              <X size={15} />
            </button>
          )}
        </motion.label>

        <select
          value={safeFilters.type}
          onChange={(event) =>
            updateFilter("type", event.target.value)
          }
          aria-label="Transaction type"
        >
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>

        <select
          value={safeFilters.category}
          onChange={(event) =>
            updateFilter("category", event.target.value)
          }
          aria-label="Transaction category"
        >
          <option value="">All categories</option>

          {filteredCategories.map((category, index) => {
            const categoryId = category._id || category.id;

            if (!categoryId) return null;

            return (
              <option
                key={categoryId || index}
                value={categoryId}
              >
                {category.name || "Unnamed category"}
              </option>
            );
          })}
        </select>

        <label className="transaction-date-field">
          <span>From</span>

          <input
            type="date"
            value={safeFilters.startDate}
            max={safeFilters.endDate || undefined}
            onChange={(event) =>
              updateFilter("startDate", event.target.value)
            }
            aria-label="Start date"
          />
        </label>

        <label className="transaction-date-field">
          <span>To</span>

          <input
            type="date"
            value={safeFilters.endDate}
            min={safeFilters.startDate || undefined}
            onChange={(event) =>
              updateFilter("endDate", event.target.value)
            }
            aria-label="End date"
          />
        </label>
      </div>
    </motion.section>
  );
}

export default TransactionFilters;


import { Search, SlidersHorizontal, X } from "lucide-react";

function TransactionFilters({
  filters,
  categories,
  onChange,
  onReset,
}) {
  const filteredCategories = categories.filter(
    (category) =>
      !filters.type || category.type === filters.type
  );

  const updateFilter = (key, value) => {
    onChange({ ...filters, [key]: value, page: 1 });
  };

  const hasFilters =
    filters.type ||
    filters.category ||
    filters.startDate ||
    filters.endDate ||
    filters.search;

  return (
    <section className="transaction-filters">
      <div className="transaction-filter-heading">
        <div className="transaction-filter-title">
          <SlidersHorizontal size={17} />
          <span>Filters</span>
        </div>

        {hasFilters && (
          <button
            type="button"
            className="transaction-reset-button"
            onClick={onReset}
          >
            <X size={14} />
            Clear all
          </button>
        )}
      </div>

      <div className="transaction-filter-grid">
        <label className="transaction-search-field">
          <Search size={17} />
          <input
            type="search"
            placeholder="Search this page..."
            value={filters.search}
            onChange={(event) =>
              updateFilter("search", event.target.value)
            }
          />
        </label>

        <select
          value={filters.type}
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
          value={filters.category}
          onChange={(event) =>
            updateFilter("category", event.target.value)
          }
          aria-label="Transaction category"
        >
          <option value="">All categories</option>
          {filteredCategories.map((category) => (
            <option
              key={category._id || category.id}
              value={category._id || category.id}
            >
              {category.name}
            </option>
          ))}
        </select>

        <label className="transaction-date-field">
          <span>From</span>
          <input
            type="date"
            value={filters.startDate}
            onChange={(event) =>
              updateFilter("startDate", event.target.value)
            }
          />
        </label>

        <label className="transaction-date-field">
          <span>To</span>
          <input
            type="date"
            value={filters.endDate}
            min={filters.startDate || undefined}
            onChange={(event) =>
              updateFilter("endDate", event.target.value)
            }
          />
        </label>
      </div>
    </section>
  );
}

export default TransactionFilters;

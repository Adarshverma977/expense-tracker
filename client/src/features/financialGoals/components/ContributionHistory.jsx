
import { useEffect, useState } from "react";

import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  History,
  IndianRupee,
  RefreshCw,
} from "lucide-react";

import { getGoalContributions } from "../financialGoalService";

const PAGE_LIMIT = 20;

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const formatAmount = (amount) => {
  const value = Number(amount);

  return currencyFormatter.format(
    Number.isFinite(value) ? value : 0
  );
};

const formatDate = (date) => {
  if (!date) return "Date unavailable";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
};

const getErrorMessage = (err) => {
  return (
    err?.response?.data?.message ||
    err?.message ||
    "Unable to load contribution history. Please try again."
  );
};

const getDefaultPagination = (currentPage = 1, total = 0) => {
  const totalPages = Math.ceil(total / PAGE_LIMIT);

  return {
    page: currentPage,
    limit: PAGE_LIMIT,
    total,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1 && currentPage <= totalPages,
  };
};

const ContributionHistory = ({ goalId, refreshKey = 0 }) => {
  const [contributions, setContributions] = useState([]);

  const [pagination, setPagination] = useState(
    getDefaultPagination()
  );

  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);
  const [retryKey, setRetryKey] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    const fetchContributions = async () => {
      if (!goalId) {
        setContributions([]);
        setPagination(getDefaultPagination());
        setError("Unable to identify this financial goal.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const params = {
          page,
          limit: PAGE_LIMIT,
          ...(type !== "all" && { type }),
        };

        const response = await getGoalContributions(goalId, params);

        if (!isActive) return;

        const result = response?.data;
        const fetchedContributions = result?.contributions;

        if (!Array.isArray(fetchedContributions)) {
          throw new Error("Invalid contribution history response.");
        }

        const validContributions = fetchedContributions.filter(
          (contribution) =>
            contribution &&
            typeof contribution === "object" &&
            typeof contribution._id === "string"
        );

        const serverPagination = result?.pagination;

        const total = Number.isFinite(Number(serverPagination?.total))
          ? Math.max(0, Number(serverPagination.total))
          : validContributions.length;

        const fallbackPagination = getDefaultPagination(page, total);

        setContributions(validContributions);

        setPagination({
          ...fallbackPagination,
          ...(serverPagination && typeof serverPagination === "object"
            ? serverPagination
            : {}),
          page: Number(serverPagination?.page) || page,
          limit: Number(serverPagination?.limit) || PAGE_LIMIT,
          total,
          totalPages:
            Number(serverPagination?.totalPages) ||
            fallbackPagination.totalPages,
          hasNextPage:
            typeof serverPagination?.hasNextPage === "boolean"
              ? serverPagination.hasNextPage
              : fallbackPagination.hasNextPage,
          hasPreviousPage:
            typeof serverPagination?.hasPreviousPage === "boolean"
              ? serverPagination.hasPreviousPage
              : fallbackPagination.hasPreviousPage,
        });
      } catch (err) {
        if (!isActive) return;

        setContributions([]);
        setPagination(getDefaultPagination(page));
        setError(getErrorMessage(err));
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchContributions();

    return () => {
      isActive = false;
    };
  }, [goalId, page, type, refreshKey, retryKey]);

  const handleTypeChange = (event) => {
    setType(event.target.value);
    setPage(1);
  };

  const handleRetry = () => {
    setRetryKey((previous) => previous + 1);
  };

  const handlePreviousPage = () => {
    if (pagination.hasPreviousPage && page > 1 && !loading) {
      setPage((currentPage) => currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination.hasNextPage && !loading) {
      setPage((currentPage) => currentPage + 1);
    }
  };

  return (
    <section className="contribution-history">
      <div className="contribution-history-header">
        <div className="contribution-history-title">
          <div className="contribution-history-icon">
            <History size={18} />
          </div>

          <div>
            <h3>Contribution History</h3>
            <p>
              {pagination.total}{" "}
              {pagination.total === 1 ? "transaction" : "transactions"}
            </p>
          </div>
        </div>

        <select
          className="contribution-history-filter"
          value={type}
          onChange={handleTypeChange}
          aria-label="Filter contributions by type"
          disabled={loading}
        >
          <option value="all">All activity</option>
          <option value="deposit">Deposits</option>
          <option value="withdrawal">Withdrawals</option>
        </select>
      </div>

      {loading ? (
        <div
          className="contribution-history-state"
          aria-live="polite"
        >
          <span className="contribution-history-spinner" />
          <p>Loading contribution history...</p>
        </div>
      ) : error ? (
        <div
          className="contribution-history-state contribution-history-error"
          role="alert"
        >
          <p>{error}</p>

          <button type="button" onClick={handleRetry}>
            <RefreshCw size={15} />
            Try again
          </button>
        </div>
      ) : contributions.length === 0 ? (
        <div className="contribution-history-state">
          <div className="contribution-history-empty-icon">
            <IndianRupee size={22} />
          </div>

          <h4>No contributions yet</h4>

          <p>
            {type === "all"
              ? "Your deposits and withdrawals will appear here."
              : `No ${type} records found for this goal.`}
          </p>
        </div>
      ) : (
        <>
          <div className="contribution-history-list">
            {contributions.map((contribution) => {
              const isDeposit = contribution.type === "deposit";

              return (
                <article
                  className="contribution-history-item"
                  key={contribution._id}
                >
                  <div
                    className={`contribution-history-item-icon ${isDeposit ? "deposit" : "withdrawal"
                      }`}
                  >
                    {isDeposit ? (
                      <ArrowDownLeft size={19} />
                    ) : (
                      <ArrowUpRight size={19} />
                    )}
                  </div>

                  <div className="contribution-history-item-info">
                    <h4>
                      {isDeposit ? "Money added" : "Money withdrawn"}
                    </h4>

                    <p>
                      {contribution.note?.trim() || "No note added"}
                    </p>

                    <span>{formatDate(contribution.date)}</span>
                  </div>

                  <div
                    className={`contribution-history-amount ${isDeposit ? "deposit" : "withdrawal"
                      }`}
                  >
                    <strong>
                      {isDeposit ? "+" : "-"}
                      {formatAmount(contribution.amount)}
                    </strong>

                    <span>
                      {isDeposit ? "Deposit" : "Withdrawal"}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>

          {pagination.totalPages > 1 && (
            <div className="contribution-history-pagination">
              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <div className="contribution-history-pagination-actions">
                <button
                  type="button"
                  onClick={handlePreviousPage}
                  disabled={!pagination.hasPreviousPage || loading}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={18} />
                </button>

                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={!pagination.hasNextPage || loading}
                  aria-label="Next page"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default ContributionHistory;

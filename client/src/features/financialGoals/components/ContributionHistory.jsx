
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

const formatAmount = (amount) => {
  const value = Number(amount);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
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

const ContributionHistory = ({ goalId, refreshKey = 0 }) => {
  const [contributions, setContributions] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);
  const [retryKey, setRetryKey] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    const fetchContributions = async () => {
      if (!goalId) return;

      setLoading(true);
      setError("");

      try {
        const params = {
          page,
          limit: 20,
          ...(type !== "all" && { type }),
        };

        const response = await getGoalContributions(goalId, params);

        if (!isActive) return;

        const result = response?.data;

        setContributions(result?.contributions || []);

        setPagination(
          result?.pagination || {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          }
        );
      } catch (err) {
        if (!isActive) return;

        setContributions([]);

        setError(
          err.response?.data?.message ||
          "Unable to load contribution history. Please try again."
        );
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
    if (pagination.hasPreviousPage) {
      setPage((currentPage) => currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination.hasNextPage) {
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
        <div className="contribution-history-state">
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
                  disabled={!pagination.hasPreviousPage}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={18} />
                </button>

                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={!pagination.hasNextPage}
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

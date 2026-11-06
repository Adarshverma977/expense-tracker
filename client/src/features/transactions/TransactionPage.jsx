
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Plus,
  ReceiptText,
  RefreshCw,
  Wallet,
} from "lucide-react";

import TransactionTable from "./components/TransactionTable";
import TransactionFilters from "./components/TransactionFilters";
import TransactionModal from "./components/TransactionModal";
import DeleteTransactionModal from "./components/DeleteTransactionModal";

import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../../services/transactionService";

import { getCategories } from "../../services/categoryService";
import "./TransactionPage.css";

const initialFilters = {
  type: "",
  category: "",
  startDate: "",
  endDate: "",
  search: "",
  page: 1,
};

const extractArray = (response, keys) => {
  const candidates = [
    response?.data,
    response?.data?.data,
    response?.data?.categories,
    response?.data?.data?.categories,
    response?.categories,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;

    for (const key of keys) {
      if (Array.isArray(candidate?.[key])) {
        return candidate[key];
      }
    }
  }

  return [];
};

const extractTransactionList = (response) => {
  const data = response?.data?.data ?? response?.data ?? {};
  const transactions =
    data?.transactions ||
    response?.transactions ||
    [];

  return {
    transactions: Array.isArray(transactions) ? transactions : [],
    pagination: data?.pagination || response?.pagination || {},
  };
};

const extractSavedTransaction = (response) =>
  response?.data?.data?.transaction ||
  response?.data?.transaction ||
  response?.transaction ||
  null;

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

function TransactionPage() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [filters, setFilters] = useState(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingTransaction, setDeletingTransaction] = useState(null);

  const fetchCategories = useCallback(async () => {
    const response = await getCategories();
    const result = extractArray(response, ["categories"]);
    setCategories(result);
  }, []);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setPageError("");

    try {
      const params = {
        page: filters.page,
        limit: 10,
      };

      if (filters.type) params.type = filters.type;
      if (filters.category) params.category = filters.category;
      if (filters.startDate) {
        params.startDate = new Date(
          `${filters.startDate}T00:00:00`
        ).toISOString();
      }
      if (filters.endDate) {
        params.endDate = new Date(
          `${filters.endDate}T23:59:59.999`
        ).toISOString();
      }

      const response = await getTransactions(params);
      const result = extractTransactionList(response);

      setTransactions(result.transactions);
      setPagination((current) => ({
        ...current,
        ...result.pagination,
        page: result.pagination.page || filters.page,
        limit: result.pagination.limit || 10,
        totalPages: result.pagination.totalPages || 1,
      }));
    } catch (error) {
      setPageError(
        error?.response?.data?.message ||
        "Unable to load transactions. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    filters.page,
    filters.type,
    filters.category,
    filters.startDate,
    filters.endDate,
  ]);

  useEffect(() => {
    fetchCategories().catch((error) => {
      setPageError(
        error?.response?.data?.message ||
        "Unable to load categories."
      );
    });
  }, [fetchCategories]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const visibleTransactions = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    if (!search) return transactions;

    return transactions.filter((transaction) => {
      const category =
        typeof transaction.category === "object"
          ? transaction.category?.name
          : "";

      return [
        transaction.title,
        transaction.description,
        category,
        transaction.paymentMethod,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(search)
        );
    });
  }, [transactions, filters.search]);

  const summary = useMemo(() => {
    return transactions.reduce(
      (result, transaction) => {
        const amount = Number(transaction.amount || 0);

        if (transaction.type === "income") {
          result.income += amount;
        } else {
          result.expenses += amount;
        }

        return result;
      },
      { income: 0, expenses: 0 }
    );
  }, [transactions]);

  const openCreateModal = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const openEditModal = (transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const closeModal = useCallback(() => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setEditingTransaction(null);
  }, [isSubmitting]);

  const handleSaveTransaction = async (payload) => {
    setIsSubmitting(true);

    try {
      if (editingTransaction) {
        await updateTransaction(
          editingTransaction._id || editingTransaction.id,
          payload
        );
        setNotice("Transaction updated successfully.");
      } else {
        await createTransaction(payload);
        setNotice("Transaction added successfully.");
      }

      setIsModalOpen(false);
      setEditingTransaction(null);
      setFilters((current) => ({ ...current, page: 1 }));
      await fetchTransactions();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!deletingTransaction) return;

    setIsDeleting(true);

    try {
      await deleteTransaction(
        deletingTransaction._id || deletingTransaction.id
      );

      setDeletingTransaction(null);
      setNotice("Transaction deleted successfully.");

      if (transactions.length === 1 && filters.page > 1) {
        setFilters((current) => ({
          ...current,
          page: current.page - 1,
        }));
      } else {
        await fetchTransactions();
      }
    } catch (error) {
      setPageError(
        error?.response?.data?.message ||
        "Unable to delete transaction."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFilterChange = (nextFilters) => {
    if (
      nextFilters.startDate &&
      nextFilters.endDate &&
      nextFilters.startDate > nextFilters.endDate
    ) {
      return;
    }

    setFilters(nextFilters);
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
  };

  useEffect(() => {
    if (!notice) return undefined;

    const timeout = window.setTimeout(() => setNotice(""), 3000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const total = Number(pagination.total || 0);
  const page = Number(pagination.page || filters.page);
  const totalPages = Math.max(1, Number(pagination.totalPages || 1));

  return (
    <main className="transactions-page">
      <header className="transactions-page-header">
        <div>
          <span className="transactions-eyebrow">
            YOUR FINANCIAL ACTIVITY
          </span>
          <h1>Transactions</h1>
          <p>Track, manage and understand where your money goes.</p>
        </div>

        <button
          type="button"
          className="transaction-primary-button transactions-add-button"
          onClick={openCreateModal}
        >
          <Plus size={18} />
          Add transaction
        </button>
      </header>

      {notice && (
        <div className="transaction-notice" role="status">
          {notice}
        </div>
      )}

      <section className="transactions-summary-grid">
        <article className="transactions-summary-card">
          <div className="transactions-summary-icon total">
            <ReceiptText size={20} />
          </div>
          <div>
            <span>Transactions on this page</span>
            <strong>{transactions.length}</strong>
          </div>
        </article>

        <article className="transactions-summary-card">
          <div className="transactions-summary-icon income">
            <ArrowDownLeft size={20} />
          </div>
          <div>
            <span>Income on this page</span>
            <strong className="income-text">
              {formatCurrency(summary.income)}
            </strong>
          </div>
        </article>

        <article className="transactions-summary-card">
          <div className="transactions-summary-icon expense">
            <ArrowUpRight size={20} />
          </div>
          <div>
            <span>Expenses on this page</span>
            <strong className="expense-text">
              {formatCurrency(summary.expenses)}
            </strong>
          </div>
        </article>

        <article className="transactions-summary-card">
          <div className="transactions-summary-icon count">
            <Wallet size={20} />
          </div>
          <div>
            <span>All transactions</span>
            <strong>{total}</strong>
          </div>
        </article>
      </section>

      <TransactionFilters
        filters={filters}
        categories={categories}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      <section className="transactions-list-panel">
        <div className="transactions-list-header">
          <div>
            <h2>All transactions</h2>
            <p>Your recorded income and expenses</p>
          </div>

          <button
            type="button"
            className="transaction-refresh-button"
            onClick={fetchTransactions}
            disabled={isLoading}
          >
            <RefreshCw
              size={16}
              className={isLoading ? "transaction-refreshing" : ""}
            />
            Refresh
          </button>
        </div>

        {pageError ? (
          <div className="transaction-error-state">
            <p>{pageError}</p>
            <button
              type="button"
              className="transaction-secondary-button"
              onClick={() => {
                fetchCategories().catch(() => { });
                fetchTransactions();
              }}
            >
              Try again
            </button>
          </div>
        ) : isLoading ? (
          <div className="transaction-loading-state">
            <span className="transaction-loading-spinner" />
            <p>Loading transactions...</p>
          </div>
        ) : (
          <>
            <TransactionTable
              transactions={visibleTransactions}
              onEdit={openEditModal}
              onDelete={setDeletingTransaction}
            />

            <div className="transaction-pagination">
              <span>
                Showing {total === 0 ? 0 : (page - 1) * 10 + 1}
                {"–"}
                {Math.min(page * 10, total)} of {total} transactions
              </span>

              <div>
                <button
                  type="button"
                  aria-label="Previous page"
                  disabled={page <= 1 || isLoading}
                  onClick={() =>
                    setFilters((current) => ({
                      ...current,
                      page: current.page - 1,
                    }))
                  }
                >
                  <ChevronLeft size={18} />
                </button>

                <span>
                  Page {page} of {totalPages}
                </span>

                <button
                  type="button"
                  aria-label="Next page"
                  disabled={page >= totalPages || isLoading}
                  onClick={() =>
                    setFilters((current) => ({
                      ...current,
                      page: current.page + 1,
                    }))
                  }
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <TransactionModal
        isOpen={isModalOpen}
        transaction={editingTransaction}
        categories={categories}
        onClose={closeModal}
        onSubmit={handleSaveTransaction}
        isSubmitting={isSubmitting}
      />

      <DeleteTransactionModal
        transaction={deletingTransaction}
        onClose={() => {
          if (!isDeleting) setDeletingTransaction(null);
        }}
        onConfirm={handleDeleteTransaction}
        isDeleting={isDeleting}
      />
    </main>
  );
}

export default TransactionPage;

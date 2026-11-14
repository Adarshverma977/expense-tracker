
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Plus,
  ReceiptText,
  RefreshCw,
  Wallet,
  Download,
  FileUp,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import TransactionTable from "./components/TransactionTable";
import TransactionFilters from "./components/TransactionFilters";
import TransactionModal from "./components/TransactionModal";
import DeleteTransactionModal from "./components/DeleteTransactionModal";
import CSVImportModal from "./components/CSVImportModal";
import CSVImportSummary from "./components/CSVImportSummary";
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  importTransactions,
  exportTransactions,
} from "../../services/transactionService";
import { getCategories } from "../../services/categoryService";
import "./TransactionPage.css";

const PAGE_SIZE = 10;

const createInitialFilters = () => ({
  type: "",
  category: "",
  startDate: "",
  endDate: "",
  search: "",
  page: 1,
});

const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.35,
      staggerChildren: 0.08,
    },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

const contentVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.2 },
  },
};

const extractArray = (response, keys = []) => {
  const candidates = [
    response,
    response?.data,
    response?.data?.data,
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
  const candidates = [
    response?.data?.data,
    response?.data,
    response,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return {
        transactions: candidate,
        pagination: {},
      };
    }

    if (Array.isArray(candidate?.transactions)) {
      return {
        transactions: candidate.transactions,
        pagination: candidate.pagination || {},
      };
    }
  }

  return {
    transactions: [],
    pagination: {},
  };
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.message ||
  fallback;

const formatCurrency = (amount) => {
  const value = Number(amount ?? 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
};

const getExportErrorMessage = async (error) => {
  const data = error?.response?.data;

  if (data instanceof Blob) {
    try {
      const text = await data.text();
      const parsed = JSON.parse(text);

      return parsed?.message || "Unable to export transactions.";
    } catch {
      return "Unable to export transactions. Please try again.";
    }
  }

  return getErrorMessage(
    error,
    "Unable to export transactions. Please try again."
  );
};

const getDateRangeParams = (filters) => {
  const params = {};

  if (filters.type) params.type = filters.type;
  if (filters.category) params.category = filters.category;

  if (filters.startDate) {
    const start = new Date(`${filters.startDate}T00:00:00`);

    if (!Number.isNaN(start.getTime())) {
      params.startDate = start.toISOString();
    }
  }

  if (filters.endDate) {
    const end = new Date(`${filters.endDate}T23:59:59.999`);

    if (!Number.isNaN(end.getTime())) {
      params.endDate = end.toISOString();
    }
  }

  return params;
};

const normalizePagination = (data, requestedPage) => {
  const limit = Math.max(1, Number(data?.limit) || PAGE_SIZE);
  const total = Math.max(0, Number(data?.total) || 0);
  const totalPages = Math.max(
    1,
    Number(data?.totalPages) || Math.ceil(total / limit)
  );
  const page = Math.max(1, Number(data?.page) || requestedPage);

  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};

function TransactionPage() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(
    normalizePagination({}, 1)
  );
  const [filters, setFilters] = useState(createInitialFilters);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [importResult, setImportResult] = useState(null);
  const [csvImportError, setCsvImportError] = useState("");
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingTransaction, setDeletingTransaction] = useState(null);

  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);
  const saveLockRef = useRef(false);
  const deleteLockRef = useRef(false);
  const importLockRef = useRef(false);
  const exportLockRef = useRef(false);

  const queryParams = useMemo(
    () => getDateRangeParams(filters),
    [filters.type, filters.category, filters.startDate, filters.endDate]
  );

  const fetchCategories = useCallback(async () => {
    const response = await getCategories();
    const result = extractArray(response, ["categories"]);

    if (mountedRef.current) {
      setCategories(result.filter(Boolean));
    }
  }, []);

  const fetchTransactions = useCallback(
    async (requestedPage = filters.page) => {
      const requestId = ++requestIdRef.current;

      setIsLoading(true);
      setPageError("");

      try {
        const response = await getTransactions({
          ...queryParams,
          page: requestedPage,
          limit: PAGE_SIZE,
        });

        if (
          !mountedRef.current ||
          requestId !== requestIdRef.current
        ) {
          return;
        }

        const result = extractTransactionList(response);

        setTransactions(result.transactions.filter(Boolean));
        setPagination(
          normalizePagination(result.pagination, requestedPage)
        );
      } catch (error) {
        if (
          !mountedRef.current ||
          requestId !== requestIdRef.current
        ) {
          return;
        }

        setTransactions([]);
        setPageError(
          getErrorMessage(
            error,
            "Unable to load transactions. Please try again."
          )
        );
      } finally {
        if (
          mountedRef.current &&
          requestId === requestIdRef.current
        ) {
          setIsLoading(false);
        }
      }
    },
    [filters.page, queryParams]
  );

  useEffect(() => {
    mountedRef.current = true;

    fetchCategories().catch((error) => {
      if (mountedRef.current) {
        setNotice(
          getErrorMessage(
            error,
            "Unable to load categories. Please refresh the page."
          )
        );
      }
    });

    return () => {
      mountedRef.current = false;
    };
  }, [fetchCategories]);

  useEffect(() => {
    fetchTransactions();

    return () => {
      requestIdRef.current += 1;
    };
  }, [fetchTransactions]);

  useEffect(() => {
    if (!notice) return undefined;

    const timer = window.setTimeout(() => {
      setNotice("");
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [notice]);

  const visibleTransactions = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    if (!search) return transactions;

    return transactions.filter((transaction) => {
      const categoryName =
        transaction.category &&
          typeof transaction.category === "object"
          ? transaction.category.name
          : "";

      return [
        transaction.title,
        transaction.description,
        categoryName,
        transaction.paymentMethod,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(search)
        );
    });
  }, [transactions, filters.search]);

  const summary = useMemo(
    () =>
      transactions.reduce(
        (result, transaction) => {
          const amount = Number(transaction.amount ?? 0);
          const safeAmount = Number.isFinite(amount) ? amount : 0;

          if (transaction.type === "income") {
            result.income += safeAmount;
          }

          if (transaction.type === "expense") {
            result.expenses += safeAmount;
          }

          return result;
        },
        { income: 0, expenses: 0 }
      ),
    [transactions]
  );

  const openCreateModal = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const openEditModal = (transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const closeModal = useCallback(() => {
    if (saveLockRef.current) return;

    setIsModalOpen(false);
    setEditingTransaction(null);
  }, []);

  const refreshAfterMutation = async () => {
    if (filters.page !== 1) {
      setFilters((current) => ({ ...current, page: 1 }));
    } else {
      await fetchTransactions(1);
    }
  };

  const handleSaveTransaction = async (payload) => {
    if (saveLockRef.current) return;

    saveLockRef.current = true;
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

      await refreshAfterMutation();
    } catch (error) {
      if (mountedRef.current) {
        setPageError(
          getErrorMessage(
            error,
            "Unable to save transaction. Please try again."
          )
        );
      }

      throw error;
    } finally {
      saveLockRef.current = false;

      if (mountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  const handleDeleteTransaction = async () => {
    if (!deletingTransaction || deleteLockRef.current) return;

    deleteLockRef.current = true;
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
      if (mountedRef.current) {
        setPageError(
          getErrorMessage(error, "Unable to delete transaction.")
        );
      }
    } finally {
      deleteLockRef.current = false;

      if (mountedRef.current) {
        setIsDeleting(false);
      }
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
    setFilters(createInitialFilters());
  };

  const handleCSVImport = async (file) => {
    if (importLockRef.current) return;

    importLockRef.current = true;
    setIsImporting(true);
    setCsvImportError("");

    try {
      const response = await importTransactions(file);

      setImportResult(response);
      setIsImportModalOpen(false);
      setNotice("CSV import completed.");

      await refreshAfterMutation();
    } catch (error) {
      if (mountedRef.current) {
        setCsvImportError(
          getErrorMessage(
            error,
            "Unable to import CSV file. Please try again."
          )
        );
      }
    } finally {
      importLockRef.current = false;

      if (mountedRef.current) {
        setIsImporting(false);
      }
    }
  };

  const handleCSVExport = async () => {
    if (exportLockRef.current) return;

    exportLockRef.current = true;
    setIsExporting(true);

    try {
      const response = await exportTransactions(queryParams);
      const responseData = response?.data ?? response;

      const blob =
        responseData instanceof Blob
          ? responseData
          : new Blob([responseData], {
            type: "text/csv;charset=utf-8;",
          });

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = `moneta-transactions-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl);
      }, 1000);

      setNotice("Transactions exported successfully.");
    } catch (error) {
      if (mountedRef.current) {
        setPageError(await getExportErrorMessage(error));
      }
    } finally {
      exportLockRef.current = false;

      if (mountedRef.current) {
        setIsExporting(false);
      }
    }
  };

  const total = pagination.total;
  const page = pagination.page;
  const totalPages = pagination.totalPages;
  const limit = pagination.limit;

  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <motion.main
      className="transactions-page"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.header
        className="transactions-page-header"
        variants={sectionVariants}
      >
        <div>
          <span className="transactions-eyebrow">
            YOUR FINANCIAL ACTIVITY
          </span>
          <h1>Transactions</h1>
          <p>Track, manage and understand where your money goes.</p>
        </div>

        <div className="transactions-header-actions">
          <motion.button
            type="button"
            className="transaction-secondary-button"
            onClick={() => {
              setCsvImportError("");
              setIsImportModalOpen(true);
            }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            <FileUp size={17} />
            Import CSV
          </motion.button>

          <motion.button
            type="button"
            className="transaction-secondary-button"
            onClick={handleCSVExport}
            disabled={isExporting}
            whileHover={!isExporting ? { y: -2 } : undefined}
            whileTap={!isExporting ? { scale: 0.97 } : undefined}
          >
            {isExporting ? (
              <span className="transaction-loading-spinner csv-button-spinner" />
            ) : (
              <Download size={17} />
            )}
            {isExporting ? "Exporting..." : "Export CSV"}
          </motion.button>

          <motion.button
            type="button"
            className="transaction-primary-button transactions-add-button"
            onClick={openCreateModal}
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <Plus size={18} />
            Add transaction
          </motion.button>
        </div>
      </motion.header>

      <AnimatePresence mode="wait">
        {notice && (
          <motion.div
            key={notice}
            className="transaction-notice"
            role="status"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {notice}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.section
        className="transactions-summary-grid"
        variants={sectionVariants}
      >
        <motion.article
          className="transactions-summary-card"
          variants={sectionVariants}
          whileHover={{ y: -5 }}
        >
          <div className="transactions-summary-icon total">
            <ReceiptText size={20} />
          </div>
          <div>
            <span>Transactions on this page</span>
            <strong>{transactions.length}</strong>
          </div>
        </motion.article>

        <motion.article
          className="transactions-summary-card"
          variants={sectionVariants}
          whileHover={{ y: -5 }}
        >
          <div className="transactions-summary-icon income">
            <ArrowDownLeft size={20} />
          </div>
          <div>
            <span>Income on this page</span>
            <strong className="income-text">
              {formatCurrency(summary.income)}
            </strong>
          </div>
        </motion.article>

        <motion.article
          className="transactions-summary-card"
          variants={sectionVariants}
          whileHover={{ y: -5 }}
        >
          <div className="transactions-summary-icon expense">
            <ArrowUpRight size={20} />
          </div>
          <div>
            <span>Expenses on this page</span>
            <strong className="expense-text">
              {formatCurrency(summary.expenses)}
            </strong>
          </div>
        </motion.article>

        <motion.article
          className="transactions-summary-card"
          variants={sectionVariants}
          whileHover={{ y: -5 }}
        >
          <div className="transactions-summary-icon count">
            <Wallet size={20} />
          </div>
          <div>
            <span>All transactions</span>
            <strong>{total}</strong>
          </div>
        </motion.article>
      </motion.section>

      <motion.div variants={sectionVariants}>
        <TransactionFilters
          filters={filters}
          categories={categories}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
        />
      </motion.div>

      <motion.section
        className="transactions-list-panel"
        variants={sectionVariants}
      >
        <div className="transactions-list-header">
          <div>
            <h2>All transactions</h2>
            <p>Your recorded income and expenses</p>
          </div>

          <motion.button
            type="button"
            className="transaction-refresh-button"
            onClick={() => fetchTransactions()}
            disabled={isLoading}
            whileHover={!isLoading ? { y: -2 } : undefined}
            whileTap={!isLoading ? { scale: 0.96 } : undefined}
          >
            <RefreshCw
              size={16}
              className={isLoading ? "transaction-refreshing" : ""}
            />
            Refresh
          </motion.button>
        </div>

        <AnimatePresence mode="wait">
          {pageError ? (
            <motion.div
              key="error"
              className="transaction-error-state"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <p>{pageError}</p>
              <button
                type="button"
                className="transaction-secondary-button"
                onClick={() => {
                  setPageError("");
                  fetchCategories().catch(() => { });
                  fetchTransactions();
                }}
              >
                Try again
              </button>
            </motion.div>
          ) : isLoading ? (
            <motion.div
              key="loading"
              className="transaction-loading-state"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <span className="transaction-loading-spinner" />
              <p>Loading transactions...</p>
            </motion.div>
          ) : (
            <motion.div
              key="transactions"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <TransactionTable
                transactions={visibleTransactions}
                onEdit={openEditModal}
                onDelete={setDeletingTransaction}
              />

              <div className="transaction-pagination">
                <span>
                  Showing {startItem}–{endItem} of {total} transactions
                </span>

                <div>
                  <motion.button
                    type="button"
                    aria-label="Previous page"
                    disabled={page <= 1 || isLoading}
                    onClick={() =>
                      setFilters((current) => ({
                        ...current,
                        page: Math.max(1, current.page - 1),
                      }))
                    }
                    whileHover={page > 1 ? { scale: 1.06 } : undefined}
                    whileTap={page > 1 ? { scale: 0.94 } : undefined}
                  >
                    <ChevronLeft size={18} />
                  </motion.button>

                  <span>
                    Page {page} of {totalPages}
                  </span>

                  <motion.button
                    type="button"
                    aria-label="Next page"
                    disabled={page >= totalPages || isLoading}
                    onClick={() =>
                      setFilters((current) => ({
                        ...current,
                        page: Math.min(totalPages, current.page + 1),
                      }))
                    }
                    whileHover={
                      page < totalPages ? { scale: 1.06 } : undefined
                    }
                    whileTap={
                      page < totalPages ? { scale: 0.94 } : undefined
                    }
                  >
                    <ChevronRight size={18} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

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
          if (!isDeleting) {
            setDeletingTransaction(null);
          }
        }}
        onConfirm={handleDeleteTransaction}
        isDeleting={isDeleting}
      />

      <CSVImportModal
        isOpen={isImportModalOpen}
        onClose={() => {
          if (!isImporting) {
            setIsImportModalOpen(false);
            setCsvImportError("");
          }
        }}
        onImport={handleCSVImport}
        isImporting={isImporting}
        apiError={csvImportError}
      />

      <AnimatePresence>
        {importResult && (
          <CSVImportSummary
            result={importResult}
            onClose={() => setImportResult(null)}
          />
        )}
      </AnimatePresence>
    </motion.main>
  );
}

export default TransactionPage;

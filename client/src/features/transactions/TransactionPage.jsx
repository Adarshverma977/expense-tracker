
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

const initialFilters = {
  type: "",
  category: "",
  startDate: "",
  endDate: "",
  search: "",
  page: 1,
};

const pageVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.35,
      staggerChildren: 0.09,
    },
  },
};

const sectionVariants = {
  hidden: {
    opacity: 0,
    y: 18,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 18,
  },
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
  hidden: {
    opacity: 0,
    y: 10,
  },
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
    transition: {
      duration: 0.2,
    },
  },
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

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const getExportErrorMessage = async (error) => {
  const responseData = error?.response?.data;

  if (responseData instanceof Blob) {
    try {
      const text = await responseData.text();
      const parsed = JSON.parse(text);

      return (
        parsed?.message ||
        "Unable to export transactions. Please try again."
      );
    } catch {
      return "Unable to export transactions. Please try again.";
    }
  }

  return (
    responseData?.message ||
    "Unable to export transactions. Please try again."
  );
};

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

  const fetchCategories = useCallback(async () => {
    const response = await getCategories();
    const result = extractArray(response, ["categories"]);

    setCategories(result);
  }, []);

  const fetchTransactions = useCallback(
    async (requestedPage = filters.page) => {
      setIsLoading(true);
      setPageError("");

      try {
        const params = {
          page: requestedPage,
          limit: 10,
        };

        if (filters.type) {
          params.type = filters.type;
        }

        if (filters.category) {
          params.category = filters.category;
        }

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
          page: result.pagination.page || requestedPage,
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
    },
    [
      filters.page,
      filters.type,
      filters.category,
      filters.startDate,
      filters.endDate,
    ]
  );

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
      {
        income: 0,
        expenses: 0,
      }
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

      // Always return to page 1 after saving.
      setFilters((current) => ({
        ...current,
        page: 1,
      }));

      // Fetch page 1 directly to avoid using the previous page.
      await fetchTransactions(1);
    } catch (error) {
      setPageError(
        error?.response?.data?.message ||
        "Unable to save transaction. Please try again."
      );

      throw error;
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
        const previousPage = filters.page - 1;

        setFilters((current) => ({
          ...current,
          page: previousPage,
        }));

        await fetchTransactions(previousPage);
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

  // CSV IMPORT
  const handleCSVImport = async (file) => {
    setIsImporting(true);
    setCsvImportError("");
    setPageError("");

    try {
      const response = await importTransactions(file);

      // Axios service returns response.data.
      // Backend response envelope contains the import result in data.
      const result = response?.data ?? {};

      setImportResult(response);
      setIsImportModalOpen(false);

      setFilters((current) => ({
        ...current,
        page: 1,
      }));

      await fetchTransactions(1);

      setNotice(
        `${Number(result.imported || 0)} transactions imported successfully.`
      );
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        "Unable to import CSV file. Please check the file and try again.";

      setCsvImportError(message);
    } finally {
      setIsImporting(false);
    }
  };

  // CSV EXPORT
  const handleCSVExport = async () => {
    setIsExporting(true);
    setPageError("");

    try {
      const params = {};

      if (filters.type) {
        params.type = filters.type;
      }

      if (filters.category) {
        params.category = filters.category;
      }

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

      const response = await exportTransactions(params);

      const blob = new Blob([response.data], {
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
      setPageError(await getExportErrorMessage(error));
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    if (!notice) return undefined;

    const timeout = window.setTimeout(() => {
      setNotice("");
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [notice]);

  const total = Number(pagination.total || 0);
  const page = Number(pagination.page || filters.page);

  const totalPages = Math.max(
    1,
    Number(pagination.totalPages || 1)
  );

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

          <p>
            Track, manage and understand where your money goes.
          </p>
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
            whileHover={!isExporting ? { y: -2 } : {}}
            whileTap={!isExporting ? { scale: 0.97 } : {}}
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
            transition={{ duration: 0.2 }}
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
          variants={cardVariants}
          whileHover={{ y: -5 }}
          transition={{ duration: 0.2 }}
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
          variants={cardVariants}
          whileHover={{ y: -5 }}
          transition={{ duration: 0.2 }}
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
          variants={cardVariants}
          whileHover={{ y: -5 }}
          transition={{ duration: 0.2 }}
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
          variants={cardVariants}
          whileHover={{ y: -5 }}
          transition={{ duration: 0.2 }}
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
            whileHover={!isLoading ? { y: -2 } : {}}
            whileTap={!isLoading ? { scale: 0.96 } : {}}
          >
            <RefreshCw
              size={16}
              className={
                isLoading ? "transaction-refreshing" : ""
              }
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
                  Showing {total === 0 ? 0 : (page - 1) * 10 + 1}
                  {"–"}
                  {Math.min(page * 10, total)} of {total} transactions
                </span>

                <div>
                  <motion.button
                    type="button"
                    aria-label="Previous page"
                    disabled={page <= 1 || isLoading}
                    onClick={() =>
                      setFilters((current) => ({
                        ...current,
                        page: current.page - 1,
                      }))
                    }
                    whileHover={
                      page > 1 ? { scale: 1.06 } : {}
                    }
                    whileTap={
                      page > 1 ? { scale: 0.94 } : {}
                    }
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
                        page: current.page + 1,
                      }))
                    }
                    whileHover={
                      page < totalPages ? { scale: 1.06 } : {}
                    }
                    whileTap={
                      page < totalPages ? { scale: 0.94 } : {}
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

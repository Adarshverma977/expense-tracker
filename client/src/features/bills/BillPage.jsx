
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import {
  Archive,
  Plus,
  RefreshCw,
  ReceiptText,
  AlertCircle,
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  archiveBill,
  createBill,
  createBillPayment,
  getBillPayments,
  getBills,
  updateBill,
} from "./billService";

import { getCategories } from "../../services/categoryService";
import { getWallets } from "../../services/walletService";

import BillFilters from "./components/BillFilters";
import BillCard from "./components/BillCard";
import BillModal from "./components/BillModal";
import BillPaymentModal from "./components/BillPaymentModal";
import BillPaymentHistory from "./components/BillPaymentHistory";

import ConfirmDialog from "../../components/ui/ConfirmDialog";
import appToast from "../../components/ui/toast";

import "./BillPage.css";

const INITIAL_FILTERS = {
  status: "active",
  frequency: "",
  category: "",
  wallet: "",
  due: "",
  startDate: "",
  endDate: "",
  search: "",
  page: 1,
  limit: 10,
  sort: "due_soon",
};

const HISTORY_PAGE_SIZE = 10;

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

const BillPage = () => {
  const [bills, setBills] = useState([]);
  const [categories, setCategories] = useState([]);
  const [wallets, setWallets] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [dependencyError, setDependencyError] = useState("");

  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [archivingBill, setArchivingBill] = useState(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const [selectedBill, setSelectedBill] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  const [historyBill, setHistoryBill] = useState(null);
  const [payments, setPayments] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const [historyPagination, setHistoryPagination] = useState({
    page: 1,
    limit: HISTORY_PAGE_SIZE,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [refreshKey, setRefreshKey] = useState(0);

  const requestIdRef = useRef(0);
  const historyRequestIdRef = useRef(0);
  const historyBillRef = useRef(null);
  const historyPageRef = useRef(1);

  const historyModalRef = useRef(null);
  const historyCloseButtonRef = useRef(null);
  const previousHistoryFocusRef = useRef(null);

  historyBillRef.current = historyBill;

  const requestFilters = useMemo(
    () => ({
      status: filters.status,
      frequency: filters.frequency,
      category: filters.category,
      wallet: filters.wallet,
      due: filters.due,
      startDate: filters.startDate,
      endDate: filters.endDate,
      page: filters.page,
      limit: filters.limit,
      sort: filters.sort,
    }),
    [
      filters.status,
      filters.frequency,
      filters.category,
      filters.wallet,
      filters.due,
      filters.startDate,
      filters.endDate,
      filters.page,
      filters.limit,
      filters.sort,
    ],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [filters.search]);

  const fetchBills = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    try {
      setError("");

      if (!isRefreshing) {
        setIsLoading(true);
      }

      const cleanedFilters = Object.fromEntries(
        Object.entries({
          ...requestFilters,
          search: debouncedSearch,
        }).filter(
          ([, value]) =>
            value !== "" &&
            value !== null &&
            value !== undefined,
        ),
      );

      const response = await getBills(cleanedFilters);

      if (requestId !== requestIdRef.current) return;

      const result = response?.data || {};

      const fetchedBills = Array.isArray(result.bills)
        ? result.bills
        : [];

      const serverPagination = result.pagination || {};

      const serverTotalPages = serverPagination.totalPages ?? 1;
      const serverPage = serverPagination.page ?? filters.page;

      if (
        fetchedBills.length === 0 &&
        serverTotalPages > 0 &&
        serverPage > serverTotalPages
      ) {
        setFilters((current) => ({
          ...current,
          page: serverTotalPages,
        }));

        return;
      }

      setBills(fetchedBills);

      setPagination({
        page: serverPage,
        limit: serverPagination.limit ?? filters.limit,
        total: serverPagination.total ?? 0,
        totalPages: serverTotalPages,
      });
    } catch (err) {
      if (requestId !== requestIdRef.current) return;

      setError(getErrorMessage(err, "Unable to load bills."));
      setBills([]);

      setPagination((current) => ({
        ...current,
        total: 0,
        totalPages: 1,
      }));
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [
    requestFilters,
    debouncedSearch,
    filters.page,
    filters.limit,
    isRefreshing,
  ]);

  const fetchDependencies = useCallback(async () => {
    const results = await Promise.allSettled([
      getCategories(),
      getWallets({ status: "active" }),
    ]);

    const [categoryResult, walletResult] = results;
    const dependencyMessages = [];

    if (categoryResult.status === "fulfilled") {
      setCategories(
        categoryResult.value?.data?.categories || [],
      );
    } else {
      dependencyMessages.push(
        getErrorMessage(
          categoryResult.reason,
          "Unable to load categories.",
        ),
      );
    }

    if (walletResult.status === "fulfilled") {
      setWallets(
        walletResult.value?.data?.wallets || [],
      );
    } else {
      dependencyMessages.push(
        getErrorMessage(
          walletResult.reason,
          "Unable to load wallets.",
        ),
      );
    }

    setDependencyError(dependencyMessages.join(" "));
  }, []);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills, refreshKey]);

  const handleFilterChange = (nextFilters) => {
    setFilters((current) => ({
      ...current,
      ...nextFilters,
      page: 1,
    }));
  };

  const handleResetFilters = () => {
    setFilters({ ...INITIAL_FILTERS });
    setDebouncedSearch("");
  };

  const handleRefresh = () => {
    if (isLoading || isRefreshing) return;

    setIsRefreshing(true);
    setRefreshKey((current) => current + 1);
  };

  const openCreateModal = () => {
    setEditingBill(null);
    setIsBillModalOpen(true);
  };

  const openEditModal = (bill) => {
    setEditingBill(bill);
    setIsBillModalOpen(true);
  };

  const closeBillModal = () => {
    if (isSubmitting) return;

    setIsBillModalOpen(false);
    setEditingBill(null);
  };

  const handleBillSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      setError("");

      if (editingBill) {
        await updateBill(editingBill._id, formData);
      } else {
        await createBill(formData);
      }

      setIsBillModalOpen(false);
      setEditingBill(null);
      setRefreshKey((current) => current + 1);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to save bill."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchiveBill = (bill) => {
    if (!bill?._id || isArchiving) return;

    setArchivingBill(bill);
  };

  const closeArchiveModal = () => {
    if (isArchiving) return;

    setArchivingBill(null);
  };

  const handleArchiveConfirm = async () => {
    if (!archivingBill?._id || isArchiving) return;

    const billTitle = archivingBill.title || "Bill";

    try {
      setIsArchiving(true);

      await archiveBill(archivingBill._id);

      appToast.success(`${billTitle} archived successfully.`);

      setArchivingBill(null);
      setRefreshKey((current) => current + 1);
    } catch (err) {
      appToast.error(
        getErrorMessage(
          err,
          "Unable to archive bill. Please try again.",
        ),
      );
    } finally {
      setIsArchiving(false);
    }
  };

  const openPaymentModal = (bill) => {
    setSelectedBill(bill);
    setIsPaymentModalOpen(true);
  };

  const closePaymentModal = () => {
    if (isPaying) return;

    setIsPaymentModalOpen(false);
    setSelectedBill(null);
  };

  const fetchPaymentHistory = useCallback(
    async (bill, page = 1) => {
      if (!bill?._id) return;

      const requestId = ++historyRequestIdRef.current;

      historyPageRef.current = page;

      try {
        setHistoryError("");
        setIsHistoryLoading(true);

        const response = await getBillPayments({
          bill: bill._id,
          page,
          limit: HISTORY_PAGE_SIZE,
          sort: "newest",
        });

        if (requestId !== historyRequestIdRef.current) return;

        const result = response?.data || {};
        const resultPagination = result.pagination || {};

        const fetchedPayments = Array.isArray(result.payments)
          ? result.payments
          : [];

        const totalPages = resultPagination.totalPages ?? 0;
        const serverPage = resultPagination.page ?? page;

        if (
          fetchedPayments.length === 0 &&
          totalPages > 0 &&
          page > totalPages
        ) {
          const correctedPage = totalPages;

          historyPageRef.current = correctedPage;

          const correctedResponse = await getBillPayments({
            bill: bill._id,
            page: correctedPage,
            limit: HISTORY_PAGE_SIZE,
            sort: "newest",
          });

          if (requestId !== historyRequestIdRef.current) return;

          const correctedResult = correctedResponse?.data || {};
          const correctedPagination =
            correctedResult.pagination || {};

          setPayments(
            Array.isArray(correctedResult.payments)
              ? correctedResult.payments
              : [],
          );

          setHistoryPagination({
            page: correctedPagination.page ?? correctedPage,
            limit: correctedPagination.limit ?? HISTORY_PAGE_SIZE,
            total: correctedPagination.total ?? 0,
            totalPages: correctedPagination.totalPages ?? 0,
            hasNextPage: correctedPagination.hasNextPage ?? false,
            hasPreviousPage:
              correctedPagination.hasPreviousPage ?? correctedPage > 1,
          });

          return;
        }

        setPayments(fetchedPayments);

        setHistoryPagination({
          page: serverPage,
          limit: resultPagination.limit ?? HISTORY_PAGE_SIZE,
          total: resultPagination.total ?? 0,
          totalPages,
          hasNextPage: resultPagination.hasNextPage ?? false,
          hasPreviousPage:
            resultPagination.hasPreviousPage ?? serverPage > 1,
        });
      } catch (err) {
        if (requestId !== historyRequestIdRef.current) return;

        setHistoryError(
          getErrorMessage(
            err,
            "Unable to load payment history.",
          ),
        );

        setPayments([]);
      } finally {
        if (requestId === historyRequestIdRef.current) {
          setIsHistoryLoading(false);
        }
      }
    },
    [],
  );

  const handlePaymentSubmit = async (paymentData) => {
    try {
      setIsPaying(true);
      setError("");

      await createBillPayment(paymentData);

      setIsPaymentModalOpen(false);
      setSelectedBill(null);
      setRefreshKey((current) => current + 1);

      const currentHistoryBill = historyBillRef.current;

      if (currentHistoryBill?._id === paymentData.bill) {
        await fetchPaymentHistory(currentHistoryBill, 1);
      }
    } catch (err) {
      setError(
        getErrorMessage(err, "Unable to record payment."),
      );
    } finally {
      setIsPaying(false);
    }
  };

  const openPaymentHistory = (bill) => {
    historyRequestIdRef.current += 1;
    historyPageRef.current = 1;

    previousHistoryFocusRef.current = document.activeElement;

    setHistoryBill(bill);
    setPayments([]);
    setHistoryError("");
    setIsHistoryLoading(true);

    setHistoryPagination({
      page: 1,
      limit: HISTORY_PAGE_SIZE,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });

    fetchPaymentHistory(bill, 1);
  };

  const closePaymentHistory = () => {
    historyRequestIdRef.current += 1;
    historyPageRef.current = 1;

    setHistoryBill(null);
    setPayments([]);
    setHistoryError("");
    setIsHistoryLoading(false);

    setHistoryPagination({
      page: 1,
      limit: HISTORY_PAGE_SIZE,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  };

  const handleRetryHistory = () => {
    if (historyBill) {
      fetchPaymentHistory(historyBill, historyPageRef.current);
    }
  };

  const handleHistoryPageChange = (page) => {
    if (!historyBill || isHistoryLoading) return;

    if (
      page < 1 ||
      page > historyPagination.totalPages
    ) {
      return;
    }

    fetchPaymentHistory(historyBill, page);
  };

  const handlePageChange = (page) => {
    if (
      page < 1 ||
      page > pagination.totalPages
    ) {
      return;
    }

    setFilters((current) => ({
      ...current,
      page,
    }));
  };

  useEffect(() => {
    if (!historyBill) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const focusTimer = requestAnimationFrame(() => {
      historyCloseButtonRef.current?.focus();
    });

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closePaymentHistory();
        return;
      }

      if (event.key !== "Tab") return;

      const modal = historyModalRef.current;

      if (!modal) return;

      const focusableElements = modal.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

      const elements = Array.from(focusableElements);

      if (!elements.length) {
        event.preventDefault();
        modal.focus();
        return;
      }

      const firstElement = elements[0];
      const lastElement = elements[elements.length - 1];

      if (
        event.shiftKey &&
        (document.activeElement === firstElement ||
          !modal.contains(document.activeElement))
      ) {
        event.preventDefault();
        lastElement.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === lastElement ||
          !modal.contains(document.activeElement))
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [historyBill]);

  useEffect(() => {
    if (historyBill) return;

    const previousFocus = previousHistoryFocusRef.current;

    if (previousFocus?.isConnected) {
      previousFocus.focus();
    }
  }, [historyBill]);

  const visibleError = [error, dependencyError]
    .filter(Boolean)
    .join(" ");

  const hasSearch = filters.search.trim().length > 0;

  return (
    <motion.main
      className="bill-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <section className="bill-page-header">
        <div className="bill-page-heading">
          <span className="bill-page-eyebrow">
            FINANCIAL MANAGEMENT
          </span>

          <h1>Bills & Payments</h1>

          <p>
            Manage recurring bills, upcoming payments and payment history.
          </p>
        </div>

        <div className="bill-page-actions">
          <button
            type="button"
            className="bill-refresh-button"
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            aria-label="Refresh bills"
            title="Refresh bills"
          >
            <RefreshCw
              size={17}
              className={isRefreshing ? "bill-refresh-spinning" : ""}
            />
          </button>

          <button
            type="button"
            className="bill-create-button"
            onClick={openCreateModal}
          >
            <Plus size={18} />
            <span>Add Bill</span>
          </button>
        </div>
      </section>

      <section className="bill-filter-section">
        <BillFilters
          filters={filters}
          categories={categories}
          wallets={wallets}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
        />
      </section>

      <AnimatePresence>
        {visibleError && (
          <motion.div
            className="bill-error-alert"
            role="alert"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <div className="bill-error-icon">
              <AlertCircle size={17} />
            </div>

            <span>{visibleError}</span>

            <button
              type="button"
              onClick={() => {
                setError("");
                setDependencyError("");
              }}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="bill-results-section">
        <div className="bill-results-heading">
          <div className="bill-results-title">
            <div className="bill-results-icon">
              <FileText size={18} />
            </div>

            <div>
              <h2>Your Bills</h2>
              <p>
                {pagination.total}{" "}
                {pagination.total === 1 ? "bill" : "bills"} found
              </p>
            </div>
          </div>

          {isRefreshing && (
            <span className="bill-refresh-status">
              <RefreshCw size={13} />
              Updating
            </span>
          )}
        </div>

        {isLoading ? (
          <div
            className="bill-list bill-skeleton-list"
            aria-label="Loading bills"
          >
            {Array.from({ length: 4 }).map((_, index) => (
              <div className="bill-card-skeleton" key={index}>
                <div className="bill-skeleton-circle" />

                <div className="bill-skeleton-content">
                  <div className="bill-skeleton-line bill-skeleton-title" />
                  <div className="bill-skeleton-line bill-skeleton-subtitle" />
                  <div className="bill-skeleton-line bill-skeleton-detail" />
                </div>

                <div className="bill-skeleton-side">
                  <div className="bill-skeleton-line bill-skeleton-amount" />
                  <div className="bill-skeleton-line bill-skeleton-action" />
                </div>
              </div>
            ))}
          </div>
        ) : bills.length > 0 ? (
          <>
            <div className="bill-list">
              {bills.map((bill, index) => (
                <motion.div
                  className="bill-list-item"
                  key={bill._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.2,
                    delay: Math.min(index * 0.035, 0.2),
                  }}
                >
                  <BillCard
                    bill={bill}
                    onEdit={openEditModal}
                    onArchive={handleArchiveBill}
                    onPay={openPaymentModal}
                  />

                  <button
                    type="button"
                    className="bill-history-trigger"
                    onClick={() => openPaymentHistory(bill)}
                  >
                    <ReceiptText size={15} />
                    <span>Payment history</span>
                  </button>
                </motion.div>
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <nav
                className="bill-pagination"
                aria-label="Bills pagination"
              >
                <button
                  type="button"
                  className="bill-pagination-button"
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    handlePageChange(pagination.page - 1)
                  }
                  aria-label="Previous page"
                >
                  <ChevronLeft size={17} />
                  <span>Previous</span>
                </button>

                <div className="bill-pagination-info">
                  <span className="bill-pagination-current">
                    {pagination.page}
                  </span>
                  <span className="bill-pagination-divider">/</span>
                  <span>{pagination.totalPages}</span>
                  <span className="bill-pagination-label">pages</span>
                </div>

                <button
                  type="button"
                  className="bill-pagination-button"
                  disabled={
                    pagination.page >= pagination.totalPages
                  }
                  onClick={() =>
                    handlePageChange(pagination.page + 1)
                  }
                  aria-label="Next page"
                >
                  <span>Next</span>
                  <ChevronRight size={17} />
                </button>
              </nav>
            )}
          </>
        ) : (
          <motion.div
            className="bill-empty-state"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bill-empty-icon">
              {hasSearch ? (
                <Search size={24} />
              ) : (
                <Archive size={24} />
              )}
            </div>

            <h3>
              {hasSearch
                ? "No matching bills"
                : "No bills found"}
            </h3>

            <p>
              {hasSearch
                ? "We couldn't find any bills matching your search or filters."
                : "Start tracking your expenses by adding your first bill."}
            </p>

            {hasSearch ? (
              <button
                type="button"
                className="bill-empty-reset-button"
                onClick={handleResetFilters}
              >
                Reset filters
              </button>
            ) : (
              <button
                type="button"
                className="bill-create-button bill-empty-create-button"
                onClick={openCreateModal}
              >
                <Plus size={18} />
                <span>Add your first bill</span>
              </button>
            )}
          </motion.div>
        )}
      </section>

      <BillModal
        isOpen={isBillModalOpen}
        bill={editingBill}
        categories={categories}
        wallets={wallets}
        onClose={closeBillModal}
        onSubmit={handleBillSubmit}
        isSubmitting={isSubmitting}
      />

      <BillPaymentModal
        isOpen={isPaymentModalOpen}
        bill={selectedBill}
        wallets={wallets}
        onClose={closePaymentModal}
        onSubmit={handlePaymentSubmit}
        isSubmitting={isPaying}
      />

      <ConfirmDialog
        isOpen={Boolean(archivingBill)}
        onClose={closeArchiveModal}
        onConfirm={handleArchiveConfirm}
        title="Archive this bill?"
        description={
          archivingBill
            ? `"${archivingBill.title}" will be moved out of your active bills list. You can manage it from your archived bills.`
            : "This bill will be moved out of your active bills list."
        }
        confirmText="Archive bill"
        cancelText="Keep bill"
        variant="warning"
        icon="archive"
        isLoading={isArchiving}
      />

      <AnimatePresence>
        {historyBill && (
          <motion.div
            className="bill-history-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closePaymentHistory();
              }
            }}
          >
            <motion.section
              ref={historyModalRef}
              className="bill-history-modal"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="bill-history-modal-title"
              tabIndex={-1}
            >
              <div className="bill-history-modal-header">
                <div className="bill-history-modal-heading">
                  <span className="bill-history-modal-eyebrow">
                    PAYMENT RECORDS
                  </span>

                  <h2 id="bill-history-modal-title">
                    {historyBill.title || "Payment history"}
                  </h2>

                  <p>Review previously recorded payments.</p>
                </div>

                <button
                  ref={historyCloseButtonRef}
                  type="button"
                  className="bill-history-modal-close"
                  onClick={closePaymentHistory}
                  aria-label="Close payment history"
                >
                  ×
                </button>
              </div>

              <div className="bill-history-modal-body">
                <BillPaymentHistory
                  payments={payments}
                  isLoading={isHistoryLoading}
                  error={historyError}
                  onRetry={handleRetryHistory}
                  pagination={historyPagination}
                  onPageChange={handleHistoryPageChange}
                />
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
};

export default BillPage;

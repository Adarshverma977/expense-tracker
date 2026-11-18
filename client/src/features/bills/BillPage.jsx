
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Archive,
  Plus,
  RefreshCw,
  ReceiptText,
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
import ArchiveBillModal from "./components/ArchiveBillModal";

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

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

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

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedBill, setSelectedBill] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  const [archivingBill, setArchivingBill] = useState(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const [historyBill, setHistoryBill] = useState(null);
  const [payments, setPayments] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  const requestIdRef = useRef(0);
  const historyRequestIdRef = useRef(0);

  const fetchBills = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    try {
      setError("");
      setIsLoading(true);

      const {
        search,
        ...apiFilters
      } = filters;

      const response = await getBills(apiFilters);

      if (requestId !== requestIdRef.current) return;

      const result = response?.data || {};

      setBills(Array.isArray(result.bills) ? result.bills : []);

      setPagination({
        page: result.pagination?.page || filters.page,
        limit: result.pagination?.limit || filters.limit,
        total: result.pagination?.total || 0,
        totalPages: result.pagination?.totalPages || 1,
      });
    } catch (err) {
      if (requestId !== requestIdRef.current) return;

      setError(getErrorMessage(err, "Unable to load bills."));
      setBills([]);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [filters]);

  const fetchDependencies = useCallback(async () => {
    try {
      const [categoryResponse, walletResponse] = await Promise.all([
        getCategories(),
        getWallets({ status: "active" }),
      ]);

      setCategories(categoryResponse?.data?.categories || []);
      setWallets(walletResponse?.data?.wallets || []);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load categories and wallets."));
    }
  }, []);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills, refreshKey]);

  const filteredBills = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    if (!search) return bills;

    return bills.filter((bill) =>
      [bill.title, bill.payee, bill.description, bill.category?.name]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search)),
    );
  }, [bills, filters.search]);

  const handleFilterChange = (nextFilters) => {
    setFilters((current) => ({
      ...current,
      ...nextFilters,
      page: 1,
    }));
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const handleRefresh = () => {
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

  const handleArchiveBill = async () => {
    if (!archivingBill) return;

    try {
      setIsArchiving(true);

      await archiveBill(archivingBill._id);

      setArchivingBill(null);
      setRefreshKey((current) => current + 1);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to archive bill."));
    } finally {
      setIsArchiving(false);
    }
  };

  const openPaymentModal = (bill) => {
    setSelectedBill(bill);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (paymentData) => {
    try {
      setIsPaying(true);

      await createBillPayment(paymentData);

      setIsPaymentModalOpen(false);
      setSelectedBill(null);
      setRefreshKey((current) => current + 1);

      if (historyBill?._id === paymentData.bill) {
        await fetchPaymentHistory(historyBill);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Unable to record payment."));
    } finally {
      setIsPaying(false);
    }
  };

  const fetchPaymentHistory = async (bill) => {
    const requestId = ++historyRequestIdRef.current;

    try {
      setHistoryError("");
      setIsHistoryLoading(true);

      const response = await getBillPayments({
        bill: bill._id,
        page: 1,
        limit: 100,
        sort: "newest",
      });

      if (requestId !== historyRequestIdRef.current) return;

      const result = response?.data || {};

      setPayments(Array.isArray(result.payments) ? result.payments : []);
    } catch (err) {
      if (requestId !== historyRequestIdRef.current) return;

      setHistoryError(
        getErrorMessage(err, "Unable to load payment history."),
      );
      setPayments([]);
    } finally {
      if (requestId === historyRequestIdRef.current) {
        setIsHistoryLoading(false);
      }
    }
  };

  const openPaymentHistory = (bill) => {
    setHistoryBill(bill);
    setPayments([]);
    fetchPaymentHistory(bill);
  };

  const closePaymentHistory = () => {
    historyRequestIdRef.current += 1;
    setHistoryBill(null);
    setPayments([]);
    setHistoryError("");
  };

  const handleRetryHistory = () => {
    if (historyBill) {
      fetchPaymentHistory(historyBill);
    }
  };

  const handlePageChange = (page) => {
    setFilters((current) => ({
      ...current,
      page,
    }));
  };

  return (
    <motion.main
      className="bill-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bill-page-header">
        <div className="bill-page-heading">
          <span className="bill-page-eyebrow">
            FINANCIAL MANAGEMENT
          </span>

          <h1> Bills & Payments </h1>

          <p>
            Manage your recurring bills, upcoming payments and payment history.
          </p>
        </div>

        <div className="bill-page-actions">
          <button
            type="button"
            className="bill-refresh-button"
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            aria-label="Refresh bills"
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
      </div>

      <BillFilters
        filters={filters}
        categories={categories}
        wallets={wallets}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {error && (
        <div className="bill-error-alert" role="alert">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      <div className="bill-results-heading">
        <div>
          <h2>Your Bills</h2>
          <span>
            {pagination.total} {pagination.total === 1 ? "bill" : "bills"}
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="bill-list">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="bill-card-skeleton" key={index}>
              <div className="bill-skeleton-circle" />
              <div className="bill-skeleton-content">
                <div className="bill-skeleton-line bill-skeleton-title" />
                <div className="bill-skeleton-line bill-skeleton-subtitle" />
              </div>
              <div className="bill-skeleton-line bill-skeleton-amount" />
            </div>
          ))}
        </div>
      ) : filteredBills.length > 0 ? (
        <>
          <div className="bill-list">
            {filteredBills.map((bill) => (
              <div className="bill-list-item" key={bill._id}>
                <BillCard
                  bill={bill}
                  onEdit={openEditModal}
                  onArchive={setArchivingBill}
                  onPay={openPaymentModal}
                />

                <button
                  type="button"
                  className="bill-history-trigger"
                  onClick={() => openPaymentHistory(bill)}
                >
                  <ReceiptText size={15} />
                  Payment history
                </button>
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="bill-pagination">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                Previous
              </button>

              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="bill-empty-state">
          <div className="bill-empty-icon">
            {filters.search ? <ReceiptText size={25} /> : <Archive size={25} />}
          </div>

          <h3>
            {filters.search ? "No matching bills" : "No bills found"}
          </h3>

          <p>
            {filters.search
              ? "Try another search term or reset your filters."
              : "Create your first bill to start tracking upcoming payments."}
          </p>

          {!filters.search && (
            <button
              type="button"
              className="bill-create-button"
              onClick={openCreateModal}
            >
              <Plus size={18} />
              Add your first bill
            </button>
          )}
        </div>
      )}

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
        onClose={() => {
          if (isPaying) return;
          setIsPaymentModalOpen(false);
          setSelectedBill(null);
        }}
        onSubmit={handlePaymentSubmit}
        isSubmitting={isPaying}
      />

      <ArchiveBillModal
        isOpen={Boolean(archivingBill)}
        bill={archivingBill}
        onClose={() => {
          if (!isArchiving) setArchivingBill(null);
        }}
        onConfirm={handleArchiveBill}
        isArchiving={isArchiving}
      />

      {historyBill && (
        <div
          className="bill-history-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closePaymentHistory();
            }
          }}
        >
          <motion.section
            className="bill-history-modal"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bill-history-modal-title"
          >
            <div className="bill-history-modal-header">
              <div>
                <span>PAYMENT RECORDS</span>
                <h2 id="bill-history-modal-title">
                  {historyBill.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={closePaymentHistory}
                aria-label="Close payment history"
              >
                ×
              </button>
            </div>

            <BillPaymentHistory
              payments={payments}
              isLoading={isHistoryLoading}
              error={historyError}
              onRetry={handleRetryHistory}
            />
          </motion.section>
        </div>
      )}
    </motion.main>
  );
};

export default BillPage;

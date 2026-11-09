
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  RefreshCw,
  Repeat,
  CalendarDays,
  Wallet,
  Pause,
  Play,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Search,
  Clock3,
  AlertCircle,
} from "lucide-react";

import { getCategories } from "../../services/categoryService";

import {
  getRecurringTransactions,
  createRecurringTransaction,
  updateRecurringTransaction,
  pauseRecurringTransaction,
  resumeRecurringTransaction,
  cancelRecurringTransaction,
} from "./recurringTransactionService";

import "./RecurringTransactionsPage.css";

const initialFilters = {
  status: "",
  type: "",
  frequency: "",
  sort: "newest",
  page: 1,
  limit: 10,
};

const emptyForm = {
  title: "",
  amount: "",
  type: "expense",
  category: "",
  description: "",
  paymentMethod: "upi",
  frequency: "monthly",
  startDate: new Date().toLocaleDateString("en-CA"),
  endDate: "",
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const formatDate = (date) => {
  if (!date) return "Not scheduled";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
};

const extractCategories = (response) => {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.categories)) return data.categories;
  if (Array.isArray(data?.data?.categories)) return data.data.categories;

  return [];
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || fallback;

function RecurringTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);

  const [filters, setFilters] = useState(initialFilters);

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionId, setActionId] = useState(null);

  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [cancelItem, setCancelItem] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const fetchCategories = useCallback(async () => {
    const response = await getCategories();
    setCategories(extractCategories(response));
  }, []);

  const fetchRecurringTransactions = useCallback(async () => {
    setIsLoading(true);
    setPageError("");

    try {
      const params = {
        page: filters.page,
        limit: filters.limit,
        sort: filters.sort,
      };

      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;
      if (filters.frequency) params.frequency = filters.frequency;

      const response = await getRecurringTransactions(params);

      const data = response?.data || {};
      const list = Array.isArray(data.recurringTransactions)
        ? data.recurringTransactions
        : [];

      setTransactions(list);

      setPagination((current) => ({
        ...current,
        ...(data.pagination || {}),
        page: data.pagination?.page || filters.page,
        limit: data.pagination?.limit || filters.limit,
        totalPages: data.pagination?.totalPages || 1,
      }));
    } catch (error) {
      setPageError(
        getErrorMessage(
          error,
          "Unable to load recurring transactions."
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCategories().catch(() => {
      setPageError("Unable to load categories.");
    });
  }, [fetchCategories]);

  useEffect(() => {
    fetchRecurringTransactions();
  }, [fetchRecurringTransactions]);

  useEffect(() => {
    if (!notice) return undefined;

    const timeout = window.setTimeout(() => setNotice(""), 3000);

    return () => window.clearTimeout(timeout);
  }, [notice]);

  const summary = useMemo(() => {
    return {
      total: transactions.length,
      active: transactions.filter((item) => item.status === "active").length,
      paused: transactions.filter((item) => item.status === "paused").length,
      monthly: transactions.filter((item) => item.frequency === "monthly").length,
    };
  }, [transactions]);

  const openCreateModal = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);

    setForm({
      title: item.title || "",
      amount: String(item.amount || ""),
      type: item.type || "expense",
      category:
        typeof item.category === "object"
          ? item.category?._id || ""
          : item.category || "",
      description: item.description || "",
      paymentMethod: item.paymentMethod || "other",
      frequency: item.frequency || "monthly",
      startDate: item.startDate
        ? new Date(item.startDate).toISOString().slice(0, 10)
        : "",
      endDate: item.endDate
        ? new Date(item.endDate).toISOString().slice(0, 10)
        : "",
    });

    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;

    setIsModalOpen(false);
    setEditingItem(null);
    setFormError("");
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!form.title.trim() || form.title.trim().length < 2) {
      setFormError("Title must contain at least 2 characters.");
      return;
    }

    if (!/^\d+(\.\d{1,2})?$/.test(form.amount) || Number(form.amount) <= 0) {
      setFormError("Enter a valid positive amount with up to 2 decimals.");
      return;
    }

    if (!form.category) {
      setFormError("Please select a category.");
      return;
    }

    if (!form.startDate) {
      setFormError("Please select a start date.");
      return;
    }

    if (form.endDate && form.endDate < form.startDate) {
      setFormError("End date cannot be before start date.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      amount: form.amount,
      type: form.type,
      category: form.category,
      description: form.description.trim(),
      paymentMethod: form.paymentMethod,
      frequency: form.frequency,
      startDate: form.startDate,
      endDate: form.endDate || null,
    };

    setIsSubmitting(true);

    try {
      if (editingItem) {
        await updateRecurringTransaction(
          editingItem._id || editingItem.id,
          payload
        );

        setNotice("Recurring transaction updated successfully.");
      } else {
        await createRecurringTransaction(payload);
        setNotice("Recurring transaction created successfully.");
      }

      setIsModalOpen(false);
      setEditingItem(null);

      setFilters((current) => ({
        ...current,
        page: 1,
      }));

      if (filters.page === 1) {
        await fetchRecurringTransactions();
      }
    } catch (error) {
      setFormError(
        getErrorMessage(error, "Unable to save recurring transaction.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusAction = async (item) => {
    const id = item._id || item.id;

    setActionId(id);
    setPageError("");

    try {
      if (item.status === "active") {
        await pauseRecurringTransaction(id);
        setNotice("Recurring transaction paused successfully.");
      } else {
        await resumeRecurringTransaction(id);
        setNotice("Recurring transaction resumed successfully.");
      }

      await fetchRecurringTransactions();
    } catch (error) {
      setPageError(
        getErrorMessage(error, "Unable to update recurring transaction.")
      );
    } finally {
      setActionId(null);
    }
  };

  const handleCancel = async () => {
    if (!cancelItem) return;

    const id = cancelItem._id || cancelItem.id;

    setActionId(id);

    try {
      await cancelRecurringTransaction(id);

      setCancelItem(null);
      setNotice("Recurring transaction cancelled successfully.");

      await fetchRecurringTransactions();
    } catch (error) {
      setPageError(
        getErrorMessage(error, "Unable to cancel recurring transaction.")
      );
    } finally {
      setActionId(null);
    }
  };

  const updateFilter = (name, value) => {
    setFilters((current) => ({
      ...current,
      [name]: value,
      page: 1,
    }));
  };

  const getCategoryName = (category) => {
    if (typeof category === "object") return category?.name || "Category";

    return (
      categories.find((item) => item._id === category)?.name || "Category"
    );
  };

  const getStatusClass = (status) => `recurring-status ${status}`;

  return (
    <motion.main
      className="recurring-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <header className="recurring-page-header">
        <div>
          <span className="recurring-eyebrow">AUTOMATE YOUR FINANCES</span>
          <h1>Recurring transactions</h1>
          <p>
            Manage your scheduled income and expenses in one place.
          </p>
        </div>

        <button
          type="button"
          className="recurring-primary-button"
          onClick={openCreateModal}
        >
          <Plus size={18} />
          Create schedule
        </button>
      </header>

      <AnimatePresence>
        {notice && (
          <motion.div
            className="recurring-notice"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="status"
          >
            {notice}
          </motion.div>
        )}
      </AnimatePresence>

      {pageError && (
        <div className="recurring-error-banner" role="alert">
          <AlertCircle size={18} />
          <span>{pageError}</span>
          <button
            type="button"
            onClick={() => setPageError("")}
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <section className="recurring-summary-grid">
        <article className="recurring-summary-card">
          <div className="recurring-summary-icon green">
            <Repeat size={20} />
          </div>
          <div>
            <span>Schedules on page</span>
            <strong>{summary.total}</strong>
          </div>
        </article>

        <article className="recurring-summary-card">
          <div className="recurring-summary-icon blue">
            <Play size={20} />
          </div>
          <div>
            <span>Active schedules</span>
            <strong>{summary.active}</strong>
          </div>
        </article>

        <article className="recurring-summary-card">
          <div className="recurring-summary-icon orange">
            <Pause size={20} />
          </div>
          <div>
            <span>Paused schedules</span>
            <strong>{summary.paused}</strong>
          </div>
        </article>

        <article className="recurring-summary-card">
          <div className="recurring-summary-icon purple">
            <CalendarDays size={20} />
          </div>
          <div>
            <span>Monthly schedules</span>
            <strong>{summary.monthly}</strong>
          </div>
        </article>
      </section>

      <section className="recurring-filter-panel">
        <div className="recurring-filter-heading">
          <div>
            <h2>Your schedules</h2>
            <p>Filter and manage your recurring transactions.</p>
          </div>

          <button
            type="button"
            className="recurring-refresh-button"
            onClick={fetchRecurringTransactions}
            disabled={isLoading}
          >
            <RefreshCw
              size={16}
              className={isLoading ? "recurring-spinning" : ""}
            />
            Refresh
          </button>
        </div>

        <div className="recurring-filters">
          <label>
            <span>Status</span>
            <select
              value={filters.status}
              onChange={(event) => updateFilter("status", event.target.value)}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </label>

          <label>
            <span>Type</span>
            <select
              value={filters.type}
              onChange={(event) => updateFilter("type", event.target.value)}
            >
              <option value="">All types</option>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </label>

          <label>
            <span>Frequency</span>
            <select
              value={filters.frequency}
              onChange={(event) =>
                updateFilter("frequency", event.target.value)
              }
            >
              <option value="">All frequencies</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </label>

          <label>
            <span>Sort by</span>
            <select
              value={filters.sort}
              onChange={(event) => updateFilter("sort", event.target.value)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="next_due">Next due</option>
            </select>
          </label>
        </div>
      </section>

      <section className="recurring-list-panel">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              className="recurring-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <span className="recurring-spinner" />
              <p>Loading your schedules...</p>
            </motion.div>
          ) : transactions.length === 0 ? (
            <motion.div
              key="empty"
              className="recurring-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="recurring-empty-icon">
                <Repeat size={30} />
              </div>
              <h3>No recurring transactions found</h3>
              <p>
                Create a schedule to automate your regular income or expenses.
              </p>
              <button
                type="button"
                className="recurring-primary-button"
                onClick={openCreateModal}
              >
                <Plus size={17} />
                Create your first schedule
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              className="recurring-card-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {transactions.map((item) => (
                <motion.article
                  className="recurring-item-card"
                  key={item._id || item.id}
                  layout
                >
                  <div className="recurring-item-main">
                    <div
                      className={`recurring-item-icon ${item.type === "income" ? "income" : "expense"
                        }`}
                    >
                      <Wallet size={21} />
                    </div>

                    <div className="recurring-item-details">
                      <div className="recurring-item-title-row">
                        <h3>{item.title}</h3>
                        <span className={getStatusClass(item.status)}>
                          {item.status}
                        </span>
                      </div>

                      <div className="recurring-item-meta">
                        <span>{getCategoryName(item.category)}</span>
                        <span className="recurring-meta-dot" />
                        <span>{item.frequency}</span>
                        <span className="recurring-meta-dot" />
                        <span>{item.paymentMethod?.replace("_", " ")}</span>
                      </div>

                      <div className="recurring-next-date">
                        <Clock3 size={14} />
                        Next run: {formatDate(item.nextRunDate)}
                      </div>
                    </div>
                  </div>

                  <div className="recurring-item-right">
                    <strong
                      className={
                        item.type === "income"
                          ? "recurring-income"
                          : "recurring-expense"
                      }
                    >
                      {item.type === "income" ? "+" : "-"}
                      {formatCurrency(item.amount)}
                    </strong>

                    <div className="recurring-item-actions">
                      {(item.status === "active" ||
                        item.status === "paused") && (
                          <button
                            type="button"
                            className="recurring-icon-button"
                            title={item.status === "active" ? "Pause" : "Resume"}
                            disabled={actionId === (item._id || item.id)}
                            onClick={() => handleStatusAction(item)}
                          >
                            {item.status === "active" ? (
                              <Pause size={16} />
                            ) : (
                              <Play size={16} />
                            )}
                          </button>
                        )}

                      {item.status === "active" || item.status === "paused" ? (
                        <>
                          <button
                            type="button"
                            className="recurring-icon-button"
                            title="Edit schedule"
                            onClick={() => openEditModal(item)}
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            className="recurring-icon-button danger"
                            title="Cancel schedule"
                            onClick={() => setCancelItem(item)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {!isLoading && pagination.total > 0 && (
          <div className="recurring-pagination">
            <span>
              Showing {transactions.length} of {pagination.total} schedules
            </span>

            <div>
              <button
                type="button"
                disabled={filters.page <= 1}
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: current.page - 1,
                  }))
                }
                aria-label="Previous page"
              >
                <ChevronLeft size={18} />
              </button>

              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <button
                type="button"
                disabled={filters.page >= pagination.totalPages}
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: current.page + 1,
                  }))
                }
                aria-label="Next page"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Create / Edit modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="recurring-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeModal();
            }}
          >
            <motion.div
              className="recurring-modal"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="recurring-modal-title"
            >
              <div className="recurring-modal-header">
                <div>
                  <span className="recurring-eyebrow">SCHEDULE MANAGER</span>
                  <h2 id="recurring-modal-title">
                    {editingItem ? "Edit schedule" : "Create schedule"}
                  </h2>
                  <p>
                    Set up an automatic recurring income or expense.
                  </p>
                </div>

                <button
                  type="button"
                  className="recurring-modal-close"
                  onClick={closeModal}
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="recurring-form-grid">
                  <label className="recurring-form-full">
                    <span>Transaction title</span>
                    <input
                      name="title"
                      value={form.title}
                      onChange={handleFormChange}
                      placeholder="e.g. Monthly rent"
                      maxLength={100}
                      required
                    />
                  </label>

                  <label>
                    <span>Amount (₹)</span>
                    <input
                      name="amount"
                      type="number"
                      min="0.01"
                      max="999999999999.99"
                      step="0.01"
                      value={form.amount}
                      onChange={handleFormChange}
                      placeholder="1500.00"
                      required
                    />
                  </label>

                  <label>
                    <span>Transaction type</span>
                    <select
                      name="type"
                      value={form.type}
                      onChange={handleFormChange}
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </label>

                  <label>
                    <span>Category</span>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Select category</option>
                      {categories
                        .filter((category) => {
                          const categoryType =
                            category.type || category.categoryType;

                          return !categoryType || categoryType === form.type;
                        })
                        .map((category) => (
                          <option
                            key={category._id}
                            value={category._id}
                          >
                            {category.name}
                          </option>
                        ))}
                    </select>
                  </label>

                  <label>
                    <span>Payment method</span>
                    <select
                      name="paymentMethod"
                      value={form.paymentMethod}
                      onChange={handleFormChange}
                    >
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="card">Card</option>
                      <option value="bank_transfer">Bank transfer</option>
                      <option value="other">Other</option>
                    </select>
                  </label>

                  <label>
                    <span>Frequency</span>
                    <select
                      name="frequency"
                      value={form.frequency}
                      onChange={handleFormChange}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </label>

                  <label>
                    <span>Start date</span>
                    <input
                      type="date"
                      name="startDate"
                      value={form.startDate}
                      onChange={handleFormChange}
                      required
                    />
                  </label>

                  <label>
                    <span>End date <small>(Optional)</small></span>
                    <input
                      type="date"
                      name="endDate"
                      min={form.startDate}
                      value={form.endDate}
                      onChange={handleFormChange}
                    />
                  </label>

                  <label className="recurring-form-full">
                    <span>Description <small>(Optional)</small></span>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleFormChange}
                      placeholder="Add some details..."
                      rows={3}
                      maxLength={500}
                    />
                  </label>
                </div>

                {formError && (
                  <div className="recurring-form-error" role="alert">
                    <AlertCircle size={16} />
                    {formError}
                  </div>
                )}

                <div className="recurring-modal-footer">
                  <button
                    type="button"
                    className="recurring-secondary-button"
                    onClick={closeModal}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="recurring-primary-button"
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? "Saving..."
                      : editingItem
                        ? "Save changes"
                        : "Create schedule"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel confirmation */}
      <AnimatePresence>
        {cancelItem && (
          <motion.div
            className="recurring-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="recurring-confirm-modal"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="cancel-recurring-title"
            >
              <div className="recurring-confirm-icon">
                <Trash2 size={23} />
              </div>

              <h2 id="cancel-recurring-title">Cancel this schedule?</h2>

              <p>
                <strong>{cancelItem.title}</strong> will no longer generate
                future transactions. Existing transactions will remain.
              </p>

              <div className="recurring-modal-footer">
                <button
                  type="button"
                  className="recurring-secondary-button"
                  onClick={() => setCancelItem(null)}
                  disabled={actionId === (cancelItem._id || cancelItem.id)}
                >
                  Keep schedule
                </button>

                <button
                  type="button"
                  className="recurring-danger-button"
                  onClick={handleCancel}
                  disabled={actionId === (cancelItem._id || cancelItem.id)}
                >
                  {actionId === (cancelItem._id || cancelItem.id)
                    ? "Cancelling..."
                    : "Yes, cancel"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}

export default RecurringTransactionsPage;

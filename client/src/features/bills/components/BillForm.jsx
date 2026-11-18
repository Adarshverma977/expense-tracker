
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, X, CalendarDays, IndianRupee } from "lucide-react";

const DEFAULT_FORM = {
  title: "",
  payee: "",
  description: "",
  amount: "",
  category: "",
  wallet: "",
  frequency: "one_time",
  dueDate: "",
  nextDueDate: "",
  reminderDays: [7, 3, 1],
  notes: "",
};

const toDateInputValue = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getInitialForm = (bill) => {
  if (!bill) return { ...DEFAULT_FORM };

  return {
    title: bill.title || "",
    payee: bill.payee || "",
    description: bill.description || "",
    amount: bill.amount?.toString() || "",
    category:
      typeof bill.category === "object"
        ? bill.category?._id || ""
        : bill.category || "",
    wallet:
      typeof bill.wallet === "object"
        ? bill.wallet?._id || ""
        : bill.wallet || "",
    frequency: bill.frequency || "one_time",
    dueDate: toDateInputValue(bill.dueDate),
    nextDueDate: toDateInputValue(bill.nextDueDate),
    reminderDays: Array.isArray(bill.reminderDays)
      ? bill.reminderDays
      : [7, 3, 1],
    notes: bill.notes || "",
  };
};

const BillForm = ({
  bill = null,
  categories = [],
  wallets = [],
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState(() =>
    getInitialForm(bill)
  );

  const [formError, setFormError] = useState("");

  useEffect(() => {
    setFormData(getInitialForm(bill));
    setFormError("");
  }, [bill]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
      ...(name === "frequency" && value === "one_time"
        ? { nextDueDate: "" }
        : {}),
    }));

    setFormError("");
  };

  const handleReminderChange = (days) => {
    setFormData((current) => {
      const selected = current.reminderDays.includes(days);

      return {
        ...current,
        reminderDays: selected
          ? current.reminderDays.filter((day) => day !== days)
          : [...current.reminderDays, days].sort((a, b) => b - a),
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!formData.title.trim()) {
      setFormError("Please enter a bill title.");
      return;
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      setFormError("Please enter a valid bill amount.");
      return;
    }

    if (!formData.category) {
      setFormError("Please select a category.");
      return;
    }

    if (!formData.dueDate) {
      setFormError("Please select a due date.");
      return;
    }

    if (
      formData.frequency !== "one_time" &&
      formData.nextDueDate &&
      formData.nextDueDate <= formData.dueDate
    ) {
      setFormError("Next due date must be later than the due date.");
      return;
    }

    const payload = {
      ...formData,
      title: formData.title.trim(),
      payee: formData.payee.trim(),
      description: formData.description.trim(),
      amount: formData.amount.trim(),
      category: formData.category,
      wallet: formData.wallet || null,
      dueDate: new Date(`${formData.dueDate}T12:00:00`).toISOString(),
      nextDueDate:
        formData.frequency === "one_time" || !formData.nextDueDate
          ? null
          : new Date(`${formData.nextDueDate}T12:00:00`).toISOString(),
      reminderDays: [...formData.reminderDays],
      notes: formData.notes.trim(),
    };

    try {
      await onSubmit?.(payload);
    } catch (error) {
      setFormError(
        error?.response?.data?.message ||
        error?.message ||
        "Unable to save bill. Please try again."
      );
    }
  };

  const expenseCategories = categories.filter(
    (category) =>
      category.type === "expense" &&
      category.status !== "archived"
  );

  const activeWallets = wallets.filter(
    (wallet) => wallet.status === "active"
  );

  return (
    <form className="bill-form" onSubmit={handleSubmit}>
      <div className="bill-form-grid">
        <div className="bill-form-field bill-form-full">
          <label htmlFor="bill-title">Bill title *</label>
          <input
            id="bill-title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Electricity bill"
            maxLength={100}
            required
          />
        </div>

        <div className="bill-form-field">
          <label htmlFor="bill-payee">Payee / Provider</label>
          <input
            id="bill-payee"
            name="payee"
            type="text"
            value={formData.payee}
            onChange={handleChange}
            placeholder="e.g. Electricity Board"
            maxLength={100}
          />
        </div>

        <div className="bill-form-field">
          <label htmlFor="bill-amount">Amount *</label>
          <div className="bill-input-with-icon">
            <IndianRupee size={17} />
            <input
              id="bill-amount"
              name="amount"
              type="number"
              min="0.01"
              max="999999999999.99"
              step="0.01"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div className="bill-form-field">
          <label htmlFor="bill-category">Category *</label>
          <select
            id="bill-category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">Select category</option>
            {expenseCategories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="bill-form-field">
          <label htmlFor="bill-wallet">Payment wallet</label>
          <select
            id="bill-wallet"
            name="wallet"
            value={formData.wallet}
            onChange={handleChange}
          >
            <option value="">No wallet assigned</option>
            {activeWallets.map((wallet) => (
              <option key={wallet._id} value={wallet._id}>
                {wallet.name}
                {wallet.type === "credit_card" ? " (Credit Card)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="bill-form-field">
          <label htmlFor="bill-frequency">Frequency *</label>
          <select
            id="bill-frequency"
            name="frequency"
            value={formData.frequency}
            onChange={handleChange}
          >
            <option value="one_time">One time</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        <div className="bill-form-field">
          <label htmlFor="bill-due-date">Due date *</label>
          <div className="bill-input-with-icon">
            <CalendarDays size={17} />
            <input
              id="bill-due-date"
              name="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {formData.frequency !== "one_time" && (
          <div className="bill-form-field">
            <label htmlFor="bill-next-due-date">
              Next due date
            </label>
            <div className="bill-input-with-icon">
              <CalendarDays size={17} />
              <input
                id="bill-next-due-date"
                name="nextDueDate"
                type="date"
                min={formData.dueDate || undefined}
                value={formData.nextDueDate}
                onChange={handleChange}
              />
            </div>
          </div>
        )}

        <div className="bill-form-field bill-form-full">
          <label htmlFor="bill-description">Description</label>
          <textarea
            id="bill-description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Add some details about this bill..."
            rows={3}
            maxLength={500}
          />
        </div>

        <div className="bill-form-field bill-form-full">
          <label>Reminder schedule</label>
          <div className="bill-reminder-options">
            {[30, 14, 7, 3, 1, 0].map((days) => (
              <label
                className="bill-reminder-option"
                key={days}
              >
                <input
                  type="checkbox"
                  checked={formData.reminderDays.includes(days)}
                  onChange={() => handleReminderChange(days)}
                />
                <span>
                  {days === 0 ? "Due date" : `${days} days before`}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="bill-form-field bill-form-full">
          <label htmlFor="bill-notes">Notes</label>
          <textarea
            id="bill-notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Additional notes..."
            rows={3}
            maxLength={1000}
          />
        </div>
      </div>

      {formError && (
        <div className="bill-form-error" role="alert">
          {formError}
        </div>
      )}

      <div className="bill-form-actions">
        <button
          type="button"
          className="bill-form-cancel"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          <X size={17} />
          Cancel
        </button>

        <motion.button
          type="submit"
          className="bill-form-submit"
          disabled={isSubmitting}
          whileTap={{ scale: 0.97 }}
        >
          <Save size={17} />
          {isSubmitting
            ? "Saving..."
            : bill
              ? "Update bill"
              : "Create bill"}
        </motion.button>
      </div>
    </form>
  );
};

export default BillForm;

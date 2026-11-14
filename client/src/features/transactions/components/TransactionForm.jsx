
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LoaderCircle } from "lucide-react";

const createInitialForm = () => ({
  title: "",
  amount: "",
  type: "expense",
  category: "",
  description: "",
  date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16),
  paymentMethod: "upi",
});

const toLocalDateTime = (date) => {
  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return createInitialForm().date;
  }

  const offset = value.getTimezoneOffset() * 60000;

  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
};

const fieldVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const getCategoryId = (category) => {
  if (!category) return "";

  if (typeof category === "object") {
    return category._id || category.id || "";
  }

  return category;
};

const getTransactionForm = (transaction) => {
  if (!transaction) return createInitialForm();

  return {
    title: transaction.title || "",
    amount: String(transaction.amount ?? ""),
    type: transaction.type === "income" ? "income" : "expense",
    category: getCategoryId(transaction.category),
    description: transaction.description || "",
    date: transaction.date
      ? toLocalDateTime(transaction.date)
      : createInitialForm().date,
    paymentMethod: transaction.paymentMethod || "upi",
  };
};

function TransactionForm({
  transaction,
  categories = [],
  onSubmit,
  onCancel,
  isSubmitting = false,
}) {
  const [form, setForm] = useState(() => getTransactionForm(transaction));
  const [error, setError] = useState("");

  const safeCategories = useMemo(
    () => (Array.isArray(categories) ? categories.filter(Boolean) : []),
    [categories]
  );

  const availableCategories = useMemo(
    () => safeCategories.filter((category) => category.type === form.type),
    [safeCategories, form.type]
  );

  useEffect(() => {
    setForm(getTransactionForm(transaction));
    setError("");
  }, [transaction]);

  useEffect(() => {
    if (!form.category) return;

    const categoryExists = availableCategories.some(
      (category) => getCategoryId(category) === form.category
    );

    if (!categoryExists) {
      setForm((current) => ({ ...current, category: "" }));
    }
  }, [availableCategories, form.category]);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  };

  const handleTypeChange = (type) => {
    setForm((current) => ({
      ...current,
      type,
      category: "",
    }));

    setError("");
  };

  const validateForm = () => {
    const title = form.title.trim();

    if (title.length < 2) {
      return "Title must contain at least 2 characters.";
    }

    if (title.length > 100) {
      return "Title cannot exceed 100 characters.";
    }

    const amountValue = form.amount.trim();

    if (!/^\d+(\.\d{1,2})?$/.test(amountValue)) {
      return "Enter a valid amount with up to 2 decimal places.";
    }

    const amount = Number(amountValue);

    if (!Number.isFinite(amount) || amount <= 0) {
      return "Amount must be greater than zero.";
    }

    if (!form.category) {
      return "Please select a category.";
    }

    if (!availableCategories.some(
      (category) => getCategoryId(category) === form.category
    )) {
      return "Please select a valid category.";
    }

    if (!form.date || Number.isNaN(new Date(form.date).getTime())) {
      return "Please select a valid date.";
    }

    if (form.description.trim().length > 500) {
      return "Description cannot exceed 500 characters.";
    }

    const allowedPaymentMethods = [
      "cash",
      "upi",
      "card",
      "bank_transfer",
      "other",
    ];

    if (!allowedPaymentMethods.includes(form.paymentMethod)) {
      return "Please select a valid payment method.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");

    try {
      await onSubmit({
        title: form.title.trim(),
        amount: form.amount.trim(),
        type: form.type,
        category: form.category,
        description: form.description.trim(),
        date: new Date(form.date).toISOString(),
        paymentMethod: form.paymentMethod,
      });
    } catch (submitError) {
      setError(
        submitError?.response?.data?.message ||
        submitError?.message ||
        "Unable to save transaction. Please try again."
      );
    }
  };

  return (
    <motion.form
      className="transaction-form"
      onSubmit={handleSubmit}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: 0.055 },
        },
      }}
      noValidate
    >
      <motion.div
        className="transaction-type-switch"
        variants={fieldVariants}
        role="group"
        aria-label="Transaction type"
      >
        <motion.button
          type="button"
          className={form.type === "expense" ? "active expense" : ""}
          onClick={() => handleTypeChange("expense")}
          aria-pressed={form.type === "expense"}
          disabled={isSubmitting}
          whileTap={{ scale: 0.97 }}
        >
          Expense
        </motion.button>

        <motion.button
          type="button"
          className={form.type === "income" ? "active income" : ""}
          onClick={() => handleTypeChange("income")}
          aria-pressed={form.type === "income"}
          disabled={isSubmitting}
          whileTap={{ scale: 0.97 }}
        >
          Income
        </motion.button>
      </motion.div>

      <motion.label
        className="transaction-form-field"
        variants={fieldVariants}
      >
        <span>Transaction title</span>
        <input
          type="text"
          name="title"
          placeholder="e.g. Monthly groceries"
          maxLength={100}
          autoComplete="off"
          value={form.title}
          onChange={(event) => updateField("title", event.target.value)}
          disabled={isSubmitting}
          required
        />
      </motion.label>

      <motion.label
        className="transaction-form-field"
        variants={fieldVariants}
      >
        <span>Amount</span>
        <div className="transaction-amount-input">
          <span aria-hidden="true">₹</span>
          <input
            type="number"
            name="amount"
            placeholder="0.00"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            value={form.amount}
            onChange={(event) => updateField("amount", event.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>
      </motion.label>

      <motion.div
        className="transaction-form-row"
        variants={fieldVariants}
      >
        <label className="transaction-form-field">
          <span>Category</span>
          <select
            name="category"
            value={form.category}
            onChange={(event) => updateField("category", event.target.value)}
            disabled={isSubmitting || availableCategories.length === 0}
            required
          >
            <option value="">Select category</option>
            {availableCategories.map((category) => {
              const categoryId = getCategoryId(category);

              if (!categoryId) return null;

              return (
                <option key={categoryId} value={categoryId}>
                  {category.name || "Unnamed category"}
                </option>
              );
            })}
          </select>
          {availableCategories.length === 0 && (
            <small className="transaction-form-hint">
              No categories available for this transaction type.
            </small>
          )}
        </label>

        <label className="transaction-form-field">
          <span>Payment method</span>
          <select
            name="paymentMethod"
            value={form.paymentMethod}
            onChange={(event) =>
              updateField("paymentMethod", event.target.value)
            }
            disabled={isSubmitting}
          >
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="bank_transfer">Bank transfer</option>
            <option value="other">Other</option>
          </select>
        </label>
      </motion.div>

      <motion.label
        className="transaction-form-field"
        variants={fieldVariants}
      >
        <span>Date</span>
        <input
          type="datetime-local"
          name="date"
          value={form.date}
          onChange={(event) => updateField("date", event.target.value)}
          disabled={isSubmitting}
          required
        />
      </motion.label>

      <motion.label
        className="transaction-form-field"
        variants={fieldVariants}
      >
        <span>
          Description <small>Optional</small>
        </span>
        <textarea
          name="description"
          rows={3}
          maxLength={500}
          placeholder="Add a note about this transaction..."
          value={form.description}
          onChange={(event) =>
            updateField("description", event.target.value)
          }
          disabled={isSubmitting}
        />
        <small className="transaction-form-character-count">
          {form.description.length}/500
        </small>
      </motion.label>

      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            key={error}
            className="transaction-form-error"
            role="alert"
            initial={{ opacity: 0, height: 0, y: -5 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -5 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.div
        className="transaction-form-actions"
        variants={fieldVariants}
      >
        <motion.button
          type="button"
          className="transaction-secondary-button"
          onClick={onCancel}
          disabled={isSubmitting}
          whileHover={!isSubmitting ? { y: -2 } : undefined}
          whileTap={!isSubmitting ? { scale: 0.97 } : undefined}
        >
          Cancel
        </motion.button>

        <motion.button
          type="submit"
          className="transaction-primary-button"
          disabled={isSubmitting || availableCategories.length === 0}
          whileHover={!isSubmitting ? { y: -2 } : undefined}
          whileTap={!isSubmitting ? { scale: 0.97 } : undefined}
        >
          {isSubmitting ? (
            <>
              <LoaderCircle
                className="transaction-spinner"
                size={17}
                aria-hidden="true"
              />
              Saving...
            </>
          ) : transaction ? (
            "Save changes"
          ) : (
            "Add transaction"
          )}
        </motion.button>
      </motion.div>
    </motion.form>
  );
}

export default TransactionForm;

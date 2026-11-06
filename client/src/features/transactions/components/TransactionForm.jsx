
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LoaderCircle } from "lucide-react";

const initialForm = {
  title: "",
  amount: "",
  type: "expense",
  category: "",
  description: "",
  date: new Date().toISOString().slice(0, 16),
  paymentMethod: "upi",
};

const toLocalDateTime = (date) => {
  const value = new Date(date);
  const offset = value.getTimezoneOffset() * 60000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
};

const fieldVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

function TransactionForm({
  transaction,
  categories,
  onSubmit,
  onCancel,
  isSubmitting,
}) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  useEffect(() => {
    if (transaction) {
      setForm({
        title: transaction.title || "",
        amount: String(transaction.amount ?? ""),
        type: transaction.type || "expense",
        category:
          typeof transaction.category === "object"
            ? transaction.category?._id || ""
            : transaction.category || "",
        description: transaction.description || "",
        date: transaction.date
          ? toLocalDateTime(transaction.date)
          : initialForm.date,
        paymentMethod: transaction.paymentMethod || "upi",
      });
    } else {
      setForm({
        ...initialForm,
        date: new Date().toISOString().slice(0, 16),
      });
    }

    setError("");
  }, [transaction]);

  const availableCategories = categories.filter(
    (category) => category.type === form.type
  );

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  };

  const handleTypeChange = (type) => {
    const nextCategory = categories.find(
      (category) => category.type === type
    );

    setForm((current) => ({
      ...current,
      type,
      category: nextCategory
        ? nextCategory._id || nextCategory.id
        : "",
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.title.trim() || form.title.trim().length < 2) {
      setError("Title must contain at least 2 characters.");
      return;
    }

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid amount greater than zero.");
      return;
    }

    if (!/^\d+(\.\d{1,2})?$/.test(form.amount.trim())) {
      setError("Amount can have up to 2 decimal places.");
      return;
    }

    if (!form.category) {
      setError("Please select a category.");
      return;
    }

    if (!form.date || Number.isNaN(new Date(form.date).getTime())) {
      setError("Please select a valid date.");
      return;
    }

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
        "Unable to save transaction."
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
        visible: { transition: { staggerChildren: 0.055 } },
      }}
    >
      <motion.div
        className="transaction-type-switch"
        variants={fieldVariants}
      >
        <motion.button
          type="button"
          className={form.type === "expense" ? "active expense" : ""}
          onClick={() => handleTypeChange("expense")}
          whileTap={{ scale: 0.97 }}
        >
          Expense
        </motion.button>

        <motion.button
          type="button"
          className={form.type === "income" ? "active income" : ""}
          onClick={() => handleTypeChange("income")}
          whileTap={{ scale: 0.97 }}
        >
          Income
        </motion.button>
      </motion.div>

      <motion.label className="transaction-form-field" variants={fieldVariants}>
        <span>Transaction title</span>
        <input
          type="text"
          placeholder="e.g. Monthly groceries"
          maxLength={100}
          value={form.title}
          onChange={(event) => updateField("title", event.target.value)}
          required
        />
      </motion.label>

      <motion.label className="transaction-form-field" variants={fieldVariants}>
        <span>Amount</span>
        <div className="transaction-amount-input">
          <span>₹</span>
          <input
            type="number"
            placeholder="0.00"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={(event) => updateField("amount", event.target.value)}
            required
          />
        </div>
      </motion.label>

      <motion.div className="transaction-form-row" variants={fieldVariants}>
        <label className="transaction-form-field">
          <span>Category</span>
          <select
            value={form.category}
            onChange={(event) => updateField("category", event.target.value)}
            required
          >
            <option value="">Select category</option>
            {availableCategories.map((category) => (
              <option
                key={category._id || category.id}
                value={category._id || category.id}
              >
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="transaction-form-field">
          <span>Payment method</span>
          <select
            value={form.paymentMethod}
            onChange={(event) =>
              updateField("paymentMethod", event.target.value)
            }
          >
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="bank_transfer">Bank transfer</option>
            <option value="other">Other</option>
          </select>
        </label>
      </motion.div>

      <motion.label className="transaction-form-field" variants={fieldVariants}>
        <span>Date</span>
        <input
          type="datetime-local"
          value={form.date}
          onChange={(event) => updateField("date", event.target.value)}
          required
        />
      </motion.label>

      <motion.label className="transaction-form-field" variants={fieldVariants}>
        <span>
          Description <small>Optional</small>
        </span>
        <textarea
          rows={3}
          maxLength={500}
          placeholder="Add a note about this transaction..."
          value={form.description}
          onChange={(event) =>
            updateField("description", event.target.value)
          }
        />
      </motion.label>

      <AnimatePresence>
        {error && (
          <motion.p
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
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
        >
          Cancel
        </motion.button>

        <motion.button
          type="submit"
          className="transaction-primary-button"
          disabled={isSubmitting}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="transaction-spinner" size={17} />
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


import { useState } from "react";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  IndianRupee,
} from "lucide-react";

const initialValues = {
  type: "deposit",
  amount: "",
  note: "",
};

const amountPattern = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;
const MAX_AMOUNT = 999999999999.99;

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const getSafeNumber = (value) => {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const ContributionForm = ({
  onSubmit,
  onCancel,
  savedAmount = 0,
  loading = false,
}) => {
  const [formData, setFormData] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  const availableBalance = Math.max(0, getSafeNumber(savedAmount));
  const isDeposit = formData.type === "deposit";

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setSubmitError("");
  };

  const handleTypeChange = (type) => {
    if (loading || !["deposit", "withdrawal"].includes(type)) return;

    setFormData((previous) => ({
      ...previous,
      type,
    }));

    setErrors({});
    setSubmitError("");
  };

  const validateForm = () => {
    const nextErrors = {};

    const amount = formData.amount.trim();
    const note = formData.note.trim();

    if (!amountPattern.test(amount)) {
      nextErrors.amount =
        "Enter a valid amount with up to 2 decimal places.";
    } else {
      const numericAmount = Number(amount);

      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        nextErrors.amount = "Amount must be greater than zero.";
      } else if (numericAmount > MAX_AMOUNT) {
        nextErrors.amount = "Amount is too large.";
      } else if (
        formData.type === "withdrawal" &&
        numericAmount > availableBalance
      ) {
        nextErrors.amount =
          "Withdrawal amount cannot exceed your saved balance.";
      }
    }

    if (note.length > 300) {
      nextErrors.note = "Note cannot exceed 300 characters.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading || !validateForm()) return;

    try {
      setSubmitError("");

      await onSubmit({
        type: formData.type,
        amount: formData.amount.trim(),
        note: formData.note.trim(),
      });

      setFormData(initialValues);
      setErrors({});
    } catch (error) {
      setSubmitError(
        error?.response?.data?.message ||
        error?.message ||
        "Unable to save contribution. Please try again."
      );
    }
  };

  return (
    <form
      className="goal-form contribution-form"
      onSubmit={handleSubmit}
    >
      <div className="goal-form-field">
        <label>Contribution type</label>

        <div className="contribution-type-options">
          <button
            type="button"
            className={`contribution-type-option ${isDeposit ? "selected deposit" : ""
              }`}
            onClick={() => handleTypeChange("deposit")}
            disabled={loading}
            aria-pressed={isDeposit}
          >
            <ArrowDownToLine size={17} />
            <span>Deposit</span>
          </button>

          <button
            type="button"
            className={`contribution-type-option ${!isDeposit ? "selected withdrawal" : ""
              }`}
            onClick={() => handleTypeChange("withdrawal")}
            disabled={loading}
            aria-pressed={!isDeposit}
          >
            <ArrowUpFromLine size={17} />
            <span>Withdrawal</span>
          </button>
        </div>
      </div>

      <div className="goal-form-field">
        <label htmlFor="contribution-amount">
          <IndianRupee size={14} />
          {isDeposit ? "Deposit amount" : "Withdrawal amount"}
        </label>

        <input
          id="contribution-amount"
          type="text"
          inputMode="decimal"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          placeholder="Enter amount"
          maxLength={15}
          required
          disabled={loading}
          aria-invalid={Boolean(errors.amount)}
          aria-describedby={
            errors.amount ? "contribution-amount-error" : undefined
          }
        />

        {errors.amount && (
          <span
            id="contribution-amount-error"
            className="goal-form-error"
          >
            {errors.amount}
          </span>
        )}

        <span className="goal-form-hint">
          Current saved balance: ₹
          {currencyFormatter.format(availableBalance)}
        </span>
      </div>

      <div className="goal-form-field">
        <label htmlFor="contribution-note">
          Note <span>(Optional)</span>
        </label>

        <textarea
          id="contribution-note"
          name="note"
          value={formData.note}
          onChange={handleChange}
          placeholder={
            isDeposit
              ? "e.g. Monthly savings contribution"
              : "e.g. Emergency expense"
          }
          maxLength={300}
          rows={3}
          disabled={loading}
          aria-invalid={Boolean(errors.note)}
          aria-describedby={
            errors.note ? "contribution-note-error" : undefined
          }
        />

        {errors.note && (
          <span
            id="contribution-note-error"
            className="goal-form-error"
          >
            {errors.note}
          </span>
        )}
      </div>

      {submitError && (
        <div className="goal-action-error" role="alert">
          {submitError}
        </div>
      )}

      <div className="goal-form-actions">
        <button
          type="button"
          className="goal-cancel-button"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="goal-submit-button"
          disabled={loading}
        >
          {loading
            ? "Processing..."
            : isDeposit
              ? "Add Deposit"
              : "Confirm Withdrawal"}
        </button>
      </div>
    </form>
  );
};

export default ContributionForm;

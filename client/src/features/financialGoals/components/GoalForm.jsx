
import { useEffect, useState } from "react";

import {
  Target,
  CalendarDays,
  IndianRupee,
  AlertCircle,
} from "lucide-react";

const initialValues = {
  title: "",
  description: "",
  targetAmount: "",
  targetDate: "",
  icon: "target",
  color: "#176B45",
};

const goalColors = [
  "#176B45",
  "#2563EB",
  "#9333EA",
  "#DB7C26",
  "#DC4560",
  "#0891B2",
];

const amountPattern = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const MAX_TARGET_AMOUNT = 999999999999.99;

const getDateInputValue = (date) => {
  if (!date) return "";

  if (typeof date === "string" && datePattern.test(date)) {
    return isValidDate(date) ? date : "";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "";

  const year = parsedDate.getUTCFullYear();
  const month = String(parsedDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const isValidDate = (date) => {
  if (!datePattern.test(date)) return false;

  const [year, month, day] = date.split("-").map(Number);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  return (
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() === month - 1 &&
    parsedDate.getUTCDate() === day
  );
};

const getErrorMessage = (error) => {
  const message = error?.response?.data?.message;

  if (typeof message === "string" && message.trim()) {
    return message;
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
};

const GoalForm = ({
  onSubmit,
  onCancel,
  loading = false,
  initialGoal = null,
  mode = "create",
}) => {
  const [formData, setFormData] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  const isEditMode = mode === "edit";

  useEffect(() => {
    if (initialGoal && isEditMode) {
      setFormData({
        title: initialGoal.title || "",
        description: initialGoal.description || "",
        targetAmount: String(initialGoal.targetAmount ?? ""),
        targetDate: getDateInputValue(initialGoal.targetDate),
        icon: initialGoal.icon || "target",
        color: initialGoal.color || "#176B45",
      });
    } else {
      setFormData(initialValues);
    }

    setErrors({});
    setSubmitError("");
  }, [initialGoal, isEditMode]);

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

  const validateForm = () => {
    const nextErrors = {};

    const title = formData.title.trim();
    const description = formData.description.trim();
    const amount = formData.targetAmount.trim();

    if (title.length < 2) {
      nextErrors.title = "Title must contain at least 2 characters.";
    } else if (title.length > 100) {
      nextErrors.title = "Title cannot exceed 100 characters.";
    }

    if (!amountPattern.test(amount)) {
      nextErrors.targetAmount =
        "Enter a valid amount with up to 2 decimals.";
    } else {
      const numericAmount = Number(amount);

      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        nextErrors.targetAmount =
          "Target amount must be greater than zero.";
      } else if (numericAmount > MAX_TARGET_AMOUNT) {
        nextErrors.targetAmount = "Target amount is too large.";
      } else if (
        isEditMode &&
        initialGoal &&
        numericAmount < Number(initialGoal.savedAmount || 0)
      ) {
        nextErrors.targetAmount =
          "Target amount cannot be less than the amount already saved.";
      }
    }

    if (!formData.targetDate) {
      nextErrors.targetDate = "Please select a target date.";
    } else if (!isValidDate(formData.targetDate)) {
      nextErrors.targetDate = "Please select a valid date.";
    }

    if (description.length > 500) {
      nextErrors.description =
        "Description cannot exceed 500 characters.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading || !validateForm()) return;

    setSubmitError("");

    try {
      await onSubmit({
        title: formData.title.trim(),
        description: formData.description.trim(),
        targetAmount: formData.targetAmount.trim(),
        targetDate: formData.targetDate,
        icon: formData.icon,
        color: formData.color,
      });
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    }
  };

  return (
    <form className="goal-form" onSubmit={handleSubmit}>
      <div className="goal-form-content">
        <div className="goal-form-field">
          <label htmlFor="goal-title">Goal name</label>

          <input
            id="goal-title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Buy a new laptop"
            maxLength={100}
            required
            disabled={loading}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? "goal-title-error" : undefined}
          />

          {errors.title && (
            <span id="goal-title-error" className="goal-form-error">
              {errors.title}
            </span>
          )}
        </div>

        <div className="goal-form-field">
          <label htmlFor="goal-description">
            Description <span>(Optional)</span>
          </label>

          <textarea
            id="goal-description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="What are you saving for?"
            maxLength={500}
            rows={3}
            disabled={loading}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={
              errors.description ? "goal-description-error" : undefined
            }
          />

          {errors.description && (
            <span id="goal-description-error" className="goal-form-error">
              {errors.description}
            </span>
          )}
        </div>

        <div className="goal-form-row">
          <div className="goal-form-field">
            <label htmlFor="goal-target-amount">
              <IndianRupee size={14} />
              Target amount
            </label>

            <input
              id="goal-target-amount"
              type="text"
              inputMode="decimal"
              name="targetAmount"
              value={formData.targetAmount}
              onChange={handleChange}
              placeholder="50000"
              maxLength={15}
              required
              disabled={loading}
              aria-invalid={Boolean(errors.targetAmount)}
              aria-describedby={
                errors.targetAmount ? "goal-amount-error" : undefined
              }
            />

            {errors.targetAmount && (
              <span id="goal-amount-error" className="goal-form-error">
                {errors.targetAmount}
              </span>
            )}

            {isEditMode && initialGoal && (
              <span className="goal-form-hint">
                Already saved: ₹
                {Number(initialGoal.savedAmount || 0).toLocaleString("en-IN")}
              </span>
            )}
          </div>

          <div className="goal-form-field">
            <label htmlFor="goal-target-date">
              <CalendarDays size={14} />
              Target date
            </label>

            <input
              id="goal-target-date"
              type="date"
              name="targetDate"
              value={formData.targetDate}
              onChange={handleChange}
              required
              disabled={loading}
              aria-invalid={Boolean(errors.targetDate)}
              aria-describedby={
                errors.targetDate ? "goal-date-error" : undefined
              }
            />

            {errors.targetDate && (
              <span id="goal-date-error" className="goal-form-error">
                {errors.targetDate}
              </span>
            )}
          </div>
        </div>

        <div className="goal-form-field">
          <label htmlFor="goal-icon">
            <Target size={14} />
            Goal icon
          </label>

          <select
            id="goal-icon"
            name="icon"
            value={formData.icon}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="target">Target</option>
            <option value="home">Home</option>
            <option value="car">Car</option>
            <option value="education">Education</option>
            <option value="travel">Travel</option>
            <option value="laptop">Laptop</option>
            <option value="emergency">Emergency Fund</option>
          </select>
        </div>

        <div className="goal-form-field">
          <label>Choose a color</label>

          <div className="goal-color-options">
            {goalColors.map((color) => (
              <button
                key={color}
                type="button"
                className={`goal-color-option ${formData.color === color ? "selected" : ""
                  }`}
                style={{ "--option-color": color }}
                onClick={() => {
                  setFormData((previous) => ({
                    ...previous,
                    color,
                  }));

                  setSubmitError("");
                }}
                aria-label={`Select ${color}`}
                aria-pressed={formData.color === color}
                disabled={loading}
              />
            ))}
          </div>
        </div>

        {submitError && (
          <div
            className="goal-action-error"
            role="alert"
            aria-live="assertive"
          >
            <AlertCircle size={17} />
            <span>{submitError}</span>
          </div>
        )}
      </div>

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
            ? isEditMode
              ? "Saving changes..."
              : "Creating..."
            : isEditMode
              ? "Save Changes"
              : "Create Goal"}
        </button>
      </div>
    </form>
  );
};

export default GoalForm;

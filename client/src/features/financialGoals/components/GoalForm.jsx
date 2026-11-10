
import { useEffect, useState } from "react";

import {
  Target,
  CalendarDays,
  IndianRupee,
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

// ========================================
// FORMAT DATE FOR INPUT
// ========================================

const getDateInputValue = (date) => {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "";

  const year = parsedDate.getUTCFullYear();
  const month = String(parsedDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// ========================================
// GOAL FORM
// ========================================

const GoalForm = ({
  onSubmit,
  onCancel,
  loading = false,
  initialGoal = null,
  mode = "create",
}) => {
  const [formData, setFormData] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const isEditMode = mode === "edit";

  // ========================================
  // INITIALIZE FORM DATA
  // ========================================

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
  }, [initialGoal, isEditMode]);

  // ========================================
  // HANDLE INPUT CHANGE
  // ========================================

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
  };

  // ========================================
  // VALIDATE FORM
  // ========================================

  const validateForm = () => {
    const nextErrors = {};

    const title = formData.title.trim();
    const description = formData.description.trim();
    const amount = formData.targetAmount.trim();

    if (title.length < 2) {
      nextErrors.title =
        "Title must contain at least 2 characters.";
    } else if (title.length > 100) {
      nextErrors.title =
        "Title cannot exceed 100 characters.";
    }

    // Correct amount validation
    if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(amount)) {
      nextErrors.targetAmount =
        "Enter a valid amount with up to 2 decimals.";
    } else if (Number(amount) <= 0) {
      nextErrors.targetAmount =
        "Target amount must be greater than zero.";
    } else if (Number(amount) > 999999999999.99) {
      nextErrors.targetAmount =
        "Target amount is too large.";
    }

    // Prevent target below saved amount
    if (
      isEditMode &&
      initialGoal &&
      !nextErrors.targetAmount
    ) {
      const savedAmount = Number(initialGoal.savedAmount || 0);

      if (Number(amount) < savedAmount) {
        nextErrors.targetAmount =
          "Target amount cannot be less than the amount already saved.";
      }
    }

    // Date validation
    if (!formData.targetDate) {
      nextErrors.targetDate =
        "Please select a target date.";
    } else {
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;

      if (!datePattern.test(formData.targetDate)) {
        nextErrors.targetDate =
          "Please select a valid date.";
      } else {
        const [year, month, day] = formData.targetDate
          .split("-")
          .map(Number);

        const selectedDate = new Date(
          Date.UTC(year, month - 1, day),
        );

        if (
          selectedDate.getUTCFullYear() !== year ||
          selectedDate.getUTCMonth() !== month - 1 ||
          selectedDate.getUTCDate() !== day
        ) {
          nextErrors.targetDate =
            "Please select a valid date.";
        }
      }
    }

    if (description.length > 500) {
      nextErrors.description =
        "Description cannot exceed 500 characters.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  // ========================================
  // HANDLE FORM SUBMIT
  // ========================================

  const handleSubmit = (event) => {
    event.preventDefault();

    if (loading || !validateForm()) return;

    onSubmit({
      title: formData.title.trim(),
      description: formData.description.trim(),
      targetAmount: formData.targetAmount.trim(),
      targetDate: formData.targetDate,
      icon: formData.icon,
      color: formData.color,
    });
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <form className="goal-form" onSubmit={handleSubmit}>

      {/* Goal Name */}

      <div className="goal-form-field">
        <label htmlFor="goal-title">
          Goal name
        </label>

        <input
          id="goal-title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g. Buy a new laptop"
          maxLength={100}
          required
          disabled={loading}
        />

        {errors.title && (
          <span className="goal-form-error">
            {errors.title}
          </span>
        )}
      </div>

      {/* Description */}

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
        />

        {errors.description && (
          <span className="goal-form-error">
            {errors.description}
          </span>
        )}
      </div>

      {/* Target Amount and Date */}

      <div className="goal-form-row">

        <div className="goal-form-field">
          <label htmlFor="goal-target-amount">
            <IndianRupee size={14} />
            Target amount
          </label>

          <input
            id="goal-target-amount"
            type="number"
            name="targetAmount"
            value={formData.targetAmount}
            onChange={handleChange}
            placeholder="50000"
            min="0.01"
            max="999999999999.99"
            step="0.01"
            required
            disabled={loading}
          />

          {errors.targetAmount && (
            <span className="goal-form-error">
              {errors.targetAmount}
            </span>
          )}

          {isEditMode && initialGoal && (
            <span className="goal-form-hint">
              Already saved: ₹
              {Number(initialGoal.savedAmount || 0).toLocaleString(
                "en-IN",
              )}
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
          />

          {errors.targetDate && (
            <span className="goal-form-error">
              {errors.targetDate}
            </span>
          )}
        </div>

      </div>

      {/* Goal Icon */}

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

      {/* Goal Color */}

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
              }}
              aria-label={`Select ${color}`}
              aria-pressed={formData.color === color}
              disabled={loading}
            />
          ))}
        </div>
      </div>

      {/* Form Actions */}

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

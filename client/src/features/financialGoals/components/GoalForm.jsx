
import { useState } from "react";
import { Target, CalendarDays, IndianRupee } from "lucide-react";

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

const GoalForm = ({ onSubmit, onCancel, loading = false }) => {
  const [formData, setFormData] = useState(initialValues);
  const [errors, setErrors] = useState({});

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

  const validateForm = () => {
    const nextErrors = {};

    if (formData.title.trim().length < 2) {
      nextErrors.title = "Title must contain at least 2 characters.";
    }

    if (formData.title.trim().length > 100) {
      nextErrors.title = "Title cannot exceed 100 characters.";
    }

    if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(formData.targetAmount)) {
      nextErrors.targetAmount = "Enter a valid amount with up to 2 decimals.";
    } else if (Number(formData.targetAmount) <= 0) {
      nextErrors.targetAmount = "Target amount must be greater than zero.";
    } else if (Number(formData.targetAmount) > 999999999999.99) {
      nextErrors.targetAmount = "Target amount is too large.";
    }

    if (!formData.targetDate) {
      nextErrors.targetDate = "Please select a target date.";
    } else {
      const selectedDate = new Date(`${formData.targetDate}T00:00:00`);
      if (Number.isNaN(selectedDate.getTime())) {
        nextErrors.targetDate = "Please select a valid date.";
      }
    }

    if (formData.description.length > 500) {
      nextErrors.description = "Description cannot exceed 500 characters.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    onSubmit({
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim(),
    });
  };

  return (
    <form className="goal-form" onSubmit={handleSubmit}>
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
        />
        {errors.title && <span className="goal-form-error">{errors.title}</span>}
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
        />
        {errors.description && (
          <span className="goal-form-error">{errors.description}</span>
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
            type="number"
            name="targetAmount"
            value={formData.targetAmount}
            onChange={handleChange}
            placeholder="50000"
            min="0.01"
            max="999999999999.99"
            step="0.01"
            required
          />
          {errors.targetAmount && (
            <span className="goal-form-error">{errors.targetAmount}</span>
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
          />
          {errors.targetDate && (
            <span className="goal-form-error">{errors.targetDate}</span>
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
              onClick={() =>
                setFormData((previous) => ({ ...previous, color }))
              }
              aria-label={`Select ${color}`}
              aria-pressed={formData.color === color}
            />
          ))}
        </div>
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
          {loading ? "Creating..." : "Create Goal"}
        </button>
      </div>
    </form>
  );
};

export default GoalForm;

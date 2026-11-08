
import { useEffect, useState } from "react";
import { getCategories } from "../../../services/categoryService";

const BudgetForm = ({
  budget,
  month,
  year,
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    category: "",
    amount: "",
    month,
    year,
  });

  useEffect(() => {
    let active = true;

    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        setCategoryError("");

        const response = await getCategories({ type: "expense" });

        if (!active) return;

        const categoryList =
          response.data?.data?.categories ||
          response.data?.categories ||
          [];

        setCategories(
          categoryList.filter((category) => category.isActive !== false)
        );
      } catch (err) {
        if (active) {
          setCategoryError(
            err.response?.data?.message ||
            "Unable to load expense categories."
          );
        }
      } finally {
        if (active) setIsLoadingCategories(false);
      }
    };

    fetchCategories();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setForm({
      category: budget?.category?._id || "",
      amount: budget?.amount || "",
      month: budget?.month ?? month,
      year: budget?.year ?? year,
    });

    setError("");
  }, [budget, month, year]);

  const updateField = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const amount = String(form.amount).trim();
    const amountPattern = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;

    if (!budget && !form.category) {
      setError("Please select an expense category.");
      return;
    }

    if (!amountPattern.test(amount) || Number(amount) <= 0) {
      setError("Enter a valid amount greater than zero (maximum 2 decimals).");
      return;
    }

    try {
      await onSubmit({
        ...(!budget && { category: form.category }),
        amount,
        month: Number(form.month),
        year: Number(form.year),
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to save budget."
      );
    }
  };

  return (
    <form className="budget-form" onSubmit={handleSubmit}>
      {!budget && (
        <label className="budget-form-field">
          <span>Expense category</span>

          <select
            value={form.category}
            onChange={(event) =>
              updateField("category", event.target.value)
            }
            disabled={isLoadingCategories || !!categoryError}
            required
          >
            <option value="">
              {isLoadingCategories
                ? "Loading categories..."
                : "Select a category"}
            </option>

            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>

          {categoryError && (
            <small className="budget-field-error">
              {categoryError}
            </small>
          )}

          {!isLoadingCategories &&
            !categoryError &&
            categories.length === 0 && (
              <small className="budget-field-hint">
                No expense categories available. Create an expense
                category first.
              </small>
            )}
        </label>
      )}

      {budget && (
        <div className="budget-fixed-category">
          <span>Expense category</span>
          <strong>{budget.category?.name || "Selected category"}</strong>
          <small>Category cannot be changed after budget creation.</small>
        </div>
      )}

      <label className="budget-form-field">
        <span>Monthly budget amount</span>

        <div className="budget-amount-input">
          <span>₹</span>
          <input
            type="number"
            min="0.01"
            max="9999999999999.99"
            step="0.01"
            placeholder="e.g. 5000"
            value={form.amount}
            onChange={(event) =>
              updateField("amount", event.target.value)
            }
            required
          />
        </div>

        <small className="budget-field-hint">
          Set the maximum amount you plan to spend.
        </small>
      </label>

      <div className="budget-period-fields">
        <label className="budget-form-field">
          <span>Month</span>

          <select
            value={form.month}
            onChange={(event) =>
              updateField("month", Number(event.target.value))
            }
            disabled={!!budget}
          >
            {Array.from({ length: 12 }, (_, index) => (
              <option key={index + 1} value={index + 1}>
                {new Date(2000, index).toLocaleString("en-IN", {
                  month: "long",
                })}
              </option>
            ))}
          </select>
        </label>

        <label className="budget-form-field">
          <span>Year</span>

          <input
            type="number"
            min="2000"
            max="9999"
            value={form.year}
            onChange={(event) =>
              updateField("year", Number(event.target.value))
            }
            disabled={!!budget}
          />
        </label>
      </div>

      {budget && (
        <p className="budget-edit-note">
          You are updating the allocated amount for this budget.
        </p>
      )}

      {error && (
        <p className="budget-form-error" role="alert">
          {error}
        </p>
      )}

      <div className="budget-form-actions">
        <button
          type="button"
          className="budget-secondary-button"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="budget-primary-button"
          disabled={
            isSubmitting ||
            isLoadingCategories ||
            (!budget && categories.length === 0)
          }
        >
          {isSubmitting
            ? "Saving..."
            : budget
              ? "Save changes"
              : "Create budget"}
        </button>
      </div>
    </form>
  );
};

export default BudgetForm;

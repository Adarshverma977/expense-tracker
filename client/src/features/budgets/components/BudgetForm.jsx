
import { useEffect, useState } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { getCategories } from "../../../services/categoryService";

const getCategoryList = (response) => {
  const data = response?.data;

  const categories =
    data?.data?.categories ??
    data?.categories ??
    data?.data ??
    [];

  return Array.isArray(categories)
    ? categories.filter(
      (category) =>
        category &&
        category.isActive !== false &&
        typeof category._id === "string"
    )
    : [];
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.message ||
  fallback;

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

        setCategories(getCategoryList(response));
      } catch (err) {
        if (active) {
          setCategoryError(
            getErrorMessage(
              err,
              "Unable to load expense categories."
            )
          );
        }
      } finally {
        if (active) {
          setIsLoadingCategories(false);
        }
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
      amount: budget?.amount ?? "",
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

    if (isSubmitting) return;

    const amount = String(form.amount).trim();
    const amountPattern = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;
    const numericAmount = Number(amount);
    const selectedMonth = Number(form.month);
    const selectedYear = Number(form.year);

    if (!budget && !form.category) {
      setError("Please select an expense category.");
      return;
    }

    if (
      !amountPattern.test(amount) ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0 ||
      numericAmount > 9999999999999.99
    ) {
      setError(
        "Enter a valid amount greater than zero with a maximum of 2 decimal places."
      );
      return;
    }

    if (
      !Number.isInteger(selectedMonth) ||
      selectedMonth < 1 ||
      selectedMonth > 12
    ) {
      setError("Please select a valid month.");
      return;
    }

    if (
      !Number.isInteger(selectedYear) ||
      selectedYear < 2000 ||
      selectedYear > 9999
    ) {
      setError("Please enter a valid year.");
      return;
    }

    try {
      setError("");

      await onSubmit({
        ...(!budget && { category: form.category }),
        amount,
        month: selectedMonth,
        year: selectedYear,
      });
    } catch (err) {
      setError(
        getErrorMessage(err, "Unable to save budget.")
      );
    }
  };

  const isSubmitDisabled =
    isSubmitting ||
    isLoadingCategories ||
    (!budget && (categories.length === 0 || Boolean(categoryError)));

  return (
    <form
      className="budget-form"
      onSubmit={handleSubmit}
      noValidate
    >
      {!budget && (
        <label className="budget-form-field">
          <span>Expense category</span>

          <select
            value={form.category}
            onChange={(event) =>
              updateField("category", event.target.value)
            }
            disabled={isLoadingCategories || Boolean(categoryError) || isSubmitting}
            required
            aria-invalid={Boolean(error && !form.category)}
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

          {isLoadingCategories && (
            <small className="budget-field-hint">
              Loading your expense categories...
            </small>
          )}

          {categoryError && (
            <small className="budget-field-error" role="alert">
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

          <strong>
            {budget.category?.name || "Selected category"}
          </strong>

          <small>
            Category cannot be changed after budget creation.
          </small>
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
            disabled={isSubmitting}
            required
            inputMode="decimal"
            aria-invalid={Boolean(error && !String(form.amount).trim())}
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
            disabled={Boolean(budget) || isSubmitting}
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
              updateField("year", event.target.value)
            }
            disabled={Boolean(budget) || isSubmitting}
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
          disabled={isSubmitDisabled}
        >
          {isSubmitting ? (
            <>
              <LoaderCircle size={15} className="budget-loading-icon" />
              Saving...
            </>
          ) : (
            <>
              {budget ? "Save changes" : "Create budget"}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default BudgetForm;


import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  CarFront,
  Coffee,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Plane,
  Receipt,
  ShoppingBag,
  Tag,
  TrendingUp,
  Utensils,
  Wallet,
  WalletCards,
  Zap,
} from "lucide-react";

const iconOptions = [
  { value: "tag", label: "General", Icon: Tag },
  { value: "wallet", label: "Wallet", Icon: Wallet },
  { value: "walletcards", label: "Salary", Icon: WalletCards },
  { value: "briefcase", label: "Freelance / Work", Icon: BriefcaseBusiness },
  { value: "trendingup", label: "Investment", Icon: TrendingUp },
  { value: "receipt", label: "Bills", Icon: Receipt },
  { value: "graduationcap", label: "Education", Icon: GraduationCap },
  { value: "gamepad", label: "Entertainment", Icon: Gamepad2 },
  { value: "food", label: "Food", Icon: Utensils },
  { value: "shoppingbag", label: "Shopping", Icon: ShoppingBag },
  { value: "car", label: "Transportation", Icon: CarFront },
  { value: "heartpulse", label: "Healthcare", Icon: HeartPulse },
  { value: "gift", label: "Gift", Icon: Gift },
  { value: "plane", label: "Travel", Icon: Plane },
  { value: "home", label: "Home", Icon: Home },
  { value: "coffee", label: "Coffee", Icon: Coffee },
  { value: "zap", label: "Utilities", Icon: Zap },
];

const colorOptions = [
  "#176B45",
  "#0D9488",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#D65B55",
  "#EA8B32",
  "#D4A72C",
  "#64748B",
  "#475569",
];

const DEFAULT_COLOR = "#176B45";

const normalizeName = (value) =>
  typeof value === "string"
    ? value.toLowerCase().replace(/[^a-z0-9]/g, "")
    : "";

const nameIconMap = {
  freelance: "briefcase",
  gift: "gift",
  gifttosister: "gift",
  investment: "trendingup",
  salary: "walletcards",
  bills: "receipt",
  education: "graduationcap",
  entertainment: "gamepad",
  food: "food",
  healthcare: "heartpulse",
  health: "heartpulse",
  shopping: "shoppingbag",
  transportation: "car",
  transport: "car",
  travel: "plane",
  utilities: "zap",
  electricity: "zap",
  rent: "home",
  housing: "home",
  home: "home",
  coffee: "coffee",
  otherincome: "wallet",
  otherexpense: "wallet",
};

const getSuggestedIcon = (name) =>
  nameIconMap[normalizeName(name)] || "tag";

const createInitialForm = (category, initialType) => {
  const categoryIcon = iconOptions.some(
    (option) => option.value === category?.icon
  )
    ? category.icon
    : getSuggestedIcon(category?.name);

  return {
    name: category?.name || "",
    type:
      category?.type ||
      (["income", "expense"].includes(initialType)
        ? initialType
        : "expense"),
    icon: categoryIcon,
    color: colorOptions.includes(category?.color)
      ? category.color
      : DEFAULT_COLOR,
  };
};

const CategoryForm = ({
  category,
  initialType,
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const [form, setForm] = useState(() =>
    createInitialForm(category, initialType)
  );

  const [error, setError] = useState("");
  const [iconManuallySelected, setIconManuallySelected] = useState(
    Boolean(category?.icon && category.icon !== "tag")
  );

  useEffect(() => {
    setForm(createInitialForm(category, initialType));
    setError("");
    setIconManuallySelected(
      Boolean(category?.icon && category.icon !== "tag")
    );
  }, [category, initialType]);

  const selectedIcon =
    iconOptions.find((option) => option.value === form.icon) ||
    iconOptions[0];

  const PreviewIcon = selectedIcon.Icon;

  const updateField = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setError("");
  };

  const handleNameChange = (value) => {
    setForm((current) => ({
      ...current,
      name: value,
      ...(!iconManuallySelected && {
        icon: getSuggestedIcon(value),
      }),
    }));

    setError("");
  };

  const handleIconChange = (value) => {
    setIconManuallySelected(true);
    updateField("icon", value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    const name = form.name.trim();

    if (name.length < 2 || name.length > 30) {
      setError("Category name must contain 2–30 characters.");
      return;
    }

    if (!["income", "expense"].includes(form.type)) {
      setError("Please select a valid category type.");
      return;
    }

    if (!iconOptions.some((option) => option.value === form.icon)) {
      setError("Please select a valid category icon.");
      return;
    }

    if (!colorOptions.includes(form.color)) {
      setError("Please select a valid category color.");
      return;
    }

    try {
      await onSubmit({
        name,
        icon: form.icon,
        color: form.color,
        ...(!category && { type: form.type }),
      });
    } catch (submitError) {
      const message = submitError?.response?.data?.message;

      setError(
        typeof message === "string" && message.trim()
          ? message
          : submitError?.message ||
          "Unable to save category. Please try again."
      );
    }
  };

  return (
    <form
      className="category-form"
      onSubmit={handleSubmit}
      noValidate
    >
      {!category && (
        <div className="category-form-field">
          <span>Category type</span>

          <div
            className="category-type-switch"
            role="group"
            aria-label="Category type"
          >
            <button
              type="button"
              className={
                form.type === "expense" ? "active expense" : ""
              }
              aria-pressed={form.type === "expense"}
              onClick={() => updateField("type", "expense")}
              disabled={isSubmitting}
            >
              Expense
            </button>

            <button
              type="button"
              className={
                form.type === "income" ? "active income" : ""
              }
              aria-pressed={form.type === "income"}
              onClick={() => updateField("type", "income")}
              disabled={isSubmitting}
            >
              Income
            </button>
          </div>
        </div>
      )}

      {category && (
        <div className="category-fixed-type">
          Category type:
          <strong>{category.type}</strong>
          <span>
            Category type cannot be changed after creation.
          </span>
        </div>
      )}

      <label className="category-form-field">
        <span>Category name</span>

        <input
          type="text"
          name="categoryName"
          placeholder="e.g. Subscriptions"
          maxLength={30}
          minLength={2}
          value={form.name}
          onChange={(event) =>
            handleNameChange(event.target.value)
          }
          autoComplete="off"
          required
          disabled={isSubmitting}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "category-form-error" : undefined}
        />

        <span>{form.name.trim().length}/30 characters</span>
      </label>

      <div className="category-form-field">
        <span>Choose an icon</span>

        <div
          className="category-icon-options"
          role="group"
          aria-label="Category icon"
        >
          {iconOptions.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={form.icon === value}
              className={
                form.icon === value
                  ? "category-icon-option selected"
                  : "category-icon-option"
              }
              onClick={() => handleIconChange(value)}
              disabled={isSubmitting}
            >
              <Icon size={20} />
            </button>
          ))}
        </div>
      </div>

      <div className="category-form-field">
        <span>Choose a color</span>

        <div
          className="category-color-options"
          role="group"
          aria-label="Category color"
        >
          {colorOptions.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Select color ${color}`}
              aria-pressed={form.color === color}
              className={
                form.color === color
                  ? "category-color-option selected"
                  : "category-color-option"
              }
              style={{ "--category-choice-color": color }}
              onClick={() => updateField("color", color)}
              disabled={isSubmitting}
            />
          ))}
        </div>
      </div>

      <div className="category-preview">
        <span className="category-preview-label">PREVIEW</span>

        <div className="category-preview-content">
          <span
            className="category-preview-icon"
            style={{
              backgroundColor: `${form.color}20`,
              color: form.color,
            }}
          >
            <PreviewIcon size={21} />
          </span>

          <div>
            <strong>{form.name.trim() || "Category name"}</strong>
            <span>
              {form.type === "income" ? "Income" : "Expense"}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <p
          className="category-form-error"
          id="category-form-error"
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="category-form-actions">
        <button
          type="button"
          className="category-secondary-button"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="category-primary-button"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Saving..."
            : category
              ? "Save changes"
              : "Create category"}
        </button>
      </div>
    </form>
  );
};

export default CategoryForm;

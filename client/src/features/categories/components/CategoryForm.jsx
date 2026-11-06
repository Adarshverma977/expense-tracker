
import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  Car,
  Coffee,
  Gift,
  Heart,
  Home,
  Plane,
  ShoppingBag,
  Tag,
  Utensils,
  Wallet,
  Zap,
} from "lucide-react";

const iconOptions = [
  { value: "tag", label: "General", Icon: Tag },
  { value: "wallet", label: "Wallet", Icon: Wallet },
  { value: "briefcase", label: "Work", Icon: BriefcaseBusiness },
  { value: "shopping", label: "Shopping", Icon: ShoppingBag },
  { value: "food", label: "Food", Icon: Utensils },
  { value: "coffee", label: "Coffee", Icon: Coffee },
  { value: "transport", label: "Transport", Icon: Car },
  { value: "home", label: "Home", Icon: Home },
  { value: "health", label: "Health", Icon: Heart },
  { value: "gift", label: "Gift", Icon: Gift },
  { value: "travel", label: "Travel", Icon: Plane },
  { value: "utilities", label: "Utilities", Icon: Zap },
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

function CategoryForm({
  category,
  initialType,
  onSubmit,
  onCancel,
  isSubmitting,
}) {
  const [form, setForm] = useState({
    name: "",
    type: initialType || "expense",
    icon: "tag",
    color: "#176B45",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    if (category) {
      setForm({
        name: category.name || "",
        type: category.type || "expense",
        icon: category.icon || "tag",
        color: category.color || "#176B45",
      });
    } else {
      setForm({
        name: "",
        type: initialType || "expense",
        icon: "tag",
        color: "#176B45",
      });
    }

    setError("");
  }, [category, initialType]);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = form.name.trim();

    if (name.length < 2 || name.length > 30) {
      setError("Category name must contain 2–30 characters.");
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
      setError(
        submitError?.response?.data?.message ||
        submitError?.message ||
        "Unable to save category."
      );
    }
  };

  return (
    <form className="category-form" onSubmit={handleSubmit}>
      {!category && (
        <div className="category-form-field">
          <span>Category type</span>

          <div className="category-type-switch">
            <button
              type="button"
              className={form.type === "expense" ? "active expense" : ""}
              onClick={() => updateField("type", "expense")}
            >
              Expense
            </button>

            <button
              type="button"
              className={form.type === "income" ? "active income" : ""}
              onClick={() => updateField("type", "income")}
            >
              Income
            </button>
          </div>
        </div>
      )}

      {category && (
        <div className="category-fixed-type">
          Category type: <strong>{category.type}</strong>
          <span>Category type cannot be changed after creation.</span>
        </div>
      )}

      <label className="category-form-field">
        <span>Category name</span>
        <input
          type="text"
          placeholder="e.g. Subscriptions"
          maxLength={30}
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          required
        />
      </label>

      <div className="category-form-field">
        <span>Choose an icon</span>

        <div className="category-icon-options">
          {iconOptions.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              title={label}
              aria-label={label}
              className={
                form.icon === value ? "category-icon-option selected" : "category-icon-option"
              }
              onClick={() => updateField("icon", value)}
            >
              <Icon size={20} />
            </button>
          ))}
        </div>
      </div>

      <div className="category-form-field">
        <span>Choose a color</span>

        <div className="category-color-options">
          {colorOptions.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Select ${color}`}
              className={
                form.color === color
                  ? "category-color-option selected"
                  : "category-color-option"
              }
              style={{ "--category-choice-color": color }}
              onClick={() => updateField("color", color)}
            />
          ))}
        </div>
      </div>

      <div className="category-preview">
        <span className="category-preview-label">PREVIEW</span>
        <div className="category-preview-content">
          {(() => {
            const selected = iconOptions.find(
              (item) => item.value === form.icon
            );
            const Icon = selected?.Icon || Tag;

            return (
              <span
                className="category-preview-icon"
                style={{
                  backgroundColor: `${form.color}20`,
                  color: form.color,
                }}
              >
                <Icon size={21} />
              </span>
            );
          })()}

          <div>
            <strong>{form.name || "Category name"}</strong>
            <span>{form.type === "income" ? "Income" : "Expense"}</span>
          </div>
        </div>
      </div>

      {error && (
        <p className="category-form-error" role="alert">
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
}

export default CategoryForm;

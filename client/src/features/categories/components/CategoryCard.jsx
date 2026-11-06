
import {
  BriefcaseBusiness,
  Car,
  Coffee,
  Gift,
  Heart,
  Home,
  MoreHorizontal,
  Pencil,
  Plane,
  ShoppingBag,
  Tag,
  Trash2,
  Utensils,
  Wallet,
  Zap,
} from "lucide-react";
import { useState } from "react";

const iconMap = {
  tag: Tag,
  wallet: Wallet,
  briefcase: BriefcaseBusiness,
  shopping: ShoppingBag,
  shoppingbag: ShoppingBag,
  food: Utensils,
  utensils: Utensils,
  coffee: Coffee,
  transport: Car,
  car: Car,
  home: Home,
  health: Heart,
  gift: Gift,
  travel: Plane,
  plane: Plane,
  utilities: Zap,
};

function CategoryCard({ category, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const Icon =
    iconMap[String(category.icon || "tag").toLowerCase()] || Tag;

  const isDefault = category.isDefault;

  return (
    <article className="category-card">
      <div className="category-card-top">
        <div
          className="category-card-icon"
          style={{
            backgroundColor: `${category.color || "#64748B"}20`,
            color: category.color || "#64748B",
          }}
        >
          <Icon size={23} strokeWidth={1.9} />
        </div>

        <div className="category-card-menu-wrapper">
          <button
            type="button"
            className="category-menu-trigger"
            aria-label={`Actions for ${category.name}`}
            onClick={() => setMenuOpen((value) => !value)}
          >
            <MoreHorizontal size={20} />
          </button>

          {menuOpen && (
            <div className="category-action-menu">
              {isDefault ? (
                <span className="category-protected-label">
                  <Tag size={14} />
                  System category
                </span>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(category);
                    }}
                  >
                    <Pencil size={15} />
                    Edit category
                  </button>

                  <button
                    type="button"
                    className="category-delete-action"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(category);
                    }}
                  >
                    <Trash2 size={15} />
                    Delete category
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="category-card-content">
        <h3>{category.name}</h3>
        <div className="category-card-meta">
          <span
            className={`category-type-badge ${category.type === "income" ? "income" : "expense"
              }`}
          >
            {category.type === "income" ? "Income" : "Expense"}
          </span>

          {isDefault && (
            <span className="category-default-badge">Default</span>
          )}
        </div>
      </div>

      <div
        className="category-card-color-line"
        style={{ backgroundColor: category.color || "#64748B" }}
      />
    </article>
  );
}

export default CategoryCard;

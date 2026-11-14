
import { useEffect, useRef, useState } from "react";
import {
  BriefcaseBusiness,
  CarFront,
  Coffee,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  MoreHorizontal,
  Pencil,
  Plane,
  Receipt,
  ShoppingBag,
  Tag,
  Trash2,
  TrendingUp,
  Utensils,
  Wallet,
  WalletCards,
  Zap,
} from "lucide-react";

const iconMap = {
  tag: Tag,
  wallet: Wallet,
  walletcards: WalletCards,
  briefcase: BriefcaseBusiness,
  briefcasebusiness: BriefcaseBusiness,
  shopping: ShoppingBag,
  shoppingbag: ShoppingBag,
  food: Utensils,
  utensils: Utensils,
  coffee: Coffee,
  transport: CarFront,
  transportation: CarFront,
  car: CarFront,
  carfront: CarFront,
  home: Home,
  health: HeartPulse,
  healthcare: HeartPulse,
  heart: HeartPulse,
  heartpulse: HeartPulse,
  gift: Gift,
  travel: Plane,
  plane: Plane,
  utilities: Zap,
  bills: Receipt,
  receipt: Receipt,
  education: GraduationCap,
  graduationcap: GraduationCap,
  entertainment: Gamepad2,
  gamepad: Gamepad2,
  investment: TrendingUp,
  trendingup: TrendingUp,
  salary: WalletCards,
  freelance: BriefcaseBusiness,
};

const categoryNameIconMap = {
  freelance: BriefcaseBusiness,
  gift: Gift,
  gifttosister: Gift,
  investment: TrendingUp,
  salary: WalletCards,
  bills: Receipt,
  education: GraduationCap,
  entertainment: Gamepad2,
  food: Utensils,
  healthcare: HeartPulse,
  health: HeartPulse,
  shopping: ShoppingBag,
  transportation: CarFront,
  transport: CarFront,
  travel: Plane,
  utilities: Zap,
  electricity: Zap,
  rent: Home,
  housing: Home,
  home: Home,
  coffee: Coffee,
  otherincome: Wallet,
  otherexpense: Wallet,
};

const DEFAULT_COLOR = "#64748B";

const normalizeName = (value) =>
  typeof value === "string"
    ? value.toLowerCase().replace(/[^a-z0-9]/g, "")
    : "";

const CategoryCard = ({ category, onEdit, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const iconName =
    typeof category?.icon === "string"
      ? category.icon.trim().toLowerCase().replace(/[^a-z0-9]/g, "")
      : "tag";

  const normalizedCategoryName = normalizeName(category?.name);

  const Icon =
    categoryNameIconMap[normalizedCategoryName] ||
    iconMap[iconName] ||
    Tag;

  const isDefault = Boolean(category?.isDefault);

  const categoryName =
    typeof category?.name === "string" && category.name.trim()
      ? category.name.trim()
      : "Untitled category";

  const categoryColor =
    typeof category?.color === "string" && category.color.trim()
      ? category.color.trim()
      : DEFAULT_COLOR;

  const isIncome = category?.type === "income";
  const categoryId = String(category?._id || "unknown");

  useEffect(() => {
    if (!menuOpen) return undefined;

    const handleOutsideClick = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const handleEdit = () => {
    setMenuOpen(false);
    onEdit?.(category);
  };

  const handleDelete = () => {
    setMenuOpen(false);
    onDelete?.(category);
  };

  return (
    <article className="category-card">
      <div className="category-card-top">
        <div
          className="category-card-icon"
          style={{
            backgroundColor: `${categoryColor}20`,
            color: categoryColor,
          }}
        >
          <Icon size={23} strokeWidth={1.9} />
        </div>

        <div
          className="category-card-menu-wrapper"
          ref={menuRef}
        >
          <button
            type="button"
            className="category-menu-trigger"
            aria-label={`Actions for ${categoryName}`}
            aria-expanded={menuOpen}
            aria-haspopup="true"
            aria-controls={`category-menu-${categoryId}`}
            onClick={() => setMenuOpen((previous) => !previous)}
          >
            <MoreHorizontal size={20} />
          </button>

          {menuOpen && (
            <div
              className="category-action-menu"
              id={`category-menu-${categoryId}`}
              role="menu"
            >
              {isDefault ? (
                <span className="category-protected-label">
                  <Tag size={14} />
                  System category
                </span>
              ) : (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleEdit}
                  >
                    <Pencil size={15} />
                    Edit category
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    className="category-delete-action"
                    onClick={handleDelete}
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
        <h3 title={categoryName}>{categoryName}</h3>

        <div className="category-card-meta">
          <span
            className={`category-type-badge ${isIncome ? "income" : "expense"
              }`}
          >
            {isIncome ? "Income" : "Expense"}
          </span>

          {isDefault && (
            <span className="category-default-badge">
              Default
            </span>
          )}
        </div>
      </div>

      <div
        className="category-card-color-line"
        style={{ backgroundColor: categoryColor }}
      />
    </article>
  );
};

export default CategoryCard;


import { useEffect } from "react";
import { X } from "lucide-react";
import CategoryForm from "./CategoryForm";

function CategoryModal({
  isOpen,
  category,
  initialType,
  onClose,
  onSubmit,
  isSubmitting,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="category-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <section
        className="category-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-modal-title"
      >
        <header className="category-modal-header">
          <div>
            <span className="category-modal-eyebrow">
              CATEGORY MANAGEMENT
            </span>
            <h2 id="category-modal-title">
              {category ? "Edit category" : "Create category"}
            </h2>
            <p>
              {category
                ? "Update the name, icon or color of your category."
                : "Organize your financial activity your way."}
            </p>
          </div>

          <button
            type="button"
            className="category-modal-close"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </header>

        <CategoryForm
          category={category}
          initialType={initialType}
          onSubmit={onSubmit}
          onCancel={onClose}
          isSubmitting={isSubmitting}
        />
      </section>
    </div>
  );
}

export default CategoryModal;

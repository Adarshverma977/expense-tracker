
import { AlertTriangle, Trash2 } from "lucide-react";

function DeleteCategoryModal({
  category,
  onClose,
  onConfirm,
  isDeleting,
}) {
  if (!category) return null;

  return (
    <div
      className="category-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isDeleting) {
          onClose();
        }
      }}
    >
      <section
        className="category-delete-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="category-delete-title"
      >
        <div className="category-delete-icon">
          <AlertTriangle size={25} />
        </div>

        <h2 id="category-delete-title">Delete category?</h2>

        <p>
          <strong>{category.name}</strong> will be deactivated and removed
          from your active category list. Existing transactions are not
          deleted.
        </p>

        <div className="category-delete-actions">
          <button
            type="button"
            className="category-secondary-button"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>

          <button
            type="button"
            className="category-danger-button"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            <Trash2 size={16} />
            {isDeleting ? "Deleting..." : "Delete category"}
          </button>
        </div>
      </section>
    </div>
  );
}

export default DeleteCategoryModal;

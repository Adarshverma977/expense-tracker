
import { useEffect, useRef } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

function DeleteCategoryModal({
  category,
  onClose,
  onConfirm,
  isDeleting,
  error = "",
}) {
  const modalRef = useRef(null);
  const cancelButtonRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const isDeletingRef = useRef(isDeleting);

  onCloseRef.current = onClose;
  isDeletingRef.current = isDeleting;

  useEffect(() => {
    if (!category) return;

    const previousActiveElement = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const focusFrame = requestAnimationFrame(() => {
      cancelButtonRef.current?.focus();
    });

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();

        if (!isDeletingRef.current) {
          onCloseRef.current?.();
        }

        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = modalRef.current?.querySelectorAll(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (
        event.shiftKey &&
        document.activeElement === firstElement
      ) {
        event.preventDefault();
        lastElement.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === lastElement
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousActiveElement?.focus?.();
    };
  }, [category]);

  if (!category) return null;

  const handleBackdropClick = (event) => {
    if (
      event.target === event.currentTarget &&
      !isDeleting
    ) {
      onClose?.();
    }
  };

  return (
    <div
      className="category-modal-overlay"
      onMouseDown={handleBackdropClick}
    >
      <section
        ref={modalRef}
        className="category-delete-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="category-delete-title"
        aria-describedby="category-delete-description"
      >
        <button
          type="button"
          className="category-modal-close"
          onClick={onClose}
          disabled={isDeleting}
          aria-label="Close delete confirmation"
        >
          <X size={19} />
        </button>

        <div className="category-delete-icon">
          <AlertTriangle size={25} />
        </div>

        <h2 id="category-delete-title">
          Delete category?
        </h2>

        <p id="category-delete-description">
          <strong>{category.name}</strong> will be deactivated and removed
          from your active category list. Existing transactions are not
          deleted.
        </p>

        {error && (
          <div className="category-page-error" role="alert">
            <p>{error}</p>
          </div>
        )}

        <div className="category-delete-actions">
          <button
            ref={cancelButtonRef}
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

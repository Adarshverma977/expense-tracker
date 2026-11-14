
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import CategoryForm from "./CategoryForm";

const CategoryModal = ({
  isOpen,
  category,
  initialType,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    previousFocusRef.current = document.activeElement;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const focusTimer = window.requestAnimationFrame(() => {
      const firstFocusable =
        modalRef.current?.querySelector(
          'input:not(:disabled), button:not(:disabled), [tabindex]:not([tabindex="-1"])'
        );

      firstFocusable?.focus();
    });

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (!isSubmitting) {
          onClose();
        }
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = modalRef.current?.querySelectorAll(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [href], [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements?.length) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement =
        focusableElements[focusableElements.length - 1];

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
      window.cancelAnimationFrame(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;

      if (previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleOverlayMouseDown = (event) => {
    if (
      event.target === event.currentTarget &&
      !isSubmitting
    ) {
      onClose();
    }
  };

  return (
    <div
      className="category-modal-overlay"
      onMouseDown={handleOverlayMouseDown}
    >
      <section
        ref={modalRef}
        className="category-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-modal-title"
        aria-describedby="category-modal-description"
      >
        <header className="category-modal-header">
          <div>
            <span className="category-modal-eyebrow">
              CATEGORY MANAGEMENT
            </span>

            <h2 id="category-modal-title">
              {category ? "Edit category" : "Create category"}
            </h2>

            <p id="category-modal-description">
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
};

export default CategoryModal;

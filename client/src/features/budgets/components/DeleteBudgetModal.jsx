
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Trash2 } from "lucide-react";

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const DeleteBudgetModal = ({
  isOpen,
  budget,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  const modalRef = useRef(null);
  const cancelButtonRef = useRef(null);
  const previousFocusRef = useRef(null);
  const isDeletingRef = useRef(isDeleting);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    isDeletingRef.current = isDeleting;
    onCloseRef.current = onClose;
  }, [isDeleting, onClose]);

  useEffect(() => {
    if (!isOpen || !budget) return;

    previousFocusRef.current = document.activeElement;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    cancelButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (!isDeletingRef.current) {
          event.preventDefault();
          onCloseRef.current();
        }

        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = Array.from(
        modalRef.current?.querySelectorAll(FOCUSABLE_SELECTOR) || []
      ).filter((element) => element.getClientRects().length > 0);

      if (focusableElements.length === 0) {
        event.preventDefault();
        modalRef.current?.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (
        event.shiftKey &&
        (document.activeElement === firstElement ||
          !modalRef.current?.contains(document.activeElement))
      ) {
        event.preventDefault();
        lastElement.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === lastElement ||
          !modalRef.current?.contains(document.activeElement))
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;

      const previousFocus = previousFocusRef.current;

      if (previousFocus?.isConnected) {
        previousFocus.focus();
      }
    };
  }, [isOpen, budget]);

  const handleBackdropClick = (event) => {
    if (
      event.target === event.currentTarget &&
      !isDeleting
    ) {
      onClose();
    }
  };

  const categoryName =
    typeof budget?.category?.name === "string" &&
      budget.category.name.trim()
      ? budget.category.name.trim()
      : "this category";

  return (
    <AnimatePresence>
      {isOpen && budget && (
        <motion.div
          className="budget-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={handleBackdropClick}
        >
          <motion.div
            ref={modalRef}
            className="budget-delete-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-budget-title"
            aria-describedby="delete-budget-description"
            tabIndex={-1}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.96 }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
            }}
          >
            <button
              type="button"
              className="budget-modal-close"
              onClick={onClose}
              disabled={isDeleting}
              aria-label="Close modal"
            >
              <X size={19} />
            </button>

            <div className="budget-delete-icon">
              <AlertTriangle size={25} />
            </div>

            <h2 id="delete-budget-title">
              Delete this budget?
            </h2>

            <p id="delete-budget-description">
              Are you sure you want to delete the budget for{" "}
              <strong>{categoryName}</strong>? This action cannot be undone.
            </p>

            <div className="budget-delete-actions">
              <button
                ref={cancelButtonRef}
                type="button"
                className="budget-secondary-button"
                onClick={onClose}
                disabled={isDeleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="budget-danger-button"
                onClick={onConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <span
                      className="budget-loading-icon"
                      aria-hidden="true"
                    >
                      <Trash2 size={16} />
                    </span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete budget
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeleteBudgetModal;

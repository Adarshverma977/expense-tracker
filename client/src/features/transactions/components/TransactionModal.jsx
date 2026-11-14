
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import TransactionForm from "./TransactionForm";

function TransactionModal({
  isOpen,
  transaction,
  categories = [],
  onClose,
  onSubmit,
  isSubmitting = false,
}) {
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousActiveElementRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    previousActiveElementRef.current = document.activeElement;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();

        if (!isSubmitting) {
          onClose?.();
        }

        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = modalRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
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
      cancelAnimationFrame(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousActiveElementRef.current?.focus?.();
    };
  }, [isOpen, isSubmitting, onClose]);

  const handleOverlayMouseDown = (event) => {
    if (
      event.target === event.currentTarget &&
      !isSubmitting
    ) {
      onClose?.();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="transaction-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onMouseDown={handleOverlayMouseDown}
      >
        <motion.section
          ref={modalRef}
          className="transaction-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="transaction-modal-title"
          aria-describedby="transaction-modal-description"
          initial={{ opacity: 0, scale: 0.94, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ type: "spring", stiffness: 280, damping: 25 }}
        >
          <div className="transaction-modal-header">
            <div>
              <span className="transaction-modal-eyebrow">
                TRANSACTION MANAGEMENT
              </span>

              <h2 id="transaction-modal-title">
                {transaction ? "Edit transaction" : "Add transaction"}
              </h2>

              <p id="transaction-modal-description">
                {transaction
                  ? "Update your transaction details."
                  : "Record your income or expense."}
              </p>
            </div>

            <motion.button
              ref={closeButtonRef}
              type="button"
              className="transaction-modal-close"
              onClick={() => {
                if (!isSubmitting) onClose?.();
              }}
              disabled={isSubmitting}
              aria-label="Close modal"
              whileHover={!isSubmitting ? { rotate: 90 } : undefined}
              whileTap={!isSubmitting ? { scale: 0.9 } : undefined}
            >
              <X size={20} />
            </motion.button>
          </div>

          <TransactionForm
            transaction={transaction}
            categories={categories}
            onSubmit={onSubmit}
            onCancel={onClose}
            isSubmitting={isSubmitting}
          />
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
}

export default TransactionModal;

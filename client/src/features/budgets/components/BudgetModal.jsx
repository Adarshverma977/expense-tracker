
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Wallet } from "lucide-react";
import BudgetForm from "./BudgetForm";

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "a[href]",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const BudgetModal = ({
  isOpen,
  budget,
  month,
  year,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);
  const isSubmittingRef = useRef(isSubmitting);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
    onCloseRef.current = onClose;
  }, [isSubmitting, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusModal = () => {
      const firstFocusable =
        modalRef.current?.querySelector(FOCUSABLE_SELECTOR);

      firstFocusable?.focus();
    };

    focusModal();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (!isSubmittingRef.current) {
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
  }, [isOpen]);

  const handleBackdropClick = (event) => {
    if (
      event.target === event.currentTarget &&
      !isSubmitting
    ) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="budget-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={handleBackdropClick}
        >
          <motion.div
            ref={modalRef}
            className="budget-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="budget-modal-title"
            aria-describedby="budget-modal-description"
            tabIndex={-1}
            initial={{ opacity: 0, y: 25, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.97 }}
            transition={{
              duration: 0.22,
              ease: "easeOut",
            }}
          >
            <div className="budget-modal-header">
              <div className="budget-modal-title-group">
                <div className="budget-modal-icon">
                  <Wallet size={21} strokeWidth={1.9} />
                </div>

                <div>
                  <h2 id="budget-modal-title">
                    {budget ? "Edit budget" : "Create a budget"}
                  </h2>

                  <p id="budget-modal-description">
                    {budget
                      ? "Update your monthly spending limit."
                      : "Plan your spending and stay in control."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="budget-modal-close"
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="Close modal"
              >
                <X size={19} />
              </button>
            </div>

            <BudgetForm
              budget={budget}
              month={month}
              year={year}
              onSubmit={onSubmit}
              onCancel={onClose}
              isSubmitting={isSubmitting}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BudgetModal;

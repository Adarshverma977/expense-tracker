
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Wallet } from "lucide-react";

import BudgetForm from "./BudgetForm";

const BudgetModal = ({
  isOpen,
  budget,
  month,
  year,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, isSubmitting, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="budget-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !isSubmitting
            ) {
              onClose();
            }
          }}
        >
          <motion.div
            className="budget-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="budget-modal-title"
            initial={{ opacity: 0, y: 25, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.97 }}
            transition={{ duration: 0.22 }}
          >
            <div className="budget-modal-header">
              <div className="budget-modal-title-group">
                <div className="budget-modal-icon">
                  <Wallet size={21} />
                </div>

                <div>
                  <h2 id="budget-modal-title">
                    {budget ? "Edit budget" : "Create a budget"}
                  </h2>
                  <p>
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

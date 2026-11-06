
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import TransactionForm from "./TransactionForm";

function TransactionModal({
  isOpen,
  transaction,
  categories,
  onClose,
  onSubmit,
  isSubmitting,
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSubmitting) onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, isSubmitting, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="transaction-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !isSubmitting
            ) {
              onClose();
            }
          }}
        >
          <motion.section
            className="transaction-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-modal-title"
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
                <p>
                  {transaction
                    ? "Update your transaction details."
                    : "Record your income or expense."}
                </p>
              </div>

              <motion.button
                type="button"
                className="transaction-modal-close"
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="Close modal"
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.9 }}
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
      )}
    </AnimatePresence>
  );
}

export default TransactionModal;

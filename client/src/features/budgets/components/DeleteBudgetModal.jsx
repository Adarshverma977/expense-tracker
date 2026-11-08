
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Trash2 } from "lucide-react";

const DeleteBudgetModal = ({
  isOpen,
  budget,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  if (!budget) return null;

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
              !isDeleting
            ) {
              onClose();
            }
          }}
        >
          <motion.div
            className="budget-delete-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-budget-title"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.96 }}
            transition={{ duration: 0.2 }}
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

            <h2 id="delete-budget-title">Delete this budget?</h2>

            <p>
              Are you sure you want to delete the budget for{" "}
              <strong>
                {budget.category?.name || "this category"}
              </strong>
              ? This action cannot be undone.
            </p>

            <div className="budget-delete-actions">
              <button
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
                <Trash2 size={16} />
                {isDeleting ? "Deleting..." : "Delete budget"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeleteBudgetModal;

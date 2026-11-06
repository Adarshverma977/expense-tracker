
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, LoaderCircle, Trash2 } from "lucide-react";

function DeleteTransactionModal({
  transaction,
  onClose,
  onConfirm,
  isDeleting,
}) {
  return (
    <AnimatePresence>
      {transaction && (
        <motion.div
          className="transaction-modal-overlay"
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
          <motion.section
            className="transaction-delete-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-transaction-title"
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 12 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
          >
            <motion.div
              className="transaction-delete-icon"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.08, type: "spring" }}
            >
              <AlertTriangle size={25} />
            </motion.div>

            <h2 id="delete-transaction-title">
              Delete transaction?
            </h2>

            <p>
              Are you sure you want to delete{" "}
              <strong>{transaction.title}</strong>? This action cannot be
              undone.
            </p>

            <div className="transaction-delete-actions">
              <motion.button
                type="button"
                className="transaction-secondary-button"
                onClick={onClose}
                disabled={isDeleting}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                Cancel
              </motion.button>

              <motion.button
                type="button"
                className="transaction-danger-button"
                onClick={onConfirm}
                disabled={isDeleting}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                {isDeleting ? (
                  <>
                    <LoaderCircle
                      className="transaction-spinner"
                      size={16}
                    />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete transaction
                  </>
                )}
              </motion.button>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default DeleteTransactionModal;

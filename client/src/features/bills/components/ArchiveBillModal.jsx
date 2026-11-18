
import { AnimatePresence, motion } from "framer-motion";
import { Archive, X, AlertTriangle } from "lucide-react";

const ArchiveBillModal = ({
  isOpen,
  bill = null,
  onClose,
  onConfirm,
  isArchiving = false,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="bill-confirm-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !isArchiving
            ) {
              onClose?.();
            }
          }}
        >
          <motion.section
            className="bill-confirm-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="archive-bill-title"
            aria-describedby="archive-bill-description"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22 }}
          >
            <button
              type="button"
              className="bill-confirm-close"
              onClick={onClose}
              disabled={isArchiving}
              aria-label="Close confirmation"
            >
              <X size={19} />
            </button>

            <div className="bill-confirm-icon">
              <Archive size={25} />
            </div>

            <span className="bill-modal-eyebrow">
              BILL MANAGEMENT
            </span>

            <h2 id="archive-bill-title">
              Archive this bill?
            </h2>

            <p id="archive-bill-description">
              Are you sure you want to archive{" "}
              <strong>{bill?.title || "this bill"}</strong>?
              It will no longer appear in your active bills.
            </p>

            <div className="bill-confirm-warning">
              <AlertTriangle size={17} />
              <span>
                This action does not delete the bill or its payment
                history.
              </span>
            </div>

            <div className="bill-confirm-actions">
              <button
                type="button"
                className="bill-form-cancel"
                onClick={onClose}
                disabled={isArchiving}
              >
                Cancel
              </button>

              <motion.button
                type="button"
                className="bill-archive-confirm-button"
                onClick={onConfirm}
                disabled={isArchiving}
                whileTap={{ scale: 0.97 }}
              >
                <Archive size={16} />
                {isArchiving ? "Archiving..." : "Archive bill"}
              </motion.button>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ArchiveBillModal;

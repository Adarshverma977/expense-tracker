
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  LoaderCircle,
  Trash2,
} from "lucide-react";

function DeleteTransactionModal({
  transaction,
  onClose,
  onConfirm,
  isDeleting = false,
}) {
  const cancelButtonRef = useRef(null);
  const previousActiveElementRef = useRef(null);

  const isOpen = Boolean(transaction);

  useEffect(() => {
    if (!isOpen) return undefined;

    previousActiveElementRef.current = document.activeElement;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusFrame = requestAnimationFrame(() => {
      cancelButtonRef.current?.focus();
    });

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();

        if (!isDeleting) {
          onClose?.();
        }
      }

      if (event.key === "Tab") {
        event.preventDefault();
        cancelButtonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousActiveElementRef.current?.focus?.();
    };
  }, [isOpen, isDeleting, onClose]);

  const handleOverlayMouseDown = (event) => {
    if (
      event.target === event.currentTarget &&
      !isDeleting
    ) {
      onClose?.();
    }
  };

  const handleConfirm = () => {
    if (isDeleting || !transaction) return;
    onConfirm?.();
  };

  const transactionTitle =
    typeof transaction?.title === "string" &&
      transaction.title.trim()
      ? transaction.title.trim()
      : "this transaction";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="transaction-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={handleOverlayMouseDown}
        >
          <motion.section
            className="transaction-delete-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-transaction-title"
            aria-describedby="delete-transaction-description"
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 12 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 24,
            }}
          >
            <motion.div
              className="transaction-delete-icon"
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                delay: 0.08,
                type: "spring",
                stiffness: 300,
                damping: 15,
              }}
            >
              <AlertTriangle size={25} />
            </motion.div>

            <h2 id="delete-transaction-title">
              Delete transaction?
            </h2>

            <p id="delete-transaction-description">
              Are you sure you want to delete{" "}
              <strong>{transactionTitle}</strong>? This action cannot be
              undone.
            </p>

            <div className="transaction-delete-actions">
              <motion.button
                ref={cancelButtonRef}
                type="button"
                className="transaction-secondary-button"
                onClick={onClose}
                disabled={isDeleting}
                whileHover={!isDeleting ? { y: -2 } : undefined}
                whileTap={!isDeleting ? { scale: 0.97 } : undefined}
              >
                Cancel
              </motion.button>

              <motion.button
                type="button"
                className="transaction-danger-button"
                onClick={handleConfirm}
                disabled={isDeleting}
                whileHover={!isDeleting ? { y: -2 } : undefined}
                whileTap={!isDeleting ? { scale: 0.97 } : undefined}
              >
                {isDeleting ? (
                  <>
                    <LoaderCircle
                      className="transaction-spinner"
                      size={16}
                      aria-hidden="true"
                    />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} aria-hidden="true" />
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


import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Trash2,
  Archive,
  X,
  LoaderCircle,
} from "lucide-react";

import "./ConfirmDialog.css";

const ICONS = {
  delete: Trash2,
  archive: Archive,
  warning: AlertTriangle,
};

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  icon = "warning",
  isLoading = false,
}) => {
  const dialogRef = useRef(null);
  const cancelButtonRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const focusTimer = requestAnimationFrame(() => {
      cancelButtonRef.current?.focus();
    });

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isLoading) {
        onClose();
      }

      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;

      if (!dialog) return;

      const focusableElements = dialog.querySelectorAll(
        'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

      const elements = Array.from(focusableElements);

      if (!elements.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const firstElement = elements[0];
      const lastElement = elements[elements.length - 1];

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
      cancelAnimationFrame(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;

      if (previousFocusRef.current?.isConnected) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, isLoading, onClose]);

  const IconComponent = ICONS[icon] || AlertTriangle;

  const handleConfirm = async () => {
    if (isLoading) return;

    await onConfirm();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="confirm-dialog-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !isLoading
            ) {
              onClose();
            }
          }}
        >
          <motion.section
            ref={dialogRef}
            className={`confirm-dialog confirm-dialog-${variant}`}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{
              duration: 0.22,
              ease: [0.22, 1, 0.36, 1],
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-description"
            tabIndex={-1}
          >
            <button
              type="button"
              className="confirm-dialog-close"
              onClick={onClose}
              disabled={isLoading}
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>

            <div className="confirm-dialog-content">
              <div className="confirm-dialog-icon">
                <IconComponent size={25} strokeWidth={2} />
              </div>

              <h2 id="confirm-dialog-title">
                {title}
              </h2>

              <p id="confirm-dialog-description">
                {description}
              </p>
            </div>

            <div className="confirm-dialog-actions">
              <button
                ref={cancelButtonRef}
                type="button"
                className="confirm-dialog-cancel"
                onClick={onClose}
                disabled={isLoading}
              >
                {cancelText}
              </button>

              <button
                type="button"
                className="confirm-dialog-confirm"
                onClick={handleConfirm}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <LoaderCircle
                      size={16}
                      className="confirm-dialog-spinner"
                    />
                    <span>Please wait...</span>
                  </>
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;

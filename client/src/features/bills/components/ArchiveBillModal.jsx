import "./ArchiveBillModal.css";
import { useCallback, useEffect, useId, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Archive, X, AlertTriangle } from "lucide-react";

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const ArchiveBillModal = ({
  isOpen,
  bill = null,
  onClose,
  onConfirm,
  isArchiving = false,
}) => {
  const modalRef = useRef(null);
  const cancelButtonRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  const confirmGuardRef = useRef(false);

  const onCloseRef = useRef(onClose);
  const onConfirmRef = useRef(onConfirm);
  const isArchivingRef = useRef(isArchiving);

  const titleId = useId();
  const descriptionId = useId();

  onCloseRef.current = onClose;
  onConfirmRef.current = onConfirm;
  isArchivingRef.current = isArchiving;

  const handleClose = useCallback(() => {
    if (isArchivingRef.current) return;

    onCloseRef.current?.();
  }, []);

  const handleConfirm = useCallback(async () => {
    if (isArchivingRef.current || confirmGuardRef.current) return;

    confirmGuardRef.current = true;

    try {
      await onConfirmRef.current?.();
    } finally {
      confirmGuardRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current = document.activeElement;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusFrame = requestAnimationFrame(() => {
      cancelButtonRef.current?.focus();
    });

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
        return;
      }

      if (event.key !== "Tab") return;

      const modal = modalRef.current;

      if (!modal) return;

      const focusableElements = Array.from(
        modal.querySelectorAll(FOCUSABLE_SELECTOR),
      ).filter((element) => {
        return (
          element.getClientRects().length > 0 &&
          !element.hasAttribute("aria-hidden")
        );
      });

      if (!focusableElements.length) {
        event.preventDefault();
        modal.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement =
        focusableElements[focusableElements.length - 1];

      if (
        event.shiftKey &&
        (document.activeElement === firstElement ||
          !modal.contains(document.activeElement))
      ) {
        event.preventDefault();
        lastElement.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === lastElement ||
          !modal.contains(document.activeElement))
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;

      const previouslyFocused = previouslyFocusedRef.current;

      if (
        previouslyFocused &&
        previouslyFocused.isConnected &&
        typeof previouslyFocused.focus === "function"
      ) {
        previouslyFocused.focus();
      }
    };
  }, [isOpen, handleClose]);

  useEffect(() => {
    if (!isOpen) {
      confirmGuardRef.current = false;
    }
  }, [isOpen]);

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
              handleClose();
            }
          }}
        >
          <motion.section
            ref={modalRef}
            className="bill-confirm-modal archive-bill-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            tabIndex={-1}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22 }}
          >
            <button
              type="button"
              className="bill-confirm-close"
              onClick={handleClose}
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

            <h2 id={titleId}>Archive this bill?</h2>

            <p id={descriptionId}>
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
                ref={cancelButtonRef}
                type="button"
                className="bill-form-cancel"
                onClick={handleClose}
                disabled={isArchiving}
              >
                Cancel
              </button>

              <motion.button
                type="button"
                className="bill-archive-confirm-button"
                onClick={handleConfirm}
                disabled={isArchiving}
                aria-busy={isArchiving}
                whileTap={
                  isArchiving ? undefined : { scale: 0.97 }
                }
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


import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Receipt } from "lucide-react";
import BillForm from "./BillForm";

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const BillModal = ({
  isOpen,
  bill = null,
  categories = [],
  wallets = [],
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const isSubmittingRef = useRef(isSubmitting);

  onCloseRef.current = onClose;
  isSubmittingRef.current = isSubmitting;

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusModal = () => {
      const modal = modalRef.current;

      if (!modal) return;

      const focusableElements = modal.querySelectorAll(
        FOCUSABLE_SELECTOR,
      );

      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      } else {
        modal.focus();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (!isSubmittingRef.current) {
          onCloseRef.current?.();
        }

        return;
      }

      if (event.key !== "Tab") return;

      const modal = modalRef.current;

      if (!modal) return;

      const focusableElements = Array.from(
        modal.querySelectorAll(FOCUSABLE_SELECTOR),
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        modal.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

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

    document.addEventListener("keydown", handleKeyDown);

    requestAnimationFrame(focusModal);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);

      const previousFocus = previousFocusRef.current;

      if (previousFocus?.isConnected) {
        previousFocus.focus();
      }
    };
  }, [isOpen]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="bill-modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !isSubmitting
            ) {
              onCloseRef.current?.();
            }
          }}
        >
          <motion.section
            ref={modalRef}
            className="bill-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bill-modal-title"
            aria-describedby="bill-modal-description"
            tabIndex={-1}
            style={{
              position: "relative",
              zIndex: 100000,
            }}
            initial={{ opacity: 0, y: 25, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div className="bill-modal-header">
              <div className="bill-modal-heading">
                <div className="bill-modal-icon">
                  <Receipt size={21} />
                </div>

                <div>
                  <span className="bill-modal-eyebrow">
                    BILL MANAGEMENT
                  </span>

                  <h2 id="bill-modal-title">
                    {bill ? "Update bill" : "Create a bill"}
                  </h2>

                  <p id="bill-modal-description">
                    {bill
                      ? "Modify your bill details and payment schedule."
                      : "Add a bill and keep track of upcoming payments."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="bill-modal-close"
                onClick={() => {
                  if (!isSubmitting) onCloseRef.current?.();
                }}
                disabled={isSubmitting}
                aria-label="Close bill form"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bill-modal-body">
              <BillForm
                bill={bill}
                categories={categories}
                wallets={wallets}
                onSubmit={onSubmit}
                onCancel={onClose}
                isSubmitting={isSubmitting}
              />
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default BillModal;

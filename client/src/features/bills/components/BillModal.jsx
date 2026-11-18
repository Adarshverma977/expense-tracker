
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Receipt } from "lucide-react";
import BillForm from "./BillForm";

const BillModal = ({
  isOpen,
  bill = null,
  categories = [],
  wallets = [],
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose?.();
      }
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
          className="bill-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !isSubmitting
            ) {
              onClose?.();
            }
          }}
        >
          <motion.section
            className="bill-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bill-modal-title"
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

                  <p>
                    {bill
                      ? "Modify your bill details and payment schedule."
                      : "Add a bill and keep track of upcoming payments."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="bill-modal-close"
                onClick={onClose}
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
    </AnimatePresence>
  );
};

export default BillModal;

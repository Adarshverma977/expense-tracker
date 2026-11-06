
import { useEffect } from "react";
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
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="transaction-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <section
        className="transaction-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-modal-title"
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

          <button
            type="button"
            className="transaction-modal-close"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <TransactionForm
          transaction={transaction}
          categories={categories}
          onSubmit={onSubmit}
          onCancel={onClose}
          isSubmitting={isSubmitting}
        />
      </section>
    </div>
  );
}

export default TransactionModal;

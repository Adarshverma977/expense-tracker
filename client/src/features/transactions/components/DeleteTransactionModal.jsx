
import { AlertTriangle, LoaderCircle, Trash2 } from "lucide-react";

function DeleteTransactionModal({
  transaction,
  onClose,
  onConfirm,
  isDeleting,
}) {
  if (!transaction) return null;

  return (
    <div
      className="transaction-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isDeleting) {
          onClose();
        }
      }}
    >
      <section
        className="transaction-delete-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-transaction-title"
      >
        <div className="transaction-delete-icon">
          <AlertTriangle size={25} />
        </div>

        <h2 id="delete-transaction-title">
          Delete transaction?
        </h2>

        <p>
          Are you sure you want to delete{" "}
          <strong>{transaction.title}</strong>? This action cannot be undone.
        </p>

        <div className="transaction-delete-actions">
          <button
            type="button"
            className="transaction-secondary-button"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>

          <button
            type="button"
            className="transaction-danger-button"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <LoaderCircle className="transaction-spinner" size={16} />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Delete transaction
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}

export default DeleteTransactionModal;

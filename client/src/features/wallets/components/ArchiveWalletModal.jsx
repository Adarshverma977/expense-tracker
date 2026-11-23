
import { useState } from "react";
import { Archive, X } from "lucide-react";
import { archiveWallet } from "../../../services/walletService";

const ArchiveWalletModal = ({
  isOpen,
  wallet,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !wallet) return null;

  const handleArchive = async () => {
    try {
      setLoading(true);
      setError("");

      await archiveWallet(wallet._id);
      await onSuccess();
      onClose();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to archive wallet."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="wallet-archive-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div className="wallet-archive-modal">
        <div className="wallet-archive-header">
          <div className="wallet-archive-icon">
            <Archive size={22} />
          </div>

          <button
            type="button"
            className="wallet-archive-close"
            onClick={onClose}
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        <div className="wallet-archive-content">
          <h2>Archive Wallet?</h2>

          <p>
            Are you sure you want to archive{" "}
            <strong>{wallet.name}</strong>? This wallet
            will no longer be available for new
            transactions, but its historical data will
            remain preserved.
          </p>
        </div>

        {error && (
          <div className="wallet-archive-error">
            {error}
          </div>
        )}

        <div className="wallet-archive-actions">
          <button
            type="button"
            className="wallet-archive-cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="button"
            className="wallet-archive-confirm"
            onClick={handleArchive}
            disabled={loading}
          >
            {loading ? "Archiving..." : "Archive Wallet"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArchiveWalletModal;

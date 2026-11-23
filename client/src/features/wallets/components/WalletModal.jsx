
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  createWallet,
  updateWallet,
} from "../../../services/walletService";

const initialForm = {
  name: "",
  type: "cash",
  openingBalance: "",
  description: "",
};

const WalletModal = ({
  isOpen,
  wallet,
  onClose,
  onSuccess,
}) => {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(wallet);

  useEffect(() => {
    if (!isOpen) return;

    if (wallet) {
      setForm({
        name: wallet.name || "",
        type: wallet.type || "cash",
        openingBalance:
          wallet.openingBalance ??
          wallet.balance ??
          "",
        description: wallet.description || "",
      });
    } else {
      setForm(initialForm);
    }

    setError("");
  }, [isOpen, wallet]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Wallet name is required.");
      return;
    }

    if (
      form.openingBalance !== "" &&
      !Number.isFinite(Number(form.openingBalance))
    ) {
      setError("Please enter a valid balance.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      type: form.type,
      description: form.description.trim(),
    };

    if (!isEditing) {
      payload.openingBalance =
        Number(form.openingBalance || 0);
    }

    try {
      setLoading(true);

      if (isEditing) {
        await updateWallet(wallet._id, payload);
      } else {
        await createWallet(payload);
      }

      await onSuccess();
      onClose();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save wallet."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="wallet-modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="wallet-modal">
        <div className="wallet-modal-header">
          <div>
            <h2>
              {isEditing ? "Edit Wallet" : "Create Wallet"}
            </h2>

            <p>
              {isEditing
                ? "Update your wallet details."
                : "Add a new account to track your money."}
            </p>
          </div>

          <button
            type="button"
            className="wallet-modal-close"
            onClick={onClose}
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="wallet-form-group">
            <label htmlFor="wallet-name">
              Wallet Name
            </label>

            <input
              id="wallet-name"
              type="text"
              name="name"
              placeholder="e.g. Personal Cash"
              value={form.name}
              onChange={handleChange}
              maxLength={50}
              required
            />
          </div>

          <div className="wallet-form-group">
            <label htmlFor="wallet-type">
              Wallet Type
            </label>

            <select
              id="wallet-type"
              name="type"
              value={form.type}
              onChange={handleChange}
            >
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
              <option value="card">Card</option>
              <option value="digital">Digital Wallet</option>
            </select>
          </div>

          {!isEditing && (
            <div className="wallet-form-group">
              <label htmlFor="wallet-opening-balance">
                Opening Balance
              </label>

              <input
                id="wallet-opening-balance"
                type="number"
                name="openingBalance"
                placeholder="0.00"
                value={form.openingBalance}
                onChange={handleChange}
                step="0.01"
              />
            </div>
          )}

          <div className="wallet-form-group">
            <label htmlFor="wallet-description">
              Description
              <span> (Optional)</span>
            </label>

            <textarea
              id="wallet-description"
              name="description"
              placeholder="Add some details about this wallet..."
              value={form.description}
              onChange={handleChange}
              rows={3}
              maxLength={200}
            />
          </div>

          {error && (
            <div className="wallet-form-error">
              {error}
            </div>
          )}

          <div className="wallet-modal-footer">
            <button
              type="button"
              className="wallet-modal-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="wallet-modal-submit"
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Create Wallet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WalletModal;

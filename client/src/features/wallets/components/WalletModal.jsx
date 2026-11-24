
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
  openingOutstanding: "",
  creditLimit: "",
  institution: "",
  lastFourDigits: "",
  icon: "",
  color: "",
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
  const isCreditCard = form.type === "credit_card";

  useEffect(() => {
    if (!isOpen) return;

    if (wallet) {
      setForm({
        ...initialForm,
        name: wallet.name || "",
        type: wallet.type || "cash",
        institution: wallet.institution || "",
        lastFourDigits: wallet.lastFourDigits || "",
        icon: wallet.icon || "",
        color: wallet.color || "",
        creditLimit: wallet.creditLimit?.toString() || "",
      });
    } else {
      setForm({ ...initialForm });
    }

    setError("");
  }, [isOpen, wallet]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "type" && value === "credit_card"
        ? { openingBalance: "" }
        : {}),
      ...(name === "type" && value !== "credit_card"
        ? {
          creditLimit: "",
          openingOutstanding: "",
        }
        : {}),
    }));

    setError("");
  };

  const isValidAmount = (value, allowZero = false) => {
    if (value === "") return false;

    if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(value)) {
      return false;
    }

    const amount = Number(value);

    return (
      Number.isFinite(amount) &&
      (allowZero ? amount >= 0 : amount > 0)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const name = form.name.trim();

    if (name.length < 2 || name.length > 60) {
      setError("Wallet name must contain 2 to 60 characters.");
      return;
    }

    if (form.institution.trim().length > 100) {
      setError("Institution name cannot exceed 100 characters.");
      return;
    }

    if (
      form.lastFourDigits &&
      !/^\d{4}$/.test(form.lastFourDigits)
    ) {
      setError("Enter exactly four digits for the card.");
      return;
    }

    if (isCreditCard && !isValidAmount(form.creditLimit)) {
      setError("Please enter a valid credit limit greater than zero.");
      return;
    }

    if (
      !isEditing &&
      !isCreditCard &&
      form.openingBalance !== "" &&
      !isValidAmount(form.openingBalance, true)
    ) {
      setError("Enter a valid opening balance with up to 2 decimal places.");
      return;
    }

    if (
      !isEditing &&
      isCreditCard &&
      form.openingOutstanding !== "" &&
      !isValidAmount(form.openingOutstanding, true)
    ) {
      setError("Enter a valid opening outstanding with up to 2 decimal places.");
      return;
    }

    const payload = {
      name,
      ...(form.institution.trim() && {
        institution: form.institution.trim(),
      }),
      ...(form.lastFourDigits && {
        lastFourDigits: form.lastFourDigits,
      }),
      ...(form.icon.trim() && {
        icon: form.icon.trim(),
      }),
      ...(form.color.trim() && {
        color: form.color.trim(),
      }),
    };

    if (isEditing) {
      if (name === wallet.name) {
        delete payload.name;
      }

      if (form.institution.trim() === (wallet.institution || "")) {
        delete payload.institution;
      }

      if (form.lastFourDigits === (wallet.lastFourDigits || "")) {
        delete payload.lastFourDigits;
      }

      if (form.icon.trim() === (wallet.icon || "")) {
        delete payload.icon;
      }

      if (form.color.trim() === (wallet.color || "")) {
        delete payload.color;
      }

      if (form.creditLimit !== (wallet.creditLimit?.toString() || "")) {
        if (isCreditCard && isValidAmount(form.creditLimit)) {
          payload.creditLimit = form.creditLimit;
        }
      }

      if (Object.keys(payload).length === 0) {
        setError("Please make at least one change.");
        return;
      }
    } else {
      payload.type = form.type;

      if (isCreditCard) {
        payload.creditLimit = form.creditLimit;

        if (form.openingOutstanding !== "") {
          payload.openingOutstanding = form.openingOutstanding;
        }
      } else {
        payload.openingBalance = form.openingBalance || "0";
      }
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
      const validationErrors = err?.response?.data?.errors;

      setError(
        Array.isArray(validationErrors)
          ? validationErrors
            .map((item) => item.message || item.path?.join("."))
            .filter(Boolean)
            .join(" ")
          : err?.response?.data?.message ||
          err?.response?.data?.error ||
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
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div className="wallet-modal">
        <div className="wallet-modal-header">
          <div>
            <h2>{isEditing ? "Edit Wallet" : "Create Wallet"}</h2>
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
            <label htmlFor="wallet-name">Wallet Name</label>
            <input
              id="wallet-name"
              type="text"
              name="name"
              placeholder="e.g. Personal Cash"
              value={form.name}
              onChange={handleChange}
              maxLength={60}
              required
              disabled={loading}
            />
          </div>

          {!isEditing && (
            <div className="wallet-form-group">
              <label htmlFor="wallet-type">Wallet Type</label>
              <select
                id="wallet-type"
                name="type"
                value={form.type}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank Account</option>
                <option value="savings">Savings Account</option>
                <option value="credit_card">Credit Card</option>
              </select>
            </div>
          )}

          {form.type === "credit_card" && (
            <>
              <div className="wallet-form-group">
                <label htmlFor="wallet-credit-limit">
                  Credit Limit
                </label>
                <input
                  id="wallet-credit-limit"
                  type="number"
                  name="creditLimit"
                  placeholder="e.g. 50000"
                  value={form.creditLimit}
                  onChange={handleChange}
                  min="0.01"
                  step="0.01"
                  required
                  disabled={loading}
                />
              </div>

              {!isEditing && (
                <div className="wallet-form-group">
                  <label htmlFor="wallet-opening-outstanding">
                    Opening Outstanding
                  </label>
                  <input
                    id="wallet-opening-outstanding"
                    type="number"
                    name="openingOutstanding"
                    placeholder="0.00"
                    value={form.openingOutstanding}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    disabled={loading}
                  />
                </div>
              )}
            </>
          )}

          {form.type !== "credit_card" && !isEditing && (
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
                min="0"
                step="0.01"
                disabled={loading}
              />
            </div>
          )}

          <div className="wallet-form-group">
            <label htmlFor="wallet-institution">
              Institution
              <span> (Optional)</span>
            </label>
            <input
              id="wallet-institution"
              type="text"
              name="institution"
              placeholder="e.g. HDFC Bank"
              value={form.institution}
              onChange={handleChange}
              maxLength={100}
              disabled={loading}
            />
          </div>

          {isCreditCard && (
            <div className="wallet-form-group">
              <label htmlFor="wallet-last-four">
                Last Four Digits
                <span> (Optional)</span>
              </label>
              <input
                id="wallet-last-four"
                type="text"
                name="lastFourDigits"
                placeholder="1234"
                value={form.lastFourDigits}
                onChange={handleChange}
                maxLength={4}
                inputMode="numeric"
                disabled={loading}
              />
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

          {error && (
            <div className="wallet-form-error" role="alert">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default WalletModal;

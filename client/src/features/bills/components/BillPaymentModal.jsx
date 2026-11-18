
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  CreditCard,
  Wallet,
  IndianRupee,
  CalendarDays,
  Receipt,
  CheckCircle2,
} from "lucide-react";

const getInitialForm = (bill) => ({
  amount: bill?.amount?.toString() || "",
  wallet: "",
  paidAt: new Date().toISOString().slice(0, 10),
  notes: "",
});

const formatCurrency = (value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return "₹0.00";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const BillPaymentModal = ({
  isOpen,
  bill = null,
  wallets = [],
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState(() =>
    getInitialForm(bill)
  );

  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialForm(bill));
      setFormError("");
    }
  }, [isOpen, bill]);

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

  const activeWallets = wallets.filter(
    (wallet) => wallet.status === "active"
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setFormError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!bill?._id) {
      setFormError("Unable to identify the selected bill.");
      return;
    }

    if (!formData.wallet) {
      setFormError("Please select a payment wallet.");
      return;
    }

    const amount = formData.amount.trim();

    if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(amount)) {
      setFormError("Enter a valid amount with up to 2 decimal places.");
      return;
    }

    if (Number(amount) <= 0) {
      setFormError("Payment amount must be greater than zero.");
      return;
    }

    if (!formData.paidAt) {
      setFormError("Please select the payment date.");
      return;
    }

    const selectedDate = new Date(
      `${formData.paidAt}T12:00:00`
    );

    if (Number.isNaN(selectedDate.getTime())) {
      setFormError("Please select a valid payment date.");
      return;
    }

    const payload = {
      bill: bill._id,
      wallet: formData.wallet,
      amount,
      paidAt: selectedDate.toISOString(),
      idempotencyKey: crypto.randomUUID(),
      notes: formData.notes.trim(),
    };

    try {
      await onSubmit?.(payload);
    } catch (error) {
      setFormError(
        error?.response?.data?.message ||
        error?.message ||
        "Unable to record payment. Please try again."
      );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="bill-payment-overlay"
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
            className="bill-payment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bill-payment-title"
            initial={{ opacity: 0, y: 25, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div className="bill-payment-header">
              <div className="bill-payment-heading">
                <div className="bill-payment-icon">
                  <Receipt size={21} />
                </div>

                <div>
                  <span className="bill-modal-eyebrow">
                    BILL PAYMENT
                  </span>

                  <h2 id="bill-payment-title">
                    Record payment
                  </h2>

                  <p>
                    Record a payment for {bill?.title || "this bill"}.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="bill-modal-close"
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="Close payment form"
              >
                <X size={20} />
              </button>
            </div>

            <form
              className="bill-payment-form"
              onSubmit={handleSubmit}
            >
              <div className="bill-payment-summary">
                <div>
                  <span>Total bill amount</span>
                  <strong>{formatCurrency(bill?.amount)}</strong>
                </div>

                <div className="bill-payment-summary-icon">
                  <IndianRupee size={22} />
                </div>
              </div>

              <div className="bill-payment-fields">
                <div className="bill-form-field">
                  <label htmlFor="payment-amount">
                    Payment amount *
                  </label>

                  <div className="bill-input-with-icon">
                    <IndianRupee size={17} />

                    <input
                      id="payment-amount"
                      name="amount"
                      type="number"
                      min="0.01"
                      max="999999999999.99"
                      step="0.01"
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="bill-form-field">
                  <label htmlFor="payment-wallet">
                    Pay from wallet *
                  </label>

                  <div className="bill-input-with-icon">
                    <Wallet size={17} />

                    <select
                      id="payment-wallet"
                      name="wallet"
                      value={formData.wallet}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select wallet</option>

                      {activeWallets.map((wallet) => (
                        <option
                          key={wallet._id}
                          value={wallet._id}
                        >
                          {wallet.name}
                          {wallet.type === "credit_card"
                            ? " (Credit Card)"
                            : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bill-form-field">
                  <label htmlFor="payment-date">
                    Payment date *
                  </label>

                  <div className="bill-input-with-icon">
                    <CalendarDays size={17} />

                    <input
                      id="payment-date"
                      name="paidAt"
                      type="date"
                      value={formData.paidAt}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="bill-form-field">
                  <label htmlFor="payment-notes">
                    Notes
                  </label>

                  <textarea
                    id="payment-notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Add payment reference or notes..."
                    rows={3}
                    maxLength={1000}
                  />
                </div>
              </div>

              {formError && (
                <div className="bill-form-error" role="alert">
                  {formError}
                </div>
              )}

              <div className="bill-payment-info">
                <CheckCircle2 size={16} />

                <span>
                  Partial payments are supported. The bill will be
                  marked paid when the full amount is settled.
                </span>
              </div>

              <div className="bill-form-actions">
                <button
                  type="button"
                  className="bill-form-cancel"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  <X size={17} />
                  Cancel
                </button>

                <motion.button
                  type="submit"
                  className="bill-form-submit"
                  disabled={isSubmitting || activeWallets.length === 0}
                  whileTap={{ scale: 0.97 }}
                >
                  <CreditCard size={17} />
                  {isSubmitting ? "Processing..." : "Record payment"}
                </motion.button>
              </div>

              {activeWallets.length === 0 && (
                <p className="bill-payment-wallet-warning">
                  No active wallets available. Please create or activate
                  a wallet before recording a payment.
                </p>
              )}
            </form>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BillPaymentModal;

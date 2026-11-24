
import {
  Wallet,
  Landmark,
  CreditCard,
  PiggyBank,
  Pencil,
  Archive,
} from "lucide-react";

const walletConfig = {
  cash: {
    label: "Cash",
    icon: Wallet,
  },
  bank: {
    label: "Bank Account",
    icon: Landmark,
  },
  savings: {
    label: "Savings Account",
    icon: PiggyBank,
  },
  credit_card: {
    label: "Credit Card",
    icon: CreditCard,
  },
};

const formatCurrency = (amount = 0) => {
  const numericAmount = Number(amount);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(
    Number.isFinite(numericAmount) ? numericAmount : 0
  );
};

const WalletCard = ({ wallet, onEdit, onArchive }) => {
  const config = walletConfig[wallet.type] || {
    label: "Wallet",
    icon: Wallet,
  };

  const Icon = config.icon;

  const balance =
    wallet.balance ??
    wallet.currentBalance ??
    wallet.openingBalance ??
    0;

  return (
    <div className="wallet-card">
      <div className="wallet-card-top">
        <div className="wallet-card-icon">
          <Icon size={22} strokeWidth={2} />
        </div>

        <div className="wallet-card-actions">
          <button
            type="button"
            className="wallet-card-action"
            onClick={() => onEdit(wallet)}
            aria-label={`Edit ${wallet.name}`}
            title="Edit wallet"
          >
            <Pencil size={16} />
          </button>

          <button
            type="button"
            className="wallet-card-action"
            onClick={() => onArchive(wallet)}
            aria-label={`Archive ${wallet.name}`}
            title="Archive wallet"
          >
            <Archive size={16} />
          </button>
        </div>
      </div>

      <div className="wallet-card-info">
        <span className="wallet-card-type">
          {config.label}
        </span>

        <h3 className="wallet-card-name">
          {wallet.name}
        </h3>

        {wallet.institution && (
          <p className="wallet-card-description">
            {wallet.institution}
            {wallet.lastFourDigits &&
              ` •••• ${wallet.lastFourDigits}`}
          </p>
        )}
      </div>

      <div className="wallet-card-bottom">
        <div>
          <span className="wallet-card-balance-label">
            Current Balance
          </span>

          <h2 className="wallet-card-balance">
            {formatCurrency(balance)}
          </h2>
        </div>
      </div>
    </div>
  );
};

export default WalletCard;


import {
  Wallet,
  Landmark,
  CreditCard,
  Smartphone,
  MoreVertical,
  Pencil,
  Archive,
} from "lucide-react";

const walletIcons = {
  cash: Wallet,
  bank: Landmark,
  card: CreditCard,
  digital: Smartphone,
};

const formatCurrency = (amount = 0) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
};

const WalletCard = ({ wallet, onEdit, onArchive }) => {
  const Icon = walletIcons[wallet.type] || Wallet;

  const balance =
    wallet.balance ??
    wallet.currentBalance ??
    wallet.openingBalance ??
    0;

  return (
    <div className="wallet-card">
      <div className="wallet-card-top">
        <div className="wallet-card-icon">
          <Icon size={22} />
        </div>

        <div className="wallet-card-actions">
          <button
            type="button"
            className="wallet-card-action"
            onClick={() => onEdit(wallet)}
            aria-label="Edit wallet"
          >
            <Pencil size={16} />
          </button>

          <button
            type="button"
            className="wallet-card-action"
            onClick={() => onArchive(wallet)}
            aria-label="Archive wallet"
          >
            <Archive size={16} />
          </button>
        </div>
      </div>

      <div className="wallet-card-info">
        <span className="wallet-card-type">
          {wallet.type || "Wallet"}
        </span>

        <h3 className="wallet-card-name">
          {wallet.name}
        </h3>

        {wallet.description && (
          <p className="wallet-card-description">
            {wallet.description}
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

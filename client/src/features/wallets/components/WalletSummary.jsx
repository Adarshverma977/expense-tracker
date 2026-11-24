
const toMinorUnits = (amount = 0) => {
  const numericAmount = Number(amount);
  return Number.isFinite(numericAmount)
    ? Math.round(numericAmount * 100)
    : 0;
};

const formatCurrency = (amount = 0, currency = "INR") => {
  const numericAmount = Number(amount);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(
    Number.isFinite(numericAmount) ? numericAmount : 0
  );
};

const WalletSummary = ({ summary, statusFilter = "active" }) => {
  const data = summary?.summary || summary || {};

  const wallets = (data.wallets || []).filter((wallet) => {
    return (
      statusFilter === "all" ||
      wallet.status === statusFilter
    );
  });

  let totalAssetsMinor = 0;
  let totalLiabilitiesMinor = 0;

  wallets.forEach((wallet) => {
    if (wallet.type === "credit_card") {
      totalLiabilitiesMinor += toMinorUnits(
        wallet.outstanding
      );
    } else {
      totalAssetsMinor += toMinorUnits(wallet.balance);
    }
  });

  const totalAssets = totalAssetsMinor / 100;
  const totalLiabilities = totalLiabilitiesMinor / 100;
  const totalBalance = totalAssets - totalLiabilities;

  const totalWallets = wallets.length;

  const statusLabel =
    statusFilter === "active"
      ? "Active"
      : statusFilter === "archived"
        ? "Archived"
        : "All";

  const currency = data.currency || "INR";

  const summaryItems = [
    {
      title: "Total Balance",
      value: formatCurrency(totalBalance, currency),
      description: `Net balance across ${statusLabel.toLowerCase()} wallets`,
      className: "total-balance",
    },
    {
      title: "Total Wallets",
      value: totalWallets,
      description: `${statusLabel} accounts`,
      className: "total-wallets",
    },
    {
      title: "Total Assets",
      value: formatCurrency(totalAssets, currency),
      description: "Money available across accounts",
      className: "total-assets",
    },
    {
      title: "Total Liabilities",
      value: formatCurrency(totalLiabilities, currency),
      description: "Outstanding credit card balances",
      className: "total-liabilities",
    },
  ];

  return (
    <div className="wallet-summary-grid">
      {summaryItems.map((item) => (
        <div
          className={`wallet-summary-card ${item.className}`}
          key={item.title}
        >
          <div className="wallet-summary-card-content">
            <span className="wallet-summary-title">
              {item.title}
            </span>

            <h3 className="wallet-summary-value">
              {item.value}
            </h3>

            <span className="wallet-summary-description">
              {item.description}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default WalletSummary;

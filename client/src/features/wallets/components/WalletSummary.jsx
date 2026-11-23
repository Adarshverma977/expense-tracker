
const formatCurrency = (amount = 0) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
};

const WalletSummary = ({ summary }) => {
  const data = summary?.summary || summary || {};

  const totalBalance =
    data.totalBalance ?? data.balance ?? 0;

  const totalWallets =
    data.totalWallets ?? data.walletCount ?? 0;

  const totalAssets =
    data.totalAssets ?? data.assets ?? 0;

  const totalLiabilities =
    data.totalLiabilities ?? data.liabilities ?? 0;

  const summaryItems = [
    {
      title: "Total Balance",
      value: formatCurrency(totalBalance),
      description: "Across all wallets",
      className: "total-balance",
    },
    {
      title: "Total Wallets",
      value: totalWallets,
      description: "Active accounts",
      className: "total-wallets",
    },
    {
      title: "Total Assets",
      value: formatCurrency(totalAssets),
      description: "Money available",
      className: "total-assets",
    },
    {
      title: "Total Liabilities",
      value: formatCurrency(totalLiabilities),
      description: "Outstanding balances",
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

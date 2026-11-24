
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

const WalletSummary = ({ summary }) => {
  const data = summary?.summary || summary || {};

  const totalAssets = Number(data.totalCashAndBank || 0);
  const totalLiabilities = Number(data.totalCreditOutstanding || 0);

  const totalBalance = totalAssets - totalLiabilities;

  const totalWallets = Number(
    data.activeWallets ?? data.totalWallets ?? 0
  );

  const summaryItems = [
    {
      title: "Total Balance",
      value: formatCurrency(totalBalance),
      description: "Net balance across active wallets",
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
      description: "Money available across accounts",
      className: "total-assets",
    },
    {
      title: "Total Liabilities",
      value: formatCurrency(totalLiabilities),
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

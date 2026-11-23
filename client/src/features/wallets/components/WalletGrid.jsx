
import WalletCard from "./WalletCard";

const WalletGrid = ({
  wallets,
  onEdit,
  onArchive,
}) => {
  if (!wallets?.length) {
    return null;
  }

  return (
    <div className="wallets-grid">
      {wallets.map((wallet) => (
        <WalletCard
          key={wallet._id}
          wallet={wallet}
          onEdit={onEdit}
          onArchive={onArchive}
        />
      ))}
    </div>
  );
};

export default WalletGrid;

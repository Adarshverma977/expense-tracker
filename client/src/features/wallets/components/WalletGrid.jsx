
import WalletCard from "./WalletCard";

const WalletGrid = ({
  wallets,
  onEdit,
  onArchive,
  onRestore,
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
          onRestore={onRestore}
        />
      ))}
    </div>
  );
};

export default WalletGrid;

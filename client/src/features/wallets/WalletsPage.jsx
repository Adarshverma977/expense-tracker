import "./WalletsPage.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, RefreshCw } from "lucide-react";
import {
  getWallets,
  getWalletSummary,
} from "../../services/walletService";
import WalletSummary from "./components/WalletSummary";
import WalletGrid from "./components/WalletGrid";
import WalletModal from "./components/WalletModal";
import ArchiveWalletModal from "./components/ArchiveWalletModal";

const WalletsPage = () => {
  const [wallets, setWallets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);

  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [walletToArchive, setWalletToArchive] = useState(null);

  const fetchWalletData = useCallback(async (isRefresh = false) => {
    try {
      setError("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [walletResponse, summaryResponse] = await Promise.all([
        getWallets(),
        getWalletSummary(),
      ]);

      const walletData =
        walletResponse?.data?.wallets ??
        walletResponse?.wallets ??
        [];

      const summaryData =
        summaryResponse?.data ??
        summaryResponse ??
        null;

      setWallets(walletData);
      setSummary(summaryData);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load wallets."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const filteredWallets = useMemo(() => {
    return wallets.filter((wallet) => {
      const matchesSearch = wallet.name
        ?.toLowerCase()
        .includes(search.trim().toLowerCase());

      const matchesFilter =
        filter === "all" || wallet.type === filter;

      return matchesSearch && matchesFilter;
    });
  }, [wallets, search, filter]);

  const handleCreateWallet = () => {
    setSelectedWallet(null);
    setIsWalletModalOpen(true);
  };

  const handleEditWallet = (wallet) => {
    setSelectedWallet(wallet);
    setIsWalletModalOpen(true);
  };

  const handleCloseWalletModal = () => {
    setIsWalletModalOpen(false);
    setSelectedWallet(null);
  };

  const handleArchiveWallet = (wallet) => {
    setWalletToArchive(wallet);
    setIsArchiveModalOpen(true);
  };

  const handleCloseArchiveModal = () => {
    setIsArchiveModalOpen(false);
    setWalletToArchive(null);
  };

  const handleSuccess = async () => {
    await fetchWalletData(true);
  };

  return (
    <div className="wallets-page">
      <div className="wallets-page-header">
        <div className="wallets-page-heading">
          <h1>Wallets</h1>
          <p>
            Manage your accounts and keep track of your money.
          </p>
        </div>

        <div className="wallets-page-actions">
          <button
            type="button"
            className="wallets-refresh-btn"
            onClick={() => fetchWalletData(true)}
            disabled={refreshing || loading}
          >
            <RefreshCw
              size={17}
              className={refreshing ? "wallets-refresh-icon" : ""}
            />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>

          <button
            type="button"
            className="wallets-create-btn"
            onClick={handleCreateWallet}
          >
            <Plus size={18} />
            <span>Add Wallet</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="wallets-error">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => fetchWalletData(true)}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && summary && (
        <WalletSummary summary={summary} />
      )}

      <div className="wallets-toolbar">
        <div className="wallets-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search wallets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="wallets-filter">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Wallets</option>
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
            <option value="card">Card</option>
            <option value="digital">Digital</option>
          </select>
        </div>
      </div>

      <div className="wallets-section-heading">
        <div>
          <h2>Your Wallets</h2>
          <span>
            {filteredWallets.length}{" "}
            {filteredWallets.length === 1 ? "wallet" : "wallets"}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="wallets-loading">
          <div className="wallets-loading-spinner" />
          <p>Loading your wallets...</p>
        </div>
      ) : filteredWallets.length > 0 ? (
        <WalletGrid
          wallets={filteredWallets}
          onEdit={handleEditWallet}
          onArchive={handleArchiveWallet}
        />
      ) : (
        <div className="wallets-empty">
          <div className="wallets-empty-content">
            <h3>
              {search || filter !== "all"
                ? "No matching wallets"
                : "No wallets yet"}
            </h3>

            <p>
              {search || filter !== "all"
                ? "Try changing your search or filter."
                : "Create your first wallet to start tracking your money."}
            </p>

            {!search && filter === "all" && (
              <button
                type="button"
                className="wallets-create-btn"
                onClick={handleCreateWallet}
              >
                <Plus size={18} />
                Create your first wallet
              </button>
            )}
          </div>
        </div>
      )}

      <WalletModal
        isOpen={isWalletModalOpen}
        wallet={selectedWallet}
        onClose={handleCloseWalletModal}
        onSuccess={handleSuccess}
      />

      <ArchiveWalletModal
        isOpen={isArchiveModalOpen}
        wallet={walletToArchive}
        onClose={handleCloseArchiveModal}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default WalletsPage;

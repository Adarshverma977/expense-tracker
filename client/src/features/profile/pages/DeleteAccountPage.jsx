
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteAccount } from "../services/profileService";
import "./DeleteAccountPage.css";

const DeleteAccountPage = () => {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async (event) => {
    event.preventDefault();

    setError("");

    if (!confirmDelete) {
      setError("Please confirm that you understand this action.");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your account password.");
      return;
    }

    try {
      setLoading(true);

      await deleteAccount(password);

      navigate("/login", {
        replace: true,
        state: {
          message: "Your account has been permanently deleted.",
        },
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to delete your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="delete-account-page">
      <header className="delete-account-header">
        <span className="delete-account-eyebrow">ACCOUNT MANAGEMENT</span>
        <h1>Delete Account</h1>
        <p>Manage the permanent removal of your account.</p>
      </header>

      <section className="delete-account-card">
        <div className="delete-warning-icon">
          <span>!</span>
        </div>

        <div className="delete-warning-content">
          <h2>Are you sure you want to leave?</h2>
          <p>
            Deleting your account is permanent. Your account and
            associated financial information will be removed.
          </p>
        </div>

        <div className="delete-consequences">
          <h3>What happens when you delete your account?</h3>

          <ul>
            <li>Your profile and account information will be deleted.</li>
            <li>Your wallets and transaction records will be deleted.</li>
            <li>Your budgets, bills and financial goals will be deleted.</li>
            <li>Your recurring transactions and related records will be deleted.</li>
            <li>You will no longer be able to access this account.</li>
          </ul>
        </div>

        <form onSubmit={handleDelete}>
          {error && (
            <div className="delete-account-alert">{error}</div>
          )}

          <div className="delete-password-field">
            <label htmlFor="delete-password">
              Confirm Your Password
            </label>

            <input
              id="delete-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your current password"
              autoComplete="current-password"
              required
            />
          </div>

          <label className="delete-confirmation">
            <input
              type="checkbox"
              checked={confirmDelete}
              onChange={(event) =>
                setConfirmDelete(event.target.checked)
              }
            />

            <span>
              I understand that deleting my account is permanent and
              cannot be undone.
            </span>
          </label>

          <button
            type="submit"
            className="delete-account-button"
            disabled={loading || !confirmDelete || !password.trim()}
          >
            {loading ? "Deleting Account..." : "Permanently Delete Account"}
          </button>
        </form>
      </section>
    </main>
  );
};

export default DeleteAccountPage;

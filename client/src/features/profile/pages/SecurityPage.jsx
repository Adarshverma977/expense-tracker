
import { useState } from "react";
import {
  changePassword,
  changeEmail,
} from "../services/profileService";
import "./SecurityPage.css";

const SecurityPage = () => {
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [emailData, setEmailData] = useState({
    newEmail: "",
    password: "",
  });

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setPasswordError("");
    setPasswordSuccess("");
  };

  const handleEmailChange = (event) => {
    const { name, value } = event.target;

    setEmailData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setEmailError("");
    setEmailSuccess("");
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    setPasswordError("");
    setPasswordSuccess("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError("New password must be different from current password.");
      return;
    }

    try {
      setPasswordLoading(true);

      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setPasswordSuccess("Password changed successfully.");

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setPasswordError(
        err.response?.data?.message || "Unable to change password."
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleEmailSubmit = async (event) => {
    event.preventDefault();

    setEmailError("");
    setEmailSuccess("");

    try {
      setEmailLoading(true);

      const response = await changeEmail({
        newEmail: emailData.newEmail.trim(),
        password: emailData.password,
      });

      const message =
        response?.data?.message ||
        response?.message ||
        "Verification email sent. Please check your inbox.";

      setEmailSuccess(message);

      setEmailData({
        newEmail: "",
        password: "",
      });
    } catch (err) {
      setEmailError(
        err.response?.data?.message || "Unable to request email change."
      );
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <main className="security-page">
      <header className="security-header">
        <div>
          <span className="security-eyebrow">ACCOUNT SECURITY</span>
          <h1>Security Settings</h1>
          <p>Manage your password and email address securely.</p>
        </div>
      </header>

      <section className="security-content">
        <form className="security-card" onSubmit={handlePasswordSubmit}>
          <div className="security-card-heading">
            <div className="security-icon">🔒</div>
            <div>
              <h2>Change Password</h2>
              <p>Choose a strong password to protect your account.</p>
            </div>
          </div>

          {passwordError && (
            <div className="security-alert error">{passwordError}</div>
          )}

          {passwordSuccess && (
            <div className="security-alert success">{passwordSuccess}</div>
          )}

          <div className="security-fields">
            <div className="security-field">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                id="currentPassword"
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                placeholder="Enter current password"
                autoComplete="current-password"
                required
              />
            </div>

            <div className="security-field">
              <label htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                placeholder="Enter new password"
                autoComplete="new-password"
                minLength={8}
                required
              />
              <small>Use at least 8 characters.</small>
            </div>

            <div className="security-field">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Confirm new password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
          </div>

          <div className="security-footer">
            <button type="submit" disabled={passwordLoading}>
              {passwordLoading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>

        <form className="security-card" onSubmit={handleEmailSubmit}>
          <div className="security-card-heading">
            <div className="security-icon">✉️</div>
            <div>
              <h2>Change Email Address</h2>
              <p>Verify your new email address before switching.</p>
            </div>
          </div>

          {emailError && (
            <div className="security-alert error">{emailError}</div>
          )}

          {emailSuccess && (
            <div className="security-alert success">{emailSuccess}</div>
          )}

          <div className="security-fields">
            <div className="security-field">
              <label htmlFor="newEmail">New Email Address</label>
              <input
                id="newEmail"
                type="email"
                name="newEmail"
                value={emailData.newEmail}
                onChange={handleEmailChange}
                placeholder="Enter your new email"
                autoComplete="email"
                required
              />
            </div>

            <div className="security-field">
              <label htmlFor="emailPassword">Confirm Your Password</label>
              <input
                id="emailPassword"
                type="password"
                name="password"
                value={emailData.password}
                onChange={handleEmailChange}
                placeholder="Enter your current password"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <div className="security-footer">
            <button type="submit" disabled={emailLoading}>
              {emailLoading ? "Sending..." : "Send Verification Email"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
};

export default SecurityPage;

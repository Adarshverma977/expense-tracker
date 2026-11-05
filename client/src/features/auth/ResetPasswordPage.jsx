import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Lock, Wallet, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { resetPassword } from "./authService";
import ThemeToggle from "../../components/common/ThemeToggle";
import "./AuthPages.css";

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("This password reset link is invalid or missing.");
      return;
    }

    if (password.length < 8 || password.length > 72) {
      setError("Password must contain 8–72 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setIsLoading(true);

      await resetPassword(token, password);

      setIsSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to reset password. Your link may have expired."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <Link to="/login" className="auth-brand-logo">
          <span className="auth-brand-icon">
            <Wallet size={25} />
          </span>
          <span>Moneta</span>
        </Link>

        <div className="auth-brand-message">
          <span className="auth-brand-badge">
            <Lock size={15} />
            SECURE YOUR ACCOUNT
          </span>

          <h1>
            Stronger
            <br />
            passwords.
            <br />
            <span>Safer finances.</span>
          </h1>

          <p className="auth-brand-description">
            Create a new password to keep your financial
            information protected.
          </p>
        </div>

        <div className="auth-security-card">
          <div className="auth-security-icon">
            <CheckCircle2 size={23} />
          </div>
          <div>
            <strong>Your security comes first.</strong>
            <p>Choose a password you haven't used before.</p>
          </div>
        </div>

        <div className="auth-brand-footer">
          Make every rupee count.
        </div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-theme-toggle">
          <ThemeToggle />
        </div>

        <div className="auth-form-container">
          {!isSuccess ? (
            <>
              <Link to="/login" className="auth-back-link">
                <ArrowLeft size={17} />
                Back to login
              </Link>

              <div className="auth-form-heading">
                <div className="auth-page-icon">
                  <Lock size={25} />
                </div>

                <h2>Set new password</h2>
                <p>
                  Create a strong new password for your Moneta account.
                </p>
              </div>

              <form className="auth-form" onSubmit={handleSubmit}>
                {error && (
                  <div className="auth-alert auth-alert-error">
                    {error}
                  </div>
                )}

                <div className="auth-field">
                  <label htmlFor="new-password">New password</label>

                  <div className="auth-input-wrapper">
                    <Lock size={19} />

                    <input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      maxLength={72}
                      required
                    />

                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  </div>
                </div>

                <div className="auth-field">
                  <label htmlFor="confirm-password">Confirm new password</label>

                  <div className="auth-input-wrapper">
                    <Lock size={19} />

                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      maxLength={72}
                      required
                    />

                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={19} />
                      ) : (
                        <Eye size={19} />
                      )}
                    </button>
                  </div>
                </div>

                <p className="auth-password-hint">
                  Use at least 8 characters.
                </p>

                <button
                  type="submit"
                  className="auth-submit-button"
                  disabled={isLoading || !token}
                >
                  {isLoading ? "Updating password..." : "Reset password"}
                </button>
              </form>
            </>
          ) : (
            <div className="auth-success-content">
              <div className="auth-success-icon">
                <CheckCircle2 size={35} />
              </div>

              <div className="auth-form-heading">
                <h2>Password updated!</h2>
                <p>
                  Your password has been reset successfully.
                  You can now sign in using your new password.
                </p>
              </div>

              <button
                type="button"
                className="auth-submit-button"
                onClick={() => navigate("/login", { replace: true })}
              >
                Continue to login
              </button>
            </div>
          )}

          <div className="auth-page-footer">
            Need help? <Link to="/login">Back to sign in</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default ResetPasswordPage;
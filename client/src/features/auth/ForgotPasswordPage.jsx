import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Wallet, CheckCircle2 } from "lucide-react";
import { forgotPassword } from "./authService";
import ThemeToggle from "../../components/common/ThemeToggle";
import "./AuthPages.css";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setIsLoading(true);

      await forgotPassword(normalizedEmail);

      setIsSubmitted(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to process your request. Please try again."
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
            <Mail size={15} />
            ACCOUNT RECOVERY
          </span>

          <h1>
            A fresh start
            <br />
            begins with
            <br />
            <span>one step.</span>
          </h1>

          <p className="auth-brand-description">
            Your financial journey matters. Recover access to
            your account and get back to managing your money.
          </p>
        </div>

        <div className="auth-security-card">
          <div className="auth-security-icon">
            <CheckCircle2 size={23} />
          </div>
          <div>
            <strong>Your account, secured.</strong>
            <p>Secure password recovery with email verification.</p>
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
          {!isSubmitted ? (
            <>
              <Link to="/login" className="auth-back-link">
                <ArrowLeft size={17} />
                Back to login
              </Link>

              <div className="auth-form-heading">
                <div className="auth-page-icon">
                  <Mail size={25} />
                </div>

                <h2>Forgot password?</h2>
                <p>
                  No worries. Enter your registered email and
                  we'll send you instructions to reset your password.
                </p>
              </div>

              <form className="auth-form" onSubmit={handleSubmit}>
                {error && (
                  <div className="auth-alert auth-alert-error">
                    {error}
                  </div>
                )}

                <div className="auth-field">
                  <label htmlFor="forgot-email">Email address</label>

                  <div className="auth-input-wrapper">
                    <Mail size={19} />

                    <input
                      id="forgot-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      maxLength={254}
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="auth-submit-button"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending instructions..." : "Send reset link"}
                </button>
              </form>
            </>
          ) : (
            <div className="auth-success-content">
              <div className="auth-success-icon">
                <CheckCircle2 size={35} />
              </div>

              <div className="auth-form-heading">
                <h2>Check your email</h2>
                <p>
                  If an account exists with <strong>{email}</strong>,
                  password reset instructions will be sent.
                  Please check your inbox.
                </p>
              </div>

              <Link to="/login" className="auth-submit-button auth-button-link">
                Back to login
              </Link>
            </div>
          )}

          <div className="auth-page-footer">
            Remember your password?{" "}
            <Link to="/login">Sign in</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default ForgotPasswordPage;
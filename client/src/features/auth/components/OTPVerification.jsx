
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, LoaderCircle, Mail, RefreshCw } from "lucide-react";

import { verifyRegistrationOTP } from "../authService";
import { useAuth } from "../AuthContext";

const OTPVerification = ({ email, onBack, onResend }) => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerify = async (event) => {
    event.preventDefault();

    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    try {
      setIsVerifying(true);
      setError("");

      await verifyRegistrationOTP({
        email: email.trim().toLowerCase(),
        otp,
      });

      // Check whether backend established an authenticated session.
      const user = await refreshUser();

      if (user) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/login", {
          replace: true,
          state: { registrationSuccess: true },
        });
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "OTP verification failed."
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    try {
      setIsResending(true);
      setError("");
      setSuccessMessage("");

      await onResend();

      setOtp("");
      setSuccessMessage("A new verification code has been sent.");
    } catch (err) {
      setError(err.message || "Unable to resend verification code.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <form className="auth-form otp-form" onSubmit={handleVerify} noValidate>
      <div className="otp-icon"><Mail size={26} /></div>

      <div className="auth-form-heading">
        <h2>Verify your email</h2>
        <p>
          We sent a 6-digit verification code to
          <strong className="otp-email"> {email}</strong>.
        </p>
      </div>

      {error && <div className="auth-alert auth-alert-error" role="alert">{error}</div>}

      {successMessage && (
        <div className="auth-alert auth-alert-success" role="status">
          {successMessage}
        </div>
      )}

      <div className="auth-field">
        <label htmlFor="registration-otp">Verification code</label>
        <input
          id="registration-otp"
          className="otp-input"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          value={otp}
          onChange={(event) => {
            setOtp(event.target.value.replace(/\D/g, "").slice(0, 6));
            setError("");
          }}
          maxLength={6}
          disabled={isVerifying}
        />
        <span className="otp-helper-text">Enter your 6-digit code.</span>
      </div>

      <button
        type="submit"
        className="auth-submit-button"
        disabled={isVerifying || isResending}
      >
        {isVerifying ? (
          <><LoaderCircle size={18} className="auth-spinner" /> Verifying...</>
        ) : (
          <>Verify email <ArrowRight size={18} /></>
        )}
      </button>

      <button
        type="button"
        className="otp-resend-button"
        onClick={handleResend}
        disabled={isResending || isVerifying}
      >
        {isResending
          ? <LoaderCircle size={15} className="auth-spinner" />
          : <RefreshCw size={15} />}
        Resend verification code
      </button>

      <button
        type="button"
        className="otp-back-button"
        onClick={onBack}
        disabled={isResending || isVerifying}
      >
        Back to registration
      </button>
    </form>
  );
};

export default OTPVerification;


import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifyEmailChange } from "../services/profileService";
import "./VerifyEmailChangePage.css";

const VerifyEmailChangePage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Email verification token is missing.");
        return;
      }

      try {
        const response = await verifyEmailChange(token);

        if (!active) return;

        setStatus("success");
        setMessage(
          response?.data?.message ||
          "Your email address has been successfully updated."
        );
      } catch (error) {
        if (!active) return;

        setStatus("error");
        setMessage(
          error.response?.data?.message ||
          "Email verification failed. The link may have expired or already been used."
        );
      }
    };

    verifyEmail();

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <main className="email-verification-page">
      <section className="email-verification-card">
        {status === "loading" && (
          <>
            <div className="email-verification-loader" />
            <h1>Verifying your email</h1>
            <p>Please wait while we verify your new email address.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="email-verification-icon success">
              <span>✓</span>
            </div>
            <h1>Email Updated Successfully</h1>
            <p>{message}</p>
            <Link
              to="/settings/profile"
              className="email-verification-button"
            >
              Back to Profile
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="email-verification-icon error">
              <span>!</span>
            </div>
            <h1>Verification Failed</h1>
            <p>{message}</p>
            <Link
              to="/settings/security"
              className="email-verification-button"
            >
              Back to Security Settings
            </Link>
          </>
        )}
      </section>
    </main>
  );
};

export default VerifyEmailChangePage;


import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";

import RegisterForm from "./components/RegisterForm";
import OTPVerification from "./components/OTPVerification";
import { sendRegistrationOTP } from "./authService";
import ThemeToggle from "../../components/common/ThemeToggle";

import "./AuthPages.css";

const RegisterPage = () => {
  const [registrationData, setRegistrationData] = useState(null);
  const [isOtpStep, setIsOtpStep] = useState(false);

  const handleOtpSent = ({ registrationData: data }) => {
    setRegistrationData(data);
    setIsOtpStep(true);
  };

  const handleResendOTP = async () => {
    if (!registrationData) {
      throw new Error("Registration details are unavailable. Please register again.");
    }

    await sendRegistrationOTP(registrationData);
  };

  const handleBack = () => {
    setIsOtpStep(false);
  };

  return (
    <main className="auth-page">
      {/* Branding Panel */}
      <section className="auth-brand-panel">
        <div className="auth-brand-content">
          <motion.div
            className="auth-brand-logo"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="auth-brand-icon">
              <Wallet size={23} />
            </div>
            <span>Moneta</span>
          </motion.div>

          <motion.div
            className="auth-brand-message"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <span className="auth-brand-eyebrow">
              <Sparkles size={14} />
              YOUR FINANCIAL JOURNEY STARTS HERE
            </span>

            <h1>
              Build better
              <br />
              money habits.
              <br />
              <span>Starting today.</span>
            </h1>

            <p>
              Create your personal finance workspace and
              bring more clarity to every earning and expense.
            </p>
          </motion.div>

          <motion.div
            className="auth-brand-feature"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="auth-feature-icon">
              <ShieldCheck size={21} />
            </div>

            <div>
              <strong>Your finances, protected.</strong>
              <span>Secure account creation with email verification.</span>
            </div>
          </motion.div>

          <div className="auth-brand-footer">
            <span>Make every rupee count.</span>
            <ArrowUpRight size={16} />
          </div>
        </div>

        <div className="auth-brand-decoration auth-decoration-one" />
        <div className="auth-brand-decoration auth-decoration-two" />
      </section>

      {/* Registration Panel */}
      <section className="auth-form-panel">
        <div className="auth-panel-top">
          <span className="auth-mobile-brand">Moneta</span>
          <ThemeToggle />
        </div>

        <motion.div
          key={isOtpStep ? "otp" : "register"}
          className="auth-form-container"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {isOtpStep && registrationData ? (
            <OTPVerification
              email={registrationData.email}
              onBack={handleBack}
              onResend={handleResendOTP}
            />
          ) : (
            <RegisterForm onOtpSent={handleOtpSent} />
          )}

          <div className="auth-form-footer">
            {isOtpStep ? (
              <span>
                Wrong email?{" "}
                <button
                  type="button"
                  className="auth-text-button"
                  onClick={handleBack}
                >
                  Change details
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{" "}
                <Link to="/login">Sign in</Link>
              </span>
            )}
          </div>
        </motion.div>

        <div className="auth-panel-bottom">
          <span>© {new Date().getFullYear()} Moneta</span>
          <span>Personal finance, made clearer.</span>
        </div>
      </section>
    </main>
  );
};

export default RegisterPage;

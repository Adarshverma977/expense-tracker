
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";

import LoginForm from "./components/LoginForm";
import ThemeToggle from "../../components/common/ThemeToggle";

import "./AuthPages.css";

const LoginPage = () => {
  return (
    <main className="auth-page">
      {/* Left Branding Panel */}
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
              SMARTER MONEY MANAGEMENT
            </span>

            <h1>
              Your money.
              <br />
              Your goals.
              <br />
              <span>Your control.</span>
            </h1>

            <p>
              Take control of your finances with a clearer view
              of your spending, smarter insights, and better
              everyday decisions.
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
              <span>
                Private and secure personal finance tracking.
              </span>
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

      {/* Right Login Panel */}
      <section className="auth-form-panel">
        <div className="auth-panel-top">
          <span className="auth-mobile-brand">Moneta</span>
          <ThemeToggle />
        </div>

        {/* Back to Home */}
        <motion.div
          className="auth-home-navigation"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link to="/" className="auth-back-home">
            <ArrowLeft size={17} />
            <span>Back to Home</span>
          </Link>
        </motion.div>

        <motion.div
          className="auth-form-container"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
        >
          <LoginForm />

          <div className="auth-form-footer">
            <span>
              Don't have an account?{" "}
              <Link to="/register">Create account</Link>
            </span>
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

export default LoginPage;

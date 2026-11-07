
import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
  Zap,
} from "lucide-react";

import ThemeToggle from "../../components/common/ThemeToggle";
import "./LandingPage.css";

const features = [
  {
    icon: Wallet,
    title: "Effortless expense tracking",
    description:
      "Record your daily expenses and income in one organized place. Know exactly where your money goes.",
    color: "green",
  },
  {
    icon: BarChart3,
    title: "Understand your spending",
    description:
      "Turn your financial activity into meaningful visual insights with monthly trends and category breakdowns.",
    color: "blue",
  },
  {
    icon: CreditCard,
    title: "Organize your finances",
    description:
      "Create categories, manage transactions and keep your financial records structured.",
    color: "purple",
  },
  {
    icon: ShieldCheck,
    title: "Your finances, your control",
    description:
      "Access your personal financial workspace with secure authentication and protected account access.",
    color: "orange",
  },
];

const steps = [
  {
    number: "01",
    title: "Create your account",
    description:
      "Get started with your personal Moneta account in just a few steps.",
    icon: ShieldCheck,
  },
  {
    number: "02",
    title: "Record your transactions",
    description:
      "Add your income and expenses, choose categories and maintain your records.",
    icon: Wallet,
  },
  {
    number: "03",
    title: "Understand your money",
    description:
      "Explore your dashboard and discover your financial patterns.",
    icon: BarChart3,
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: "easeOut",
    },
  },
};

function DashboardPreview() {
  return (
    <motion.div
      className="landing-dashboard-preview"
      initial={{ opacity: 0, y: 35, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.8,
        delay: 0.25,
        ease: "easeOut",
      }}
    >
      <div className="landing-preview-topbar">
        <div className="landing-preview-brand">
          <span className="landing-preview-brand-icon">
            <Wallet size={15} />
          </span>
          <span>Moneta</span>
        </div>

        <div className="landing-preview-topbar-right">
          <span className="landing-preview-dot" />
          <span>Personal overview</span>
        </div>
      </div>

      <div className="landing-preview-content">
        <div className="landing-preview-heading">
          <div>
            <span>FINANCIAL OVERVIEW</span>
            <h3>Your money at a glance</h3>
          </div>

          <span className="landing-preview-period">
            This month <ChevronDown size={13} />
          </span>
        </div>

        <div className="landing-preview-balance">
          <div>
            <span>Total balance</span>
            <strong>₹84,250.00</strong>
            <small>
              <TrendingUp size={13} />
              +12.8% <span>from last month</span>
            </small>
          </div>

          <div className="landing-preview-balance-icon">
            <Wallet size={22} />
          </div>
        </div>

        <div className="landing-preview-metrics">
          <div className="landing-preview-metric">
            <div className="landing-preview-metric-heading">
              <span className="landing-preview-metric-icon income">
                <TrendingUp size={15} />
              </span>
              <span>Income</span>
            </div>
            <strong>₹65,000</strong>
            <small>Monthly earnings</small>
          </div>

          <div className="landing-preview-metric">
            <div className="landing-preview-metric-heading">
              <span className="landing-preview-metric-icon expense">
                <TrendingDown size={15} />
              </span>
              <span>Expenses</span>
            </div>
            <strong>₹28,750</strong>
            <small>Monthly spending</small>
          </div>
        </div>

        <div className="landing-preview-chart">
          <div className="landing-preview-chart-heading">
            <div>
              <strong>Monthly activity</strong>
              <span>Income vs expenses</span>
            </div>
            <span className="landing-preview-chart-legend">
              <i /> Income <i className="expense-legend" /> Expenses
            </span>
          </div>

          <div className="landing-chart-bars">
            {[
              [45, 25],
              [65, 35],
              [52, 30],
              [82, 42],
              [62, 32],
              [95, 48],
              [74, 38],
            ].map(([income, expense], index) => (
              <div className="landing-chart-column" key={index}>
                <div className="landing-chart-bar-group">
                  <motion.span
                    className="landing-chart-bar income-bar"
                    initial={{ height: 0 }}
                    animate={{ height: `${income}%` }}
                    transition={{
                      duration: 0.7,
                      delay: 0.5 + index * 0.07,
                    }}
                  />
                  <motion.span
                    className="landing-chart-bar expense-bar"
                    initial={{ height: 0 }}
                    animate={{ height: `${expense}%` }}
                    transition={{
                      duration: 0.7,
                      delay: 0.65 + index * 0.07,
                    }}
                  />
                </div>
                <span>{["M", "T", "W", "T", "F", "S", "S"][index]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="landing-preview-bottom">
          <span>
            <Sparkles size={14} />
            Your financial journey, simplified.
          </span>
          <span>MONETA</span>
        </div>
      </div>
    </motion.div>
  );
}

function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const scrollToSection = (sectionId) => {
    closeMenu();
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <div className="landing-page">
      <header className="landing-navbar">
        <div className="landing-navbar-inner">
          <Link
            to="/"
            className="landing-logo"
            aria-label="Moneta home"
            onClick={closeMenu}
          >
            <span className="landing-logo-icon">
              <Wallet size={21} strokeWidth={2.2} />
            </span>
            <span>moneta<span className="landing-logo-dot">.</span></span>
          </Link>

          <nav
            className={`landing-nav-links ${menuOpen ? "is-open" : ""}`}
          >
            <button onClick={() => scrollToSection("features")}>
              Features
            </button>
            <button onClick={() => scrollToSection("how-it-works")}>
              How it works
            </button>
            <button onClick={() => scrollToSection("about")}>
              About
            </button>
          </nav>

          <div className="landing-navbar-actions">
            <ThemeToggle />

            <Link to="/login" className="landing-login-link">
              Log in
            </Link>

            <Link to="/register" className="landing-nav-cta">
              Get started <ArrowUpRight size={16} />
            </Link>
          </div>

          <button
            type="button"
            className="landing-mobile-menu"
            onClick={() => setMenuOpen((current) => !current)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-glow landing-hero-glow-one" />
          <div className="landing-hero-glow landing-hero-glow-two" />

          <div className="landing-container landing-hero-grid">
            <motion.div
              className="landing-hero-content"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                className="landing-hero-badge"
                variants={itemVariants}
              >
                <Sparkles size={14} />
                <span>A smarter way to manage money</span>
              </motion.div>

              <motion.h1 variants={itemVariants}>
                Your money.
                <br />
                Your <span>clarity.</span>
                <br />
                Your Moneta.
              </motion.h1>

              <motion.p variants={itemVariants}>
                Take control of your finances with a simpler way to
                track expenses, manage income and understand your
                spending habits.
              </motion.p>

              <motion.div
                className="landing-hero-actions"
                variants={itemVariants}
              >
                <Link to="/register" className="landing-primary-button">
                  Get started for free
                  <ArrowRight size={18} />
                </Link>

                <button
                  className="landing-secondary-button"
                  onClick={() => scrollToSection("features")}
                >
                  Explore features
                  <ArrowUpRight size={17} />
                </button>
              </motion.div>

              <motion.div
                className="landing-hero-trust"
                variants={itemVariants}
              >
                <span>
                  <Check size={15} /> Easy to use
                </span>
                <span>
                  <Check size={15} /> Clear insights
                </span>
                <span>
                  <Check size={15} /> Your personal workspace
                </span>
              </motion.div>
            </motion.div>

            <div className="landing-hero-visual">
              <div className="landing-visual-decoration decoration-one" />
              <div className="landing-visual-decoration decoration-two" />

              <DashboardPreview />

              <motion.div
                className="landing-floating-card landing-floating-income"
                initial={{ opacity: 0, x: 25 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <span className="landing-floating-icon">
                  <TrendingUp size={17} />
                </span>
                <div>
                  <small>Income received</small>
                  <strong>+ ₹12,500</strong>
                </div>
              </motion.div>

              <motion.div
                className="landing-floating-card landing-floating-insight"
                initial={{ opacity: 0, x: -25 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                <span className="landing-floating-icon insight-icon">
                  <Zap size={17} />
                </span>
                <div>
                  <small>Financial clarity</small>
                  <strong>All in one place</strong>
                </div>
              </motion.div>
            </div>
          </div>

          <div className="landing-container landing-hero-bottom">
            <span>MADE FOR BETTER MONEY HABITS</span>
            <div />
            <span>TRACK · UNDERSTAND · GROW</span>
          </div>
        </section>

        <section className="landing-benefit-strip">
          <div className="landing-container landing-benefit-grid">
            <div>
              <CircleDollarSign size={21} />
              <span>Income and expense tracking</span>
            </div>
            <div>
              <BarChart3 size={21} />
              <span>Meaningful financial insights</span>
            </div>
            <div>
              <ShieldCheck size={21} />
              <span>Personal financial workspace</span>
            </div>
          </div>
        </section>

        <section className="landing-features" id="features">
          <div className="landing-container">
            <motion.div
              className="landing-section-heading"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={containerVariants}
            >
              <motion.span variants={itemVariants}>
                EVERYTHING IN ONE PLACE
              </motion.span>
              <motion.h2 variants={itemVariants}>
                Money management,
                <br />
                <span>without the mess.</span>
              </motion.h2>
              <motion.p variants={itemVariants}>
                Everything you need to stay organized, understand
                your finances and make more informed decisions.
              </motion.p>
            </motion.div>

            <motion.div
              className="landing-feature-grid"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
            >
              {features.map((feature) => {
                const Icon = feature.icon;

                return (
                  <motion.article
                    className="landing-feature-card"
                    key={feature.title}
                    variants={itemVariants}
                    whileHover={{ y: -7 }}
                    transition={{ duration: 0.22 }}
                  >
                    <div className={`landing-feature-icon ${feature.color}`}>
                      <Icon size={23} />
                    </div>

                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>

                    <span className="landing-feature-arrow">
                      <ArrowUpRight size={18} />
                    </span>
                  </motion.article>
                );
              })}
            </motion.div>
          </div>
        </section>

        <section className="landing-insights" id="about">
          <div className="landing-container landing-insights-grid">
            <motion.div
              className="landing-insights-visual"
              initial={{ opacity: 0, x: -35 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="landing-insight-card">
                <div className="landing-insight-card-header">
                  <div>
                    <span>SPENDING OVERVIEW</span>
                    <h3>Know where it goes.</h3>
                  </div>
                  <span className="landing-insight-icon">
                    <BarChart3 size={20} />
                  </span>
                </div>

                <div className="landing-insight-total">
                  <span>Total expenses</span>
                  <strong>₹28,750</strong>
                  <small>
                    <TrendingDown size={13} />
                    Understand your spending patterns
                  </small>
                </div>

                <div className="landing-insight-categories">
                  {[
                    ["Food & Dining", "₹8,500", "78%", "food"],
                    ["Shopping", "₹6,200", "57%", "shopping"],
                    ["Transport", "₹4,500", "42%", "transport"],
                    ["Others", "₹9,550", "88%", "others"],
                  ].map(([name, amount, width, color]) => (
                    <div
                      className="landing-insight-category"
                      key={name}
                    >
                      <div>
                        <span>{name}</span>
                        <strong>{amount}</strong>
                      </div>
                      <div className="landing-insight-progress">
                        <motion.span
                          className={color}
                          initial={{ width: 0 }}
                          whileInView={{ width }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="landing-insight-card-footer">
                  <Sparkles size={15} />
                  Visualize your financial activity with Moneta.
                </div>
              </div>
            </motion.div>

            <motion.div
              className="landing-insights-content"
              initial={{ opacity: 0, x: 35 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="landing-section-label">
                CLARITY THROUGH INSIGHTS
              </span>

              <h2>
                Don't just track money.
                <br />
                <span>Understand it.</span>
              </h2>

              <p>
                Your financial activity tells a story. Moneta helps
                you see that story through organized records and
                easy-to-understand visual analytics.
              </p>

              <ul>
                <li>
                  <Check size={17} /> See income and expenses together.
                </li>
                <li>
                  <Check size={17} /> Understand category-wise spending.
                </li>
                <li>
                  <Check size={17} /> Review your monthly financial activity.
                </li>
              </ul>

              <Link to="/register" className="landing-text-link">
                Start exploring Moneta <ArrowRight size={17} />
              </Link>
            </motion.div>
          </div>
        </section>

        <section className="landing-how" id="how-it-works">
          <div className="landing-container">
            <div className="landing-section-heading">
              <span>GET STARTED IN THREE STEPS</span>
              <h2>
                Simple by design.
                <br />
                <span>Useful by nature.</span>
              </h2>
              <p>
                Getting a clearer picture of your finances doesn't
                have to be complicated.
              </p>
            </div>

            <motion.div
              className="landing-steps-grid"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              {steps.map((step) => {
                const Icon = step.icon;

                return (
                  <motion.article
                    className="landing-step-card"
                    key={step.number}
                    variants={itemVariants}
                  >
                    <div className="landing-step-top">
                      <span>{step.number}</span>
                      <Icon size={23} />
                    </div>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </motion.article>
                );
              })}
            </motion.div>
          </div>
        </section>

        <section className="landing-cta">
          <div className="landing-container">
            <motion.div
              className="landing-cta-card"
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="landing-cta-glow" />
              <span className="landing-cta-label">
                YOUR NEXT CHAPTER STARTS HERE
              </span>

              <h2>
                Make every rupee
                <br />
                <span>make more sense.</span>
              </h2>

              <p>
                Bring your financial activity together and start
                building better money habits with Moneta.
              </p>

              <Link to="/register" className="landing-cta-button">
                Create your free account
                <ArrowRight size={18} />
              </Link>

              <span className="landing-cta-note">
                Already have an account? <Link to="/login">Log in</Link>
              </span>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer-main">
            <div className="landing-footer-brand">
              <Link to="/" className="landing-logo">
                <span className="landing-logo-icon">
                  <Wallet size={21} />
                </span>
                <span>moneta<span className="landing-logo-dot">.</span></span>
              </Link>

              <p>
                A clearer way to manage your money and understand
                your financial habits.
              </p>
            </div>

            <div className="landing-footer-links">
              <div>
                <strong>Explore</strong>
                <button onClick={() => scrollToSection("features")}>
                  Features
                </button>
                <button onClick={() => scrollToSection("how-it-works")}>
                  How it works
                </button>
                <Link to="/register">Get started</Link>
              </div>

              <div>
                <strong>Account</strong>
                <Link to="/login">Log in</Link>
                <Link to="/register">Create account</Link>
              </div>
            </div>
          </div>

          <div className="landing-footer-bottom">
            <span>© {new Date().getFullYear()} Moneta. All rights reserved.</span>
            <span>Built for better money habits.</span>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="landing-mobile-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMenu}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default LandingPage;

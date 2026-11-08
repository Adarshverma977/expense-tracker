
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  Receipt,
  RefreshCw,
  ArrowRight,
  Activity,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";
import MonthlyTrendsChart from "./MonthlyTrendsChart";
import CategoryBreakdownChart from "./CategoryBreakdownChart";
import BudgetOverview from "./BudgetOverview";

import "./DashboardPage.css";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.09 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

const Skeleton = () => (
  <div className="dashboard-skeleton">
    <div className="skeleton-heading skeleton" />

    <div className="skeleton-cards">
      {[1, 2, 3].map((item) => (
        <div className="skeleton-card skeleton" key={item} />
      ))}
    </div>

    <div className="skeleton-content skeleton" />
    <div className="skeleton-content skeleton" />
  </div>
);

const DashboardPage = () => {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await api.get("/dashboard");

        if (active) {
          setDashboard(response.data.data);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
            "Unable to load dashboard data."
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchDashboard();

    return () => {
      active = false;
    };
  }, [refreshKey]);

  if (isLoading) {
    return <Skeleton />;
  }

  if (error) {
    return (
      <motion.div
        className="dashboard-state dashboard-error"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Activity size={32} />

        <h3>Something went wrong</h3>

        <p>{error}</p>

        <button onClick={() => setRefreshKey((prev) => prev + 1)}>
          <RefreshCw size={16} />
          Try again
        </button>
      </motion.div>
    );
  }

  const summary = dashboard?.summary || {};
  const monthly = dashboard?.monthly || {};
  const currency = dashboard?.currency || "INR";

  const cards = [
    {
      title: "Total Balance",
      amount: summary.balance,
      icon: Wallet,
      className: "balance-card",
      description: "Your overall financial position",
    },
    {
      title: "Total Income",
      amount: summary.totalIncome,
      icon: TrendingUp,
      className: "income-card",
      description: "All-time money received",
    },
    {
      title: "Total Expenses",
      amount: summary.totalExpenses,
      icon: TrendingDown,
      className: "expense-card",
      description: "All-time money spent",
    },
  ];

  const recentTransactions = dashboard?.recentTransactions || [];

  const date = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <motion.div
      className="dashboard-page"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Welcome Section */}
      <motion.section
        className="dashboard-welcome"
        variants={itemVariants}
      >
        <div>
          <span className="dashboard-eyebrow">
            YOUR FINANCIAL OVERVIEW
          </span>

          <h2>Welcome back!</h2>

          <p>Here is what's happening with your money.</p>
        </div>

        <div className="dashboard-date">
          <CalendarDays size={17} />
          {date}
        </div>
      </motion.section>

      {/* Financial Summary Cards */}
      <section className="dashboard-summary">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <motion.article
              key={card.title}
              variants={itemVariants}
              whileHover={{
                y: -6,
                transition: { duration: 0.2 },
              }}
              className={`summary-card ${card.className}`}
            >
              <div className="summary-card-top">
                <span>{card.title}</span>

                <div className="summary-icon">
                  <Icon size={21} />
                </div>
              </div>

              <h3>
                <AnimatedAmount
                  amount={card.amount}
                  currency={currency}
                />
              </h3>

              <p>{card.description}</p>
            </motion.article>
          );
        })}
      </section>

      {/* Monthly Overview */}
      <motion.section
        className="monthly-overview"
        variants={itemVariants}
      >
        <div className="section-heading">
          <div>
            <span className="dashboard-eyebrow">THIS MONTH</span>
            <h3>Monthly overview</h3>
          </div>

          <span className="monthly-badge">
            <CalendarDays size={14} />
            Current month
          </span>
        </div>

        <div className="monthly-metrics">
          <Metric
            icon={ArrowUpRight}
            label="Monthly Income"
            amount={monthly.income}
            count={monthly.incomeCount}
            type="income-text"
          />

          <Metric
            icon={ArrowDownRight}
            label="Monthly Expenses"
            amount={monthly.expenses}
            count={monthly.expenseCount}
            type="expense-text"
          />

          <Metric
            icon={Wallet}
            label="Monthly Balance"
            amount={monthly.balance}
            description="Income minus expenses"
          />
        </div>
      </motion.section>

      {/* Budget Overview - New Integration */}
      <BudgetOverview />

      {/* Financial Analytics */}
      <motion.section
        className="dashboard-analytics"
        variants={itemVariants}
      >
        <div className="section-heading">
          <div>
            <span className="dashboard-eyebrow">
              FINANCIAL INSIGHTS
            </span>

            <h3>Your spending analytics</h3>
          </div>
        </div>

        <div className="analytics-grid">
          <article className="analytics-panel">
            <div className="analytics-panel-heading">
              <div>
                <h4>Monthly trends</h4>
                <p>Income vs expenses over the last 6 months</p>
              </div>
            </div>

            <MonthlyTrendsChart
              data={dashboard?.monthlyTrends || []}
            />
          </article>

          <article className="analytics-panel">
            <div className="analytics-panel-heading">
              <div>
                <h4>Expense breakdown</h4>
                <p>Where your money goes this month</p>
              </div>
            </div>

            <CategoryBreakdownChart
              data={dashboard?.categoryBreakdown || []}
            />
          </article>
        </div>
      </motion.section>

      {/* Recent Transactions */}
      <motion.section
        className="recent-transactions"
        variants={itemVariants}
      >
        <div className="section-heading">
          <div>
            <span className="dashboard-eyebrow">
              YOUR ACTIVITY
            </span>

            <h3>Recent transactions</h3>
          </div>

          <button
            className="view-all-button"
            onClick={() => navigate("/transactions")}
          >
            View all <ArrowRight size={15} />
          </button>
        </div>

        <div className="recent-list">
          <AnimatePresence>
            {recentTransactions.length ? (
              recentTransactions.map((transaction) => {
                const isIncome = transaction.type === "income";

                return (
                  <motion.div
                    className="recent-transaction-item"
                    key={transaction._id}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    layout
                  >
                    <div
                      className={`recent-transaction-icon ${isIncome
                          ? "recent-income"
                          : "recent-expense"
                        }`}
                    >
                      {isIncome ? (
                        <TrendingUp size={19} />
                      ) : (
                        <Receipt size={19} />
                      )}
                    </div>

                    <div className="recent-transaction-details">
                      <strong>{transaction.title}</strong>

                      <span>
                        {transaction.category?.name ||
                          "Uncategorized"}

                        {" · "}

                        {new Date(
                          transaction.date
                        ).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <strong
                      className={
                        isIncome
                          ? "income-text"
                          : "expense-text"
                      }
                    >
                      {isIncome ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </strong>
                  </motion.div>
                );
              })
            ) : (
              <div className="recent-empty">
                <Receipt size={28} />

                <p>No transactions yet.</p>

                <span>
                  Your recent activity will appear here.
                </span>
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>
    </motion.div>
  );
};

const Metric = ({
  icon: Icon,
  label,
  amount,
  count,
  type,
  description,
}) => (
  <motion.article whileHover={{ y: -3 }}>
    <div className="metric-label">
      <Icon size={17} />
      {label}
    </div>

    <strong className={type || ""}>
      {formatCurrency(amount)}
    </strong>

    <span>
      {count !== undefined
        ? `${count} transactions`
        : description}
    </span>
  </motion.article>
);

const AnimatedAmount = ({ amount, currency }) => (
  <motion.span
    key={String(amount)}
    initial={{ opacity: 0.4, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45 }}
  >
    {new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(amount || 0))}
  </motion.span>
);

export default DashboardPage;

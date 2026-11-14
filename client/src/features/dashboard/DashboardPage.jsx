
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
  ShoppingBag,
  Lightbulb,
  PiggyBank,
  Layers3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import MonthlyTrendsChart from "./MonthlyTrendsChart";
import CategoryBreakdownChart from "./CategoryBreakdownChart";
import BudgetOverview from "./BudgetOverview";
import "./DashboardPage.css";

const formatCurrency = (amount, currency = "INR") => {
  const numericAmount = Number(amount ?? 0);

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(numericAmount) ? numericAmount : 0);
  } catch {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number.isFinite(numericAmount) ? numericAmount : 0);
  }
};

const formatDate = (value, options) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-IN", options).format(date);
};

const getNumericValue = (value) => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: "easeOut",
    },
  },
};

const Skeleton = () => (
  <div className="dashboard-skeleton" aria-label="Loading dashboard">
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
      setIsLoading(true);
      setError("");

      try {
        const response = await api.get("/dashboard");

        if (!active) return;

        const dashboardData = response?.data?.data;

        if (!dashboardData || typeof dashboardData !== "object") {
          throw new Error("Invalid dashboard response received.");
        }

        setDashboard(dashboardData);
      } catch (err) {
        if (!active) return;

        setError(
          err.response?.data?.message ||
          err.message ||
          "Unable to load dashboard data."
        );
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

  const handleRefresh = () => {
    setRefreshKey((previous) => previous + 1);
  };

  if (isLoading) {
    return <Skeleton />;
  }

  if (error) {
    return (
      <motion.div
        className="dashboard-state dashboard-error"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        role="alert"
      >
        <Activity size={32} />
        <h3>Something went wrong</h3>
        <p>{error}</p>
        <button type="button" onClick={handleRefresh}>
          <RefreshCw size={16} />
          Try again
        </button>
      </motion.div>
    );
  }

  const summary = dashboard?.summary || {};
  const monthly = dashboard?.monthly || {};
  const currency = dashboard?.currency || "INR";

  const monthlyTrends = Array.isArray(dashboard?.monthlyTrends)
    ? dashboard.monthlyTrends
    : [];

  const categoryBreakdown = Array.isArray(dashboard?.categoryBreakdown)
    ? dashboard.categoryBreakdown.filter(
      (category) => category && typeof category === "object"
    )
    : [];

  const recentTransactions = Array.isArray(dashboard?.recentTransactions)
    ? dashboard.recentTransactions
    : [];

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

  const date = formatDate(new Date(), {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <motion.div
      className="dashboard-page"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.section className="dashboard-welcome" variants={itemVariants}>
        <div>
          <span className="dashboard-eyebrow">
            YOUR FINANCIAL OVERVIEW
          </span>
          <h2>Welcome back!</h2>
          <p>Here is what's happening with your money.</p>
        </div>

        <div className="dashboard-date">
          <CalendarDays size={17} />
          <span>{date}</span>
        </div>
      </motion.section>

      <motion.section className="dashboard-summary" variants={itemVariants}>
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
      </motion.section>

      <motion.section className="monthly-overview" variants={itemVariants}>
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
            currency={currency}
          />

          <Metric
            icon={ArrowDownRight}
            label="Monthly Expenses"
            amount={monthly.expenses}
            count={monthly.expenseCount}
            type="expense-text"
            currency={currency}
          />

          <Metric
            icon={Wallet}
            label="Monthly Balance"
            amount={monthly.balance}
            description="Income minus expenses"
            currency={currency}
          />
        </div>
      </motion.section>

      <BudgetOverview />

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
          <div className="analytics-main-column">
            <article className="analytics-panel">
              <div className="analytics-panel-heading">
                <div>
                  <h4>Monthly trends</h4>
                  <p>Income vs expenses over the last 6 months</p>
                </div>
              </div>

              <MonthlyTrendsChart data={monthlyTrends} />
            </article>

            <SpendingInsights
              data={categoryBreakdown}
              monthly={monthly}
              currency={currency}
            />
          </div>

          <article className="analytics-panel">
            <div className="analytics-panel-heading">
              <div>
                <h4>Expense breakdown</h4>
                <p>Where your money goes this month</p>
              </div>
            </div>

            <CategoryBreakdownChart data={categoryBreakdown} />
          </article>
        </div>
      </motion.section>

      <motion.section className="recent-transactions" variants={itemVariants}>
        <div className="section-heading">
          <div>
            <span className="dashboard-eyebrow">YOUR ACTIVITY</span>
            <h3>Recent transactions</h3>
          </div>

          <button
            type="button"
            className="view-all-button"
            onClick={() => navigate("/transactions")}
          >
            View all
            <ArrowRight size={15} />
          </button>
        </div>

        <div className="recent-list">
          <AnimatePresence mode="popLayout">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction) => {
                const isIncome = transaction.type === "income";

                return (
                  <motion.div
                    className="recent-transaction-item"
                    key={transaction._id}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    transition={{ duration: 0.25 }}
                    layout
                  >
                    <div
                      className={`recent-transaction-icon ${isIncome ? "recent-income" : "recent-expense"
                        }`}
                    >
                      {isIncome ? (
                        <TrendingUp size={19} />
                      ) : (
                        <Receipt size={19} />
                      )}
                    </div>

                    <div className="recent-transaction-details">
                      <strong>
                        {transaction.title || "Untitled transaction"}
                      </strong>

                      <span>
                        {transaction.category?.name || "Uncategorized"}
                        {" · "}
                        {formatDate(transaction.date, {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <strong
                      className={
                        isIncome ? "income-text" : "expense-text"
                      }
                    >
                      {isIncome ? "+" : "-"}
                      {formatCurrency(transaction.amount, currency)}
                    </strong>
                  </motion.div>
                );
              })
            ) : (
              <div className="recent-empty">
                <Receipt size={28} />
                <p>No transactions yet.</p>
                <span>Your recent activity will appear here.</span>
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>
    </motion.div>
  );
};

const SpendingInsights = ({ data, monthly, currency }) => {
  const categories = data
    .map((category) => ({
      name: category.name || "Uncategorized",
      amount: getNumericValue(category.totalAmount),
      transactionCount: getNumericValue(category.transactionCount),
    }))
    .filter((category) => category.amount > 0);

  const totalCategoryExpenses = categories.reduce(
    (total, category) => total + category.amount,
    0
  );

  const monthlyExpenses = getNumericValue(monthly.expenses);
  const totalExpenses = totalCategoryExpenses || monthlyExpenses;

  const totalTransactions = categories.reduce(
    (total, category) => total + category.transactionCount,
    0
  );

  const topCategory = [...categories].sort(
    (a, b) => b.amount - a.amount
  )[0];

  const topCategoryPercentage =
    topCategory && totalExpenses > 0
      ? (topCategory.amount / totalExpenses) * 100
      : 0;

  const averageTransaction =
    totalTransactions > 0
      ? totalCategoryExpenses / totalTransactions
      : 0;

  const insights = [
    {
      label: "Top spending category",
      value: topCategory?.name || "No data yet",
      amount: topCategory
        ? formatCurrency(topCategory.amount, currency)
        : "—",
      detail: topCategory
        ? `${topCategoryPercentage.toFixed(1)}% of categorized expenses`
        : "Your category insights will appear here",
      icon: ShoppingBag,
      className: "insight-category",
    },
    {
      label: "Total transactions",
      value: totalTransactions.toLocaleString("en-IN"),
      amount: "This month",
      detail: `${categories.length} ${categories.length === 1 ? "category" : "categories"
        } with expenses`,
      icon: Receipt,
      className: "insight-transactions",
    },
    {
      label: "Average transaction",
      value:
        totalTransactions > 0
          ? formatCurrency(averageTransaction, currency)
          : "—",
      amount: "Per transaction",
      detail:
        totalTransactions > 0
          ? "Based on categorized expenses"
          : "Not enough transaction data",
      icon: PiggyBank,
      className: "insight-average",
    },
  ];

  const observation = topCategory
    ? `${topCategory.name} is your highest spending category, accounting for ${topCategoryPercentage.toFixed(
      1
    )}% of your categorized expenses this month.`
    : "Add some expenses to start discovering your spending patterns.";

  return (
    <motion.section
      className="spending-insights"
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.4 }}
    >
      <div className="spending-insights-heading">
        <div>
          <span className="dashboard-eyebrow">SMART SUMMARY</span>
          <h4>Spending insights</h4>
        </div>

        <div className="spending-insights-icon">
          <Layers3 size={19} />
        </div>
      </div>

      <div className="spending-insights-grid">
        {insights.map((insight) => {
          const Icon = insight.icon;

          return (
            <article
              className={`spending-insight-card ${insight.className}`}
              key={insight.label}
            >
              <div className="spending-insight-icon">
                <Icon size={17} />
              </div>

              <span className="spending-insight-label">
                {insight.label}
              </span>

              <strong className="spending-insight-value">
                {insight.value}
              </strong>

              <span className="spending-insight-amount">
                {insight.amount}
              </span>

              <span className="spending-insight-detail">
                {insight.detail}
              </span>
            </article>
          );
        })}
      </div>

      <div className="spending-observation">
        <div className="spending-observation-icon">
          <Lightbulb size={19} />
        </div>

        <div>
          <strong>Monthly observation</strong>
          <p>{observation}</p>
        </div>
      </div>
    </motion.section>
  );
};

const Metric = ({
  icon: Icon,
  label,
  amount,
  count,
  type,
  description,
  currency,
}) => (
  <motion.article whileHover={{ y: -3 }}>
    <div className="metric-label">
      <Icon size={17} />
      {label}
    </div>

    <strong className={type || ""}>
      {formatCurrency(amount, currency)}
    </strong>

    <span>
      {count !== undefined && count !== null
        ? `${count} transactions`
        : description}
    </span>
  </motion.article>
);

const AnimatedAmount = ({ amount, currency }) => (
  <motion.span
    key={String(amount ?? 0)}
    initial={{ opacity: 0.4, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45 }}
  >
    {formatCurrency(amount, currency)}
  </motion.span>
);

export default DashboardPage;

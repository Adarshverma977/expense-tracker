import { useEffect, useState } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
} from "lucide-react";

import api from "../../services/api";
import MonthlyTrendsChart from "./MonthlyTrendsChart";
import CategoryBreakdownChart from "./CategoryBreakdownChart";

import "./DashboardPage.css";

const formatCurrency = (amount, currency = "INR") => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
};

const DashboardPage = () => {
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await api.get("/dashboard");

        setDashboard(response.data.data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
          "Unable to load dashboard data."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, [refreshKey]);

  if (isLoading) {
    return (
      <div className="dashboard-state">
        Loading your finances...
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-state dashboard-error">
        <p>{error}</p>

        <button onClick={() => setRefreshKey((prev) => prev + 1)}>
          Try again
        </button>
      </div>
    );
  }

  // Backend response uses "summary", not "overview".
  const summary = dashboard?.summary || {};
  const monthly = dashboard?.monthly || {};

  // Backend currently does not return a currency field.
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

  return (
    <div className="dashboard-page">
      {/* Welcome Section */}
      <section className="dashboard-welcome">
        <div>
          <span className="dashboard-eyebrow">
            YOUR FINANCIAL OVERVIEW
          </span>

          <h2>Welcome back!</h2>

          <p>Here is what's happening with your money.</p>
        </div>

        <div className="dashboard-date">
          <CalendarDays size={17} />

          {new Intl.DateTimeFormat("en-IN", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          }).format(new Date())}
        </div>
      </section>

      {/* Summary Cards */}
      <section className="dashboard-summary">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.title}
              className={`summary-card ${card.className}`}
            >
              <div className="summary-card-top">
                <span>{card.title}</span>

                <div className="summary-icon">
                  <Icon size={20} />
                </div>
              </div>

              <h3>
                {formatCurrency(card.amount, currency)}
              </h3>

              <p>{card.description}</p>
            </article>
          );
        })}
      </section>

      {/* Monthly Overview */}
      <section className="monthly-overview">
        <div className="section-heading">
          <div>
            <span className="dashboard-eyebrow">
              THIS MONTH
            </span>

            <h3>Monthly overview</h3>
          </div>

          <span className="monthly-badge">
            <CalendarDays size={14} />
            Current month
          </span>
        </div>

        <div className="monthly-metrics">
          <article>
            <div className="metric-label">
              <ArrowUpRight size={17} />
              Monthly Income
            </div>

            <strong className="income-text">
              {formatCurrency(monthly.income, currency)}
            </strong>

            <span>
              {monthly.incomeCount || 0} transactions
            </span>
          </article>

          <article>
            <div className="metric-label">
              <ArrowDownRight size={17} />
              Monthly Expenses
            </div>

            <strong className="expense-text">
              {formatCurrency(monthly.expenses, currency)}
            </strong>

            <span>
              {monthly.expenseCount || 0} transactions
            </span>
          </article>

          <article>
            <div className="metric-label">
              <Wallet size={17} />
              Monthly Balance
            </div>

            <strong>
              {formatCurrency(monthly.balance, currency)}
            </strong>

            <span>Income minus expenses</span>
          </article>
        </div>
      </section>

      {/* Financial Analytics */}
      <section className="dashboard-analytics">
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
      </section>
    </div>
  );
};

export default DashboardPage;
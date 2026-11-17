const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");

const env = require("./config/env");

const authRoutes = require("./routes/authRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const recurringTransactionRoutes = require("./routes/recurringTransactionRoutes");
const financialGoalRoutes = require("./routes/financialGoalRoutes");
const walletRoutes = require("./routes/walletRoutes");
const transferRoutes = require("./routes/transferRoutes");
const billRoutes = require("./routes/billRoutes");

const notFoundMiddleware = require("./middleware/notFoundMiddleware");
const errorMiddleware = require("./middleware/errorMiddleware");
const { apiLimiter } = require("./middleware/rateLimiter");

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

app.use(cookieParser());

if (env.NODE_ENV === "production") {
  app.use("/api", apiLimiter);
}

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Expense Tracker API is running",
    environment: env.NODE_ENV,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/recurring-transactions", recurringTransactionRoutes);
app.use("/api/financial-goals", financialGoalRoutes);
app.use("/api/wallets", walletRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/bills", billRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;

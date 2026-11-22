
import { Navigate, Route, Routes } from "react-router-dom";

import AppToast from "./components/ui/AppToast";

import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";

import AppLayout from "./layouts/AppLayout";

import LandingPage from "./features/landing/LandingPage";

import DashboardPage from "./features/dashboard/DashboardPage";
import TransactionPage from "./features/transactions/TransactionPage";
import CategoriesPage from "./features/categories/CategoriesPage";
import BudgetPage from "./features/budgets/BudgetPage";
import RecurringTransactionsPage from "./features/recurringTransactions/RecurringTransactionsPage";
import FinancialGoalsPage from "./features/financialGoals/FinancialGoalsPage";
import BillPage from "./features/bills/BillPage";

import LoginPage from "./features/auth/LoginPage";
import RegisterPage from "./features/auth/RegisterPage";
import ForgotPasswordPage from "./features/auth/ForgotPasswordPage";
import ResetPasswordPage from "./features/auth/ResetPasswordPage";

function App() {
  return (
    <>
      <AppToast />

      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/forgot-password"
            element={<ForgotPasswordPage />}
          />
          <Route
            path="/reset-password"
            element={<ResetPasswordPage />}
          />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />

            <Route
              path="/transactions"
              element={<TransactionPage />}
            />

            <Route
              path="/categories"
              element={<CategoriesPage />}
            />

            <Route path="/budgets" element={<BudgetPage />} />

            <Route
              path="/recurring-transactions"
              element={<RecurringTransactionsPage />}
            />

            <Route
              path="/financial-goals"
              element={<FinancialGoalsPage />}
            />

            <Route path="/bills" element={<BillPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;


import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";

import AppLayout from "./layouts/AppLayout";
import DashboardPage from "./features/dashboard/DashboardPage";
import TransactionPage from "./features/transactions/TransactionPage";
import CategoriesPage from "./features/categories/CategoriesPage";

import LoginPage from "./features/auth/LoginPage";
import RegisterPage from "./features/auth/RegisterPage";
import ForgotPasswordPage from "./features/auth/ForgotPasswordPage";
import ResetPasswordPage from "./features/auth/ResetPasswordPage";

function App() {
  return (
    <Routes>
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
        </Route>
      </Route>

      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      <Route
        path="*"
        element={<div>404 - Page Not Found</div>}
      />
    </Routes>
  );
}

export default App;

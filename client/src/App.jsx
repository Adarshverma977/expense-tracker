
import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
import DashboardPage from "./features/dashboard/DashboardPage";
import LoginPage from "./features/auth/LoginPage";
import RegisterPage from "./features/auth/RegisterPage";
import AppLayout from "./layouts/AppLayout";

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />

          <Route
            path="/transactions"
            element={<div>Transactions - Coming Soon</div>}
          />

          <Route
            path="/categories"
            element={<div>Categories - Coming Soon</div>}
          />
        </Route>
      </Route>

      {/* Default Route */}
      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      {/* Not Found */}
      <Route
        path="*"
        element={<div>404 - Page Not Found</div>}
      />
    </Routes>
  );
}

export default App;

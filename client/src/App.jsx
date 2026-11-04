import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicRoute />}>
        <Route
          path="/login"
          element={<div>Login Page - Coming Soon</div>}
        />

        <Route
          path="/register"
          element={<div>Register Page - Coming Soon</div>}
        />
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route
          path="/dashboard"
          element={<div>Dashboard - Coming Soon</div>}
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

      {/* Default Route */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Not Found */}
      <Route
        path="*"
        element={<div>404 - Page Not Found</div>}
      />
    </Routes>
  );
}

export default App;
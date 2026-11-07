import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Wait until authentication check completes
  if (isLoading) {
    return (
      <div className="auth-loading">
        <p>Checking authentication...</p>
      </div>
    );
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/"
        replace
        state={{ from: location }}
      />
    );
  }

  // Render protected child routes
  return <Outlet />;
};

export default ProtectedRoute;
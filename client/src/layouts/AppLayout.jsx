
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  LayoutDashboard,
  ReceiptText,
  Tags,
  Wallet,
  LogOut,
} from "lucide-react";

import { useAuth } from "../features/auth/AuthContext";

import ThemeToggle from "../components/common/ThemeToggle";
import "./AppLayout.css";

const navigationItems = [
  {
    label: "Overview",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Transactions",
    path: "/transactions",
    icon: ReceiptText,
  },
  {
    label: "Categories",
    path: "/categories",
    icon: Tags,
  },
  {
    label: "Budgets",
    path: "/budgets",
    icon: Wallet,
  },
];

const AppLayout = () => {
  const { user, logout } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const currentPage = navigationItems.find(
    (item) => item.path === location.pathname
  );

  const pageTitle = currentPage?.label || "Your finances";

  const userName = user?.name || "My Account";
  const userEmail = user?.email || "Personal workspace";

  const userInitial =
    userName.trim().charAt(0).toUpperCase() || "U";

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const renderNavigation = (className) => (
    <nav className={className}>
      {navigationItems.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.path}
            to={item.path}
            end
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? "active" : ""}`
            }
          >
            <Icon size={19} strokeWidth={1.9} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">
            <Wallet size={23} strokeWidth={2.2} />
          </div>

          <div className="brand-content">
            <h2>Moneta</h2>
            <span>PERSONAL FINANCE</span>
          </div>
        </div>

        <div className="sidebar-section">
          <span className="sidebar-section-label">
            WORKSPACE
          </span>

          {renderNavigation("sidebar-navigation")}
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <div className="help-icon">✦</div>

            <div>
              <strong>Manage smarter</strong>
              <p>Build better money habits.</p>
            </div>
          </div>

          <div className="sidebar-version">
            <span>MONETA FINANCE</span>
            <span>Version 1.0</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="app-main">
        <header className="app-header">
          <div className="header-heading">
            <span className="header-eyebrow">
              PERSONAL FINANCE
            </span>

            <h1>{pageTitle}</h1>
          </div>

          <div className="header-actions">
            <ThemeToggle />

            {/* User Profile */}
            <div className="header-profile">
              <div className="profile-avatar">
                {userInitial}
              </div>

              <div className="profile-info">
                <strong>{userName}</strong>
                <span>{userEmail}</span>
              </div>
            </div>

            {/* Logout */}
            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
              aria-label="Logout"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <section className="app-content">
          <Outlet />
        </section>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="mobile-navigation">
        {renderNavigation("mobile-navigation-items")}
      </div>
    </div>
  );
};

export default AppLayout;

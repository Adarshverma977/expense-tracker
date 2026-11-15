
import { useEffect, useState } from "react";
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
  Repeat,
  LogOut,
  Target,
  Menu,
  X,
  ChevronDown,
  UserRound,
  Settings,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import { AnimatePresence, motion } from "framer-motion";

import { useAuth } from "../features/auth/AuthContext";
import { useTheme } from "../app/ThemeContext";

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
    label: "Recurring Transactions",
    path: "/recurring-transactions",
    icon: Repeat,
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
  {
    label: "Financial Goals",
    path: "/financial-goals",
    icon: Target,
  },
];

const pageVariants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -6,
  },
};

const AppLayout = () => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();

  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const currentPage = navigationItems.find(
    (item) => item.path === location.pathname
  );

  const pageTitle = currentPage?.label || "Your finances";

  const userName = user?.name || "My Account";
  const userEmail = user?.email || "Personal workspace";

  const userInitial =
    userName.trim().charAt(0).toUpperCase() || "U";

  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        setProfileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
      setLoggingOut(false);
    }
  };

  const renderNavigation = (className) => (
    <nav className={className} aria-label="Main navigation">
      {navigationItems.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.path}
            to={item.path}
            end
            title={sidebarCollapsed ? item.label : undefined}
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? "active" : ""}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={19} strokeWidth={1.8} />

                <span>{item.label}</span>

                {isActive && (
                  <motion.div
                    className="nav-active-indicator"
                    layoutId="navigation-indicator"
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 30,
                    }}
                  />
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div
      className={`app-layout ${sidebarCollapsed ? "sidebar-collapsed" : ""
        }`}
      data-theme={theme}
    >
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="mobile-sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={`app-sidebar ${mobileMenuOpen ? "mobile-sidebar-open" : ""
          }`}
        initial={false}
        animate={{
          width: sidebarCollapsed ? 88 : 260,
        }}
        transition={{
          duration: 0.25,
          ease: "easeInOut",
        }}
      >
        <div className="sidebar-brand">
          <div className="brand-icon">
            <Wallet size={23} strokeWidth={2.1} />
          </div>

          {!sidebarCollapsed && (
            <div className="brand-content">
              <h2>Moneta</h2>
              <span>PERSONAL FINANCE</span>
            </div>
          )}

          <button
            type="button"
            className="sidebar-mobile-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-section">
          {!sidebarCollapsed && (
            <span className="sidebar-section-label">
              WORKSPACE
            </span>
          )}

          {renderNavigation("sidebar-navigation")}
        </div>

        <div className="sidebar-bottom">
          {!sidebarCollapsed && (
            <div className="sidebar-help">
              <div className="help-icon">
                <Sparkles size={19} />
              </div>

              <div className="help-content">
                <strong>Manage smarter</strong>
                <p>Build better money habits.</p>
              </div>
            </div>
          )}

          <button
            type="button"
            className="sidebar-collapse-button"
            onClick={() => setSidebarCollapsed((current) => !current)}
            aria-label={
              sidebarCollapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}

            {!sidebarCollapsed && <span>Collapse sidebar</span>}
          </button>

          {!sidebarCollapsed && (
            <div className="sidebar-version">
              <span>MONETA FINANCE</span>
              <span>Version 1.0</span>
            </div>
          )}
        </div>
      </motion.aside>

      <main className="app-main">
        <header className="app-header">
          <div className="header-left">
            <button
              type="button"
              className="mobile-menu-button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={22} />
            </button>

            <div className="header-heading">
              <span className="header-eyebrow">
                PERSONAL FINANCE
              </span>

              <h1>{pageTitle}</h1>
            </div>
          </div>

          <div className="header-actions">
            <ThemeToggle />

            <div className="header-profile-wrapper">
              <button
                type="button"
                className={`header-profile ${profileMenuOpen ? "profile-open" : ""
                  }`}
                onClick={() =>
                  setProfileMenuOpen((current) => !current)
                }
                aria-expanded={profileMenuOpen}
                aria-haspopup="true"
              >
                <div className="profile-avatar">
                  {userInitial}
                </div>

                <div className="profile-info">
                  <strong>{userName}</strong>
                  <span>{userEmail}</span>
                </div>

                <ChevronDown
                  size={16}
                  className="profile-chevron"
                />
              </button>

              <AnimatePresence>
                {profileMenuOpen && (
                  <motion.div
                    className="profile-dropdown"
                    initial={{
                      opacity: 0,
                      y: 8,
                      scale: 0.97,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                    }}
                    exit={{
                      opacity: 0,
                      y: 8,
                      scale: 0.97,
                    }}
                    transition={{ duration: 0.18 }}
                    role="menu"
                  >
                    <div className="profile-dropdown-header">
                      <div className="profile-avatar">
                        {userInitial}
                      </div>

                      <div>
                        <strong>{userName}</strong>
                        <span>{userEmail}</span>
                      </div>
                    </div>

                    <div className="profile-dropdown-divider" />

                    <button
                      type="button"
                      className="profile-dropdown-item"
                      role="menuitem"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <UserRound size={17} />
                      <span>My account</span>
                    </button>

                    <button
                      type="button"
                      className="profile-dropdown-item"
                      role="menuitem"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <Settings size={17} />
                      <span>Preferences</span>
                    </button>

                    <div className="profile-dropdown-divider" />

                    <button
                      type="button"
                      className="profile-dropdown-item logout-menu-item"
                      role="menuitem"
                      onClick={handleLogout}
                      disabled={loggingOut}
                    >
                      <LogOut size={17} />
                      <span>
                        {loggingOut ? "Signing out..." : "Sign out"}
                      </span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
              disabled={loggingOut}
              aria-label="Logout"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <section className="app-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              className="page-transition-wrapper"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{
                duration: 0.22,
                ease: "easeOut",
              }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </section>
      </main>

      <div className="mobile-navigation">
        {renderNavigation("mobile-navigation-items")}
      </div>
    </div>
  );
};

export default AppLayout;

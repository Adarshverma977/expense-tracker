
import { NavLink, Outlet } from "react-router-dom";
import "./ProfileSettingsLayout.css";

const settingsLinks = [
  {
    label: "Profile",
    description: "Personal information",
    path: "/settings/profile",
    icon: "👤",
  },
  {
    label: "Preferences",
    description: "Appearance and language",
    path: "/settings/preferences",
    icon: "⚙️",
  },
  {
    label: "Security",
    description: "Password and email",
    path: "/settings/security",
    icon: "🔒",
  },
  {
    label: "Delete Account",
    description: "Permanently remove account",
    path: "/settings/delete-account",
    icon: "⚠️",
    danger: true,
  },
];

const ProfileSettingsLayout = () => {
  return (
    <main className="settings-layout">
      <header className="settings-layout-header">
        <div>
          <span className="settings-layout-eyebrow">ACCOUNT</span>
          <h1>Settings</h1>
          <p>Manage your profile, preferences and security.</p>
        </div>
      </header>

      <div className="settings-layout-content">
        <aside className="settings-sidebar">
          <div className="settings-sidebar-heading">
            <h2>Account Settings</h2>
            <p>Manage your account</p>
          </div>

          <nav className="settings-navigation">
            {settingsLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `settings-nav-link ${isActive ? "active" : ""
                  } ${link.danger ? "danger" : ""}`
                }
              >
                <span className="settings-nav-icon">{link.icon}</span>

                <span className="settings-nav-text">
                  <strong>{link.label}</strong>
                  <small>{link.description}</small>
                </span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <section className="settings-outlet">
          <Outlet />
        </section>
      </div>
    </main>
  );
};

export default ProfileSettingsLayout;

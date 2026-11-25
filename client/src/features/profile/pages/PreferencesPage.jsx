
import { useEffect, useState } from "react";
import {
  getProfile,
  updatePreferences,
} from "../services/profileService";
import { useTheme } from "../../../app/ThemeContext";
import "./PreferencesPage.css";

const defaultPreferences = {
  theme: "system",
  dateFormat: "DD/MM/YYYY",
  language: "en",
};

const getResponseData = (response) => {
  let data = response?.data ?? response;

  if (data?.data) data = data.data;
  if (data?.user) data = data.user;
  if (data?.profile) data = data.profile;

  return data;
};

const PreferencesPage = () => {
  const { setTheme } = useTheme();

  const [preferences, setPreferences] = useState(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getProfile();
        const user = getResponseData(response);

        const savedPreferences = {
          ...defaultPreferences,
          ...(user.preferences || {}),
        };

        setPreferences(savedPreferences);
        setTheme(savedPreferences.theme);
      } catch (err) {
        setError(
          err.response?.data?.message ||
          "Unable to load your preferences."
        );
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [setTheme]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setPreferences((prev) => ({
      ...prev,
      [name]: value,
    }));

    setSuccess("");
    setError("");
  };

  const handleSave = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await updatePreferences(preferences);

      setTheme(preferences.theme);

      setSuccess("Your preferences have been updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to update your preferences."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="preferences-state">
        <div className="preferences-loader" />
        <p>Loading preferences...</p>
      </div>
    );
  }

  return (
    <main className="preferences-page">
      <header className="preferences-header">
        <div>
          <span className="preferences-eyebrow">
            PERSONALIZATION
          </span>
          <h1>Preferences</h1>
          <p>Customize your Expense Tracker experience.</p>
        </div>
      </header>

      <form className="preferences-card" onSubmit={handleSave}>
        <div className="preferences-card-heading">
          <div>
            <h2>Application Preferences</h2>
            <p>Choose how the application looks and behaves.</p>
          </div>
        </div>

        {error && (
          <div className="preferences-alert error">{error}</div>
        )}

        {success && (
          <div className="preferences-alert success">{success}</div>
        )}

        <div className="preference-item">
          <div className="preference-info">
            <h3>Appearance</h3>
            <p>Select your preferred application theme.</p>
          </div>

          <select
            name="theme"
            value={preferences.theme}
            onChange={handleChange}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System Default</option>
          </select>
        </div>

        <div className="preference-divider" />

        <div className="preference-item">
          <div className="preference-info">
            <h3>Date Format</h3>
            <p>Choose how dates appear throughout the application.</p>
          </div>

          <select
            name="dateFormat"
            value={preferences.dateFormat}
            onChange={handleChange}
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>

        <div className="preference-divider" />

        <div className="preference-item">
          <div className="preference-info">
            <h3>Language</h3>
            <p>Select your preferred application language.</p>
          </div>

          <select
            name="language"
            value={preferences.language}
            onChange={handleChange}
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
          </select>
        </div>

        <div className="preferences-footer">
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </form>
    </main>
  );
};

export default PreferencesPage;

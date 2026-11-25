
import { useEffect, useState } from "react";
import {
  getProfile,
  updateProfile,
} from "../services/profileService";
import "./ProfilePage.css";

const getProfileData = (response) => {
  let data = response?.data ?? response;

  if (data?.data) data = data.data;
  if (data?.user) data = data.user;
  if (data?.profile) data = data.profile;

  return data;
};

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    avatar: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getProfile();
        const user = getProfileData(response);

        setProfile(user);
        setFormData({
          name: user.name || "",
          avatar: user.avatar || "",
        });
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load profile."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await updateProfile({
        name: formData.name.trim(),
        avatar: formData.avatar.trim(),
      });

      const updatedUser = getProfileData(response);

      setProfile((prev) => ({
        ...prev,
        ...updatedUser,
        name: updatedUser.name ?? formData.name.trim(),
        avatar: updatedUser.avatar ?? formData.avatar.trim(),
      }));

      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-state">
        <div className="profile-loader" />
        <p>Loading your profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-state profile-error">
        <p>{error || "Profile could not be loaded."}</p>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  const initials = profile.name
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  return (
    <main className="profile-page">
      <header className="profile-page-header">
        <div>
          <span className="profile-eyebrow">ACCOUNT</span>
          <h1>My Profile</h1>
          <p>Manage your personal information and account details.</p>
        </div>
      </header>

      <section className="profile-content">
        <div className="profile-card profile-overview">
          <div className="profile-avatar">
            {formData.avatar ? (
              <img
                src={formData.avatar}
                alt="Profile avatar"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <span>{initials || "U"}</span>
            )}
          </div>

          <div className="profile-overview-info">
            <h2>{profile.name || "User"}</h2>
            <p>{profile.email}</p>
            <span
              className={`profile-status ${profile.emailVerified
                  ? "is-verified"
                  : "is-unverified"
                }`}
            >
              {profile.emailVerified
                ? "Email verified"
                : "Email not verified"}
            </span>
          </div>
        </div>

        <form className="profile-card profile-form" onSubmit={handleSubmit}>
          <div className="profile-section-heading">
            <div>
              <h2>Personal Information</h2>
              <p>Update your personal details below.</p>
            </div>
          </div>

          {error && <div className="profile-alert error">{error}</div>}
          {success && (
            <div className="profile-alert success">{success}</div>
          )}

          <div className="profile-form-grid">
            <div className="profile-field">
              <label htmlFor="profile-name">Full Name</label>
              <input
                id="profile-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                minLength={2}
                maxLength={60}
                required
              />
            </div>

            <div className="profile-field">
              <label htmlFor="profile-email">Email Address</label>
              <input
                id="profile-email"
                type="email"
                value={profile.email || ""}
                disabled
              />
              <small>Change your email from Security Settings.</small>
            </div>

            <div className="profile-field profile-field-full">
              <label htmlFor="profile-avatar">Avatar URL</label>
              <input
                id="profile-avatar"
                type="url"
                name="avatar"
                value={formData.avatar}
                onChange={handleChange}
                placeholder="https://example.com/avatar.png"
              />
              <small>Provide a publicly accessible image URL.</small>
            </div>

            <div className="profile-field">
              <label htmlFor="profile-currency">Default Currency</label>
              <input
                id="profile-currency"
                type="text"
                value={profile.currency || "INR"}
                disabled
              />
              <small>Currency settings can be managed separately.</small>
            </div>
          </div>

          <div className="profile-form-footer">
            <button
              type="submit"
              className="profile-save-button"
              disabled={saving}
            >
              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
};

export default ProfilePage;

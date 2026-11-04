
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
} from "lucide-react";

import { useAuth } from "../AuthContext";
import { loginUser } from "../authService";

const LoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { refreshUser } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFieldErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setError("");
  };

  const validateForm = () => {
    const errors = {};
    const email = formData.email.trim();

    if (!email) {
      errors.email = "Email address is required.";
    } else if (
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      errors.email = "Please enter a valid email address.";
    }

    if (!formData.password) {
      errors.password = "Password is required.";
    } else if (formData.password.length > 72) {
      errors.password = "Password cannot exceed 72 characters.";
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      await loginUser({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      const authenticatedUser = await refreshUser();

      if (!authenticatedUser) {
        throw new Error("Unable to verify your login session. Please try again.");
      }

      const redirectPath =
        location.state?.from?.pathname || "/dashboard";

      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Login failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-form-heading">
        <h2>Welcome back</h2>
        <p>Enter your details to access your account.</p>
      </div>

      {error && (
        <div className="auth-alert auth-alert-error" role="alert">
          {error}
        </div>
      )}

      <div className="auth-field">
        <label htmlFor="login-email">Email address</label>

        <div className={`auth-input-wrapper ${fieldErrors.email ? "has-error" : ""}`}>
          <Mail size={18} aria-hidden="true" />

          <input
            id="login-email"
            type="email"
            name="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            maxLength={254}
            disabled={isSubmitting}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
          />
        </div>

        {fieldErrors.email && (
          <span className="auth-field-error" id="login-email-error">
            {fieldErrors.email}
          </span>
        )}
      </div>

      <div className="auth-field">
        <div className="auth-label-row">
          <label htmlFor="login-password">Password</label>
        </div>

        <div className={`auth-input-wrapper ${fieldErrors.password ? "has-error" : ""}`}>
          <LockKeyhole size={18} aria-hidden="true" />

          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            autoComplete="current-password"
            maxLength={72}
            disabled={isSubmitting}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
          />

          <button
            type="button"
            className="password-visibility-button"
            onClick={() => setShowPassword((previous) => !previous)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            disabled={isSubmitting}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {fieldErrors.password && (
          <span className="auth-field-error" id="login-password-error">
            {fieldErrors.password}
          </span>
        )}
      </div>

      <button
        type="submit"
        className="auth-submit-button"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <LoaderCircle size={18} className="auth-spinner" />
            Signing in...
          </>
        ) : (
          <>
            Sign in
            <ArrowRight size={18} />
          </>
        )}
      </button>
    </form>
  );
};

export default LoginForm;

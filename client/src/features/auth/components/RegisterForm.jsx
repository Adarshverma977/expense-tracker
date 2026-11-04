
import { useState } from "react";
import {
  UserRound, Mail, LockKeyhole, Eye, EyeOff, LoaderCircle, ArrowRight,
} from "lucide-react";
import { sendRegistrationOTP } from "../authService";

const RegisterForm = ({ onOtpSent }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    currency: "INR",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = ({ target: { name, value } }) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    setError("");
  };

  const validateForm = () => {
    const errors = {};
    const name = formData.name.trim();
    const email = formData.email.trim();

    if (name.length < 2 || name.length > 50) {
      errors.name = "Name must contain 2–50 characters.";
    }

    if (
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      errors.email = "Please enter a valid email address.";
    }

    if (formData.password.length < 8 || formData.password.length > 72) {
      errors.password = "Password must contain 8–72 characters.";
    }

    if (formData.confirmPassword !== formData.password) {
      errors.confirmPassword = "Passwords do not match.";
    }

    if (!/^[A-Za-z]{3}$/.test(formData.currency)) {
      errors.currency = "Select a valid currency.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!validateForm()) return;

    const registrationData = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      currency: formData.currency.toUpperCase(),
    };

    try {
      setIsSubmitting(true);

      const response = await sendRegistrationOTP(registrationData);

      onOtpSent({
        registrationData,
        message: response.message || "Verification code sent successfully.",
      });
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to send verification code."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-form-heading">
        <h2>Create your account</h2>
        <p>Start managing your money with more clarity.</p>
      </div>

      {error && <div className="auth-alert auth-alert-error" role="alert">{error}</div>}

      <div className="auth-field">
        <label htmlFor="register-name">Full name</label>
        <div className={`auth-input-wrapper ${fieldErrors.name ? "has-error" : ""}`}>
          <UserRound size={18} />
          <input
            id="register-name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            autoComplete="name"
            maxLength={50}
            disabled={isSubmitting}
          />
        </div>
        {fieldErrors.name && <span className="auth-field-error">{fieldErrors.name}</span>}
      </div>

      <div className="auth-field">
        <label htmlFor="register-email">Email address</label>
        <div className={`auth-input-wrapper ${fieldErrors.email ? "has-error" : ""}`}>
          <Mail size={18} />
          <input
            id="register-email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            autoComplete="email"
            maxLength={254}
            disabled={isSubmitting}
          />
        </div>
        {fieldErrors.email && <span className="auth-field-error">{fieldErrors.email}</span>}
      </div>

      <div className="auth-field">
        <label htmlFor="register-password">Password</label>
        <div className={`auth-input-wrapper ${fieldErrors.password ? "has-error" : ""}`}>
          <LockKeyhole size={18} />
          <input
            id="register-password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            placeholder="Create a strong password"
            autoComplete="new-password"
            maxLength={72}
            disabled={isSubmitting}
          />
          <button
            type="button"
            className="password-visibility-button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label="Toggle password visibility"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {fieldErrors.password && <span className="auth-field-error">{fieldErrors.password}</span>}
      </div>

      <div className="auth-field">
        <label htmlFor="register-confirm-password">Confirm password</label>
        <div className={`auth-input-wrapper ${fieldErrors.confirmPassword ? "has-error" : ""}`}>
          <LockKeyhole size={18} />
          <input
            id="register-confirm-password"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            maxLength={72}
            disabled={isSubmitting}
          />
          <button
            type="button"
            className="password-visibility-button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            aria-label="Toggle confirm password visibility"
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {fieldErrors.confirmPassword && (
          <span className="auth-field-error">{fieldErrors.confirmPassword}</span>
        )}
      </div>

      <div className="auth-field">
        <label htmlFor="register-currency">Preferred currency</label>
        <select
          id="register-currency"
          name="currency"
          className="auth-select"
          value={formData.currency}
          onChange={handleChange}
          disabled={isSubmitting}
        >
          <option value="INR">INR - Indian Rupee (₹)</option>
          <option value="USD">USD - US Dollar ($)</option>
          <option value="EUR">EUR - Euro (€)</option>
          <option value="GBP">GBP - British Pound (£)</option>
        </select>
        {fieldErrors.currency && <span className="auth-field-error">{fieldErrors.currency}</span>}
      </div>

      <button type="submit" className="auth-submit-button" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <LoaderCircle size={18} className="auth-spinner" />
            Sending verification code...
          </>
        ) : (
          <>Create account <ArrowRight size={18} /></>
        )}
      </button>
    </form>
  );
};

export default RegisterForm;

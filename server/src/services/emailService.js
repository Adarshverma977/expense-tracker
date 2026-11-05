const emailTransporter = require("../config/email");
const env = require("../config/env");

const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: env.EMAIL_FROM,
    to: email,
    subject: "Verify Your Expense Tracker Account",

    text: `Your Expense Tracker verification OTP is ${otp}. It expires in 5 minutes. Do not share this OTP with anyone.`,

    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 24px; color: #222;">
        <h2>Verify Your Email</h2>
        <p>Welcome to Expense Tracker!</p>
        <p>Use the following OTP to verify your email address:</p>

        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px; background: #f2f5f2; text-align: center; border-radius: 8px;">
          ${otp}
        </div>

        <p>This OTP expires in <strong>5 minutes</strong>.</p>
        <p>Never share this OTP with anyone.</p>
        <p>Regards,<br />Expense Tracker Team</p>
      </div>
    `,
  };

  await emailTransporter.sendMail(mailOptions);
};

// Password Reset Email
const sendPasswordResetEmail = async (email, resetUrl) => {
  const mailOptions = {
    from: env.EMAIL_FROM,
    to: email,
    subject: "Reset Your Expense Tracker Password",

    text: `We received a request to reset your password. Open this link to reset it: ${resetUrl}. This link expires in 15 minutes. If you did not request this, ignore this email.`,

    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; padding: 28px; color: #222; border: 1px solid #e8e8e8; border-radius: 12px;">
        <h2 style="margin-bottom: 12px;">Reset Your Password</h2>

        <p>We received a request to reset your Expense Tracker account password.</p>

        <p>Click the button below to choose a new password:</p>

        <div style="text-align: center; margin: 28px 0;">
          <a
            href="${resetUrl}"
            style="display: inline-block; padding: 14px 24px; background: #176b4d; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold;"
          >
            Reset Password
          </a>
        </div>

        <p>This link expires in <strong>15 minutes</strong> and can only be used once.</p>

        <p>If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>

        <p style="margin-top: 28px;">Regards,<br />Expense Tracker Team</p>
      </div>
    `,
  };

  await emailTransporter.sendMail(mailOptions);
};

module.exports = {
  sendOTPEmail,
  sendPasswordResetEmail,
};

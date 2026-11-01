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

module.exports = {
  sendOTPEmail,
};

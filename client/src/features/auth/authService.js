import api from "../../services/api";

// Send registration OTP
export const sendRegistrationOTP = async (userData) => {
  const response = await api.post("/auth/register/send-otp", userData);
  return response.data;
};

// Verify registration OTP
export const verifyRegistrationOTP = async (userData) => {
  const response = await api.post("/auth/register/verify-otp", userData);
  return response.data;
};

// Login user
export const loginUser = async (credentials) => {
  const response = await api.post("/auth/login", credentials);
  return response.data;
};

// Logout user
export const logoutUser = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};

// Get currently authenticated user
export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

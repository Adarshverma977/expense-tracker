import api from "../../services/api";

export const sendRegistrationOTP = async (userData) => {
  const response = await api.post("/auth/register/send-otp", userData);
  return response.data;
};

export const verifyRegistrationOTP = async (userData) => {
  const response = await api.post("/auth/register/verify-otp", userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await api.post("/auth/login", credentials);
  return response.data;
};

export const logoutUser = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

// Forgot Password
export const forgotPassword = async (email) => {
  const response = await api.post("/auth/forgot-password", {
    email: email.trim().toLowerCase(),
  });

  return response.data;
};

// Reset Password
export const resetPassword = async (token, password) => {
  const response = await api.post("/auth/reset-password", {
    token,
    password,
  });

  return response.data;
};

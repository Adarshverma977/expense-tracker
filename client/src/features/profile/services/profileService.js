import api from "../../../services/api";

export const getProfile = async () => {
  const response = await api.get("/users/profile");
  return response;
};

export const updateProfile = async (data) => {
  const response = await api.patch("/users/profile", data);
  return response;
};

export const updatePreferences = async (data) => {
  const response = await api.patch("/users/preferences", data);
  return response;
};

export const changePassword = async (data) => {
  const response = await api.patch("/users/change-password", data);
  return response;
};

export const changeEmail = async (data) => {
  const response = await api.patch("/users/change-email", data);
  return response;
};

export const verifyEmailChange = async (token) => {
  const response = await api.post("/users/verify-email-change", {
    token,
  });
  return response;
};

export const deleteAccount = async (password) => {
  const response = await api.delete("/users/account", {
    data: { password },
  });
  return response;
};

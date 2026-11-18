import api from "./api";

export const getWallets = async (params = {}) => {
  const response = await api.get("/wallets", { params });
  return response.data;
};

export const getWalletById = async (id) => {
  const response = await api.get(`/wallets/${id}`);
  return response.data;
};

export const getWalletSummary = async () => {
  const response = await api.get("/wallets/summary");
  return response.data;
};

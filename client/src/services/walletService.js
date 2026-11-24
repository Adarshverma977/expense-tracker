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

export const createWallet = async (payload) => {
  const response = await api.post("/wallets", payload);
  return response.data;
};

export const updateWallet = async (id, payload) => {
  const response = await api.patch(`/wallets/${id}`, payload);
  return response.data;
};

export const archiveWallet = async (id) => {
  const response = await api.patch(`/wallets/${id}/archive`);
  return response.data;
};

export const restoreWallet = async (id) => {
  const response = await api.patch(`/wallets/${id}/restore`);
  return response.data;
};
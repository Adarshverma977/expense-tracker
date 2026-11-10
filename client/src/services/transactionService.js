import api from "./api";

export const getTransactions = async (params = {}) => {
  const response = await api.get("/transactions", { params });
  return response.data;
};

export const getTransactionById = async (id) => {
  const response = await api.get(`/transactions/${id}`);
  return response.data;
};

export const createTransaction = async (transactionData) => {
  const response = await api.post("/transactions", transactionData);
  return response.data;
};

export const updateTransaction = async (id, transactionData) => {
  const response = await api.patch(`/transactions/${id}`, transactionData);
  return response.data;
};

export const deleteTransaction = async (id) => {
  const response = await api.delete(`/transactions/${id}`);
  return response.data;
};

// Import transactions from CSV
export const importTransactions = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/transactions/import", formData);

  return response.data;
};

// Export transactions as CSV
export const exportTransactions = async (params = {}) => {
  const response = await api.get("/transactions/export", {
    params,
    responseType: "blob",
  });

  return response;
};

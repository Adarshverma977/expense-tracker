import api from "../../services/api";

export const getRecurringTransactions = async (params = {}) => {
  const response = await api.get("/recurring-transactions", { params });
  return response.data;
};

export const getRecurringTransactionById = async (id) => {
  const response = await api.get(`/recurring-transactions/${id}`);
  return response.data;
};

export const createRecurringTransaction = async (recurringData) => {
  const response = await api.post("/recurring-transactions", recurringData);
  return response.data;
};

export const updateRecurringTransaction = async (id, recurringData) => {
  const response = await api.patch(
    `/recurring-transactions/${id}`,
    recurringData,
  );

  return response.data;
};

export const pauseRecurringTransaction = async (id) => {
  const response = await api.patch(`/recurring-transactions/${id}/pause`);

  return response.data;
};

export const resumeRecurringTransaction = async (id) => {
  const response = await api.patch(`/recurring-transactions/${id}/resume`);

  return response.data;
};

export const cancelRecurringTransaction = async (id) => {
  const response = await api.delete(`/recurring-transactions/${id}`);
  return response.data;
};

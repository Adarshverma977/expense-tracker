import api from "../../services/api";

export const getBills = async (params = {}) => {
  const response = await api.get("/bills", { params });
  return response.data;
};

export const getBillById = async (id) => {
  const response = await api.get(`/bills/${id}`);
  return response.data;
};

export const createBill = async (billData) => {
  const response = await api.post("/bills", billData);
  return response.data;
};

export const updateBill = async (id, billData) => {
  const response = await api.patch(`/bills/${id}`, billData);
  return response.data;
};

export const archiveBill = async (id) => {
  const response = await api.patch(`/bills/${id}/archive`);
  return response.data;
};

export const createBillPayment = async (paymentData) => {
  const response = await api.post("/bill-payments", paymentData);
  return response.data;
};

export const getBillPayments = async (params = {}) => {
  const response = await api.get("/bill-payments", { params });
  return response.data;
};

export const getBillPaymentById = async (id) => {
  const response = await api.get(`/bill-payments/${id}`);
  return response.data;
};

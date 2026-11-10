import api from "../../services/api";

export const getFinancialGoals = async (params = {}) => {
  const response = await api.get("/financial-goals", { params });
  return response.data;
};

export const getFinancialGoalById = async (id) => {
  const response = await api.get(`/financial-goals/${id}`);
  return response.data;
};

export const createFinancialGoal = async (goalData) => {
  const response = await api.post("/financial-goals", goalData);
  return response.data;
};

export const updateFinancialGoal = async (id, goalData) => {
  const response = await api.patch(`/financial-goals/${id}`, goalData);
  return response.data;
};

export const archiveFinancialGoal = async (id) => {
  const response = await api.delete(`/financial-goals/${id}`);
  return response.data;
};

export const createGoalContribution = async (id, contributionData) => {
  const response = await api.post(
    `/financial-goals/${id}/contributions`,
    contributionData,
  );
  return response.data;
};

export const getGoalContributions = async (id, params = {}) => {
  const response = await api.get(`/financial-goals/${id}/contributions`, {
    params,
  });
  return response.data;
};

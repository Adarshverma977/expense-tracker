import api from "../../services/api";

const getGoalUrl = (id) => {
  if (!id) {
    throw new Error("Financial goal ID is required.");
  }

  return `/financial-goals/${encodeURIComponent(id)}`;
};

export const getFinancialGoals = async (params = {}) => {
  const response = await api.get("/financial-goals", { params });

  return response.data;
};

export const getFinancialGoalById = async (id) => {
  const response = await api.get(getGoalUrl(id));

  return response.data;
};

export const createFinancialGoal = async (goalData) => {
  const response = await api.post("/financial-goals", goalData);

  return response.data;
};

export const updateFinancialGoal = async (id, goalData) => {
  const response = await api.patch(getGoalUrl(id), goalData);

  return response.data;
};

export const archiveFinancialGoal = async (id) => {
  const response = await api.delete(getGoalUrl(id));

  return response.data;
};

export const restoreFinancialGoal = async (id) => {
  const response = await api.patch(`${getGoalUrl(id)}/restore`);

  return response.data;
};

export const permanentlyDeleteFinancialGoal = async (id) => {
  const response = await api.delete(`${getGoalUrl(id)}/permanent`);

  return response.data;
};

export const createGoalContribution = async (id, contributionData) => {
  const response = await api.post(
    `${getGoalUrl(id)}/contributions`,
    contributionData,
  );

  return response.data;
};

export const getGoalContributions = async (id, params = {}) => {
  const response = await api.get(`${getGoalUrl(id)}/contributions`, {
    params,
  });

  return response.data;
};

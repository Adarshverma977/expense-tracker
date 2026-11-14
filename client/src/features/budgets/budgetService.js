import api from "../../services/api";

const validateBudgetId = (id) => {
  if (typeof id !== "string" || !id.trim()) {
    throw new Error("A valid budget ID is required.");
  }

  return encodeURIComponent(id.trim());
};

export const getBudgets = async (month, year) => {
  const response = await api.get("/budgets", {
    params: { month, year },
  });

  return response.data;
};

export const getBudgetById = async (id) => {
  const budgetId = validateBudgetId(id);
  const response = await api.get(`/budgets/${budgetId}`);

  return response.data;
};

export const createBudget = async (budgetData) => {
  const response = await api.post("/budgets", budgetData);

  return response.data;
};

export const updateBudget = async (id, budgetData) => {
  const budgetId = validateBudgetId(id);
  const response = await api.patch(`/budgets/${budgetId}`, budgetData);

  return response.data;
};

export const deleteBudget = async (id) => {
  const budgetId = validateBudgetId(id);
  const response = await api.delete(`/budgets/${budgetId}`);

  return response.data;
};

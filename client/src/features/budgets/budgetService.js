import api from "../../services/api";

export const getBudgets = async (month, year) => {
  const response = await api.get("/budgets", {
    params: { month, year },
  });

  return response.data;
};

export const getBudgetById = async (id) => {
  const response = await api.get(`/budgets/${id}`);
  return response.data;
};

export const createBudget = async (budgetData) => {
  const response = await api.post("/budgets", budgetData);
  return response.data;
};

export const updateBudget = async (id, budgetData) => {
  const response = await api.patch(`/budgets/${id}`, budgetData);
  return response.data;
};

export const deleteBudget = async (id) => {
  const response = await api.delete(`/budgets/${id}`);
  return response.data;
};
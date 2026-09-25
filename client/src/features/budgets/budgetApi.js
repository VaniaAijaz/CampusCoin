import api from "../../core/api";

export const getBudgets = async (month) => {
  const { data } = await api.get("/budgets", { params: { month } });
  return data;
};

export const setBudget = async (budgetData) => {
  const { data } = await api.post("/budgets", budgetData);
  return data;
};

export const deleteBudget = async (id) => {
  const { data } = await api.delete(`/budgets/${id}`);
  return data;
};

export const getBudgetAlerts = async () => {
  const { data } = await api.get("/budgets/alerts");
  return data;
};

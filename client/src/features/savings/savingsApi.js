import api from "../../core/api";

export const getSavingsSummary = async () => {
  const { data } = await api.get("/goals/summary");
  return data;
};

export const updateSavingsGoal = async (goalAmount) => {
  const { data } = await api.post("/goals/set-goal", { goalAmount });
  return data;
};

export const depositToSavings = async (amount) => {
  const { data } = await api.post("/goals/deposit", { amount });
  return data;
};

export const withdrawFromSavings = async (amount) => {
  const { data } = await api.post("/goals/withdraw", { amount });
  return data;
};
export const withdrawSavings = withdrawFromSavings;

export const getGoals = async () => {
  const { data } = await api.get("/goals");
  return data;
};

export const createGoal = async (goalData) => {
  const { data } = await api.post("/goals", goalData);
  return data;
};

export const updateGoal = async (id, goalData) => {
  const { data } = await api.put(`/goals/${id}`, goalData);
  return data;
};

export const deleteGoal = async (id) => {
  const { data } = await api.delete(`/goals/${id}`);
  return data;
};

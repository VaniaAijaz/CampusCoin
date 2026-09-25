import api from "../../core/api";

export const getTransactions = async (params = {}) => {
  const { data } = await api.get("/transactions", { params });
  return data;
};

export const getRecentTransactions = async () => {
  const { data } = await api.get("/transactions/recent");
  return data;
};

export const getDashboardMetrics = async () => {
  const { data } = await api.get("/transactions/dashboard-metrics");
  return data;
};

export const createTransaction = async (txData) => {
  const { data } = await api.post("/transactions", txData);
  return data;
};

export const updateTransaction = async (id, txData) => {
  const { data } = await api.put(`/transactions/${id}`, txData);
  return data;
};

export const deleteTransaction = async (id) => {
  const { data } = await api.delete(`/transactions/${id}`);
  return data;
};

export const importTransactionsCSV = async (rows) => {
  const { data } = await api.post("/transactions/import-csv", { rows });
  return data;
};

export const aiCategorizeDescription = async (description) => {
  const { data } = await api.post("/tips/ai-categorize", { description });
  return data;
};

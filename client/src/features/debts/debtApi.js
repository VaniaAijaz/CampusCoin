import api from "../../core/api";

export const getDebts = async () => {
  const { data } = await api.get("/debts");
  return data;
};

export const createDebt = async (payload) => {
  const { data } = await api.post("/debts", payload);
  return data;
};

export const updateDebt = async (id, payload) => {
  const { data } = await api.put(`/debts/${id}`, payload);
  return data;
};

export const deleteDebt = async (id) => {
  const { data } = await api.delete(`/debts/${id}`);
  return data;
};

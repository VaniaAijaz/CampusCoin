import api from "../../core/api";

export const getSubscriptions = async () => {
  const { data } = await api.get("/subscriptions");
  return data;
};

export const createSubscription = async (payload) => {
  const { data } = await api.post("/subscriptions", payload);
  return data;
};

export const deleteSubscription = async (id) => {
  const { data } = await api.delete(`/subscriptions/${id}`);
  return data;
};

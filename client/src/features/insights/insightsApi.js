import api from "../../core/api";

export const getInsights = async () => {
  const { data } = await api.get("/insights");
  return data;
};

export const generateInsight = async (month) => {
  const { data } = await api.post("/insights/generate", null, { params: { month } });
  return data;
};

export const toggleBookmarkInsight = async (id) => {
  const { data } = await api.put(`/insights/${id}/bookmark`);
  return data;
};

export const togglePinInsight = async (id) => {
  const { data } = await api.put(`/insights/${id}/pin`);
  return data;
};

export const getSmartTips = async () => {
  const { data } = await api.get("/tips");
  return data;
};

export const getForecast = async () => {
  const { data } = await api.get("/tips/forecast");
  return data;
};

export const getDynamicInsight = async () => {
  const { data } = await api.get("/insights/dynamic");
  return data;
};

export const regenerateDynamicInsight = async () => {
  const { data } = await api.post("/insights/dynamic/regenerate");
  return data;
};

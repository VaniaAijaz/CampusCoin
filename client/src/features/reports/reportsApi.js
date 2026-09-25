import api from "../../core/api";

export const getMonthlySummary = async (month) => {
  const { data } = await api.get("/reports/monthly-summary", { params: { month } });
  return data;
};

export const getReportByCategory = async (month, type = "expense") => {
  const { data } = await api.get("/reports/by-category", { params: { month, type } });
  return data;
};

export const getSixMonthsTrends = async () => {
  const { data } = await api.get("/reports/six-months");
  return data;
};

export const getDailyReport = async (month) => {
  const { data } = await api.get("/reports/daily", { params: { month } });
  return data;
};

export const getTopCategory = async () => {
  const { data } = await api.get("/reports/top-category");
  return data;
};

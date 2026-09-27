import api from "../../core/api";

/**
 * Fetch active insights with optional filters (category, bookmarked, includeDismissed)
 */
export const getInsights = async (params = {}) => {
  const { data } = await api.get("/insights", { params });
  return data;
};

/**
 * Fetch top 2-3 prioritized recommendations for the Dashboard widget
 */
export const getDashboardInsights = async () => {
  const { data } = await api.get("/insights/dashboard");
  return data;
};

/**
 * Trigger fresh AI & deterministic analysis
 */
export const generateInsight = async () => {
  const { data } = await api.post("/insights/generate");
  return data;
};

/**
 * Dismiss an insight from active recommendation feed
 */
export const dismissInsight = async (id) => {
  const { data } = await api.put(`/insights/${id}/dismiss`);
  return data;
};

/**
 * Toggle bookmark status
 */
export const toggleBookmarkInsight = async (id) => {
  const { data } = await api.put(`/insights/${id}/bookmark`);
  return data;
};

/**
 * Toggle pinned status
 */
export const togglePinInsight = async (id) => {
  const { data } = await api.put(`/insights/${id}/pin`);
  return data;
};

/**
 * Get deterministic month-end cash flow forecast with drivers
 */
export const getForecast = async () => {
  const { data } = await api.get("/insights/forecast");
  return data;
};

/**
 * Apply suggested budget adjustments after explicit student review
 */
export const applyBudgetAdjustments = async (suggestedBudgets) => {
  const { data } = await api.post("/insights/apply-budgets", { suggestedBudgets });
  return data;
};

/**
 * Get dynamic single-line tip
 */
export const getDynamicInsight = async () => {
  const { data } = await api.get("/insights/dynamic");
  return data;
};

/**
 * Regenerate dynamic single-line tip
 */
export const regenerateDynamicInsight = async () => {
  const { data } = await api.post("/insights/dynamic/regenerate");
  return data;
};

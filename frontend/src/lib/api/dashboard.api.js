import { request } from "./request.js";

const buildQuery = (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

export const dashboardApi = {
  summary: () => request("/dashboard/summary"),
  monthlyStats: ({ year } = {}) => request(`/dashboard/monthly-stats${buildQuery({ year })}`),
  projectStatusSummary: ({ month, year } = {}) => request(`/dashboard/project-status-summary${buildQuery({ month, year })}`),
};
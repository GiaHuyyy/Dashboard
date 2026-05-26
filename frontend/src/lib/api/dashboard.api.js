import { request } from "./request.js";

export const dashboardApi = {
  summary: () => request("/dashboard/summary"),
};


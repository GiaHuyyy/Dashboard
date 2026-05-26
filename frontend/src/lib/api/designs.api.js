import { request } from "./request.js";

export const designApi = {
  list: ({ search = "", designType = "all", status = "all", assignee = "all", page = 1, limit = 200 } = {}) => {
    const searchParams = new URLSearchParams();
    searchParams.set("search", search);
    searchParams.set("designType", designType);
    searchParams.set("status", status);
    searchParams.set("assignee", assignee);
    searchParams.set("page", String(page));
    searchParams.set("limit", String(limit));
    return request(`/designs?${searchParams.toString()}`);
  },
  references: () => request("/designs/references"),
  detail: (id) => request(`/designs/${id}`),
  create: (payload) =>
    request("/designs", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    request(`/designs/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (id) =>
    request(`/designs/${id}`, {
      method: "DELETE",
    }),
  removeMany: (ids) =>
    request("/designs", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    }),
};


export const designPointApi = {
  list: ({ assignee = "all", month = "all", year = "all", search = "", status = "all" } = {}) => {
    const searchParams = new URLSearchParams();
    searchParams.set("assignee", assignee);
    searchParams.set("month", String(month));
    searchParams.set("year", String(year));
    searchParams.set("search", search);
    searchParams.set("status", status);
    return request(`/design-points?${searchParams.toString()}`);
  },
};


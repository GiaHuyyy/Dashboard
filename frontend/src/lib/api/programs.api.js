import { request } from "./request.js";

export const programApi = {
  list: ({ module = "all", search = "", page = 1, limit = 10 } = {}) => {
    const searchParams = new URLSearchParams();
    if (module && module !== "all") {
      searchParams.set("module", module);
    }
    searchParams.set("search", search);
    searchParams.set("page", String(page));
    searchParams.set("limit", String(limit));
    const query = searchParams.toString();
    return request(`/programs${query ? `?${query}` : ""}`);
  },
  validate: (payload) =>
    request("/programs/validate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  create: (payload) =>
    request("/programs", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  detail: (id) => request(`/programs/${id}`),
  references: () => request("/programs/references"),
  update: (id, payload) =>
    request(`/programs/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (id) =>
    request(`/programs/${id}`, {
      method: "DELETE",
    }),
  removeMany: (ids) =>
    request("/programs", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    }),
};


export const correctionApi = {
  list: ({ assignee = "all", month = "all", year = "all", search = "", page = 1, limit = 50 } = {}) => {
    const searchParams = new URLSearchParams();
    searchParams.set("assignee", assignee);
    searchParams.set("month", String(month));
    searchParams.set("year", String(year));
    searchParams.set("search", search);
    searchParams.set("page", String(page));
    searchParams.set("limit", String(limit));
    return request(`/program-corrections?${searchParams.toString()}`);
  },
  create: (payload) =>
    request("/program-corrections", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  detail: (id) => request(`/program-corrections/${id}`),
  update: (id, payload) =>
    request(`/program-corrections/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (id) =>
    request(`/program-corrections/${id}`, {
      method: "DELETE",
    }),
  removeMany: (ids) =>
    request("/program-corrections", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    }),
};


export const upgradeApi = {
  list: ({ assignee = "all", month = "all", year = "all", search = "", page = 1, limit = 50 } = {}) => {
    const searchParams = new URLSearchParams();
    searchParams.set("assignee", assignee);
    searchParams.set("month", String(month));
    searchParams.set("year", String(year));
    searchParams.set("search", search);
    searchParams.set("page", String(page));
    searchParams.set("limit", String(limit));
    return request(`/program-upgrades?${searchParams.toString()}`);
  },
  create: (payload) =>
    request("/program-upgrades", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  detail: (id) => request(`/program-upgrades/${id}`),
  update: (id, payload) =>
    request(`/program-upgrades/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (id) =>
    request(`/program-upgrades/${id}`, {
      method: "DELETE",
    }),
  removeMany: (ids) =>
    request("/program-upgrades", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    }),
};


export const pointApi = {
  list: ({ assignee = "all", month = "all", year = "all", search = "" } = {}) => {
    const searchParams = new URLSearchParams();
    searchParams.set("assignee", assignee);
    searchParams.set("month", String(month));
    searchParams.set("year", String(year));
    searchParams.set("search", search);
    return request(`/program-points?${searchParams.toString()}`);
  },
};
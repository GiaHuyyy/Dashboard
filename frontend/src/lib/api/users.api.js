import { request } from "./request.js";

export const userApi = {
  list: ({ search = "", role = "all", active = "all" } = {}) => {
    const searchParams = new URLSearchParams();
    if (search) searchParams.set("search", search);
    if (role !== "all") searchParams.set("role", role);
    if (active !== "all") searchParams.set("active", active);
    const query = searchParams.toString();
    return request(`/users${query ? `?${query}` : ""}`);
  },
  create: (payload) =>
    request("/users", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  detail: (id) => request(`/users/${id}`),
  update: (id, payload) =>
    request(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (id) =>
    request(`/users/${id}`, {
      method: "DELETE",
    }),
};


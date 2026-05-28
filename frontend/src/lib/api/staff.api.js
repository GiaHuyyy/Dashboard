import { request } from "./request.js";

export const staffApi = {
  list: ({ search = "", active = "all", page = 1, limit = 10 } = {}) => {
    const searchParams = new URLSearchParams();
    if (search) searchParams.set("search", search);
    if (active !== "all") searchParams.set("active", String(active));
    searchParams.set("page", String(page));
    searchParams.set("limit", String(limit));
    return request(`/staffs${searchParams.toString() ? `?${searchParams.toString()}` : ""}`);
  },
  references: () => request("/staffs/references"),
  create: (payload) =>
    request("/staffs", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  detail: (id) => request(`/staffs/${id}`),
  update: (id, payload) =>
    request(`/staffs/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (id) =>
    request(`/staffs/${id}`, {
      method: "DELETE",
    }),
};
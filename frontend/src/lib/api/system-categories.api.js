import { request } from "./request.js";

export const systemCategoryApi = {
  list: ({ type = "", search = "", page = 1, limit = 200 } = {}) => {
    const searchParams = new URLSearchParams();
    if (type) searchParams.set("type", type);
    if (search) searchParams.set("search", search);
    searchParams.set("page", String(page));
    searchParams.set("limit", String(limit));
    return request(`/system-categories?${searchParams.toString()}`);
  },
  detail: (id) => request(`/system-categories/${id}`),
  create: (payload) =>
    request("/system-categories", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    request(`/system-categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (id) =>
    request(`/system-categories/${id}`, {
      method: "DELETE",
    }),
  removeMany: (ids) =>
    request("/system-categories", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    }),
};


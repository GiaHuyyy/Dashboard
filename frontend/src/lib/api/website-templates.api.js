import { request } from "./request.js";

export const websiteTemplateApi = {
  list: ({ search = "", category = "all", platform = "all", active = "all", page = 1, limit = 200 } = {}) => {
    const searchParams = new URLSearchParams();
    searchParams.set("search", search);
    searchParams.set("category", category);
    searchParams.set("platform", platform);
    searchParams.set("active", active);
    searchParams.set("page", String(page));
    searchParams.set("limit", String(limit));
    return request(`/website-templates?${searchParams.toString()}`);
  },
  detail: (id) => request(`/website-templates/${id}`),
  create: (payload) =>
    request("/website-templates", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    request(`/website-templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (id) =>
    request(`/website-templates/${id}`, {
      method: "DELETE",
    }),
  removeMany: (ids) =>
    request("/website-templates", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    }),
};


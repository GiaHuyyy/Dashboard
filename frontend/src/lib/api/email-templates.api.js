import { request } from "./request.js";

export const emailTemplateApi = {
  list: ({ templateType = "all", status = "all", search = "", page = 1, limit = 200 } = {}) => {
    const searchParams = new URLSearchParams();
    searchParams.set("templateType", templateType);
    searchParams.set("status", status);
    searchParams.set("search", search);
    searchParams.set("page", String(page));
    searchParams.set("limit", String(limit));
    return request(`/email-templates?${searchParams.toString()}`);
  },
  detail: (id) => request(`/email-templates/${id}`),
  create: (payload) =>
    request("/email-templates", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    request(`/email-templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (id) =>
    request(`/email-templates/${id}`, {
      method: "DELETE",
    }),
  removeMany: (ids) =>
    request("/email-templates", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    }),
};


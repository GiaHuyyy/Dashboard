import { request } from "./request.js";

export const sourceApi = {
  list: ({ status = "all", search = "", page = 1, limit = 200 } = {}) => {
    const searchParams = new URLSearchParams();
    searchParams.set("status", status);
    searchParams.set("search", search);
    searchParams.set("page", String(page));
    searchParams.set("limit", String(limit));
    return request(`/program-sources?${searchParams.toString()}`);
  },
  create: (payload) =>
    request("/program-sources", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  detail: (id) => request(`/program-sources/${id}`),
  update: (id, payload) =>
    request(`/program-sources/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  sendMail: (id) =>
    request(`/program-sources/${id}/send-mail`, {
      method: "POST",
    }),
  remove: (id) =>
    request(`/program-sources/${id}`, {
      method: "DELETE",
    }),
  removeMany: (ids) =>
    request("/program-sources", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    }),
};


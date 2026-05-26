import { request } from "./request.js";

export const businessContractApi = {
  list: ({ search = "", handoverStatus = "all", page = 1, limit = 200 } = {}) => {
    const searchParams = new URLSearchParams();
    searchParams.set("search", search);
    searchParams.set("handoverStatus", handoverStatus);
    searchParams.set("page", String(page));
    searchParams.set("limit", String(limit));
    return request(`/business-contracts?${searchParams.toString()}`);
  },
  references: () => request("/business-contracts/references"),
  create: (payload) =>
    request("/business-contracts", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  detail: (id) => request(`/business-contracts/${id}`),
  update: (id, payload) =>
    request(`/business-contracts/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  handover: (id) =>
    request(`/business-contracts/${id}/handover`, {
      method: "POST",
    }),
  remove: (id) =>
    request(`/business-contracts/${id}`, {
      method: "DELETE",
    }),
  removeMany: (ids) =>
    request("/business-contracts", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    }),
};


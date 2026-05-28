import { request } from "./request.js";

export const hostPriceApi = {
  list: ({ search = "", page = 1, limit = 10 } = {}) => {
    const searchParams = new URLSearchParams();
    if (search) searchParams.set("search", search);
    searchParams.set("page", String(page));
    searchParams.set("limit", String(limit));
    return request(`/host-prices${searchParams.toString() ? `?${searchParams.toString()}` : ""}`);
  },
  detail: (id) => request(`/host-prices/${id}`),
  create: (payload) =>
    request("/host-prices", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    request(`/host-prices/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (id) =>
    request(`/host-prices/${id}`, {
      method: "DELETE",
    }),
  removeMany: (ids) =>
    request("/host-prices", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    }),
};


export const sslPriceApi = {
  list: ({ search = "", page = 1, limit = 10 } = {}) => {
    const searchParams = new URLSearchParams();
    if (search) searchParams.set("search", search);
    searchParams.set("page", String(page));
    searchParams.set("limit", String(limit));
    return request(`/ssl-prices${searchParams.toString() ? `?${searchParams.toString()}` : ""}`);
  },
  detail: (id) => request(`/ssl-prices/${id}`),
  create: (payload) =>
    request("/ssl-prices", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    request(`/ssl-prices/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (id) =>
    request(`/ssl-prices/${id}`, {
      method: "DELETE",
    }),
  removeMany: (ids) =>
    request("/ssl-prices", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    }),
};


export const domainPriceApi = {
  list: ({ search = "", page = 1, limit = 10 } = {}) => {
    const searchParams = new URLSearchParams();
    if (search) searchParams.set("search", search);
    searchParams.set("page", String(page));
    searchParams.set("limit", String(limit));
    return request(`/domain-prices${searchParams.toString() ? `?${searchParams.toString()}` : ""}`);
  },
  detail: (id) => request(`/domain-prices/${id}`),
  create: (payload) =>
    request("/domain-prices", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    request(`/domain-prices/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (id) =>
    request(`/domain-prices/${id}`, {
      method: "DELETE",
    }),
  removeMany: (ids) =>
    request("/domain-prices", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    }),
};


export const packagePriceApi = {
  list: ({ search = "", page = 1, limit = 10 } = {}) => {
    const searchParams = new URLSearchParams();
    if (search) searchParams.set("search", search);
    searchParams.set("page", String(page));
    searchParams.set("limit", String(limit));
    return request(`/package-prices${searchParams.toString() ? `?${searchParams.toString()}` : ""}`);
  },
  detail: (id) => request(`/package-prices/${id}`),
  create: (payload) =>
    request("/package-prices", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    request(`/package-prices/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (id) =>
    request(`/package-prices/${id}`, {
      method: "DELETE",
    }),
  removeMany: (ids) =>
    request("/package-prices", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    }),
};


export const administrationPriceApi = {
  list: ({ search = "", page = 1, limit = 10 } = {}) => {
    const searchParams = new URLSearchParams();
    if (search) searchParams.set("search", search);
    searchParams.set("page", String(page));
    searchParams.set("limit", String(limit));
    return request(`/administration-prices${searchParams.toString() ? `?${searchParams.toString()}` : ""}`);
  },
  detail: (id) => request(`/administration-prices/${id}`),
  create: (payload) =>
    request("/administration-prices", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    request(`/administration-prices/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (id) =>
    request(`/administration-prices/${id}`, {
      method: "DELETE",
    }),
  removeMany: (ids) =>
    request("/administration-prices", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    }),
};


export const advertisingPriceApi = {
  list: ({ search = "", page = 1, limit = 10 } = {}) => {
    const searchParams = new URLSearchParams();
    if (search) searchParams.set("search", search);
    searchParams.set("page", String(page));
    searchParams.set("limit", String(limit));
    return request(`/advertising-prices${searchParams.toString() ? `?${searchParams.toString()}` : ""}`);
  },
  detail: (id) => request(`/advertising-prices/${id}`),
  create: (payload) =>
    request("/advertising-prices", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    request(`/advertising-prices/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (id) =>
    request(`/advertising-prices/${id}`, {
      method: "DELETE",
    }),
  removeMany: (ids) =>
    request("/advertising-prices", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    }),
};
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const SESSION_EXPIRED_EVENT = "auth:session-expired";
let hasDispatchedSessionExpired = false;

const isSessionExpired = (status, message) => {
  if (status !== 401 || !message) return false;
  const normalized = message.toLowerCase();
  return normalized.includes("hết hạn") || normalized.includes("expired");
};

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const responseText = await response.text();
  let data = null;
  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message = data?.message || "Request failed";
    if (isSessionExpired(response.status, message) && !hasDispatchedSessionExpired) {
      hasDispatchedSessionExpired = true;
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail: { message } }));
    }
    throw new Error(message);
  }

  hasDispatchedSessionExpired = false;
  return data;
};

export const authApi = {
  register: (payload) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  login: (payload) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  logout: () =>
    request("/auth/logout", {
      method: "POST",
    }),
  me: () => request("/auth/me"),
};

export const programApi = {
  list: (module) => {
    const searchParams = new URLSearchParams();
    if (module && module !== "all") {
      searchParams.set("module", module);
    }
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

export const staffApi = {
  list: ({ search = "", active = "all" } = {}) => {
    const searchParams = new URLSearchParams();
    if (search) searchParams.set("search", search);
    if (active !== "all") searchParams.set("active", String(active));
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

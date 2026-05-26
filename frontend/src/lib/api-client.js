
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


export const mailConfigurationApi = {
  detail: () => request("/mail-configuration"),
  update: (payload) =>
    request("/mail-configuration", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
};

export const systemSettingApi = {
  detail: () => request("/system-settings"),
  update: (payload) => {
    const body = payload && Object.prototype.hasOwnProperty.call(payload, "settings") ? payload : { settings: payload };

    return request("/system-settings", {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },
};

export const hostPriceApi = {
  list: ({ search = "" } = {}) => {
    const searchParams = new URLSearchParams();
    if (search) searchParams.set("search", search);
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
  list: ({ search = "" } = {}) => {
    const searchParams = new URLSearchParams();
    if (search) searchParams.set("search", search);
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
  list: ({ search = "" } = {}) => {
    const searchParams = new URLSearchParams();
    if (search) searchParams.set("search", search);
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
  list: ({ search = "" } = {}) => {
    const searchParams = new URLSearchParams();
    if (search) searchParams.set("search", search);
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
  list: ({ search = "" } = {}) => {
    const searchParams = new URLSearchParams();
    if (search) searchParams.set("search", search);
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
  list: ({ search = "" } = {}) => {
    const searchParams = new URLSearchParams();
    if (search) searchParams.set("search", search);
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

export const designApi = {
  list: ({ search = "", designType = "all", status = "all", assignee = "all", page = 1, limit = 200 } = {}) => {
    const searchParams = new URLSearchParams();
    searchParams.set("search", search);
    searchParams.set("designType", designType);
    searchParams.set("status", status);
    searchParams.set("assignee", assignee);
    searchParams.set("page", String(page));
    searchParams.set("limit", String(limit));
    return request(`/designs?${searchParams.toString()}`);
  },
  references: () => request("/designs/references"),
  detail: (id) => request(`/designs/${id}`),
  create: (payload) =>
    request("/designs", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    request(`/designs/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (id) =>
    request(`/designs/${id}`, {
      method: "DELETE",
    }),
  removeMany: (ids) =>
    request("/designs", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    }),
};

export const designPointApi = {
  list: ({ assignee = "all", month = "all", year = "all", search = "", status = "all" } = {}) => {
    const searchParams = new URLSearchParams();
    searchParams.set("assignee", assignee);
    searchParams.set("month", String(month));
    searchParams.set("year", String(year));
    searchParams.set("search", search);
    searchParams.set("status", status);
    return request(`/design-points?${searchParams.toString()}`);
  },
};


export const dashboardApi = {
  summary: () => request("/dashboard/summary"),
};

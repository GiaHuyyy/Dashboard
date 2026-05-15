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
};

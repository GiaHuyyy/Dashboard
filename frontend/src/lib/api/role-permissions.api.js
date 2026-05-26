import { request } from "./request.js";

export const rolePermissionApi = {
  list: () => request("/role-permissions"),
  update: (role, permissions = []) =>
    request(`/role-permissions/${role}`, {
      method: "PUT",
      body: JSON.stringify({ permissions }),
    }),
};


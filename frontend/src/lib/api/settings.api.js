import { request } from "./request.js";

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


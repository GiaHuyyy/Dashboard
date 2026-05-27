import {
  getSystemSettingDefinitions,
  getSystemSettingRows,
  getSystemSettingsObject,
  updateSystemSettingsFromObject,
} from "../services/systemSettingService.js";
import { formatDateTime } from "../utils/date.js";
import { sendError, sendOk } from "../utils/httpResponse.js";

const toResponseRows = (rows) =>
  rows.map((item) => ({
    id: item._id,
    key: item.key,
    group: item.group,
    label: item.label,
    type: item.type,
    value: item.value,
    sortOrder: Number(item.sortOrder || 0),
    note: item.note || "",
    updatedAt: formatDateTime(item.updatedAt),
  }));

const getLatestUpdatedAt = (rows) => {
  const latest = rows
    .map((item) => (item.updatedAt ? new Date(item.updatedAt).getTime() : 0))
    .filter((item) => Number.isFinite(item))
    .sort((a, b) => b - a)[0];

  return latest ? formatDateTime(latest) : "";
};

export const getSystemSettings = async (req, res) => {
  const rows = await getSystemSettingRows(req.user?.sub);
  const settings = await getSystemSettingsObject();

  return sendOk(res, {
    settings,
    rows: toResponseRows(rows),
    definitions: getSystemSettingDefinitions(),
    updatedAt: getLatestUpdatedAt(rows),
  });
};

export const updateSystemSettings = async (req, res) => {
  try {
    const rows = await updateSystemSettingsFromObject(req.body?.settings || req.body || {}, req.user?.sub);
    const settings = await getSystemSettingsObject();

    return sendOk(res, {
      message: "Đã lưu cấu hình tham số",
      settings,
      rows: toResponseRows(rows),
      definitions: getSystemSettingDefinitions(),
      updatedAt: getLatestUpdatedAt(rows),
    });
  } catch (error) {
    return sendError(res, error?.status || 500, error?.message || "Không thể lưu cấu hình tham số");
  }
};
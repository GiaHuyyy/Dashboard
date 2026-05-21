import {
  getSystemSettingDefinitions,
  getSystemSettingRows,
  getSystemSettingsObject,
  updateSystemSettingsFromObject,
} from "../services/systemSettingService.js";

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

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

  return res.json({
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

    return res.json({
      message: "Đã lưu cấu hình tham số",
      settings,
      rows: toResponseRows(rows),
      definitions: getSystemSettingDefinitions(),
      updatedAt: getLatestUpdatedAt(rows),
    });
  } catch (error) {
    return res.status(error?.status || 500).json({
      message: error?.message || "Không thể lưu cấu hình tham số",
    });
  }
};

import SystemSetting from "../models/SystemSetting.js";

export const SYSTEM_SETTING_GROUPS = {
  source: "source",
  time: "time",
  upload: "upload",
  sla: "sla",
};

const SETTING_DEFINITIONS = [
  {
    key: "source.defaultExpireValue",
    group: SYSTEM_SETTING_GROUPS.source,
    label: "Hạn tải source mặc định",
    type: "number",
    defaultValue: 7,
    sortOrder: 10,
    note: "Giá trị mặc định để tính hạn hiệu lực link source.",
  },
  {
    key: "source.defaultExpireUnit",
    group: SYSTEM_SETTING_GROUPS.source,
    label: "Đơn vị hạn tải",
    type: "string",
    defaultValue: "day",
    sortOrder: 20,
    note: "hour = giờ, day = ngày.",
  },
  {
    key: "source.allowSendExpiredSource",
    group: SYSTEM_SETTING_GROUPS.source,
    label: "Cho phép gửi source đã quá hạn",
    type: "boolean",
    defaultValue: true,
    sortOrder: 30,
    note: "Nếu tắt, hệ thống có thể chặn gửi source đã quá hạn ở các bước tích hợp sau.",
  },
  {
    key: "source.autoMarkSentAfterMailSuccess",
    group: SYSTEM_SETTING_GROUPS.source,
    label: "Tự cập nhật trạng thái gửi sau khi gửi mail thành công",
    type: "boolean",
    defaultValue: true,
    sortOrder: 40,
    note: "Khi gửi mail source thành công, tự chuyển trạng thái gửi sang Đã gửi.",
  },
  {
    key: "source.autoSetDownloadedAt",
    group: SYSTEM_SETTING_GROUPS.source,
    label: "Tự set ngày tải khi xác nhận đã tải",
    type: "boolean",
    defaultValue: true,
    sortOrder: 50,
    note: "Khi chọn trạng thái đã tải, tự điền ngày xác nhận tải.",
  },
  {
    key: "time.workingHoursPerDay",
    group: SYSTEM_SETTING_GROUPS.time,
    label: "Số giờ tương đương 1 ngày công",
    type: "number",
    defaultValue: 8,
    sortOrder: 110,
    note: "Ví dụ: 8 giờ = 1 ngày công, 1 giờ = 0.125.",
  },
  {
    key: "time.roundingDigits",
    group: SYSTEM_SETTING_GROUPS.time,
    label: "Số chữ số làm tròn khi quy đổi",
    type: "number",
    defaultValue: 3,
    sortOrder: 120,
    note: "Ví dụ: 1h / 8h = 0.125 nên mặc định nên để 3.",
  },
  {
    key: "upload.maxUploadSizeMb",
    group: SYSTEM_SETTING_GROUPS.upload,
    label: "Giới hạn dung lượng upload",
    type: "number",
    defaultValue: 10,
    sortOrder: 210,
    note: "Đơn vị MB.",
  },
  {
    key: "upload.maxFilesPerUpload",
    group: SYSTEM_SETTING_GROUPS.upload,
    label: "Số file tối đa mỗi lần upload",
    type: "number",
    defaultValue: 5,
    sortOrder: 220,
    note: "Giới hạn số lượng file trong một lần upload.",
  },
  {
    key: "upload.allowedExtensions",
    group: SYSTEM_SETTING_GROUPS.upload,
    label: "Định dạng file cho phép",
    type: "string",
    defaultValue: "jpg,png,jpeg,webp,pdf,doc,docx,xls,xlsx,zip,rar",
    sortOrder: 230,
    note: "Danh sách đuôi file, cách nhau bởi dấu phẩy.",
  },
  {
    key: "sla.warningBeforeDeadlineHours",
    group: SYSTEM_SETTING_GROUPS.sla,
    label: "Cảnh báo trước hạn",
    type: "number",
    defaultValue: 24,
    sortOrder: 310,
    note: "Đơn vị giờ.",
  },
  {
    key: "sla.programDefaultDueDays",
    group: SYSTEM_SETTING_GROUPS.sla,
    label: "Hạn dự kiến lập trình mặc định",
    type: "number",
    defaultValue: 3,
    sortOrder: 320,
    note: "Đơn vị ngày.",
  },
  {
    key: "sla.correctionDefaultDueDays",
    group: SYSTEM_SETTING_GROUPS.sla,
    label: "Hạn dự kiến chỉnh sửa mặc định",
    type: "number",
    defaultValue: 1,
    sortOrder: 330,
    note: "Đơn vị ngày.",
  },
  {
    key: "sla.upgradeDefaultDueDays",
    group: SYSTEM_SETTING_GROUPS.sla,
    label: "Hạn dự kiến nâng cấp mặc định",
    type: "number",
    defaultValue: 2,
    sortOrder: 340,
    note: "Đơn vị ngày.",
  },
];

const SETTING_KEYS = SETTING_DEFINITIONS.map((item) => item.key);

const normalizeValueByType = (value, type, defaultValue) => {
  if (type === "number") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : defaultValue;
  }

  if (type === "boolean") {
    if (value === true || value === false) return value;

    if (typeof value === "string") {
      if (value.toLowerCase() === "true") return true;
      if (value.toLowerCase() === "false") return false;
    }

    return Boolean(defaultValue);
  }

  if (typeof value === "string") return value.trim();

  return String(defaultValue ?? "");
};

const getDefinitionMap = () =>
  SETTING_DEFINITIONS.reduce((map, item) => {
    map.set(item.key, item);
    return map;
  }, new Map());

const normalizeSettingsPayload = (settings = {}) => {
  if (settings?.settings && typeof settings.settings === "object") {
    return settings.settings;
  }

  return settings || {};
};

const buildDefaultSettingsObject = () =>
  SETTING_DEFINITIONS.reduce((result, definition) => {
    const [group, field] = definition.key.split(".");
    if (!result[group]) result[group] = {};
    result[group][field] = definition.defaultValue;
    return result;
  }, {});

const buildSettingsObjectFromRows = (rows = []) => {
  const settings = buildDefaultSettingsObject();
  const definitionMap = getDefinitionMap();

  rows.forEach((row) => {
    const definition = definitionMap.get(row.key);
    if (!definition) return;

    const [group, field] = definition.key.split(".");
    if (!settings[group]) settings[group] = {};

    settings[group][field] = normalizeValueByType(row.value, definition.type, definition.defaultValue);
  });

  return settings;
};

const getPayloadValueByDefinition = (settings, definition) => {
  const [group, field] = definition.key.split(".");
  const groupValue = settings?.[group];

  if (!groupValue || typeof groupValue !== "object") {
    return { exists: false, value: undefined };
  }

  if (!Object.prototype.hasOwnProperty.call(groupValue, field)) {
    return { exists: false, value: undefined };
  }

  return { exists: true, value: groupValue[field] };
};

const ensureDefaultRows = async (userId = null) => {
  const rows = [];

  for (const definition of SETTING_DEFINITIONS) {
    const existing = await SystemSetting.findOne({ key: definition.key });

    if (existing) {
      let shouldSave = false;

      if (existing.group !== definition.group) {
        existing.group = definition.group;
        shouldSave = true;
      }
      if (existing.label !== definition.label) {
        existing.label = definition.label;
        shouldSave = true;
      }
      if (existing.type !== definition.type) {
        existing.type = definition.type;
        shouldSave = true;
      }
      if (Number(existing.sortOrder || 0) !== Number(definition.sortOrder || 0)) {
        existing.sortOrder = definition.sortOrder || 0;
        shouldSave = true;
      }
      if ((existing.note || "") !== (definition.note || "")) {
        existing.note = definition.note || "";
        shouldSave = true;
      }

      if (shouldSave) {
        existing.updatedBy = userId || existing.updatedBy || null;
        await existing.save();
      }

      rows.push(existing);
      continue;
    }

    const created = await SystemSetting.create({
      key: definition.key,
      group: definition.group,
      label: definition.label,
      type: definition.type,
      value: definition.defaultValue,
      sortOrder: definition.sortOrder || 0,
      note: definition.note || "",
      updatedBy: userId || null,
    });

    rows.push(created);
  }

  return rows.sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
};

export const getSystemSettingDefinitions = () => SETTING_DEFINITIONS;

export const getSystemSettingRows = async (userId = null) => {
  await ensureDefaultRows(userId);

  return SystemSetting.find({ key: { $in: SETTING_KEYS } })
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();
};

export const getSystemSettingsObject = async () => {
  await ensureDefaultRows();

  const rows = await SystemSetting.find({ key: { $in: SETTING_KEYS } }).lean();
  return buildSettingsObjectFromRows(rows);
};

export const updateSystemSettingsFromObject = async (rawSettings = {}, userId = null) => {
  const settings = normalizeSettingsPayload(rawSettings);
  await ensureDefaultRows(userId);

  const operations = [];

  SETTING_DEFINITIONS.forEach((definition) => {
    const payloadValue = getPayloadValueByDefinition(settings, definition);

    if (!payloadValue.exists) return;

    const normalizedValue = normalizeValueByType(payloadValue.value, definition.type, definition.defaultValue);

    operations.push({
      updateOne: {
        filter: { key: definition.key },
        update: {
          $set: {
            key: definition.key,
            group: definition.group,
            label: definition.label,
            type: definition.type,
            value: normalizedValue,
            sortOrder: definition.sortOrder || 0,
            note: definition.note || "",
            updatedBy: userId || null,
          },
        },
        upsert: true,
      },
    });
  });

  if (operations.length > 0) {
    await SystemSetting.bulkWrite(operations);
  }

  return getSystemSettingRows(userId);
};

export const getSystemSettingValue = async (key) => {
  const definition = getDefinitionMap().get(key);
  if (!definition) return null;

  const row = await SystemSetting.findOne({ key }).lean();
  if (!row) return definition.defaultValue;

  return normalizeValueByType(row.value, definition.type, definition.defaultValue);
};

export const calculateConvertPoint = ({
  durationValue,
  durationUnit,
  workingHoursPerDay = 8,
  roundingDigits = 3,
}) => {
  const numeric = Number(durationValue);
  const hoursPerDay = Number(workingHoursPerDay);
  const digits = Number(roundingDigits);

  if (!Number.isFinite(numeric) || numeric <= 0) return "";
  if (!Number.isFinite(hoursPerDay) || hoursPerDay <= 0) return "";

  const rawValue = durationUnit === "h" ? numeric / hoursPerDay : numeric;
  const safeDigits = Number.isFinite(digits) ? Math.min(Math.max(Math.trunc(digits), 0), 6) : 3;

  return Number(rawValue.toFixed(safeDigits)).toString();
};

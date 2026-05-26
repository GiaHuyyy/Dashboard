import "dotenv/config";

import { getSystemSettingsObject } from "../services/systemSettingService.js";
import { resolveCloudinaryUploadFolder } from "../constants/upload-folders.js";
import { getMissingCloudinaryEnv } from "../services/cloudinaryService.js";
import { uploadImageAsset } from "../services/uploadAssetService.js";

const DEFAULT_UPLOAD_SETTINGS = {
  maxUploadSizeMb: 5,
  allowedExtensions: "jpg,png,jpeg,webp",
};

const EXTENSION_MIME_MAP = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const normalizeExtensions = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim().replace(/^\./, "").toLowerCase())
    .filter(Boolean);

const getImageUploadSettings = async () => {
  const settings = await getSystemSettingsObject();
  const upload = settings?.upload || {};
  const configuredExtensions = normalizeExtensions(upload.allowedExtensions || DEFAULT_UPLOAD_SETTINGS.allowedExtensions);
  const imageExtensions = configuredExtensions.filter((item) => EXTENSION_MIME_MAP[item]);

  return {
    maxUploadSizeMb: Number(upload.maxUploadSizeMb || DEFAULT_UPLOAD_SETTINGS.maxUploadSizeMb),
    allowedExtensions: imageExtensions.length > 0 ? imageExtensions : normalizeExtensions(DEFAULT_UPLOAD_SETTINGS.allowedExtensions),
  };
};

const getFileExtension = (filename = "") => filename.split(".").pop()?.toLowerCase() || "";


export const uploadContractImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Không có file được gửi" });
  }

  const uploadSettings = await getImageUploadSettings();
  const fileExtension = getFileExtension(req.file.originalname);
  const allowedMimes = uploadSettings.allowedExtensions.map((item) => EXTENSION_MIME_MAP[item]).filter(Boolean);
  const maxSizeBytes = uploadSettings.maxUploadSizeMb * 1024 * 1024;

  if (!uploadSettings.allowedExtensions.includes(fileExtension) || !allowedMimes.includes(req.file.mimetype)) {
    return res.status(400).json({
      message: `Chỉ chấp nhận ảnh định dạng ${uploadSettings.allowedExtensions.join(", ").toUpperCase()}`,
    });
  }

  if (req.file.size > maxSizeBytes) {
    return res.status(400).json({
      message: `Kích thước file tối đa ${uploadSettings.maxUploadSizeMb}MB`,
    });
  }

  const missingVars = getMissingCloudinaryEnv();

  if (missingVars.length > 0) {
    return res.status(500).json({
      message: "Thiếu cấu hình Cloudinary",
      error: `Missing env: ${missingVars.join(", ")}`,
    });
  }

  try {
    const uploadFolder = resolveCloudinaryUploadFolder(req.body?.folder);

    if (uploadFolder === null) {
      return res.status(400).json({
        message: "Thư mục upload không hợp lệ",
      });
    }

    const result = await uploadImageAsset(req.file.buffer, { folder: uploadFolder });

    return res.json({
      message: "Upload thành công",
      url: result.url,
      publicId: result.publicId,
    });
  } catch (error) {
    console.error("Cloudinary upload failed:", {
      message: error?.message,
      http_code: error?.http_code,
      name: error?.name,
    });

    return res.status(500).json({
      message: "Upload lên Cloudinary thất bại",
      error: error?.message || "Unknown Cloudinary error",
    });
  }
};
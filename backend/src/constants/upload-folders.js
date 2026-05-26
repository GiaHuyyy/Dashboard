export const DEFAULT_CLOUDINARY_BASE_FOLDER = "dashboard";

export const CLOUDINARY_UPLOAD_FOLDERS = {
  WEBSITE_TEMPLATES: "website-templates",
  BUSINESS_CONTRACTS: "business-contracts",
};

export const ALLOWED_CLOUDINARY_UPLOAD_FOLDERS = Object.values(CLOUDINARY_UPLOAD_FOLDERS);

const normalizeFolderSegment = (value = "") =>
  String(value || "")
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .map((segment) => segment.trim().replace(/[^a-zA-Z0-9_-]/g, "-"))
    .filter(Boolean)
    .join("/");

export const normalizeCloudinaryFolder = normalizeFolderSegment;

export const resolveCloudinaryUploadFolder = (folder = "") => {
  const normalizedFolder = normalizeFolderSegment(folder);

  if (!normalizedFolder) return "";

  if (!ALLOWED_CLOUDINARY_UPLOAD_FOLDERS.includes(normalizedFolder)) {
    return null;
  }

  return normalizedFolder;
};

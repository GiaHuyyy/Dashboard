import "dotenv/config";
import cloudinary from "cloudinary";

import { DEFAULT_CLOUDINARY_BASE_FOLDER, normalizeCloudinaryFolder } from "../constants/upload-folders.js";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const getMissingCloudinaryEnv = () =>
  ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"].filter((key) => !process.env[key]);


export const buildCloudinaryFolder = (folder = "") => {
  const baseFolder = normalizeCloudinaryFolder(process.env.CLOUDINARY_UPLOAD_FOLDER || DEFAULT_CLOUDINARY_BASE_FOLDER);
  const childFolder = normalizeCloudinaryFolder(folder);
  return [baseFolder, childFolder].filter(Boolean).join("/");
};

export const uploadBufferToCloudinary = (buffer, { folder = "" } = {}) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      {
        resource_type: "image",
        folder: buildCloudinaryFolder(folder),
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );

    uploadStream.end(buffer);
  });

export const deleteCloudinaryAsset = async (publicId) => {
  const normalizedPublicId = String(publicId || "").trim();
  if (!normalizedPublicId) return null;

  try {
    return await cloudinary.v2.uploader.destroy(normalizedPublicId, { resource_type: "image" });
  } catch (error) {
    console.warn("Cloudinary delete failed:", {
      publicId: normalizedPublicId,
      message: error?.message,
      http_code: error?.http_code,
      name: error?.name,
    });
    return null;
  }
};
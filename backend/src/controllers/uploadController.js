import "dotenv/config";
import cloudinary from "cloudinary";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadContractImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Không có file được gửi" });
  }

  const missingVars = [
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ].filter((key) => !process.env[key]);

  if (missingVars.length > 0) {
    return res.status(500).json({
      message: "Thiếu cấu hình Cloudinary",
      error: `Missing env: ${missingVars.join(", ")}`,
    });
  }

  try {
    const uploadWithOptions = (options) =>
      new Promise((resolve, reject) => {
        const uploadStream = cloudinary.v2.uploader.upload_stream(options, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });
        uploadStream.end(req.file.buffer);
      });

    const baseOptions = {
      resource_type: "auto",
      folder: process.env.CLOUDINARY_UPLOAD_FOLDER || "dashboard",
    };
    const preset = process.env.CLOUDINARY_UPLOAD_PRESET?.trim();

    let result;
    try {
      result = await uploadWithOptions(preset ? { ...baseOptions, upload_preset: preset } : baseOptions);
    } catch (error) {
      if (preset && String(error?.message || "").toLowerCase().includes("upload preset not found")) {
        result = await uploadWithOptions(baseOptions);
      } else {
        throw error;
      }
    }

    return res.json({
      message: "Upload thành công",
      url: result.secure_url,
      publicId: result.public_id,
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

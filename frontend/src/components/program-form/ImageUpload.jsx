import { Upload, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { systemSettingApi } from "@/lib/api-client";

const DEFAULT_UPLOAD_SETTINGS = {
  maxUploadSizeMb: 5,
  maxFilesPerUpload: 6,
  allowedExtensions: "jpg,png,jpeg,webp",
};

const IMAGE_MIME_BY_EXTENSION = {
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

export function ImageUpload({ previews, onFilesSelected, onRemoveImage, onImageClick, isUploading, maxImages = 6, disabled = false }) {
  const [uploadSettings, setUploadSettings] = useState(DEFAULT_UPLOAD_SETTINGS);

  useEffect(() => {
    let mounted = true;

    const fetchUploadSettings = async () => {
      try {
        const response = await systemSettingApi.detail();
        const nextUpload = response?.settings?.upload || {};
        if (!mounted) return;

        setUploadSettings({
          maxUploadSizeMb: Number(nextUpload.maxUploadSizeMb || DEFAULT_UPLOAD_SETTINGS.maxUploadSizeMb),
          maxFilesPerUpload: Number(nextUpload.maxFilesPerUpload || DEFAULT_UPLOAD_SETTINGS.maxFilesPerUpload),
          allowedExtensions: nextUpload.allowedExtensions || DEFAULT_UPLOAD_SETTINGS.allowedExtensions,
        });
      } catch {
        if (!mounted) return;
        setUploadSettings(DEFAULT_UPLOAD_SETTINGS);
      }
    };

    void fetchUploadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  const imageExtensions = useMemo(() => {
    const configured = normalizeExtensions(uploadSettings.allowedExtensions);
    const allowedImages = configured.filter((item) => IMAGE_MIME_BY_EXTENSION[item]);
    return allowedImages.length > 0 ? allowedImages : normalizeExtensions(DEFAULT_UPLOAD_SETTINGS.allowedExtensions);
  }, [uploadSettings.allowedExtensions]);

  const validTypes = useMemo(() => imageExtensions.map((item) => IMAGE_MIME_BY_EXTENSION[item]), [imageExtensions]);
  const effectiveMaxImages = Math.min(maxImages, Number(uploadSettings.maxFilesPerUpload || maxImages));
  const maxSizeBytes = Number(uploadSettings.maxUploadSizeMb || DEFAULT_UPLOAD_SETTINGS.maxUploadSizeMb) * 1024 * 1024;
  const acceptValue = imageExtensions.map((item) => `.${item}`).join(",");

  const getImageSrc = (item) => {
    if (!item) return "";
    if (item.kind === "url") return item.url;
    if (item.kind === "file") return item.previewUrl;
    return "";
  };

  const handleChange = (e) => {
    const files = Array.from(e.target.files || []);
    const validFiles = [];
    const totalImages = previews.length + files.length;

    if (totalImages > effectiveMaxImages) {
      toast.error(`Tối đa ${effectiveMaxImages} ảnh hợp đồng`);
      return;
    }

    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name}: Chỉ chấp nhận ${imageExtensions.join(", ").toUpperCase()}`);
        continue;
      }

      if (file.size > maxSizeBytes) {
        toast.error(`${file.name}: Kích thước tối đa ${uploadSettings.maxUploadSizeMb}MB`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-600">Ảnh hợp đồng</label>
        <span className="text-xs text-slate-500">
          {previews.length}/{effectiveMaxImages} ảnh
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {previews.length < effectiveMaxImages && (
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-4 py-6 transition-colors hover:border-slate-400 disabled:cursor-not-allowed">
            <Upload className="h-5 w-5 text-slate-500" />
            <span className="text-sm text-slate-600">Chọn ảnh</span>
            <input
              type="file"
              accept={acceptValue || "image/*"}
              multiple
              onChange={handleChange}
              disabled={isUploading || disabled}
              className="hidden"
            />
          </label>
        )}

        {previews.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {previews.map((item, index) => (
              <div key={index} className="relative group">
                <img
                  src={getImageSrc(item)}
                  alt={`Contract ${index + 1}`}
                  className="h-24 w-full rounded-lg border border-slate-200 object-cover cursor-pointer transition-opacity hover:opacity-75"
                  onClick={() => onImageClick(index)}
                />
                <button
                  type="button"
                  onClick={() => onRemoveImage(index)}
                  disabled={isUploading || disabled}
                  className="absolute right-1 top-1 rounded-full bg-rose-600 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-700 disabled:cursor-not-allowed"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
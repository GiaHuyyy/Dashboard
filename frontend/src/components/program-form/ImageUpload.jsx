import { Upload, X } from "lucide-react";
import { toast } from "sonner";

export function ImageUpload({ previews, onFilesSelected, onRemoveImage, onImageClick, isUploading, maxImages = 6 }) {
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

    if (totalImages > maxImages) {
      toast.error(`Tối đa ${maxImages} ảnh hợp đồng`);
      return;
    }

    for (const file of files) {
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name}: Chỉ chấp nhận JPG, PNG, WebP`);
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}: Kích thước tối đa 5MB`);
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
          {previews.length}/{maxImages} ảnh
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {previews.length < maxImages && (
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-4 py-6 transition-colors hover:border-slate-400 disabled:cursor-not-allowed">
            <Upload className="h-5 w-5 text-slate-500" />
            <span className="text-sm text-slate-600">Chọn ảnh</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleChange}
              disabled={isUploading}
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
                  disabled={isUploading}
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

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { z } from "zod";

import { FormActions, FormPageLayout, FormSection } from "@/components/forms";
import FormField from "@/components/ui/form-field";
import { hasPermission } from "@/lib/permissions";
import { useSystemCategoryOptions } from "@/lib/system-categories";
import { UPLOAD_FOLDERS } from "@/constants/upload-folders";
import { uploadApi } from "@/lib/upload";
import { websiteTemplateApi } from "@/lib/api-client";

const PLATFORM_OPTIONS = ["React", "HTML/CSS", "WordPress", "Laravel", "Khác"];
const PREVIEW_IMAGE_MODES = {
  LINK: "link",
  UPLOAD: "upload",
};

const optionalUrlSchema = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || /^https?:\/\//i.test(value), "Link không hợp lệ");

const optionalPreviewImageSchema = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || /^https?:\/\//i.test(value), "Link ảnh preview không hợp lệ");

const getGoogleDriveFileId = (url) => {
  const value = String(url || "").trim();
  if (!value) return "";

  const fileMatch = value.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
  if (fileMatch?.[1]) return fileMatch[1];

  const idMatch = value.match(/[?&]id=([^&]+)/i);
  if (idMatch?.[1]) return idMatch[1];

  return "";
};

const getPreviewImageUrl = (url) => {
  const value = String(url || "").trim();
  if (!value) return "";

  const driveFileId = getGoogleDriveFileId(value);
  if (driveFileId) {
    return `https://drive.google.com/thumbnail?id=${encodeURIComponent(driveFileId)}&sz=w1000`;
  }

  return value;
};

const schema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên website mẫu"),
  demoUrl: z.string().trim().min(1, "Vui lòng nhập link demo").url("Link demo không hợp lệ"),
  templateUrl: optionalUrlSchema,
  previewImage: optionalPreviewImageSchema,
  category: z.string().trim().min(1, "Vui lòng chọn danh mục"),
  platform: z.string().trim().optional(),
  tagsText: z.string().trim().optional(),
  description: z.string().trim().optional(),
  note: z.string().trim().optional(),
  isActive: z.boolean(),
});

const defaultValues = {
  name: "",
  demoUrl: "",
  templateUrl: "",
  previewImage: "",
  previewImagePublicId: "",
  category: "",
  platform: "React",
  tagsText: "",
  description: "",
  note: "",
  isActive: true,
};

const mapTemplateToForm = (item) => ({
  name: item.name || "",
  demoUrl: item.demoUrl || "",
  templateUrl: item.templateUrl || "",
  previewImage: item.previewImage || "",
  previewImagePublicId: item.previewImagePublicId || "",
  category: item.category || "",
  platform: item.platform || "",
  tagsText: Array.isArray(item.tags) ? item.tags.join(", ") : "",
  description: item.description || "",
  note: item.note || "",
  isActive: Boolean(item.isActive),
});

const tagsToArray = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

function WebsiteTemplateForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const returnPath = location.state?.sourcePath || "/kho-mau/website-mau";
  const currentUser = useSelector((state) => state.auth.user);
  const canSave = hasPermission(currentUser, isEditMode ? "websiteTemplate.update" : "websiteTemplate.create");
  const { options: categoryOptions, isLoading: isLoadingCategories } = useSystemCategoryOptions("websiteTemplate");
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState(defaultValues);
  const [previewImageMode, setPreviewImageMode] = useState(PREVIEW_IMAGE_MODES.LINK);
  const [previewFile, setPreviewFile] = useState(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState("");
  const [isUploadingPreview, setIsUploadingPreview] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const previewImageValue = useWatch({ control, name: "previewImage" });
  const previewImageUrl = useMemo(() => {
    if (previewImageMode === PREVIEW_IMAGE_MODES.UPLOAD) return localPreviewUrl;
    return getPreviewImageUrl(previewImageValue);
  }, [localPreviewUrl, previewImageMode, previewImageValue]);

  const categorySelectOptions = useMemo(() => {
    if (categoryOptions.length === 0) return [{ label: "Không có dữ liệu", value: "" }];
    return categoryOptions;
  }, [categoryOptions]);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    };
  }, [localPreviewUrl]);

  useEffect(() => {
    if (isEditMode || categoryOptions.length === 0) return;
    const nextDefault = { ...defaultValues, category: categoryOptions[0].value };
    reset(nextDefault);
    setInitialSnapshot(nextDefault);
    setPreviewImageMode(PREVIEW_IMAGE_MODES.LINK);
    setPreviewFile(null);
    setLocalPreviewUrl("");
  }, [categoryOptions, isEditMode, reset]);

  useEffect(() => {
    if (!isEditMode) return;
    const fetchDetail = async () => {
      setIsLoadingDetail(true);
      try {
        const response = await websiteTemplateApi.detail(id);
        const item = response?.websiteTemplate;
        if (!item) {
          toast.error("Không tìm thấy website mẫu");
          navigate(returnPath);
          return;
        }
        const mapped = mapTemplateToForm(item);
        reset(mapped);
        setInitialSnapshot(mapped);
        setPreviewImageMode(PREVIEW_IMAGE_MODES.LINK);
        setPreviewFile(null);
        setLocalPreviewUrl("");
      } catch (error) {
        toast.error(error?.message || "Không thể tải chi tiết website mẫu");
        navigate(returnPath);
      } finally {
        setIsLoadingDetail(false);
      }
    };
    void fetchDetail();
  }, [id, isEditMode, navigate, reset, returnPath]);

  const handlePreviewModeChange = (mode) => {
    setPreviewImageMode(mode);
    setPreviewFile(null);
    setLocalPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return "";
    });

    if (mode === PREVIEW_IMAGE_MODES.UPLOAD) {
      setValue("previewImage", "", { shouldDirty: true, shouldValidate: true });
    }
  };

  const handlePreviewFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setPreviewFile(file);

    setLocalPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : "";
    });

    setValue("previewImage", "", { shouldDirty: true, shouldValidate: true });
  };

  const uploadPreviewImageIfNeeded = async () => {
    if (previewImageMode !== PREVIEW_IMAGE_MODES.UPLOAD) return null;
    if (!previewFile) return "";

    setIsUploadingPreview(true);
    try {
      return await uploadApi.uploadToCloudinary(previewFile, { folder: UPLOAD_FOLDERS.WEBSITE_TEMPLATES });
    } finally {
      setIsUploadingPreview(false);
    }
  };

  const persistTemplate = async (values, mode) => {
    try {
      const uploadedPreviewImage = await uploadPreviewImageIfNeeded();
      const isLinkImageChanged = previewImageMode === PREVIEW_IMAGE_MODES.LINK && values.previewImage !== initialSnapshot.previewImage;
      const previewImage = previewImageMode === PREVIEW_IMAGE_MODES.UPLOAD ? uploadedPreviewImage?.url || "" : values.previewImage || "";
      const previewImagePublicId =
        previewImageMode === PREVIEW_IMAGE_MODES.UPLOAD
          ? uploadedPreviewImage?.publicId || ""
          : isLinkImageChanged
            ? ""
            : values.previewImagePublicId || "";

      const payload = {
        name: values.name,
        demoUrl: values.demoUrl,
        templateUrl: values.templateUrl || "",
        previewImage,
        previewImagePublicId,
        category: values.category,
        platform: values.platform || "",
        tags: tagsToArray(values.tagsText),
        description: values.description || "",
        note: values.note || "",
        isActive: values.isActive,
      };

      let response = null;
      if (isEditMode) {
        response = await websiteTemplateApi.update(id, payload);
        toast.success(response?.message || "Cập nhật website mẫu thành công");
      } else {
        response = await websiteTemplateApi.create(payload);
        toast.success(response?.message || "Thêm website mẫu thành công");
      }

      if (mode === "save-stay") {
        const saved = response?.websiteTemplate;
        if (!isEditMode && saved?.id) {
          navigate(`/kho-mau/website-mau/chinh-sua/${saved.id}`, { replace: true });
          return;
        }
        const nextSnapshot = mapTemplateToForm(saved || payload);
        reset(nextSnapshot);
        setInitialSnapshot(nextSnapshot);
        setPreviewImageMode(PREVIEW_IMAGE_MODES.LINK);
        setPreviewFile(null);
        setLocalPreviewUrl("");
        return;
      }

      navigate(returnPath);
    } catch (error) {
      toast.error(error?.message || "Không thể lưu website mẫu");
    }
  };

  const onSubmit = async (values, mode) => {
    if (!canSave) {
      toast.error("Bạn không có quyền lưu website mẫu");
      return;
    }
    await persistTemplate(values, mode);
  };

  const submitWithMode = (mode) =>
    handleSubmit(
      (values) => onSubmit(values, mode),
      () => toast.error("Vui lòng kiểm tra lại thông tin form"),
    )();

  if (isLoadingCategories || isLoadingDetail) {
    return <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Đang tải dữ liệu...</div>;
  }

  return (
    <FormPageLayout
      disabled={!canSave || isUploadingPreview}
      actions={
        <FormActions
        onSave={() => submitWithMode("save")}
        onSaveStay={() => submitWithMode("save-stay")}
        onReset={() => {
          reset(initialSnapshot);
          setPreviewImageMode(PREVIEW_IMAGE_MODES.LINK);
          setPreviewFile(null);
          setLocalPreviewUrl("");
        }}
        isSubmitting={isSubmitting}
        isUploading={isUploadingPreview}
        isEditMode={isEditMode}
        exitPath={returnPath}
        showSaveMail={false}
        readOnlyMode={!canSave}
        readOnlyTitle="Bạn không có quyền lưu website mẫu"
      />
      }
    >
      <FormSection title="Thông tin website mẫu">
            <div className="flex flex-col gap-4 rounded-xl border border-slate-100 p-4">
              <p className="text-md font-semibold text-slate-700">Thông tin chính</p>
              <FormField
                label="Tên website mẫu"
                inputProps={{ ...register("name"), placeholder: "VD: Website spa 01" }}
                error={errors.name?.message}
              />
              <FormField
                label="Danh mục website"
                type="select"
                options={categorySelectOptions}
                selectProps={{
                  ...register("category"),
                  disabled: categoryOptions.length === 0,
                }}
                error={errors.category?.message}
              />
              <FormField
                label="Nền tảng"
                type="select"
                options={PLATFORM_OPTIONS.map((item) => ({ label: item, value: item }))}
                selectProps={register("platform")}
                error={errors.platform?.message}
              />
              <FormField
                label="Mô tả ngắn"
                type="textarea"
                inputProps={{ ...register("description"), rows: 3, placeholder: "Mô tả nhanh về mẫu website" }}
                error={errors.description?.message}
              />
              <FormField
                label="Ghi chú nội bộ"
                type="textarea"
                inputProps={{ ...register("note"), rows: 3, placeholder: "Ghi chú thêm nếu có" }}
                error={errors.note?.message}
              />
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <input type="checkbox" {...register("isActive")} />
                Kích hoạt
              </label>
            </div>

            <div className="flex flex-col gap-4 rounded-xl border border-slate-100 p-4">
              <p className="text-md font-semibold text-slate-700">Liên kết & ảnh preview</p>
              <FormField
                label="Link demo"
                inputProps={{ ...register("demoUrl"), placeholder: "https://..." }}
                error={errors.demoUrl?.message}
              />
              <FormField
                label="Link template/source"
                inputProps={{ ...register("templateUrl"), placeholder: "https://..." }}
                error={errors.templateUrl?.message}
              />

              <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-600">
                  <span>Ảnh preview</span>
                  <label className="flex items-center gap-2 font-medium">
                    <input
                      type="radio"
                      checked={previewImageMode === PREVIEW_IMAGE_MODES.LINK}
                      onChange={() => handlePreviewModeChange(PREVIEW_IMAGE_MODES.LINK)}
                    />
                    Dùng link ảnh
                  </label>
                  <label className="flex items-center gap-2 font-medium">
                    <input
                      type="radio"
                      checked={previewImageMode === PREVIEW_IMAGE_MODES.UPLOAD}
                      onChange={() => handlePreviewModeChange(PREVIEW_IMAGE_MODES.UPLOAD)}
                    />
                    Upload từ máy
                  </label>
                </div>

                {previewImageMode === PREVIEW_IMAGE_MODES.LINK ? (
                  <FormField
                    label="Link ảnh preview"
                    inputProps={{
                      ...register("previewImage"),
                      placeholder: "https://... hoặc link Google Drive",
                    }}
                    error={errors.previewImage?.message}
                  />
                ) : (
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-600">Upload ảnh preview</label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm file:mr-3 file:rounded-md file:border-0 file:bg-sky-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-sky-700 hover:file:bg-sky-100"
                      onChange={handlePreviewFileChange}
                    />
                    <p className="text-xs text-slate-500">Chấp nhận JPG, PNG, WebP, ... theo cấu hình upload hệ thống.</p>
                  </div>
                )}

                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-3">
                  <p className="mb-2 text-xs font-semibold text-slate-500">Xem trước ảnh</p>
                  {previewImageUrl ? (
                    <img
                      src={previewImageUrl}
                      alt="Preview website mẫu"
                      className="h-40 w-full rounded-lg border border-slate-200 bg-white object-contain p-1"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white text-xs text-slate-400">
                      Chưa có ảnh preview
                    </div>
                  )}
                </div>
              </div>

              <FormField
                label="Tags"
                inputProps={{ ...register("tagsText"), placeholder: "landing-page, responsive, spa" }}
                error={errors.tagsText?.message}
              />
            </div>
      </FormSection>
    </FormPageLayout>
  );
}

export default WebsiteTemplateForm;
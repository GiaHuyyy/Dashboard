import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { z } from "zod";

import { FormActions } from "@/components/program-form/FormActions";
import FormField from "@/components/ui/form-field";
import { hasPermission } from "@/lib/permissions";
import { useSystemCategoryOptions } from "@/lib/system-categories";
import { websiteTemplateApi } from "@/lib/api-client";

const PLATFORM_OPTIONS = ["React", "HTML/CSS", "WordPress", "Laravel", "Khác"];

const optionalUrlSchema = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || /^https?:\/\//i.test(value), "Link không hợp lệ");

const optionalPreviewImageSchema = z
  .string()
  .trim()
  .optional()
  .refine(
    (value) => !value || /^https?:\/\//i.test(value) || /^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,/i.test(value),
    "Link ảnh preview không hợp lệ",
  );

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
  if (/^data:image\//i.test(value)) return value;

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

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const previewImageValue = useWatch({ control, name: "previewImage" });
  const previewImageUrl = useMemo(() => getPreviewImageUrl(previewImageValue), [previewImageValue]);

  const categorySelectOptions = useMemo(() => {
    if (categoryOptions.length === 0) return [{ label: "Không có dữ liệu", value: "" }];
    return categoryOptions;
  }, [categoryOptions]);

  useEffect(() => {
    if (isEditMode || categoryOptions.length === 0) return;
    const nextDefault = { ...defaultValues, category: categoryOptions[0].value };
    reset(nextDefault);
    setInitialSnapshot(nextDefault);
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
      } catch (error) {
        toast.error(error?.message || "Không thể tải chi tiết website mẫu");
        navigate(returnPath);
      } finally {
        setIsLoadingDetail(false);
      }
    };
    void fetchDetail();
  }, [id, isEditMode, navigate, reset, returnPath]);

  const persistTemplate = async (values, mode) => {
    const payload = {
      name: values.name,
      demoUrl: values.demoUrl,
      templateUrl: values.templateUrl || "",
      previewImage: values.previewImage || "",
      category: values.category,
      platform: values.platform || "",
      tags: tagsToArray(values.tagsText),
      description: values.description || "",
      note: values.note || "",
      isActive: values.isActive,
    };

    try {
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
    <form className="space-y-4">
      <FormActions
        onSave={() => submitWithMode("save")}
        onSaveStay={() => submitWithMode("save-stay")}
        onReset={() => reset(initialSnapshot)}
        isSubmitting={isSubmitting}
        isUploading={false}
        isEditMode={isEditMode}
        exitPath={returnPath}
        showSaveMail={false}
        readOnlyMode={!canSave}
        readOnlyTitle="Bạn không có quyền lưu website mẫu"
      />

      <fieldset disabled={!canSave} className="contents">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-3 text-lg font-semibold text-slate-700">
            Thông tin website mẫu
          </div>
          <div className="grid gap-5 p-5 lg:grid-cols-2">
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
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <input type="checkbox" {...register("isActive")} />
                Kích hoạt
              </label>
            </div>

            <div className="flex flex-col gap-4 rounded-xl border border-slate-100 p-4">
              <p className="text-md font-semibold text-slate-700">Liên kết</p>
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
              <FormField
                label="Link ảnh preview"
                inputProps={{
                  ...register("previewImage"),
                  placeholder: "https://..., link Google Drive hoặc data:image/...;base64,...",
                }}
                error={errors.previewImage?.message}
              />
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3">
                <p className="mb-2 text-xs font-semibold text-slate-500">Xem trước ảnh</p>
                {previewImageUrl ? (
                  <img
                    src={previewImageUrl}
                    alt="Preview website mẫu"
                    className="h-36 w-full rounded-lg border border-slate-200 bg-white object-contain p-1"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-36 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white text-xs text-slate-400">
                    Chưa có ảnh preview
                  </div>
                )}
              </div>
              <FormField
                label="Tags"
                inputProps={{ ...register("tagsText"), placeholder: "landing-page, responsive, spa" }}
                error={errors.tagsText?.message}
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-3 text-lg font-semibold text-slate-700">Mô tả & ghi chú</div>
          <div className="grid gap-5 p-5 lg:grid-cols-2">
            <FormField
              label="Mô tả ngắn"
              type="textarea"
              inputProps={{ ...register("description"), rows: 4, placeholder: "Mô tả nhanh về mẫu website" }}
              error={errors.description?.message}
            />
            <FormField
              label="Ghi chú nội bộ"
              type="textarea"
              inputProps={{ ...register("note"), rows: 4, placeholder: "Ghi chú thêm nếu có" }}
              error={errors.note?.message}
            />
          </div>
        </div>
      </fieldset>
    </form>
  );
}

export default WebsiteTemplateForm;

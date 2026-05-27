import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { FormActions, FormPageLayout, FormSection } from "@/components/forms";
import { EmailTemplateEditor } from "@/components/template/EmailTemplateEditor";
import FormField from "@/components/ui/form-field";
import { emailTemplateApi } from "@/lib/api-client";
import { PERMISSION_DENIED_MESSAGE, usePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/constants/permissions";

const TEMPLATE_TYPES = [
  { value: "source", label: "Source" },
  { value: "contract", label: "Hợp đồng" },
];

const TEMPLATE_STATUS_OPTIONS = [
  { value: "draft", label: "Bản nháp" },
  { value: "active", label: "Đang dùng" },
];

const VARIABLE_OPTIONS = {
  source: [
    "{{contractCode}}",
    "{{module}}",
    "{{domain}}",
    "{{sourceLink}}",
    "{{expiresAt}}",
    "{{downloadStatus}}",
    "{{downloadCount}}",
    "{{priceRows}}",
    "{{toEmail}}",
    "{{ccEmails}}",
    "{{note}}",
  ],
  contract: [
    "{{actionLabel}}",
    "{{actionLabelLower}}",
    "{{contractCode}}",
    "{{contractName}}",
    "{{customerName}}",
    "{{customerPhone}}",
    "{{customerEmail}}",
    "{{mailStatus}}",
    "{{selectedSalesStaff}}",
    "{{ccEmails}}",
    "{{contractImagesBlock}}",
  ],
};

const schema = z.object({
  templateType: z.enum(["source", "contract"], { message: "Vui lòng chọn loại mẫu" }),
  name: z.string().trim().min(1, "Vui lòng nhập tên mẫu"),
  subject: z.string().trim().min(1, "Vui lòng nhập tiêu đề email"),
  body: z.string().trim().min(1, "Vui lòng nhập nội dung mẫu"),
  status: z.enum(["draft", "active"], { message: "Vui lòng chọn trạng thái" }),
  isDefault: z.boolean(),
  note: z.string().trim().optional(),
});

const defaultValues = {
  templateType: "source",
  name: "",
  subject: "",
  body: "",
  status: "draft",
  isDefault: false,
  note: "",
};

const mapTemplateToForm = (template) => ({
  templateType: ["source", "contract"].includes(template?.templateType) ? template.templateType : "source",
  name: template?.name || "",
  subject: template?.subject || "",
  body: template?.body || "",
  status: ["draft", "active"].includes(template?.status) ? template.status : "draft",
  isDefault: Boolean(template?.isDefault),
  note: template?.note || "",
});

function EmailTemplateForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const returnPath = "/bieu-mau/mau-email";
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [initialSnapshot, setInitialSnapshot] = useState(defaultValues);
  const { can } = usePermission();

  const canView = can(PERMISSIONS.TEMPLATE_VIEW);
  const canSave = can(isEditMode ? PERMISSIONS.TEMPLATE_UPDATE : PERMISSIONS.TEMPLATE_CREATE);
  const isReadOnly = isEditMode && canView && !canSave;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const body = watch("body");
  const templateType = watch("templateType");
  const variables = VARIABLE_OPTIONS[templateType] || VARIABLE_OPTIONS.source;

  const pageTitle = isEditMode ? "Cập nhật mẫu email" : "Thêm mẫu email";
  const typeLabel = useMemo(
    () => TEMPLATE_TYPES.find((item) => item.value === templateType)?.label || "Source",
    [templateType],
  );

  const fetchDetail = useCallback(async () => {
    if (!isEditMode) return;

    if (!canView) {
      toast.error(PERMISSION_DENIED_MESSAGE);
      navigate(returnPath);
      return;
    }

    setIsLoading(true);
    try {
      const response = await emailTemplateApi.detail(id);
      const template = response?.template;
      if (!template) {
        toast.error("Không tìm thấy mẫu email");
        navigate(returnPath);
        return;
      }
      const mapped = mapTemplateToForm(template);
      reset(mapped);
      setInitialSnapshot(mapped);
    } catch (error) {
      toast.error(error?.message || "Không thể tải chi tiết mẫu email");
      navigate(returnPath);
    } finally {
      setIsLoading(false);
    }
  }, [canView, id, isEditMode, navigate, reset]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  const updateBody = (nextBody) => {
    setValue("body", nextBody, { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = async (values, mode = "save") => {
    if (!canSave) {
      toast.error(PERMISSION_DENIED_MESSAGE);
      return;
    }

    try {
      let response;
      if (isEditMode) {
        response = await emailTemplateApi.update(id, values);
        toast.success(response?.message || "Đã cập nhật mẫu email");
      } else {
        response = await emailTemplateApi.create(values);
        toast.success(response?.message || "Đã thêm mẫu email");
      }

      const saved = response?.template ? mapTemplateToForm(response.template) : values;
      setInitialSnapshot(saved);
      reset(saved);

      if (mode === "save-stay") {
        if (!isEditMode && response?.template?.id) {
          navigate(`/bieu-mau/mau-email/chinh-sua/${response.template.id}`, { replace: true });
        }
        return;
      }

      navigate(returnPath);
    } catch (error) {
      toast.error(error?.message || "Không thể lưu mẫu email");
    }
  };

  const submitWithMode = (mode) =>
    handleSubmit(
      (values) => onSubmit(values, mode),
      () => toast.error("Vui lòng kiểm tra lại thông tin form"),
    )();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Đang tải dữ liệu...</div>
    );
  }

  return (
    <FormPageLayout
      disabled={!canSave}
      actions={
        <FormActions
        onSave={() => submitWithMode("save")}
        onSaveStay={() => submitWithMode("save-stay")}
        onReset={() => reset(initialSnapshot)}
        isSubmitting={isSubmitting}
        isUploading={false}
        isEditMode={isEditMode}
        exitPath={returnPath}
        showSaveMail={false}
        saveLabel={isSubmitting ? "Đang lưu..." : isEditMode ? "Cập nhật" : "Lưu"}
        saveStayLabel={isEditMode ? "Cập nhật tại trang" : "Lưu tại trang"}
        readOnlyMode={!canSave}
        readOnlyTitle={isReadOnly ? "Bạn chỉ có quyền xem mẫu email này" : PERMISSION_DENIED_MESSAGE}
      />
      }
    >
      <FormSection
        title="Thông tin mẫu email"
        headerClassName="rounded-2xl border-t-3 border-t-sky-500 text-base text-gray-500"
      >
          <div className="flex flex-col gap-4 rounded-xl border border-slate-100 p-4">
            <p className="text-md font-semibold text-slate-700">Thông tin chung</p>
            <FormField
              label="Loại mẫu"
              type="select"
              options={TEMPLATE_TYPES}
              selectProps={{ ...register("templateType"), disabled: !canSave }}
              error={errors.templateType?.message}
            />
            <FormField label="Tên mẫu" inputProps={{ ...register("name"), disabled: !canSave }} error={errors.name?.message} />
            <FormField
              label="Trạng thái"
              type="select"
              options={TEMPLATE_STATUS_OPTIONS}
              selectProps={{ ...register("status"), disabled: !canSave }}
              error={errors.status?.message}
            />
            <FormField label="Đặt làm mẫu mặc định cho loại này" type="checkbox" inputProps={{ ...register("isDefault"), disabled: !canSave }} />
            <FormField
              label="Ghi chú"
              type="textarea"
              inputProps={{ ...register("note"), rows: 3, disabled: !canSave }}
              error={errors.note?.message}
            />
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-slate-100 p-4">
            <p className="text-md font-semibold text-slate-700">Gợi ý sử dụng mẫu</p>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              <p className="font-semibold text-slate-700">Lưu ý</p>
              <p className="mt-1">
                Mẫu Source nên có <span className="font-semibold">{"{{sourceLink}}"}</span> và{" "}
                <span className="font-semibold">{"{{expiresAt}}"}</span>. Mẫu Hợp đồng nên có{" "}
                <span className="font-semibold">{"{{contractCode}}"}</span> và{" "}
                <span className="font-semibold">{"{{customerName}}"}</span>.
              </p>
            </div>
            <div className="rounded-lg border border-sky-100 bg-sky-50 p-3 text-sm text-sky-800">
              <p className="font-semibold">Chèn biến dữ liệu</p>
              <p className="mt-1">
                Sau khi đặt con trỏ trong phần Nội dung mẫu, bấm biến dữ liệu bên dưới editor để chèn đúng vị trí.
              </p>
            </div>
          </div>

          <FormField
            label="Tiêu đề email"
            className="lg:col-span-2"
            inputProps={{ ...register("subject"), disabled: !canSave }}
            error={errors.subject?.message}
          />

          <div className="lg:col-span-2">
            <input type="hidden" {...register("body")} />
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <label className="block text-sm font-medium text-slate-600">Nội dung mẫu</label>
              <span className="text-xs text-slate-500">
                Đặt con trỏ trong nội dung, rồi bấm biến dữ liệu bên dưới để chèn vào đúng vị trí.
              </span>
            </div>
            <EmailTemplateEditor
              value={body}
              onChange={updateBody}
              variables={variables}
              error={errors.body?.message}
              disabled={!canSave}
            />
          </div>
      </FormSection>
    </FormPageLayout>
  );
}

export default EmailTemplateForm;
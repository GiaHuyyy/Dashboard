import { Copy, Eye } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { FormActions } from "@/components/program-form/FormActions";
import { Button } from "@/components/ui/button-v2";
import FormField from "@/components/ui/form-field";
import { emailTemplateApi } from "@/lib/api-client";

const TEMPLATE_TYPES = [
  { value: "source", label: "Source" },
  { value: "contract", label: "Hợp đồng" },
];

const TEMPLATE_STATUS_OPTIONS = [
  { value: "draft", label: "Bản nháp" },
  { value: "active", label: "Đang dùng" },
];

const VARIABLE_GROUPS = [
  "{{contractCode}}",
  "{{customerName}}",
  "{{module}}",
  "{{description}}",
  "{{assignee}}",
  "{{status}}",
  "{{dueAt}}",
  "{{sourceLink}}",
  "{{expiresAt}}",
];

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
  const [showVariables, setShowVariables] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

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

  const subject = watch("subject");
  const body = watch("body");

  const fetchDetail = useCallback(async () => {
    if (!isEditMode) return;
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
  }, [id, isEditMode, navigate, reset]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  const copyVariable = async (variable) => {
    try {
      await navigator.clipboard.writeText(variable);
      toast.success(`Đã copy ${variable}`);
    } catch {
      toast.error("Không thể copy biến dữ liệu");
    }
  };

  const insertToSubject = (variable) => {
    setValue("subject", `${subject || ""} ${variable}`.trim(), { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = async (values, mode = "save") => {
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
        saveLabel={isSubmitting ? "Đang lưu..." : isEditMode ? "Cập nhật" : "Lưu"}
        saveStayLabel={isEditMode ? "Cập nhật tại trang" : "Lưu tại trang"}
      />

      <div className="rounded-tl-2xl rounded-tr-2xl bg-white shadow-sm">
        <div className="rounded-2xl border-t-3 border-slate-200 border-t-sky-500 px-4 py-3">
          <h2 className="text-base font-semibold text-gray-500">Thông tin mẫu email</h2>
        </div>
        <div className="grid gap-5 border-x border-b border-slate-200 p-5 lg:grid-cols-2">
          <div className="flex flex-col gap-4 rounded-xl border border-slate-100 p-4">
            <p className="text-md font-semibold text-slate-700">Thông tin chung</p>
            <FormField
              label="Loại mẫu"
              type="select"
              options={TEMPLATE_TYPES}
              selectProps={register("templateType")}
              error={errors.templateType?.message}
            />
            <FormField label="Tên mẫu" inputProps={register("name")} error={errors.name?.message} />
            <FormField
              label="Trạng thái"
              type="select"
              options={TEMPLATE_STATUS_OPTIONS}
              selectProps={register("status")}
              error={errors.status?.message}
            />
            <FormField label="Đặt làm mẫu mặc định cho loại này" type="checkbox" inputProps={register("isDefault")} />
            <FormField
              label="Ghi chú"
              type="textarea"
              inputProps={{ ...register("note"), rows: 3 }}
              error={errors.note?.message}
            />
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-slate-100 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-md font-semibold text-slate-700">Biến dữ liệu</p>
              <button
                type="button"
                onClick={() => setShowVariables((prev) => !prev)}
                className="text-sm font-semibold text-sky-700"
              >
                {showVariables ? "Ẩn gợi ý" : "Hiện gợi ý"}
              </button>
            </div>
            {showVariables ? (
              <div className="rounded-lg border border-sky-100 bg-sky-50 p-3 text-sm text-sky-800">
                <p>
                  Bấm biến để copy, hoặc dùng nút chèn vào tiêu đề. Khi gửi mail hệ thống sẽ thay biến bằng dữ liệu
                  thật.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {VARIABLE_GROUPS.map((variable) => (
                    <button
                      type="button"
                      key={variable}
                      onClick={() => copyVariable(variable)}
                      className="rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                    >
                      {variable}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    icon={Copy}
                    variant="primary-outline"
                    size="sm"
                    label="Chèn {{contractCode}} vào tiêu đề"
                    onClick={() => insertToSubject("{{contractCode}}")}
                  />
                  <Button
                    icon={Copy}
                    variant="primary-outline"
                    size="sm"
                    label="Chèn {{customerName}} vào tiêu đề"
                    onClick={() => insertToSubject("{{customerName}}")}
                  />
                </div>
              </div>
            ) : null}

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              <p className="font-semibold text-slate-700">Gợi ý</p>
              <p className="mt-1">
                Mẫu Source nên có <span className="font-semibold">{"{{sourceLink}}"}</span> và{" "}
                <span className="font-semibold">{"{{expiresAt}}"}</span>. Mẫu Hợp đồng nên có{" "}
                <span className="font-semibold">{"{{contractCode}}"}</span> và{" "}
                <span className="font-semibold">{"{{customerName}}"}</span>.
              </p>
            </div>
          </div>

          <FormField
            label="Tiêu đề email"
            className="lg:col-span-2"
            inputProps={register("subject")}
            error={errors.subject?.message}
          />
          <FormField
            label="Nội dung mẫu"
            type="textarea"
            className="lg:col-span-2"
            inputProps={{ ...register("body"), rows: 12 }}
            error={errors.body?.message}
          />
        </div>
      </div>

      <div className="rounded-tl-2xl rounded-tr-2xl bg-white shadow-sm">
        <div className="flex items-center justify-between gap-2 rounded-2xl border-t-3 border-slate-200 border-t-sky-500 px-4 py-3">
          <p className="text-base font-semibold text-gray-500">Preview</p>
          <button
            type="button"
            onClick={() => setShowPreview((prev) => !prev)}
            className="flex items-center gap-1 text-sm font-semibold text-sky-700"
          >
            <Eye className="h-4 w-4" />
            {showPreview ? "Ẩn preview" : "Hiện preview"}
          </button>
        </div>
        {showPreview ? (
          <div className="border-x border-b border-slate-200 p-5">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-800">{subject || "Tiêu đề email"}</p>
              <div className="mt-3 whitespace-pre-wrap leading-6">{body || "Nội dung mẫu email"}</div>
            </div>
          </div>
        ) : null}
      </div>
    </form>
  );
}

export default EmailTemplateForm;

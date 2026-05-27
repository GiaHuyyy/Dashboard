import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { useSelector } from "react-redux";

import { FormActions, FormPageLayout, FormSection } from "@/components/forms";
import { hasPermission } from "@/lib/permissions";
import FormField from "@/components/ui/form-field";
import { domainPriceApi } from "@/lib/api-client";

const PROVIDER_OPTIONS = ["Cloudflare", "GoDaddy", "P.A Việt Nam", "Namecheap", "Khác"];
const formSchema = z.object({
  extension: z
    .string()
    .trim()
    .min(2, "Vui lòng nhập đuôi tên miền")
    .regex(/^\.[a-z0-9-]+$/i, "Đuôi tên miền phải theo dạng .com, .vn, ..."),
  provider: z.string().trim().min(1, "Vui lòng chọn nhà cung cấp"),
  registerPrice: z.coerce.number().gte(0, "Giá đăng ký không hợp lệ"),
  renewalPrice: z.coerce.number().gte(0, "Giá gia hạn không hợp lệ"),
  transferPrice: z.coerce.number().gte(0, "Giá chuyển về không hợp lệ"),
  visible: z.boolean(),
  note: z.string().optional(),
});

const defaultValues = {
  extension: "",
  provider: "Cloudflare",
  registerPrice: 0,
  renewalPrice: 0,
  transferPrice: 0,
  visible: true,
  note: "",
};

function DomainPriceForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const currentUser = useSelector((state) => state.auth.user);
  const canSave = hasPermission(currentUser, isEditMode ? "price.update" : "price.create");
  const isReadOnlyMode = !canSave;
  const [formData, setFormData] = useState(defaultValues);
  const [initialSnapshot, setInitialSnapshot] = useState(defaultValues);
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const mapResponseToForm = (item) => ({
    extension: item?.extension || "",
    provider: item?.provider || "Cloudflare",
    registerPrice: Number(item?.registerPrice) || 0,
    renewalPrice: Number(item?.renewalPrice) || 0,
    transferPrice: Number(item?.transferPrice) || 0,
    visible: Boolean(item?.visible ?? true),
    note: item?.note || "",
  });

  const fetchDetail = useCallback(async () => {
    if (!isEditMode) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await domainPriceApi.detail(id);
      const mapped = mapResponseToForm(response?.domainPrice);
      setFormData(mapped);
      setInitialSnapshot(mapped);
    } catch (error) {
      toast.error(error?.message || "Không thể tải dữ liệu bảng giá tên miền");
      navigate("/bang-gia/ten-mien");
    } finally {
      setIsLoading(false);
    }
  }, [id, isEditMode, navigate]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  const buildPayload = (values) => ({
    extension: values.extension.trim().toLowerCase(),
    provider: values.provider.trim(),
    registerPrice: Number(values.registerPrice),
    renewalPrice: Number(values.renewalPrice),
    transferPrice: Number(values.transferPrice),
    visible: Boolean(values.visible),
    note: values.note?.trim() || "",
  });

  const persist = async (mode) => {
    if (!canSave) {
      toast.error("Bạn không có quyền lưu dữ liệu này");
      return;
    }
    const parsed = formSchema.safeParse(formData);
    if (!parsed.success) {
      const nextErrors = {};
      parsed.error.issues.forEach((issue) => {
        const key = issue.path?.[0];
        if (key && !nextErrors[key]) nextErrors[key] = issue.message;
      });
      setFieldErrors(nextErrors);
      return;
    }
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      const payload = buildPayload(parsed.data);
      if (isEditMode) {
        const response = await domainPriceApi.update(id, payload);
        toast.success(response?.message || "Đã cập nhật bảng giá tên miền");
      } else {
        const response = await domainPriceApi.create(payload);
        toast.success(response?.message || "Đã thêm bảng giá tên miền");
        if (mode === "save-stay" && response?.domainPrice?.id) {
          navigate(`/bang-gia/ten-mien/chinh-sua/${response.domainPrice.id}`, { replace: true });
          return;
        }
      }
      if (mode === "save-stay" && isEditMode) {
        const nextSnapshot = parsed.data;
        setInitialSnapshot(nextSnapshot);
        setFormData(nextSnapshot);
        return;
      }
      if (mode !== "save-stay") navigate("/bang-gia/ten-mien");
    } catch (error) {
      toast.error(error?.message || "Không thể lưu bảng giá tên miền");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Đang tải dữ liệu...</div>
    );
  }

  return (
    <FormPageLayout
      disabled={isReadOnlyMode}
      actions={
        <FormActions
        onSave={() => void persist("save")}
        onSaveStay={() => void persist("save-stay")}
        onSaveMail={() => null}
        onReset={() => {
          setFormData(initialSnapshot);
          setFieldErrors({});
        }}
        isSubmitting={isSubmitting}
        isUploading={false}
        isEditMode={isEditMode}
        exitPath="/bang-gia/ten-mien"
        readOnlyMode={isReadOnlyMode}
        showSaveMail={false}
      />
      }
    >
      <FormSection title="Thông tin bảng giá tên miền">
          <FormField
            label="Đuôi tên miền"
            type="text"
            inputProps={{
              value: formData.extension,
              onChange: (event) => {
                setFormData((prev) => ({ ...prev, extension: event.target.value }));
                setFieldErrors((prev) => ({ ...prev, extension: undefined }));
              },
              placeholder: "Ví dụ: .com",
            }}
            error={fieldErrors.extension}
          />
          <FormField
            label="Nhà cung cấp"
            type="select"
            options={PROVIDER_OPTIONS.map((item) => ({ label: item, value: item }))}
            selectProps={{
              value: formData.provider,
              onChange: (event) => {
                setFormData((prev) => ({ ...prev, provider: event.target.value }));
                setFieldErrors((prev) => ({ ...prev, provider: undefined }));
              },
            }}
            error={fieldErrors.provider}
          />
          <FormField
            label="Giá đăng ký"
            type="number"
            inputProps={{
              min: 0,
              value: formData.registerPrice,
              onChange: (event) => {
                setFormData((prev) => ({ ...prev, registerPrice: event.target.value }));
                setFieldErrors((prev) => ({ ...prev, registerPrice: undefined }));
              },
            }}
            error={fieldErrors.registerPrice}
          />
          <FormField
            label="Giá gia hạn"
            type="number"
            inputProps={{
              min: 0,
              value: formData.renewalPrice,
              onChange: (event) => {
                setFormData((prev) => ({ ...prev, renewalPrice: event.target.value }));
                setFieldErrors((prev) => ({ ...prev, renewalPrice: undefined }));
              },
            }}
            error={fieldErrors.renewalPrice}
          />
          <FormField
            label="Giá chuyển về"
            type="number"
            inputProps={{
              min: 0,
              value: formData.transferPrice,
              onChange: (event) => {
                setFormData((prev) => ({ ...prev, transferPrice: event.target.value }));
                setFieldErrors((prev) => ({ ...prev, transferPrice: undefined }));
              },
            }}
            error={fieldErrors.transferPrice}
          />
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <input
              type="checkbox"
              checked={formData.visible}
              onChange={(event) => setFormData((prev) => ({ ...prev, visible: event.target.checked }))}
            />
            Hiển thị
          </label>
          <div className="lg:col-span-2">
            <FormField
              label="Ghi chú"
              type="textarea"
              inputProps={{
                value: formData.note,
                rows: 3,
                onChange: (event) => setFormData((prev) => ({ ...prev, note: event.target.value })),
              }}
            />
          </div>
      </FormSection>
    </FormPageLayout>
  );
}

export default DomainPriceForm;
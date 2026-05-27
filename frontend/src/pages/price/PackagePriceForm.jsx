import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { useSelector } from "react-redux";

import { FormActions, FormPageLayout, FormSection } from "@/components/forms";
import { hasPermission } from "@/lib/permissions";
import FormField from "@/components/ui/form-field";
import { packagePriceApi } from "@/lib/api-client";
import { PERMISSIONS } from "@/constants/permissions";

const formSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên gói"),
  includesHosting: z.boolean(),
  includesDomain: z.boolean(),
  designPages: z.coerce.number().int("Số trang phải là số nguyên").gt(0, "Số trang phải lớn hơn 0"),
  monthlyPrice: z.coerce.number().gte(0, "Giá tháng không hợp lệ"),
  yearlyPrice: z.coerce.number().gte(0, "Giá năm không hợp lệ"),
  visible: z.boolean(),
  note: z.string().optional(),
});

const defaultValues = {
  name: "",
  includesHosting: true,
  includesDomain: true,
  designPages: 1,
  monthlyPrice: 0,
  yearlyPrice: 0,
  visible: true,
  note: "",
};

function PackagePriceForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const currentUser = useSelector((state) => state.auth.user);
  const canSave = hasPermission(currentUser, isEditMode ? PERMISSIONS.PRICE_UPDATE : PERMISSIONS.PRICE_CREATE);
  const isReadOnlyMode = !canSave;
  const [formData, setFormData] = useState(defaultValues);
  const [initialSnapshot, setInitialSnapshot] = useState(defaultValues);
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const mapResponseToForm = (item) => ({
    name: item?.name || "",
    includesHosting: Boolean(item?.includesHosting ?? true),
    includesDomain: Boolean(item?.includesDomain ?? true),
    designPages: Number(item?.designPages) || 1,
    monthlyPrice: Number(item?.monthlyPrice) || 0,
    yearlyPrice: Number(item?.yearlyPrice) || 0,
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
      const response = await packagePriceApi.detail(id);
      const mapped = mapResponseToForm(response?.packagePrice);
      setFormData(mapped);
      setInitialSnapshot(mapped);
    } catch (error) {
      toast.error(error?.message || "Không thể tải dữ liệu bảng giá trọn gói");
      navigate("/bang-gia/tron-goi");
    } finally {
      setIsLoading(false);
    }
  }, [id, isEditMode, navigate]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  const buildPayload = (values) => ({
    name: values.name.trim(),
    includesHosting: Boolean(values.includesHosting),
    includesDomain: Boolean(values.includesDomain),
    designPages: Number(values.designPages),
    monthlyPrice: Number(values.monthlyPrice),
    yearlyPrice: Number(values.yearlyPrice),
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
        const response = await packagePriceApi.update(id, payload);
        toast.success(response?.message || "Đã cập nhật bảng giá trọn gói");
      } else {
        const response = await packagePriceApi.create(payload);
        toast.success(response?.message || "Đã thêm bảng giá trọn gói");
        if (mode === "save-stay" && response?.packagePrice?.id) {
          navigate(`/bang-gia/tron-goi/chinh-sua/${response.packagePrice.id}`, { replace: true });
          return;
        }
      }
      if (mode === "save-stay" && isEditMode) {
        const nextSnapshot = parsed.data;
        setInitialSnapshot(nextSnapshot);
        setFormData(nextSnapshot);
        return;
      }
      if (mode !== "save-stay") navigate("/bang-gia/tron-goi");
    } catch (error) {
      toast.error(error?.message || "Không thể lưu bảng giá trọn gói");
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
        exitPath="/bang-gia/tron-goi"
        readOnlyMode={isReadOnlyMode}
        showSaveMail={false}
      />
      }
    >
      <FormSection title="Thông tin bảng giá trọn gói">
          <FormField
            label="Tên gói"
            type="text"
            inputProps={{
              value: formData.name,
              onChange: (event) => {
                setFormData((prev) => ({ ...prev, name: event.target.value }));
                setFieldErrors((prev) => ({ ...prev, name: undefined }));
              },
              placeholder: "Ví dụ: Gói Business",
            }}
            error={fieldErrors.name}
          />
          <FormField
            label="Số trang thiết kế"
            type="number"
            inputProps={{
              min: 1,
              value: formData.designPages,
              onChange: (event) => {
                setFormData((prev) => ({ ...prev, designPages: event.target.value }));
                setFieldErrors((prev) => ({ ...prev, designPages: undefined }));
              },
            }}
            error={fieldErrors.designPages}
          />
          <FormField
            label="Giá tháng"
            type="number"
            inputProps={{
              min: 0,
              value: formData.monthlyPrice,
              onChange: (event) => {
                setFormData((prev) => ({ ...prev, monthlyPrice: event.target.value }));
                setFieldErrors((prev) => ({ ...prev, monthlyPrice: undefined }));
              },
            }}
            error={fieldErrors.monthlyPrice}
          />
          <FormField
            label="Giá năm"
            type="number"
            inputProps={{
              min: 0,
              value: formData.yearlyPrice,
              onChange: (event) => {
                setFormData((prev) => ({ ...prev, yearlyPrice: event.target.value }));
                setFieldErrors((prev) => ({ ...prev, yearlyPrice: undefined }));
              },
            }}
            error={fieldErrors.yearlyPrice}
          />
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <input
              type="checkbox"
              checked={formData.includesHosting}
              onChange={(event) => setFormData((prev) => ({ ...prev, includesHosting: event.target.checked }))}
            />
            Bao gồm hosting
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <input
              type="checkbox"
              checked={formData.includesDomain}
              onChange={(event) => setFormData((prev) => ({ ...prev, includesDomain: event.target.checked }))}
            />
            Bao gồm domain
          </label>
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

export default PackagePriceForm;
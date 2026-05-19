import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { FormActions } from "@/components/program-form/FormActions";
import FormField from "@/components/ui/form-field";
import { sslPriceApi } from "@/lib/api-client";

const SSL_TYPES = ["DV", "OV", "EV", "Wildcard"];
const VALIDITY_OPTIONS = ["3", "6", "12", "24", "36"];
const formSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập Tên gói SSL"),
  sslType: z.enum(SSL_TYPES, { message: "Vui lòng chọn Loại SSL hợp lệ" }),
  validityMonths: z.coerce.number().int("Thời hạn phải là số nguyên").gt(0, "Thời hạn phải lớn hơn 0"),
  warrantyAmount: z.coerce.number().gte(0, "Mức bảo hiểm không hợp lệ"),
  price: z.coerce.number().gte(0, "Giá không hợp lệ"),
  visible: z.boolean(),
  note: z.string().optional(),
});
const defaultValues = {
  name: "",
  sslType: "DV",
  validityMonths: 12,
  warrantyAmount: 0,
  price: 0,
  visible: true,
  note: "",
};

function SslPriceForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [formData, setFormData] = useState(defaultValues);
  const [initialSnapshot, setInitialSnapshot] = useState(defaultValues);
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const mapResponseToForm = (item) => ({
    name: item?.name || "",
    sslType: item?.sslType || "DV",
    validityMonths: Number(item?.validityMonths) || 12,
    warrantyAmount: Number(item?.warrantyAmount) || 0,
    price: Number(item?.price) || 0,
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
      const response = await sslPriceApi.detail(id);
      const mapped = mapResponseToForm(response?.sslPrice);
      setFormData(mapped);
      setInitialSnapshot(mapped);
    } catch (error) {
      toast.error(error?.message || "Không thể tải dữ liệu bảng giá SSL");
      navigate("/bang-gia/ssl");
    } finally {
      setIsLoading(false);
    }
  }, [id, isEditMode, navigate]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  const buildPayload = (values) => ({
    name: values.name.trim(),
    sslType: values.sslType,
    validityMonths: Number(values.validityMonths),
    warrantyAmount: Number(values.warrantyAmount),
    price: Number(values.price),
    visible: Boolean(values.visible),
    note: values.note?.trim() || "",
  });

  const persist = async (mode) => {
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
        const response = await sslPriceApi.update(id, payload);
        toast.success(response?.message || "Đã cập nhật bảng giá SSL");
      } else {
        const response = await sslPriceApi.create(payload);
        toast.success(response?.message || "Đã thêm bảng giá SSL");
        if (mode === "save-stay" && response?.sslPrice?.id) {
          navigate(`/bang-gia/ssl/chinh-sua/${response.sslPrice.id}`, { replace: true });
          return;
        }
      }
      if (mode === "save-stay" && isEditMode) {
        const nextSnapshot = parsed.data;
        setInitialSnapshot(nextSnapshot);
        setFormData(nextSnapshot);
        return;
      }
      if (mode !== "save-stay") navigate("/bang-gia/ssl");
    } catch (error) {
      toast.error(error?.message || "Không thể lưu bảng giá SSL");
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
    <form className="space-y-4">
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
        exitPath="/bang-gia/ssl"
        showSaveMail={false}
      />

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-3 text-lg font-semibold text-slate-700">
          Thông tin bảng giá SSL
        </div>
        <div className="grid gap-5 p-5 lg:grid-cols-2">
          <FormField
            label="Tên gói SSL"
            type="text"
            inputProps={{
              value: formData.name,
              onChange: (event) => {
                setFormData((prev) => ({ ...prev, name: event.target.value }));
                setFieldErrors((prev) => ({ ...prev, name: undefined }));
              },
              placeholder: "Nhập tên gói SSL",
            }}
            error={fieldErrors.name}
          />
          <FormField
            label="Loại SSL"
            type="select"
            options={SSL_TYPES.map((item) => ({ label: item, value: item }))}
            selectProps={{
              value: formData.sslType,
              onChange: (event) => {
                setFormData((prev) => ({ ...prev, sslType: event.target.value }));
                setFieldErrors((prev) => ({ ...prev, sslType: undefined }));
              },
            }}
            error={fieldErrors.sslType}
          />
          <FormField
            label="Thời hạn (tháng)"
            type="select"
            options={VALIDITY_OPTIONS.map((item) => ({ label: `${item} tháng`, value: item }))}
            selectProps={{
              value: String(formData.validityMonths),
              onChange: (event) => {
                setFormData((prev) => ({ ...prev, validityMonths: Number(event.target.value) }));
                setFieldErrors((prev) => ({ ...prev, validityMonths: undefined }));
              },
            }}
            error={fieldErrors.validityMonths}
          />
          <FormField
            label="Giá"
            type="number"
            inputProps={{
              min: 0,
              value: formData.price,
              onChange: (event) => {
                setFormData((prev) => ({ ...prev, price: event.target.value }));
                setFieldErrors((prev) => ({ ...prev, price: undefined }));
              },
            }}
            error={fieldErrors.price}
          />
          <FormField
            label="Mức bảo hiểm"
            type="number"
            inputProps={{
              min: 0,
              value: formData.warrantyAmount,
              onChange: (event) => {
                setFormData((prev) => ({ ...prev, warrantyAmount: event.target.value }));
                setFieldErrors((prev) => ({ ...prev, warrantyAmount: undefined }));
              },
            }}
            error={fieldErrors.warrantyAmount}
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
        </div>
      </div>
    </form>
  );
}

export default SslPriceForm;

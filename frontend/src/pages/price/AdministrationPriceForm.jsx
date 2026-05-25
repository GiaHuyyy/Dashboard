import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { useSelector } from "react-redux";

import { FormActions } from "@/components/program-form/FormActions";
import { hasPermission } from "@/lib/permissions";
import FormField from "@/components/ui/form-field";
import { administrationPriceApi } from "@/lib/api-client";

const SCOPE_OPTIONS = ["Website", "Hệ thống", "Server"];
const FREQUENCY_OPTIONS = ["Tháng", "Quý", "Năm", "Theo yêu cầu"];
const formSchema = z.object({
  serviceName: z.string().trim().min(1, "Vui lòng nhập tên dịch vụ"),
  scope: z.enum(SCOPE_OPTIONS, { message: "Vui lòng chọn phạm vi hợp lệ" }),
  frequency: z.enum(FREQUENCY_OPTIONS, { message: "Vui lòng chọn chu kỳ hợp lệ" }),
  price: z.coerce.number().gte(0, "Giá không hợp lệ"),
  slaHours: z.coerce.number().int("SLA phải là số nguyên").gte(0, "SLA không hợp lệ"),
  visible: z.boolean(),
  note: z.string().optional(),
});

const defaultValues = {
  serviceName: "",
  scope: "Website",
  frequency: "Tháng",
  price: 0,
  slaHours: 0,
  visible: true,
  note: "",
};

function AdministrationPriceForm() {
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
    serviceName: item?.serviceName || "",
    scope: item?.scope || "Website",
    frequency: item?.frequency || "Tháng",
    price: Number(item?.price) || 0,
    slaHours: Number(item?.slaHours) || 0,
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
      const response = await administrationPriceApi.detail(id);
      const mapped = mapResponseToForm(response?.administrationPrice);
      setFormData(mapped);
      setInitialSnapshot(mapped);
    } catch (error) {
      toast.error(error?.message || "Không thể tải dữ liệu bảng giá quản trị");
      navigate("/bang-gia/quan-tri");
    } finally {
      setIsLoading(false);
    }
  }, [id, isEditMode, navigate]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  const buildPayload = (values) => ({
    serviceName: values.serviceName.trim(),
    scope: values.scope,
    frequency: values.frequency,
    price: Number(values.price),
    slaHours: Number(values.slaHours),
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
        const response = await administrationPriceApi.update(id, payload);
        toast.success(response?.message || "Đã cập nhật bảng giá quản trị");
      } else {
        const response = await administrationPriceApi.create(payload);
        toast.success(response?.message || "Đã thêm bảng giá quản trị");
        if (mode === "save-stay" && response?.administrationPrice?.id) {
          navigate(`/bang-gia/quan-tri/chinh-sua/${response.administrationPrice.id}`, { replace: true });
          return;
        }
      }
      if (mode === "save-stay" && isEditMode) {
        const nextSnapshot = parsed.data;
        setInitialSnapshot(nextSnapshot);
        setFormData(nextSnapshot);
        return;
      }
      if (mode !== "save-stay") navigate("/bang-gia/quan-tri");
    } catch (error) {
      toast.error(error?.message || "Không thể lưu bảng giá quản trị");
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
        exitPath="/bang-gia/quan-tri"
        readOnlyMode={isReadOnlyMode}
        showSaveMail={false}
      />

      <fieldset disabled={isReadOnlyMode} className="contents">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-3 text-lg font-semibold text-slate-700">
          Thông tin bảng giá quản trị
        </div>
        <div className="grid gap-5 p-5 lg:grid-cols-2">
          <FormField
            label="Tên dịch vụ"
            type="text"
            inputProps={{
              value: formData.serviceName,
              onChange: (event) => {
                setFormData((prev) => ({ ...prev, serviceName: event.target.value }));
                setFieldErrors((prev) => ({ ...prev, serviceName: undefined }));
              },
              placeholder: "Ví dụ: Quản trị nội dung website",
            }}
            error={fieldErrors.serviceName}
          />
          <FormField
            label="Phạm vi"
            type="select"
            options={SCOPE_OPTIONS.map((item) => ({ label: item, value: item }))}
            selectProps={{
              value: formData.scope,
              onChange: (event) => {
                setFormData((prev) => ({ ...prev, scope: event.target.value }));
                setFieldErrors((prev) => ({ ...prev, scope: undefined }));
              },
            }}
            error={fieldErrors.scope}
          />
          <FormField
            label="Chu kỳ"
            type="select"
            options={FREQUENCY_OPTIONS.map((item) => ({ label: item, value: item }))}
            selectProps={{
              value: formData.frequency,
              onChange: (event) => {
                setFormData((prev) => ({ ...prev, frequency: event.target.value }));
                setFieldErrors((prev) => ({ ...prev, frequency: undefined }));
              },
            }}
            error={fieldErrors.frequency}
          />
          <FormField
            label="SLA (giờ)"
            type="number"
            inputProps={{
              min: 0,
              value: formData.slaHours,
              onChange: (event) => {
                setFormData((prev) => ({ ...prev, slaHours: event.target.value }));
                setFieldErrors((prev) => ({ ...prev, slaHours: undefined }));
              },
            }}
            error={fieldErrors.slaHours}
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
      </fieldset>
    </form>
  );
}

export default AdministrationPriceForm;
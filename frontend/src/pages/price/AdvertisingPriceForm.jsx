import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { useSelector } from "react-redux";

import { FormActions } from "@/components/program-form/FormActions";
import { hasPermission } from "@/lib/permissions";
import FormField from "@/components/ui/form-field";
import { advertisingPriceApi } from "@/lib/api-client";

const PLATFORM_OPTIONS = ["Google", "Facebook", "TikTok", "Zalo"];
const formSchema = z.object({
  platform: z.enum(PLATFORM_OPTIONS, { message: "Vui lòng chọn nền tảng hợp lệ" }),
  packageName: z.string().trim().min(1, "Vui lòng nhập tên gói quảng cáo"),
  minimumBudget: z.coerce.number().gte(0, "Ngân sách tối thiểu không hợp lệ"),
  serviceFeePercent: z.coerce.number().gte(0, "Phí dịch vụ không hợp lệ").lte(100, "Phí dịch vụ tối đa 100%"),
  setupFee: z.coerce.number().gte(0, "Phí setup không hợp lệ"),
  visible: z.boolean(),
  note: z.string().optional(),
});

const defaultValues = {
  platform: "Google",
  packageName: "",
  minimumBudget: 0,
  serviceFeePercent: 0,
  setupFee: 0,
  visible: true,
  note: "",
};

function AdvertisingPriceForm() {
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
    platform: item?.platform || "Google",
    packageName: item?.packageName || "",
    minimumBudget: Number(item?.minimumBudget) || 0,
    serviceFeePercent: Number(item?.serviceFeePercent) || 0,
    setupFee: Number(item?.setupFee) || 0,
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
      const response = await advertisingPriceApi.detail(id);
      const mapped = mapResponseToForm(response?.advertisingPrice);
      setFormData(mapped);
      setInitialSnapshot(mapped);
    } catch (error) {
      toast.error(error?.message || "Không thể tải dữ liệu bảng giá quảng cáo");
      navigate("/bang-gia/quang-cao");
    } finally {
      setIsLoading(false);
    }
  }, [id, isEditMode, navigate]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  const buildPayload = (values) => ({
    platform: values.platform,
    packageName: values.packageName.trim(),
    minimumBudget: Number(values.minimumBudget),
    serviceFeePercent: Number(values.serviceFeePercent),
    setupFee: Number(values.setupFee),
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
        const response = await advertisingPriceApi.update(id, payload);
        toast.success(response?.message || "Đã cập nhật bảng giá quảng cáo");
      } else {
        const response = await advertisingPriceApi.create(payload);
        toast.success(response?.message || "Đã thêm bảng giá quảng cáo");
        if (mode === "save-stay" && response?.advertisingPrice?.id) {
          navigate(`/bang-gia/quang-cao/chinh-sua/${response.advertisingPrice.id}`, { replace: true });
          return;
        }
      }
      if (mode === "save-stay" && isEditMode) {
        const nextSnapshot = parsed.data;
        setInitialSnapshot(nextSnapshot);
        setFormData(nextSnapshot);
        return;
      }
      if (mode !== "save-stay") navigate("/bang-gia/quang-cao");
    } catch (error) {
      toast.error(error?.message || "Không thể lưu bảng giá quảng cáo");
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
        exitPath="/bang-gia/quang-cao"
        readOnlyMode={isReadOnlyMode}
        showSaveMail={false}
      />

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-3 text-lg font-semibold text-slate-700">
          Thông tin bảng giá quảng cáo
        </div>
        <div className="grid gap-5 p-5 lg:grid-cols-2">
          <FormField
            label="Nền tảng"
            type="select"
            options={PLATFORM_OPTIONS.map((item) => ({ label: item, value: item }))}
            selectProps={{
              value: formData.platform,
              onChange: (event) => {
                setFormData((prev) => ({ ...prev, platform: event.target.value }));
                setFieldErrors((prev) => ({ ...prev, platform: undefined }));
              },
            }}
            error={fieldErrors.platform}
          />
          <FormField
            label="Tên gói"
            type="text"
            inputProps={{
              value: formData.packageName,
              onChange: (event) => {
                setFormData((prev) => ({ ...prev, packageName: event.target.value }));
                setFieldErrors((prev) => ({ ...prev, packageName: undefined }));
              },
              placeholder: "Ví dụ: Gói tăng đơn cơ bản",
            }}
            error={fieldErrors.packageName}
          />
          <FormField
            label="Ngân sách tối thiểu"
            type="number"
            inputProps={{
              min: 0,
              value: formData.minimumBudget,
              onChange: (event) => {
                setFormData((prev) => ({ ...prev, minimumBudget: event.target.value }));
                setFieldErrors((prev) => ({ ...prev, minimumBudget: undefined }));
              },
            }}
            error={fieldErrors.minimumBudget}
          />
          <FormField
            label="Phí dịch vụ (%)"
            type="number"
            inputProps={{
              min: 0,
              max: 100,
              value: formData.serviceFeePercent,
              onChange: (event) => {
                setFormData((prev) => ({ ...prev, serviceFeePercent: event.target.value }));
                setFieldErrors((prev) => ({ ...prev, serviceFeePercent: undefined }));
              },
            }}
            error={fieldErrors.serviceFeePercent}
          />
          <FormField
            label="Phí setup"
            type="number"
            inputProps={{
              min: 0,
              value: formData.setupFee,
              onChange: (event) => {
                setFormData((prev) => ({ ...prev, setupFee: event.target.value }));
                setFieldErrors((prev) => ({ ...prev, setupFee: undefined }));
              },
            }}
            error={fieldErrors.setupFee}
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

export default AdvertisingPriceForm;
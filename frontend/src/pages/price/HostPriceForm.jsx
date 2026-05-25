import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { useSelector } from "react-redux";

import { FormActions } from "@/components/program-form/FormActions";
import { hasPermission } from "@/lib/permissions";
import FormField from "@/components/ui/form-field";
import { hostPriceApi } from "@/lib/api-client";

const STORAGE_UNIT_OPTIONS = ["MB", "GB", "TB"];
const formSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên hosting"),
  storageValue: z.coerce.number().gt(0, "Dung lượng phải lớn hơn 0"),
  storageUnit: z.enum(STORAGE_UNIT_OPTIONS, { message: "Vui lòng chọn đơn vị dung lượng hợp lệ" }),
  monthlyPrice: z.coerce.number().gte(0, "Giá tháng không hợp lệ"),
  yearlyPrice1: z.coerce.number().gte(0, "Giá năm 1 không hợp lệ"),
  yearlyPrice2: z.coerce.number().gte(0, "Giá năm 2 không hợp lệ"),
  yearlyPrice3: z.coerce.number().gte(0, "Giá năm 3 không hợp lệ"),
  visible: z.boolean(),
  note: z.string().optional(),
});

const defaultValues = {
  name: "",
  storageValue: 1,
  storageUnit: "GB",
  monthlyPrice: 0,
  yearlyPrice1: 0,
  yearlyPrice2: 0,
  yearlyPrice3: 0,
  visible: true,
  note: "",
};

const parseStorage = (storage = "") => {
  const match = String(storage)
    .trim()
    .match(/^(\d+(?:\.\d+)?)\s*(MB|GB|TB)$/i);
  if (!match) return { storageValue: 1, storageUnit: "GB" };
  return {
    storageValue: Number(match[1]) || 1,
    storageUnit: String(match[2]).toUpperCase(),
  };
};

function HostPriceForm() {
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

  const mapResponseToForm = (item) => {
    const storage = parseStorage(item?.storage);
    return {
      name: item?.name || "",
      storageValue: storage.storageValue,
      storageUnit: storage.storageUnit,
      monthlyPrice: Number(item?.monthlyPrice) || 0,
      yearlyPrice1: Number(item?.yearlyPrice1) || 0,
      yearlyPrice2: Number(item?.yearlyPrice2) || 0,
      yearlyPrice3: Number(item?.yearlyPrice3) || 0,
      visible: Boolean(item?.visible ?? true),
      note: item?.note || "",
    };
  };

  const fetchDetail = useCallback(async () => {
    if (!isEditMode) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await hostPriceApi.detail(id);
      const mapped = mapResponseToForm(response?.hostPrice);
      setFormData(mapped);
      setInitialSnapshot(mapped);
    } catch (error) {
      toast.error(error?.message || "Không thể tải dữ liệu bảng giá host");
      navigate("/bang-gia/host");
    } finally {
      setIsLoading(false);
    }
  }, [id, isEditMode, navigate]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  const buildPayload = (values) => ({
    name: values.name.trim(),
    storage: `${values.storageValue} ${values.storageUnit}`,
    monthlyPrice: Number(values.monthlyPrice),
    yearlyPrice1: Number(values.yearlyPrice1),
    yearlyPrice2: Number(values.yearlyPrice2),
    yearlyPrice3: Number(values.yearlyPrice3),
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
        const response = await hostPriceApi.update(id, payload);
        toast.success(response?.message || "Đã cập nhật bảng giá host");
      } else {
        const response = await hostPriceApi.create(payload);
        toast.success(response?.message || "Đã thêm bảng giá host");
        if (mode === "save-stay" && response?.hostPrice?.id) {
          navigate(`/bang-gia/host/chinh-sua/${response.hostPrice.id}`, { replace: true });
          return;
        }
      }

      if (mode === "save-stay" && isEditMode) {
        const nextSnapshot = parsed.data;
        setInitialSnapshot(nextSnapshot);
        setFormData(nextSnapshot);
        return;
      }

      if (mode !== "save-stay") {
        navigate("/bang-gia/host");
      }
    } catch (error) {
      toast.error(error?.message || "Không thể lưu bảng giá host");
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
        exitPath="/bang-gia/host"
        readOnlyMode={isReadOnlyMode}
        showSaveMail={false}
      />

      <fieldset disabled={isReadOnlyMode} className="contents">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-3 text-lg font-semibold text-slate-700">
          Thông tin bảng giá host
        </div>
        <div className="grid gap-5 p-5 lg:grid-cols-2">
          <FormField
            label="Tên hosting"
            type="text"
            inputProps={{
              value: formData.name,
              onChange: (event) => {
                setFormData((prev) => ({ ...prev, name: event.target.value }));
                setFieldErrors((prev) => ({ ...prev, name: undefined }));
              },
              placeholder: "Nhập tên gói host",
            }}
            error={fieldErrors.name}
          />
          <div className="grid grid-cols-[2fr_1fr] gap-2">
            <FormField
              label="Dung lượng"
              type="number"
              inputProps={{
                min: 0.1,
                step: "0.1",
                value: formData.storageValue,
                onChange: (event) => {
                  setFormData((prev) => ({ ...prev, storageValue: event.target.value }));
                  setFieldErrors((prev) => ({ ...prev, storageValue: undefined }));
                },
                placeholder: "Ví dụ: 10",
              }}
              error={fieldErrors.storageValue}
            />
            <FormField
              label="Đơn vị"
              type="select"
              options={STORAGE_UNIT_OPTIONS.map((item) => ({ label: item, value: item }))}
              selectProps={{
                value: formData.storageUnit,
                onChange: (event) => {
                  setFormData((prev) => ({ ...prev, storageUnit: event.target.value }));
                  setFieldErrors((prev) => ({ ...prev, storageUnit: undefined }));
                },
              }}
              error={fieldErrors.storageUnit}
            />
          </div>
          <FormField
            label="Giá tháng"
            type="number"
            inputProps={{
              value: formData.monthlyPrice,
              min: 0,
              onChange: (event) => {
                setFormData((prev) => ({ ...prev, monthlyPrice: event.target.value }));
                setFieldErrors((prev) => ({ ...prev, monthlyPrice: undefined }));
              },
            }}
            error={fieldErrors.monthlyPrice}
          />
          <FormField
            label="Giá năm 1"
            type="number"
            inputProps={{
              value: formData.yearlyPrice1,
              min: 0,
              onChange: (event) => {
                setFormData((prev) => ({ ...prev, yearlyPrice1: event.target.value }));
                setFieldErrors((prev) => ({ ...prev, yearlyPrice1: undefined }));
              },
            }}
            error={fieldErrors.yearlyPrice1}
          />
          <FormField
            label="Giá năm 2"
            type="number"
            inputProps={{
              value: formData.yearlyPrice2,
              min: 0,
              onChange: (event) => {
                setFormData((prev) => ({ ...prev, yearlyPrice2: event.target.value }));
                setFieldErrors((prev) => ({ ...prev, yearlyPrice2: undefined }));
              },
            }}
            error={fieldErrors.yearlyPrice2}
          />
          <FormField
            label="Giá năm 3"
            type="number"
            inputProps={{
              value: formData.yearlyPrice3,
              min: 0,
              onChange: (event) => {
                setFormData((prev) => ({ ...prev, yearlyPrice3: event.target.value }));
                setFieldErrors((prev) => ({ ...prev, yearlyPrice3: undefined }));
              },
            }}
            error={fieldErrors.yearlyPrice3}
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

export default HostPriceForm;
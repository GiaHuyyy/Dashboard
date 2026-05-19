import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { FormActions } from "@/components/program-form/FormActions";
import FormField from "@/components/ui/form-field";
import { hostPriceApi } from "@/lib/api-client";

const defaultValues = {
  name: "",
  storage: "",
  monthlyPrice: 0,
  yearlyPrice1: 0,
  yearlyPrice2: 0,
  yearlyPrice3: 0,
  visible: true,
  note: "",
};

function HostPriceForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [formData, setFormData] = useState(defaultValues);
  const [initialSnapshot, setInitialSnapshot] = useState(defaultValues);
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mapResponseToForm = (item) => ({
    name: item?.name || "",
    storage: item?.storage || "",
    monthlyPrice: Number(item?.monthlyPrice) || 0,
    yearlyPrice1: Number(item?.yearlyPrice1) || 0,
    yearlyPrice2: Number(item?.yearlyPrice2) || 0,
    yearlyPrice3: Number(item?.yearlyPrice3) || 0,
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

  const buildPayload = () => ({
    name: formData.name.trim(),
    storage: formData.storage.trim(),
    monthlyPrice: Number(formData.monthlyPrice),
    yearlyPrice1: Number(formData.yearlyPrice1),
    yearlyPrice2: Number(formData.yearlyPrice2),
    yearlyPrice3: Number(formData.yearlyPrice3),
    visible: Boolean(formData.visible),
    note: formData.note.trim(),
  });

  const persist = async (mode) => {
    if (!formData.name.trim() || !formData.storage.trim()) {
      toast.error("Vui lòng nhập Tên hosting và Dung lượng");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = buildPayload();
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
        const nextSnapshot = buildPayload();
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
        onReset={() => setFormData(initialSnapshot)}
        isSubmitting={isSubmitting}
        isUploading={false}
        isEditMode={isEditMode}
        exitPath="/bang-gia/host"
        showSaveMail={false}
      />

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-3 text-lg font-semibold text-slate-700">Thông tin bảng giá host</div>
        <div className="grid gap-5 p-5 lg:grid-cols-2">
          <FormField
            label="Tên hosting"
            type="text"
            inputProps={{
              value: formData.name,
              onChange: (event) => setFormData((prev) => ({ ...prev, name: event.target.value })),
              placeholder: "Nhập tên gói host",
            }}
          />
          <FormField
            label="Dung lượng"
            type="text"
            inputProps={{
              value: formData.storage,
              onChange: (event) => setFormData((prev) => ({ ...prev, storage: event.target.value })),
              placeholder: "Ví dụ: 10GB",
            }}
          />
          <FormField
            label="Giá tháng"
            type="number"
            inputProps={{
              value: formData.monthlyPrice,
              min: 0,
              onChange: (event) => setFormData((prev) => ({ ...prev, monthlyPrice: event.target.value })),
            }}
          />
          <FormField
            label="Giá năm 1"
            type="number"
            inputProps={{
              value: formData.yearlyPrice1,
              min: 0,
              onChange: (event) => setFormData((prev) => ({ ...prev, yearlyPrice1: event.target.value })),
            }}
          />
          <FormField
            label="Giá năm 2"
            type="number"
            inputProps={{
              value: formData.yearlyPrice2,
              min: 0,
              onChange: (event) => setFormData((prev) => ({ ...prev, yearlyPrice2: event.target.value })),
            }}
          />
          <FormField
            label="Giá năm 3"
            type="number"
            inputProps={{
              value: formData.yearlyPrice3,
              min: 0,
              onChange: (event) => setFormData((prev) => ({ ...prev, yearlyPrice3: event.target.value })),
            }}
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

export default HostPriceForm;

import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { FormActions } from "@/components/program-form/FormActions";
import FormField from "@/components/ui/form-field";
import { packagePriceApi } from "@/lib/api-client";

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
  const [formData, setFormData] = useState(defaultValues);
  const [initialSnapshot, setInitialSnapshot] = useState(defaultValues);
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const buildPayload = () => ({
    name: formData.name.trim(),
    includesHosting: Boolean(formData.includesHosting),
    includesDomain: Boolean(formData.includesDomain),
    designPages: Number(formData.designPages),
    monthlyPrice: Number(formData.monthlyPrice),
    yearlyPrice: Number(formData.yearlyPrice),
    visible: Boolean(formData.visible),
    note: formData.note.trim(),
  });

  const persist = async (mode) => {
    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập tên gói trọn gói");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = buildPayload();
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
        const nextSnapshot = buildPayload();
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
    <form className="space-y-4">
      <FormActions
        onSave={() => void persist("save")}
        onSaveStay={() => void persist("save-stay")}
        onSaveMail={() => null}
        onReset={() => setFormData(initialSnapshot)}
        isSubmitting={isSubmitting}
        isUploading={false}
        isEditMode={isEditMode}
        exitPath="/bang-gia/tron-goi"
        showSaveMail={false}
      />

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-3 text-lg font-semibold text-slate-700">
          Thông tin bảng giá trọn gói
        </div>
        <div className="grid gap-5 p-5 lg:grid-cols-2">
          <FormField
            label="Tên gói"
            type="text"
            inputProps={{
              value: formData.name,
              onChange: (event) => setFormData((prev) => ({ ...prev, name: event.target.value })),
            }}
          />
          <FormField
            label="Số trang thiết kế"
            type="number"
            inputProps={{
              min: 1,
              value: formData.designPages,
              onChange: (event) => setFormData((prev) => ({ ...prev, designPages: event.target.value })),
            }}
          />
          <FormField
            label="Giá tháng"
            type="number"
            inputProps={{
              min: 0,
              value: formData.monthlyPrice,
              onChange: (event) => setFormData((prev) => ({ ...prev, monthlyPrice: event.target.value })),
            }}
          />
          <FormField
            label="Giá năm"
            type="number"
            inputProps={{
              min: 0,
              value: formData.yearlyPrice,
              onChange: (event) => setFormData((prev) => ({ ...prev, yearlyPrice: event.target.value })),
            }}
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
        </div>
      </div>
    </form>
  );
}

export default PackagePriceForm;

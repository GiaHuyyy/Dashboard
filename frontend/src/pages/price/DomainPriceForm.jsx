import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { FormActions } from "@/components/program-form/FormActions";
import FormField from "@/components/ui/form-field";
import { domainPriceApi } from "@/lib/api-client";

const defaultValues = {
  extension: "",
  provider: "",
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
  const [formData, setFormData] = useState(defaultValues);
  const [initialSnapshot, setInitialSnapshot] = useState(defaultValues);
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mapResponseToForm = (item) => ({
    extension: item?.extension || "",
    provider: item?.provider || "",
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

  const buildPayload = () => ({
    extension: formData.extension.trim(),
    provider: formData.provider.trim(),
    registerPrice: Number(formData.registerPrice),
    renewalPrice: Number(formData.renewalPrice),
    transferPrice: Number(formData.transferPrice),
    visible: Boolean(formData.visible),
    note: formData.note.trim(),
  });

  const persist = async (mode) => {
    if (!formData.extension.trim() || !formData.provider.trim()) {
      toast.error("Vui lòng nhập đầy đủ đuôi tên miền và nhà cung cấp");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = buildPayload();
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
        const nextSnapshot = buildPayload();
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
    <form className="space-y-4">
      <FormActions
        onSave={() => void persist("save")}
        onSaveStay={() => void persist("save-stay")}
        onSaveMail={() => null}
        onReset={() => setFormData(initialSnapshot)}
        isSubmitting={isSubmitting}
        isUploading={false}
        isEditMode={isEditMode}
        exitPath="/bang-gia/ten-mien"
        showSaveMail={false}
      />

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-3 text-lg font-semibold text-slate-700">
          Thông tin bảng giá tên miền
        </div>
        <div className="grid gap-5 p-5 lg:grid-cols-2">
          <FormField
            label="Đuôi tên miền"
            type="text"
            inputProps={{
              value: formData.extension,
              onChange: (event) => setFormData((prev) => ({ ...prev, extension: event.target.value })),
              placeholder: "Ví dụ: .com",
            }}
          />
          <FormField
            label="Nhà cung cấp"
            type="text"
            inputProps={{
              value: formData.provider,
              onChange: (event) => setFormData((prev) => ({ ...prev, provider: event.target.value })),
            }}
          />
          <FormField
            label="Giá đăng ký"
            type="number"
            inputProps={{
              min: 0,
              value: formData.registerPrice,
              onChange: (event) => setFormData((prev) => ({ ...prev, registerPrice: event.target.value })),
            }}
          />
          <FormField
            label="Giá gia hạn"
            type="number"
            inputProps={{
              min: 0,
              value: formData.renewalPrice,
              onChange: (event) => setFormData((prev) => ({ ...prev, renewalPrice: event.target.value })),
            }}
          />
          <FormField
            label="Giá chuyển về"
            type="number"
            inputProps={{
              min: 0,
              value: formData.transferPrice,
              onChange: (event) => setFormData((prev) => ({ ...prev, transferPrice: event.target.value })),
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

export default DomainPriceForm;

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { FormActions } from "@/components/program-form/FormActions";
import { ImageLightbox } from "@/components/program-form/ImageLightbox";
import { ImageUpload } from "@/components/program-form/ImageUpload";
import FormField from "@/components/ui/form-field";
import { HANDOVER_STATUS_OPTIONS } from "@/constants/business-contract";
import { MAIL_STATUS_OPTIONS, STATUS_OPTIONS } from "@/constants/program";
import { businessContractApi, staffApi } from "@/lib/api-client";
import { getStaffNamesByRole, toSelectOptions } from "@/lib/staff-roles";
import { uploadApi } from "@/lib/upload";

const schema = z.object({
  contractCode: z.string().trim().min(1, "Vui lòng nhập số hợp đồng"),
  contractName: z.string().trim().min(1, "Vui lòng nhập tên hợp đồng"),
  customerName: z.string().trim().min(1, "Vui lòng nhập tên khách hàng"),
  customerPhone: z.string().optional(),
  customerEmail: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), "Email khách hàng không hợp lệ"),
  status: z.enum(STATUS_OPTIONS, { message: "Vui lòng chọn trạng thái hợp lệ" }),
  mailStatus: z.enum(MAIL_STATUS_OPTIONS, { message: "Vui lòng chọn mail nhận hợp lệ" }),
  selectedSalesStaff: z.string().trim().min(1, "Vui lòng chọn nhân viên kinh doanh"),
  salesReceiverName: z.string().trim().min(1, "Vui lòng nhập tên người nhận"),
  salesReceiverEmail: z.string().trim().email("Email nhận không hợp lệ"),
  ccEmails: z
    .string()
    .optional()
    .refine((value) => {
      if (!value?.trim()) return true;
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .every((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
    }, "Danh sách email cc không hợp lệ"),
  handoverStatus: z.enum(HANDOVER_STATUS_OPTIONS, { message: "Vui lòng chọn trạng thái bàn giao hợp lệ" }),
  handoverAt: z.string().optional(),
  visible: z.boolean(),
  note: z.string().optional(),
});

const defaultValues = {
  contractCode: "",
  contractName: "",
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  status: STATUS_OPTIONS[0],
  mailStatus: MAIL_STATUS_OPTIONS[0],
  selectedSalesStaff: "",
  salesReceiverName: "",
  salesReceiverEmail: "",
  ccEmails: "",
  handoverStatus: HANDOVER_STATUS_OPTIONS[0],
  handoverAt: "",
  visible: true,
  note: "",
};

const toDateTimeLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
};

const mapDetailToForm = (contract) => ({
  contractCode: contract.contractCode || "",
  contractName: contract.contractName || "",
  customerName: contract.customerName || "",
  customerPhone: contract.customerPhone || "",
  customerEmail: contract.customerEmail || "",
  status: contract.status || STATUS_OPTIONS[0],
  mailStatus: contract.mailStatus || MAIL_STATUS_OPTIONS[0],
  selectedSalesStaff: contract.selectedSalesStaff || "",
  salesReceiverName: contract.salesReceiverName || "",
  salesReceiverEmail: contract.salesReceiverEmail || "",
  ccEmails: Array.isArray(contract.ccEmails) ? contract.ccEmails.join(", ") : "",
  handoverStatus: contract.handoverStatus || HANDOVER_STATUS_OPTIONS[0],
  handoverAt: toDateTimeLocal(contract.handoverAt),
  visible: Boolean(contract.visible ?? true),
  note: contract.note || "",
});

const mapImages = (images = []) =>
  Array.isArray(images)
    ? images.map((url) => ({ kind: "url", url })).filter((item) => item.url)
    : [];

function BusinessForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [contractImages, setContractImages] = useState([]);
  const contractImagesRef = useRef([]);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [initialSnapshot, setInitialSnapshot] = useState({ values: defaultValues, images: [] });
  const [staffReferences, setStaffReferences] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handoverStatus = useWatch({ control, name: "handoverStatus" });
  const salesOptions = toSelectOptions(getStaffNamesByRole(staffReferences, "Nhân viên kinh doanh"));

  useEffect(() => {
    contractImagesRef.current = contractImages;
  }, [contractImages]);

  useEffect(
    () => () => {
      contractImagesRef.current.forEach((item) => {
        if (item.kind === "file" && item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    },
    [],
  );

  useEffect(() => {
    const fetchStaffReferences = async () => {
      try {
        const response = await staffApi.references();
        const references = Array.isArray(response?.staffs) ? response.staffs : [];
        setStaffReferences(references);
        if (!isEditMode) {
          const firstSales = getStaffNamesByRole(references, "Nhân viên kinh doanh")[0] || "";
          if (firstSales) {
            setValue("selectedSalesStaff", firstSales, { shouldValidate: true });
          }
        }
      } catch {
        setStaffReferences([]);
      }
    };
    void fetchStaffReferences();
  }, [isEditMode, setValue]);

  useEffect(() => {
    if (handoverStatus === "Đã bàn giao") return;
    setValue("handoverAt", "", { shouldValidate: true });
  }, [handoverStatus, setValue]);

  useEffect(() => {
    if (!isEditMode) {
      setIsLoading(false);
      return;
    }
    const fetchDetail = async () => {
      setIsLoading(true);
      try {
        const response = await businessContractApi.detail(id);
        const contract = response?.contract;
        if (!contract) {
          toast.error("Không tìm thấy hợp đồng kinh doanh");
          navigate("/kinh-doanh/danh-sach");
          return;
        }
        const mappedValues = mapDetailToForm(contract);
        const mappedImages = mapImages(contract.contractImages);
        reset(mappedValues);
        setContractImages(mappedImages);
        setInitialSnapshot({ values: mappedValues, images: mappedImages });
      } catch (error) {
        toast.error(error?.message || "Không thể tải chi tiết hợp đồng kinh doanh");
        navigate("/kinh-doanh/danh-sach");
      } finally {
        setIsLoading(false);
      }
    };
    void fetchDetail();
  }, [id, isEditMode, navigate, reset]);

  const handleContractImageChange = (files) => {
    const normalizedNewFiles = files.map((file) => ({
      kind: "file",
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setContractImages((prev) => [...prev, ...normalizedNewFiles]);
  };

  const removeContractImage = (index) => {
    setContractImages((prev) => {
      const target = prev[index];
      if (target?.kind === "file" && target.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadNewImages = async () => {
    const existingImageUrls = contractImages.filter((item) => item.kind === "url").map((item) => item.url);
    const newImageFiles = contractImages.filter((item) => item.kind === "file").map((item) => item.file);
    if (newImageFiles.length === 0) return existingImageUrls;

    setIsUploadingImages(true);
    try {
      const uploadedImageUrls = await Promise.all(
        newImageFiles.map(async (file) => {
          const response = await uploadApi.uploadToCloudinary(file);
          return response.url;
        }),
      );
      return [...existingImageUrls, ...uploadedImageUrls];
    } finally {
      setIsUploadingImages(false);
    }
  };

  const persist = async (values, mode) => {
    let uploadedContractImages = [];
    try {
      uploadedContractImages = await uploadNewImages();
    } catch (error) {
      toast.error(error?.message || "Upload ảnh hợp đồng không thành công");
      return;
    }

    const payload = {
      ...values,
      contractImages: uploadedContractImages,
      ccEmails: values.ccEmails
        ? values.ccEmails
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
      handoverAt: values.handoverStatus === "Đã bàn giao" ? values.handoverAt || null : null,
    };

    try {
      if (isEditMode) {
        const response = await businessContractApi.update(id, payload);
        if (mode === "save-stay") {
          toast.success(response?.message || "Đã cập nhật hợp đồng kinh doanh");
          const nextValues = mapDetailToForm(response?.contract || payload);
          const nextImages = mapImages(response?.contract?.contractImages || uploadedContractImages);
          setInitialSnapshot({ values: nextValues, images: nextImages });
          reset(nextValues);
          setContractImages(nextImages);
          return;
        }
        toast.success(response?.message || "Đã cập nhật hợp đồng kinh doanh");
        navigate("/kinh-doanh/danh-sach");
        return;
      }

      const response = await businessContractApi.create(payload);
      if (mode === "save-stay" && response?.contract?.id) {
        toast.success(response?.message || "Đã tạo hợp đồng kinh doanh");
        navigate(`/kinh-doanh/chinh-sua/${response.contract.id}`, { replace: true });
        return;
      }
      toast.success(response?.message || "Đã tạo hợp đồng kinh doanh");
      navigate("/kinh-doanh/danh-sach");
    } catch (error) {
      toast.error(error?.message || "Không thể lưu hợp đồng kinh doanh");
    }
  };

  if (isLoading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Đang tải dữ liệu...</div>;
  }

  return (
    <form className="space-y-4">
      <FormActions
        onSave={() => void handleSubmit((values) => persist(values, "save"))()}
        onSaveStay={() => void handleSubmit((values) => persist(values, "save-stay"))()}
        onSaveMail={() => null}
        onReset={() => {
          contractImages.forEach((item) => {
            if (item.kind === "file" && item.previewUrl) {
              URL.revokeObjectURL(item.previewUrl);
            }
          });
          reset(initialSnapshot.values);
          setContractImages(initialSnapshot.images);
        }}
        isSubmitting={isSubmitting}
        isUploading={isUploadingImages}
        isEditMode={isEditMode}
        exitPath="/kinh-doanh/danh-sach"
        showSaveMail={false}
      />

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-3 text-lg font-semibold text-slate-700">
          Thông tin hợp đồng kinh doanh
        </div>
        <div className="grid gap-5 p-5 lg:grid-cols-2">
          <FormField label="Số hợp đồng" type="text"  inputProps={{ ...register("contractCode"), placeholder: "1234567QW" }} error={errors.contractCode?.message} />
          <FormField label="Tên hợp đồng" type="text" inputProps={{ ...register("contractName"), placeholder: "Website" }} error={errors.contractName?.message} />
          <FormField label="Tên khách hàng" type="text" inputProps={{ ...register("customerName"), placeholder: "Nguyen Van A" }} error={errors.customerName?.message} />
          <FormField label="Số điện thoại khách hàng" type="text" inputProps={{ ...register("customerPhone"), placeholder: "+84" }} error={errors.customerPhone?.message} />
          <FormField label="Email khách hàng" type="text" inputProps={{ ...register("customerEmail"), placeholder: "nguyenvana@email.com" }} error={errors.customerEmail?.message} />
          <FormField
            label="Trạng thái"
            type="select"
            options={STATUS_OPTIONS.map((item) => ({ label: item, value: item }))}
            selectProps={register("status")}
            error={errors.status?.message}
          />

          <div>
            <p className="text-sm font-semibold text-slate-600">Mail nhận</p>
            <div className="mt-2 flex flex-wrap gap-6 text-sm text-slate-600">
              {MAIL_STATUS_OPTIONS.map((option) => (
                <label key={option} className="flex items-center gap-2">
                  <input type="radio" value={option} {...register("mailStatus")} />
                  {option}
                </label>
              ))}
            </div>
            {errors.mailStatus && <p className="mt-1 text-xs text-rose-600">{errors.mailStatus.message}</p>}
          </div>

          <FormField
            label="Nhân viên kinh doanh"
            type="select"
            options={salesOptions.length > 0 ? salesOptions : [{ label: "Chưa có nhân sự kinh doanh", value: "" }]}
            selectProps={{ ...register("selectedSalesStaff"), disabled: salesOptions.length === 0 }}
            error={errors.selectedSalesStaff?.message}
          />
          <FormField label="Tên người nhận mail" type="text" inputProps={{ ...register("salesReceiverName") }} error={errors.salesReceiverName?.message} />
          <FormField label="Email người nhận mail" type="text" inputProps={{ ...register("salesReceiverEmail") }} error={errors.salesReceiverEmail?.message} />
          <FormField label="Danh sách email cc" type="text" inputProps={{ ...register("ccEmails"), placeholder: "email1@x.com, email2@x.com" }} error={errors.ccEmails?.message} />
          <FormField
            label="Trạng thái bàn giao"
            type="select"
            options={HANDOVER_STATUS_OPTIONS.map((item) => ({ label: item, value: item }))}
            selectProps={{ ...register("handoverStatus") }}
            error={errors.handoverStatus?.message}
          />
          <FormField
            label="Ngày bàn giao"
            type="datetime-local"
            inputProps={{ ...register("handoverAt"), disabled: handoverStatus !== "Đã bàn giao" }}
            error={errors.handoverAt?.message}
          />
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <input type="checkbox" {...register("visible")} />
            Hiển thị
          </label>

          <div className="lg:col-span-2">
            <ImageUpload
              previews={contractImages}
              onFilesSelected={handleContractImageChange}
              onRemoveImage={removeContractImage}
              onImageClick={setLightboxIndex}
              isUploading={isUploadingImages}
              maxImages={6}
            />
          </div>

          <div className="lg:col-span-2">
            <FormField label="Ghi chú" type="textarea" inputProps={{ ...register("note"), rows: 3 }} error={errors.note?.message} />
          </div>
        </div>
      </div>

      <ImageLightbox
        currentIndex={lightboxIndex}
        images={contractImages}
        onClose={() => setLightboxIndex(null)}
        onNext={() => setLightboxIndex(lightboxIndex + 1)}
        onPrev={() => setLightboxIndex(lightboxIndex - 1)}
      />
    </form>
  );
}

export default BusinessForm;

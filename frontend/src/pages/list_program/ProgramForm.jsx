import { zodResolver } from "@hookform/resolvers/zod";
import { RotateCw, Save, SquareArrowRightExit, Upload, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import FormField from "@/components/ui/form-field";
import { programApi } from "@/lib/api-client";
import { uploadApi } from "@/lib/upload";

const moduleOptions = ["Không tính điểm", "Cơ bản", "Cơ bản + Responsive", "Cơ bản + Mobile", "Giỏ hàng cơ bản"];
const durationUnitOptions = ["h", "ngày"];
const statusOptions = ["Đã nhận", "Đang xử lý", "Hoàn thành"];
const mailStatusOptions = ["Mail nhận", "Mail dự kiến", "Mail hoàn thành"];
const salesStaffOptions = ["ĐỖ VAN SANG", "TRẦN LAN", "NGUYỄN HUY"];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const nameRegex = /^[\p{L}\s]+$/u;
const CONTRACT_NAME_MIN_LENGTH = 4;
const CONTRACT_CODE_MIN_LENGTH = 6;
const SALES_RECEIVER_NAME_MIN_LENGTH = 4;
const EMAIL_LOCAL_MIN_LENGTH = 6;
const EMAIL_LOCAL_HAS_LETTER_REGEX = /[A-Za-zÀ-ỹ]/u;

const hasValidEmailLocalPart = (email) => {
  const localPart = (email || "").split("@")[0] || "";
  if (localPart.length < EMAIL_LOCAL_MIN_LENGTH) {
    return false;
  }
  return EMAIL_LOCAL_HAS_LETTER_REGEX.test(localPart);
};

const formatNumber = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "";
  return Number(parsed.toFixed(3)).toString();
};

const calculateConvertByDuration = (durationValue, durationUnit) => {
  const numeric = Number(durationValue);
  if (!Number.isFinite(numeric) || numeric <= 0) return "";
  if (durationUnit === "ngày") return formatNumber(numeric);
  if (durationUnit === "h") return formatNumber(numeric / 8);
  return "";
};

const programSchema = z.object({
  module: z.enum(moduleOptions, { message: "Vui lòng chọn module hợp lệ" }),
  durationValue: z.coerce.number().gt(0, "Thời gian phải lớn hơn 0"),
  durationUnit: z.enum(durationUnitOptions, { message: "Vui lòng chọn đơn vị thời gian hợp lệ" }),
  convert: z.string().trim().min(1, "Vui lòng nhập quy đổi"),
  design: z.boolean(),
  visible: z.boolean(),
  contractImages: z.array(z.any()).optional(),
  contractName: z
    .string()
    .trim()
    .min(CONTRACT_NAME_MIN_LENGTH, `Tên hợp đồng tối thiểu ${CONTRACT_NAME_MIN_LENGTH} ký tự`),
  contractCode: z
    .string()
    .trim()
    .min(CONTRACT_CODE_MIN_LENGTH, `Số hợp đồng tối thiểu ${CONTRACT_CODE_MIN_LENGTH} ký tự`),
  status: z.enum(statusOptions, { message: "Vui lòng chọn trạng thái hợp lệ" }),
  mailStatus: z.enum(mailStatusOptions, { message: "Vui lòng chọn mail nhận hợp lệ" }),
  selectedSalesStaff: z.string().trim().min(1, "Vui lòng chọn nhân viên kinh doanh"),
  salesReceiverName: z
    .string()
    .trim()
    .min(
      SALES_RECEIVER_NAME_MIN_LENGTH,
      `Họ tên kinh doanh nhận mail tối thiểu ${SALES_RECEIVER_NAME_MIN_LENGTH} ký tự`,
    )
    .refine((value) => nameRegex.test(value), "Họ tên kinh doanh nhận mail chỉ được chứa chữ và khoảng trắng"),
  salesReceiverEmail: z
    .string()
    .trim()
    .email("Email kinh doanh nhận không hợp lệ")
    .refine(
      (value) => hasValidEmailLocalPart(value),
      `Email kinh doanh nhận: phần trước @ tối thiểu ${EMAIL_LOCAL_MIN_LENGTH} ký tự và có ít nhất 1 chữ cái`,
    ),
  ccEmails: z
    .string()
    .optional()
    .refine((value) => {
      if (!value?.trim()) return true;
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .every((email) => emailRegex.test(email));
    }, "Danh sách email cc không hợp lệ")
    .refine((value) => {
      if (!value?.trim()) return true;
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .every((email) => hasValidEmailLocalPart(email));
    }, `Email cc: phần trước @ tối thiểu ${EMAIL_LOCAL_MIN_LENGTH} ký tự và có ít nhất 1 chữ cái`),
});

const defaultValues = {
  module: moduleOptions[0],
  durationValue: 1,
  durationUnit: "ngày",
  convert: "1",
  design: false,
  visible: true,
  contractImages: [],
  contractName: "",
  contractCode: "",
  status: statusOptions[0],
  mailStatus: mailStatusOptions[0],
  selectedSalesStaff: salesStaffOptions[0],
  salesReceiverName: "",
  salesReceiverEmail: "",
  ccEmails: "",
};

function ProgramForm() {
  const navigate = useNavigate();
  const [contractImagePreviews, setContractImagePreviews] = useState([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(programSchema),
    defaultValues,
  });

  const selectedDurationValue = watch("durationValue");
  const selectedDurationUnit = watch("durationUnit");

  useEffect(() => {
    const convertedValue = calculateConvertByDuration(selectedDurationValue, selectedDurationUnit);
    setValue("convert", convertedValue, { shouldValidate: true });
  }, [selectedDurationUnit, selectedDurationValue, setValue]);

  const onSubmit = async (values, mode) => {
    const convertedValue = calculateConvertByDuration(values.durationValue, values.durationUnit);
    const payloadWithoutImages = {
      ...values,
      contractImages: [],
      time: `${formatNumber(values.durationValue)} ${values.durationUnit}`,
      convert: convertedValue,
      ccEmails: values.ccEmails
        ? values.ccEmails
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
    };

    try {
      await programApi.validate(payloadWithoutImages);
    } catch (error) {
      toast.error(error?.message || "Lưu dữ liệu không thành công");
      return;
    }

    let contractImageUrls = [];
    if (contractImagePreviews.length > 0) {
      setIsUploadingImages(true);
      try {
        const uploadPromises = contractImagePreviews.map(async (file) => {
          const response = await uploadApi.uploadToCloudinary(file);
          return response.url;
        });
        contractImageUrls = await Promise.all(uploadPromises);
      } catch (error) {
        toast.error(error?.message || "Upload ảnh hợp đồng không thành công");
        return;
      } finally {
        setIsUploadingImages(false);
      }
    }

    const payload = {
      ...payloadWithoutImages,
      contractImages: contractImageUrls,
    };

    try {
      await programApi.create(payload);
    } catch (error) {
      toast.error(error?.message || "Lưu dữ liệu không thành công");
      return;
    }

    if (mode === "save-mail") {
      toast.success("Đã lưu form và đánh dấu gửi mail");
      return;
    }

    if (mode === "save-stay") {
      toast.success("Đã lưu form tại trang");
      return;
    }

    toast.success("Lưu thành công");
    navigate("/lap-trinh/danh-sach");
  };

  const onInvalid = () => {
    toast.error("Vui lòng kiểm tra lại thông tin form");
  };

  const handleContractImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    const validFiles = [];
    const totalImages = contractImagePreviews.length + files.length;

    if (totalImages > 6) {
      toast.error("Tối đa 6 ảnh hợp đồng");
      return;
    }

    for (const file of files) {
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name}: Chỉ chấp nhận JPG, PNG, WebP`);
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}: Kích thước tối đa 5MB`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setContractImagePreviews((prev) => {
        const nextFiles = [...prev, ...validFiles];
        setValue("contractImages", nextFiles, { shouldValidate: true });
        return nextFiles;
      });
    }
  };

  const removeContractImage = (index) => {
    setContractImagePreviews((prev) => {
      const nextFiles = prev.filter((_, i) => i !== index);
      setValue("contractImages", nextFiles, { shouldValidate: true });
      return nextFiles;
    });
  };

  const submitWithMode = (mode) =>
    handleSubmit(
      async (values) => {
        await onSubmit(values, mode);
      },
      () => onInvalid(),
    )();

  return (
    <form className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <button
          type="button"
          onClick={() => submitWithMode("save")}
          disabled={isSubmitting || isUploadingImages}
          className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-sky-400"
        >
          <Save className="h-4 w-4" />
          Lưu
        </button>
        <button
          type="button"
          onClick={() => submitWithMode("save-mail")}
          disabled={isSubmitting || isUploadingImages}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          <Save className="h-4 w-4" />
          Lưu gửi mail
        </button>
        <button
          type="button"
          onClick={() => submitWithMode("save-stay")}
          disabled={isSubmitting || isUploadingImages}
          className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-emerald-400"
        >
          <Save className="h-4 w-4" />
          Lưu tại trang
        </button>
        <button
          type="button"
          onClick={() => {
            reset(defaultValues);
            setContractImagePreviews([]);
          }}
          disabled={isSubmitting || isUploadingImages}
          className="inline-flex items-center gap-2 rounded-md bg-slate-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          <RotateCw className="h-4 w-4" />
          Làm lại
        </button>
        <button
          type="button"
          onClick={() => navigate("/lap-trinh/danh-sach")}
          disabled={isSubmitting || isUploadingImages}
          className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-rose-400"
        >
          <SquareArrowRightExit className="h-4 w-4" />
          Thoát
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-3 text-md font-semibold text-slate-600">Nội dung</div>
        <div className="grid gap-5 p-5 lg:grid-cols-2">
          <div className="space-y-4 rounded-xl border border-slate-100 p-4">
            <p className="text-sm font-semibold text-slate-700">Thông tin lập trình</p>

            <FormField
              label="Module"
              type="select"
              options={moduleOptions.map((item) => ({ label: item, value: item }))}
              selectProps={register("module")}
              error={errors.module?.message}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Thời gian"
                type="number"
                inputProps={{ ...register("durationValue"), min: "0.1", step: "0.1", placeholder: "Nhập số" }}
                error={errors.durationValue?.message}
              />
              <FormField
                label="Đơn vị"
                type="select"
                options={durationUnitOptions.map((item) => ({ label: item, value: item }))}
                selectProps={register("durationUnit")}
                error={errors.durationUnit?.message}
              />
            </div>

            <FormField
              label="Quy đổi"
              type="text"
              inputProps={{ ...register("convert"), readOnly: true, placeholder: "Tự động" }}
              error={errors.convert?.message}
            />

            <div className="mt-3 grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <input type="checkbox" {...register("design")} />
                Design
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <input type="checkbox" {...register("visible")} />
                Hiển thị
              </label>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-600">Ảnh hợp đồng</label>
                <span className="text-xs text-slate-500">
                  {contractImagePreviews.length}/6 ảnh
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {contractImagePreviews.length < 6 && (
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-4 py-6 transition-colors hover:border-slate-400 disabled:cursor-not-allowed">
                    <Upload className="h-5 w-5 text-slate-500" />
                    <span className="text-sm text-slate-600">Chọn ảnh</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleContractImageChange}
                      disabled={isUploadingImages}
                      className="hidden"
                    />
                  </label>
                )}

                {contractImagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {contractImagePreviews.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Contract ${index + 1}`}
                          className="h-24 w-full rounded-lg border border-slate-200 object-cover cursor-pointer transition-opacity hover:opacity-75"
                          onClick={() => setLightboxIndex(index)}
                        />
                        <button
                          type="button"
                          onClick={() => removeContractImage(index)}
                          disabled={isUploadingImages}
                          className="absolute right-1 top-1 rounded-full bg-rose-600 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-700 disabled:cursor-not-allowed"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-slate-100 p-4">
            <p className="text-sm font-semibold text-slate-700">Thông tin hợp đồng</p>

            <FormField
              label="Tên hợp đồng"
              type="text"
              inputProps={{ ...register("contractName"), placeholder: "VÕ TUẤN ANH" }}
              error={errors.contractName?.message}
            />

            <FormField
              label="Số hợp đồng"
              type="text"
              inputProps={{ ...register("contractCode"), placeholder: "0260223QT" }}
              error={errors.contractCode?.message}
            />

            <FormField
              label="Trạng thái"
              type="select"
              options={statusOptions.map((item) => ({ label: item, value: item }))}
              selectProps={register("status")}
              error={errors.status?.message}
            />

            <div>
              <p className="text-sm font-semibold text-slate-600">Mail nhận</p>
              <div className="mt-2 flex flex-wrap gap-6 text-sm text-slate-600">
                {mailStatusOptions.map((option) => (
                  <label key={option} className="flex items-center gap-2">
                    <input type="radio" value={option} {...register("mailStatus")} />
                    {option}
                  </label>
                ))}
              </div>
              {errors.mailStatus && <p className="mt-1 text-xs text-rose-600">{errors.mailStatus.message}</p>}
            </div>

            <FormField
              label="Chọn nhân viên kinh doanh"
              type="select"
              options={salesStaffOptions.map((item) => ({ label: item, value: item }))}
              selectProps={register("selectedSalesStaff")}
              error={errors.selectedSalesStaff?.message}
            />

            <FormField
              label="Họ tên kinh doanh nhận mail"
              type="text"
              inputProps={{ ...register("salesReceiverName"), placeholder: "ĐỖ VAN SANG" }}
              error={errors.salesReceiverName?.message}
            />

            <FormField
              label="Email kinh doanh nhận"
              type="text"
              inputProps={{ ...register("salesReceiverEmail"), placeholder: "thanhdv.sota@gmail.com" }}
              error={errors.salesReceiverEmail?.message}
            />

            <FormField
              label={
                <>
                  Danh sách email cc <span className="text-red-600">(phân cách bằng dấu phẩy)</span>
                </>
              }
              type="text"
              inputProps={{ ...register("ccEmails"), placeholder: "example@gmail.com, example2@gmail.com" }}
              error={errors.ccEmails?.message}
            />
          </div>
        </div>
      </div>

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <div className="relative max-h-screen max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={URL.createObjectURL(contractImagePreviews[lightboxIndex])}
              alt={`Contract ${lightboxIndex + 1}`}
              className="h-full w-full object-contain rounded-lg"
            />

            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="absolute right-4 top-4 rounded-full bg-slate-600 p-2 text-white hover:bg-slate-700"
            >
              <X className="h-6 w-6" />
            </button>

            {lightboxIndex > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(lightboxIndex - 1);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-slate-600 p-2 text-white hover:bg-slate-700"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {lightboxIndex < contractImagePreviews.length - 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(lightboxIndex + 1);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-slate-600 p-2 text-white hover:bg-slate-700"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}

            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm font-semibold text-white">
              {lightboxIndex + 1}/{contractImagePreviews.length}
            </p>
          </div>
        </div>
      )}
    </form>
  );
}

export default ProgramForm;

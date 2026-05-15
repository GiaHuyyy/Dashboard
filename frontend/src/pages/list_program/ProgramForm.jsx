import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { FormActions } from "@/components/program-form/FormActions";
import { ProgramInfo } from "@/components/program-form/ProgramInfo";
import { ContractInfo } from "@/components/program-form/ContractInfo";
import { ImageLightbox } from "@/components/program-form/ImageLightbox";
import { programApi } from "@/lib/api-client";
import { uploadApi } from "@/lib/upload";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const nameRegex = /^[\p{L}\s]+$/u;
const CONTRACT_NAME_MIN_LENGTH = 4;
const CONTRACT_CODE_MIN_LENGTH = 6;
const SALES_RECEIVER_NAME_MIN_LENGTH = 4;
const EMAIL_LOCAL_MIN_LENGTH = 6;
const EMAIL_LOCAL_HAS_LETTER_REGEX = /[A-Za-zÀ-ỹ]/u;
const MODULE_OPTIONS = ["Không tính điểm", "Cơ bản", "Cơ bản + Responsive", "Cơ bản + Mobile", "Giỏ hàng cơ bản"];
const DURATION_UNIT_OPTIONS = ["h", "ngày"];
const STATUS_OPTIONS = ["Đã nhận", "Đang xử lý", "Hoàn thành"];
const MAIL_STATUS_OPTIONS = ["Mail nhận", "Mail dự kiến", "Mail hoàn thành"];
const SALES_STAFF_OPTIONS = ["ĐỖ VAN SANG", "TRẦN LAN", "NGUYỄN HUY"];

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
  module: z.enum(MODULE_OPTIONS, { message: "Vui lòng chọn module hợp lệ" }),
  durationValue: z.coerce.number().gt(0, "Thời gian phải lớn hơn 0"),
  durationUnit: z.enum(DURATION_UNIT_OPTIONS, { message: "Vui lòng chọn đơn vị thời gian hợp lệ" }),
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
  status: z.enum(STATUS_OPTIONS, { message: "Vui lòng chọn trạng thái hợp lệ" }),
  mailStatus: z.enum(MAIL_STATUS_OPTIONS, { message: "Vui lòng chọn mail nhận hợp lệ" }),
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
  module: MODULE_OPTIONS[0],
  durationValue: 1,
  durationUnit: "ngày",
  convert: "1",
  design: false,
  visible: true,
  contractImages: [],
  contractName: "",
  contractCode: "",
  status: STATUS_OPTIONS[0],
  mailStatus: MAIL_STATUS_OPTIONS[0],
  selectedSalesStaff: SALES_STAFF_OPTIONS[0],
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

  const handleContractImageChange = (files) => {
    setContractImagePreviews((prev) => {
      const nextFiles = [...prev, ...files];
      setValue("contractImages", nextFiles, { shouldValidate: true });
      return nextFiles;
    });
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
      <FormActions
        onSave={() => submitWithMode("save")}
        onSaveMail={() => submitWithMode("save-mail")}
        onSaveStay={() => submitWithMode("save-stay")}
        onReset={() => {
          reset(defaultValues);
          setContractImagePreviews([]);
        }}
        isSubmitting={isSubmitting}
        isUploading={isUploadingImages}
      />

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-3 text-md font-semibold text-slate-600">Nội dung</div>
        <div className="grid gap-5 p-5 lg:grid-cols-2">
          <ProgramInfo
            register={register}
            errors={errors}
            contractImagePreviews={contractImagePreviews}
            onFilesSelected={handleContractImageChange}
            onRemoveImage={removeContractImage}
            onImageClick={setLightboxIndex}
            isUploading={isUploadingImages}
          />

          <ContractInfo register={register} errors={errors} />
        </div>
      </div>

      <ImageLightbox
        currentIndex={lightboxIndex}
        images={contractImagePreviews}
        onClose={() => setLightboxIndex(null)}
        onNext={() => setLightboxIndex(lightboxIndex + 1)}
        onPrev={() => setLightboxIndex(lightboxIndex - 1)}
      />
    </form>
  );
}

export default ProgramForm;

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { FormActions } from "@/components/program-form/FormActions";
import { ProgramInfo } from "@/components/program-form/ProgramInfo";
import { ContractInfo } from "@/components/program-form/ContractInfo";
import { ImageLightbox } from "@/components/program-form/ImageLightbox";
import Modal from "@/components/ui/modal";
import {
  DURATION_UNIT_OPTIONS,
  MAIL_STATUS_OPTIONS,
  MODULE_OPTIONS,
  STATUS_OPTIONS,
} from "@/constants/program";
import { designApi, programApi, staffApi } from "@/lib/api-client";
import { getStaffNamesByRole, toSelectOptions } from "@/lib/staff-roles";
import { uploadApi } from "@/lib/upload";

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
  module: z.enum(MODULE_OPTIONS, { message: "Vui lòng chọn module hợp lệ" }),
  durationValue: z.coerce.number().gt(0, "Thời gian phải lớn hơn 0"),
  durationUnit: z.enum(DURATION_UNIT_OPTIONS, { message: "Vui lòng chọn đơn vị thời gian hợp lệ" }),
  convert: z.string().trim().min(1, "Vui lòng nhập quy đổi"),
  assigner: z.string().trim().min(1, "Vui lòng chọn người giao"),
  assignee: z.string().trim().min(1, "Vui lòng chọn người nhận"),
  designTaskId: z.string().trim().min(1, "Vui lòng chọn thiết kế tham chiếu"),
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
  assigner: "",
  assignee: "",
  designTaskId: "",
  design: false,
  visible: true,
  contractImages: [],
  contractName: "",
  contractCode: "",
  status: STATUS_OPTIONS[0],
  mailStatus: MAIL_STATUS_OPTIONS[0],
  selectedSalesStaff: "",
  salesReceiverName: "",
  salesReceiverEmail: "",
  ccEmails: "",
};

function ProgramForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: programId } = useParams();
  const returnPath = location.state?.sourcePath || "/lap-trinh/danh-sach";
  const isEditMode = Boolean(programId);
  const [contractImages, setContractImages] = useState([]);
  const contractImagesRef = useRef([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isLoadingProgram, setIsLoadingProgram] = useState(false);
  const [staffReferences, setStaffReferences] = useState([]);
  const [designReferences, setDesignReferences] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [initialSnapshot, setInitialSnapshot] = useState({ values: defaultValues, images: [] });
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(programSchema),
    defaultValues,
  });

  const selectedDurationValue = useWatch({ control, name: "durationValue" });
  const selectedDurationUnit = useWatch({ control, name: "durationUnit" });
  const isReadOnlyMode = isEditMode && initialSnapshot.values.status === "Hoàn thành";

  useEffect(() => {
    const fetchStaffs = async () => {
      try {
        const [staffResponse, designResponse] = await Promise.all([staffApi.references(), designApi.references()]);
        const nextReferences = Array.isArray(staffResponse?.staffs) ? staffResponse.staffs : [];
        const nextDesignReferences = Array.isArray(designResponse?.designTasks) ? designResponse.designTasks : [];
        setStaffReferences(nextReferences);
        setDesignReferences(nextDesignReferences);
        const managerOptions = getStaffNamesByRole(nextReferences, "Quản lý");
        const programmerOptions = getStaffNamesByRole(nextReferences, "Lập trình viên");
        const salesOptions = getStaffNamesByRole(nextReferences, "Nhân viên kinh doanh");
        if (!isEditMode && managerOptions.length > 0) {
          setValue("assigner", managerOptions[0], { shouldValidate: true });
        }
        if (!isEditMode && programmerOptions.length > 0) {
          setValue("assignee", programmerOptions[0], { shouldValidate: true });
        }
        if (!isEditMode && salesOptions.length > 0) {
          setValue("selectedSalesStaff", salesOptions[0], { shouldValidate: true });
        }
        if (!isEditMode && nextDesignReferences.length > 0) {
          setValue("designTaskId", nextDesignReferences[0].id, { shouldValidate: true });
        }
      } catch (error) {
        toast.error(error?.message || "Không thể tải dữ liệu tham chiếu");
      }
    };
    void fetchStaffs();
  }, [isEditMode, setValue]);

  const assignerOptions = toSelectOptions(getStaffNamesByRole(staffReferences, "Quản lý"));
  const assigneeOptions = toSelectOptions(getStaffNamesByRole(staffReferences, "Lập trình viên"));
  const salesOptions = toSelectOptions(getStaffNamesByRole(staffReferences, "Nhân viên kinh doanh"));
  const designTaskOptions = designReferences.map((item) => ({
    label: item?.label || item?.title || "Design",
    value: item?.id,
  }));

  useEffect(() => {
    const convertedValue = calculateConvertByDuration(selectedDurationValue, selectedDurationUnit);
    setValue("convert", convertedValue, { shouldValidate: true });
  }, [selectedDurationUnit, selectedDurationValue, setValue]);

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
    if (!programId) return;

    const fetchProgramDetail = async () => {
      setIsLoadingProgram(true);
      try {
        const response = await programApi.detail(programId);
        const program = response?.program;
        if (!program) {
          toast.error("Không tìm thấy dữ liệu cần chỉnh sửa");
          navigate(returnPath);
          return;
        }

        const parsedDuration = Number(program.durationValue);
        const safeDuration = Number.isFinite(parsedDuration) && parsedDuration > 0 ? parsedDuration : 1;
        const formValues = {
          module: program.module || MODULE_OPTIONS[0],
          durationValue: safeDuration,
          durationUnit: program.durationUnit || "ngày",
          convert: program.convert || "1",
          assigner: program.assigner || "",
          assignee: program.assignee || "",
          designTaskId: program.designTaskId || "",
          design: Boolean(program.design),
          visible: Boolean(program.visible),
          contractImages: [],
          contractName: program.contractName || "",
          contractCode: program.contractCode || "",
          status: program.status || STATUS_OPTIONS[0],
          mailStatus: program.mailStatus || MAIL_STATUS_OPTIONS[0],
          selectedSalesStaff: program.selectedSalesStaff || "",
          salesReceiverName: program.salesReceiverName || "",
          salesReceiverEmail: program.salesReceiverEmail || "",
          ccEmails: Array.isArray(program.ccEmails) ? program.ccEmails.join(", ") : "",
        };

        const initialImages = Array.isArray(program.contractImages)
          ? program.contractImages.map((url) => ({ kind: "url", url }))
          : [];

        reset(formValues);
        setContractImages(initialImages);
        setInitialSnapshot({ values: formValues, images: initialImages });
      } catch (error) {
        toast.error(error?.message || "Không thể tải dữ liệu chỉnh sửa");
        navigate(returnPath);
      } finally {
        setIsLoadingProgram(false);
      }
    };

    fetchProgramDetail();
  }, [navigate, programId, reset, returnPath]);

  const persistProgram = async (values, mode) => {
    const shouldSendMail = mode === "save-mail";
    const convertedValue = calculateConvertByDuration(values.durationValue, values.durationUnit);
    const payloadWithoutImages = {
      ...values,
      contractImages: [],
      time: `${formatNumber(values.durationValue)} ${values.durationUnit}`,
      convert: convertedValue,
      sendMail: shouldSendMail,
      ccEmails: values.ccEmails
        ? values.ccEmails
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
    };

    try {
      await programApi.validate({
        ...payloadWithoutImages,
        currentProgramId: isEditMode ? programId : undefined,
      });
    } catch (error) {
      toast.error(error?.message || "Lưu dữ liệu không thành công");
      return;
    }

    let uploadedImageUrls = [];
    const existingImageUrls = contractImages.filter((item) => item.kind === "url").map((item) => item.url);
    const newImageFiles = contractImages.filter((item) => item.kind === "file").map((item) => item.file);

    if (newImageFiles.length > 0) {
      setIsUploadingImages(true);
      try {
        const uploadPromises = newImageFiles.map(async (file) => {
          const response = await uploadApi.uploadToCloudinary(file);
          return response.url;
        });
        uploadedImageUrls = await Promise.all(uploadPromises);
      } catch (error) {
        toast.error(error?.message || "Upload ảnh hợp đồng không thành công");
        return;
      } finally {
        setIsUploadingImages(false);
      }
    }

    const payload = {
      ...payloadWithoutImages,
      contractImages: [...existingImageUrls, ...uploadedImageUrls],
    };

    let response;
    try {
      if (isEditMode) {
        response = await programApi.update(programId, payload);
      } else {
        response = await programApi.create(payload);
      }
    } catch (error) {
      toast.error(error?.message || "Lưu dữ liệu không thành công");
      return;
    }

    if (mode === "save-mail") {
      toast.success(response?.message || (isEditMode ? "Đã cập nhật form và gửi mail" : "Đã lưu form và gửi mail"));
      if (!isEditMode) {
        navigate(returnPath);
        return;
      }
      return;
    }

    if (mode === "save-stay") {
      toast.success(response?.message || (isEditMode ? "Đã cập nhật form tại trang" : "Đã lưu form tại trang"));
      return;
    }

    toast.success(response?.message || (isEditMode ? "Cập nhật thành công" : "Lưu thành công"));
    navigate(returnPath);
  };

  const onSubmit = async (values, mode) => {
    if (isReadOnlyMode) {
      return;
    }
    if (isEditMode && values.status === "Hoàn thành" && initialSnapshot.values.status !== "Hoàn thành") {
      setPendingSubmit({ values, mode });
      setCompleteConfirmOpen(true);
      return;
    }
    await persistProgram(values, mode);
  };

  const onInvalid = () => {
    toast.error("Vui lòng kiểm tra lại thông tin form");
  };

  const handleContractImageChange = (files) => {
    const normalizedNewFiles = files.map((file) => ({
      kind: "file",
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setContractImages((prev) => {
      const nextItems = [...prev, ...normalizedNewFiles];
      setValue("contractImages", nextItems, { shouldValidate: true });
      return nextItems;
    });
  };

  const removeContractImage = (index) => {
    setContractImages((prev) => {
      const target = prev[index];
      if (target?.kind === "file" && target.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }

      const nextItems = prev.filter((_, i) => i !== index);
      setValue("contractImages", nextItems, { shouldValidate: true });
      return nextItems;
    });
  };

  const submitWithMode = (mode) =>
    handleSubmit(
      async (values) => {
        await onSubmit(values, mode);
      },
      () => onInvalid(),
    )();

  if (isLoadingProgram) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Đang tải dữ liệu...</div>
    );
  }

  return (
    <form className="space-y-4">
      <FormActions
        onSave={() => submitWithMode("save")}
        onSaveMail={() => submitWithMode("save-mail")}
        onSaveStay={() => submitWithMode("save-stay")}
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
        exitPath={returnPath}
        readOnlyMode={isReadOnlyMode}
      />

      <fieldset disabled={isReadOnlyMode}>
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-3 text-lg font-semibold text-slate-700">Nội dung</div>
          <div className="grid gap-5 p-5 lg:grid-cols-2">
            <ProgramInfo
              register={register}
              errors={errors}
              contractImages={contractImages}
              onFilesSelected={handleContractImageChange}
              onRemoveImage={removeContractImage}
              onImageClick={setLightboxIndex}
              isUploading={isUploadingImages}
              assignerOptions={assignerOptions}
              assigneeOptions={assigneeOptions}
              designTaskOptions={designTaskOptions}
            />

            <ContractInfo register={register} errors={errors} salesOptions={salesOptions} />
          </div>
        </div>
      </fieldset>

      <ImageLightbox
        currentIndex={lightboxIndex}
        images={contractImages}
        onClose={() => setLightboxIndex(null)}
        onNext={() => setLightboxIndex(lightboxIndex + 1)}
        onPrev={() => setLightboxIndex(lightboxIndex - 1)}
      />

      <Modal
        open={completeConfirmOpen}
        onClose={() => {
          setCompleteConfirmOpen(false);
          setPendingSubmit(null);
        }}
        title="Xác nhận hoàn thành"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setCompleteConfirmOpen(false);
                setPendingSubmit(null);
              }}
              className="rounded-md border px-4 py-2 text-sm"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => {
                const current = pendingSubmit;
                setCompleteConfirmOpen(false);
                setPendingSubmit(null);
                if (current) {
                  void persistProgram(current.values, current.mode);
                }
              }}
              className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Xác nhận
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          Bạn đang chuyển trạng thái sang
          <span className="font-semibold text-slate-800"> Hoàn thành</span>. Xác nhận để lưu cập nhật.
        </p>
      </Modal>
    </form>
  );
}

export default ProgramForm;

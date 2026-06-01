import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { useSelector } from "react-redux";

import { FormActions, FormPageLayout, FormSection } from "@/components/forms";
import { ImageLightbox } from "@/components/forms/ImageLightbox";
import { ImageUpload } from "@/components/forms/ImageUpload";
import FormField from "@/components/ui/form-field";
import Modal from "@/components/ui/modal";
import {
  BUSINESS_CONTRACT_PROJECT_STATUS_CATEGORY_TYPE,
  BUSINESS_CONTRACT_STATUS_OPTIONS,
  BUSINESS_CONTRACT_TYPE_CATEGORY_TYPE,
  HANDOVER_STATUS_OPTIONS,
} from "@/constants/business-contract";
import { UPLOAD_FOLDERS } from "@/constants/upload-folders";
import { MAIL_STATUS_OPTIONS } from "@/constants/program";
import { businessContractApi, staffApi, systemCategoryApi } from "@/lib/api-client";
import { hasPermission } from "@/lib/permissions";
import { getStaffNamesByRole, toSelectOptions } from "@/lib/staff-roles";
import { uploadApi } from "@/lib/upload";
import { PERMISSIONS } from "@/constants/permissions";

const schema = z.object({
  contractCode: z.string().trim().min(1, "Vui lòng nhập số hợp đồng"),
  contractName: z.string().trim().min(1, "Vui lòng nhập tên hợp đồng"),
  customerName: z.string().trim().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), "Email khách hàng không hợp lệ"),
  contractType: z.string().trim().min(1, "Vui lòng chọn loại hợp đồng"),
  status: z.string().trim().min(1, "Vui lòng chọn trạng thái dự án"),
  mailStatus: z.enum(MAIL_STATUS_OPTIONS, { message: "Vui lòng chọn mail nhận hợp lệ" }),
  selectedSalesStaff: z.string().trim().min(1, "Vui lòng chọn nhân viên kinh doanh"),
  selectedManager: z.string().optional(),
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
  expectedHandoverAt: z.string().trim().min(1, "Vui lòng chọn ngày dự kiến bàn giao"),
  handoverStatus: z.enum(HANDOVER_STATUS_OPTIONS, { message: "Vui lòng chọn trạng thái bàn giao hợp lệ" }),
  handoverAt: z.string().optional(),
  visible: z.boolean(),
  note: z.string().optional(),
}).superRefine((values, ctx) => {
  if (values.handoverStatus === "Đã bàn giao" && !values.handoverAt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["handoverAt"],
      message: "Vui lòng chọn ngày bàn giao",
    });
  }
});

const defaultValues = {
  contractCode: "",
  contractName: "",
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  contractType: "",
  status: BUSINESS_CONTRACT_STATUS_OPTIONS[0],
  mailStatus: MAIL_STATUS_OPTIONS[0],
  selectedSalesStaff: "",
  selectedManager: "",
  ccEmails: "",
  expectedHandoverAt: "",
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
  contractType: contract.contractType || "",
  status: contract.status || BUSINESS_CONTRACT_STATUS_OPTIONS[0],
  mailStatus: contract.mailStatus || MAIL_STATUS_OPTIONS[0],
  selectedSalesStaff: contract.selectedSalesStaff || "",
  selectedManager: contract.selectedManager || "",
  ccEmails: Array.isArray(contract.ccEmails) ? contract.ccEmails.join(", ") : "",
  expectedHandoverAt: toDateTimeLocal(contract.expectedHandoverAt),
  handoverStatus: contract.handoverStatus || HANDOVER_STATUS_OPTIONS[0],
  handoverAt: toDateTimeLocal(contract.handoverAt),
  visible: Boolean(contract.visible ?? true),
  note: contract.note || "",
});

const mapImages = (images = []) =>
  Array.isArray(images)
    ? images
        .map((item) => {
          if (typeof item === "string") return { kind: "url", url: item, publicId: "" };
          return { kind: "url", url: item?.url || "", publicId: item?.publicId || "" };
        })
        .filter((item) => item.url)
    : [];

function BusinessForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const currentUser = useSelector((state) => state.auth.user);
  const canSave = hasPermission(currentUser, isEditMode ? PERMISSIONS.CONTRACT_UPDATE : PERMISSIONS.CONTRACT_CREATE);
  const canOverrideHandover = hasPermission(currentUser, PERMISSIONS.CONTRACT_OVERRIDE_HANDOVER);
  const canSendMail = hasPermission(currentUser, PERMISSIONS.CONTRACT_SEND_MAIL);
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [contractImages, setContractImages] = useState([]);
  const contractImagesRef = useRef([]);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [initialSnapshot, setInitialSnapshot] = useState({ values: defaultValues, images: [] });
  const [staffReferences, setStaffReferences] = useState([]);
  const [projectStatusOptions, setProjectStatusOptions] = useState(BUSINESS_CONTRACT_STATUS_OPTIONS);
  const [contractTypeOptions, setContractTypeOptions] = useState([]);
  const [handoverConfirmOpen, setHandoverConfirmOpen] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(null);

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
  const isHandedOverLocked =
    isEditMode && initialSnapshot.values?.handoverStatus === "Đã bàn giao" && !canOverrideHandover;
  const isFormReadOnly = !canSave || isHandedOverLocked;
  const salesOptions = toSelectOptions(getStaffNamesByRole(staffReferences, "Nhân viên kinh doanh"));
  const managerOptions = toSelectOptions(getStaffNamesByRole(staffReferences, "Quản lý"));
  const customerEmail = useWatch({ control, name: "customerEmail" });
  const selectedStatus = useWatch({ control, name: "status" });
  const selectedContractType = useWatch({ control, name: "contractType" });
  const hasCustomerEmail = Boolean(customerEmail?.trim());
  const visibleProjectStatusOptions = selectedStatus && !projectStatusOptions.includes(selectedStatus)
    ? [selectedStatus, ...projectStatusOptions]
    : projectStatusOptions;
  const visibleContractTypeOptions = selectedContractType && !contractTypeOptions.includes(selectedContractType)
    ? [selectedContractType, ...contractTypeOptions]
    : contractTypeOptions;

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
          const firstManager = getStaffNamesByRole(references, "Quản lý")[0] || "";
          if (firstSales) {
            setValue("selectedSalesStaff", firstSales, { shouldValidate: true });
          }
          if (firstManager) {
            setValue("selectedManager", firstManager, { shouldValidate: true });
          }
        }
      } catch {
        setStaffReferences([]);
      }
    };
    void fetchStaffReferences();
  }, [isEditMode, setValue]);

  useEffect(() => {
    const getCategoryValues = (response) =>
      Array.isArray(response?.categories)
        ? response.categories
            .filter((item) => item?.isActive !== false)
            .map((item) => item.name)
            .filter(Boolean)
        : [];

    const fetchContractCategoryOptions = async () => {
      try {
        const [projectStatusResponse, contractTypeResponse] = await Promise.all([
          systemCategoryApi.list({ type: BUSINESS_CONTRACT_PROJECT_STATUS_CATEGORY_TYPE, limit: 200 }),
          systemCategoryApi.list({ type: BUSINESS_CONTRACT_TYPE_CATEGORY_TYPE, limit: 200 }),
        ]);

        const nextProjectStatusOptions = getCategoryValues(projectStatusResponse);
        const nextContractTypeOptions = getCategoryValues(contractTypeResponse);
        const nextStatuses = nextProjectStatusOptions.length > 0 ? nextProjectStatusOptions : BUSINESS_CONTRACT_STATUS_OPTIONS;
        const nextTypes = nextContractTypeOptions;

        setProjectStatusOptions(nextStatuses);
        setContractTypeOptions(nextTypes);
        if (!isEditMode) {
          if (nextStatuses[0]) setValue("status", nextStatuses[0], { shouldValidate: true });
          if (nextTypes[0]) setValue("contractType", nextTypes[0], { shouldValidate: true });
        }
      } catch {
        setProjectStatusOptions(BUSINESS_CONTRACT_STATUS_OPTIONS);
        setContractTypeOptions([]);
      }
    };

    void fetchContractCategoryOptions();
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
    if (isFormReadOnly) return;

    const normalizedNewFiles = files.map((file) => ({
      kind: "file",
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setContractImages((prev) => [...prev, ...normalizedNewFiles]);
  };

  const removeContractImage = (index) => {
    if (isFormReadOnly) return;

    setContractImages((prev) => {
      const target = prev[index];
      if (target?.kind === "file" && target.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadNewImages = async () => {
    const existingImageUrls = contractImages
      .filter((item) => item.kind === "url")
      .map((item) => ({ url: item.url, publicId: item.publicId || "" }));
    const newImageFiles = contractImages.filter((item) => item.kind === "file").map((item) => item.file);
    if (newImageFiles.length === 0) return existingImageUrls;

    setIsUploadingImages(true);
    try {
      const uploadedImageUrls = await Promise.all(
        newImageFiles.map(async (file) => {
          const response = await uploadApi.uploadToCloudinary(file, { folder: UPLOAD_FOLDERS.BUSINESS_CONTRACTS });
          return { url: response.url, publicId: response.publicId || "" };
        }),
      );
      return [...existingImageUrls, ...uploadedImageUrls];
    } finally {
      setIsUploadingImages(false);
    }
  };

  const persist = async (values, mode) => {
    if (!canSave) {
      toast.error("Bạn không có quyền lưu dữ liệu này");
      return;
    }

    if (isHandedOverLocked) {
      toast.error("Hợp đồng đã bàn giao, chỉ được xem chi tiết");
      return;
    }

    if (mode === "save-mail" && !canSendMail) {
      toast.error("Bạn không có quyền gửi mail hợp đồng");
      return;
    }

    if (mode === "save-mail" && !values.customerEmail?.trim()) {
      toast.error("Vui lòng nhập Email khách hàng trước khi gửi mail");
      return;
    }

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
      expectedHandoverAt: values.expectedHandoverAt || null,
      ccEmails: values.ccEmails
        ? values.ccEmails
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
      handoverAt: values.handoverStatus === "Đã bàn giao" ? values.handoverAt || null : null,
      sendMail: mode === "save-mail",
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

  const onSubmit = async (values, mode) => {
    if (values.handoverStatus === "Đã bàn giao" && initialSnapshot.values?.handoverStatus !== "Đã bàn giao") {
      setPendingSubmit({ values, mode });
      setHandoverConfirmOpen(true);
      return;
    }

    await persist(values, mode);
  };

  const submitWithMode = (mode) =>
    handleSubmit(
      (values) => void onSubmit(values, mode),
      () => toast.error("Vui lòng kiểm tra lại thông tin form"),
    )();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Đang tải dữ liệu...</div>
    );
  }

  return (
    <FormPageLayout
      disabled={isFormReadOnly}
      actions={
        <FormActions
          onSave={() => submitWithMode("save")}
          onSaveStay={() => submitWithMode("save-stay")}
          onSaveMail={() => submitWithMode("save-mail")}
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
          showSaveMail
          saveMailDisabled={!canSendMail || !hasCustomerEmail}
          saveMailDisabledTitle={!canSendMail ? "Bạn không có quyền gửi mail hợp đồng" : "Vui lòng nhập Email khách hàng trước khi gửi mail"}
          readOnlyMode={isFormReadOnly}
        />
      }
    >
      <FormSection title="Thông tin hợp đồng kinh doanh">
          <FormField
            label="Số hợp đồng"
            type="text"
            inputProps={{ ...register("contractCode"), placeholder: "1234567QW", disabled: isFormReadOnly }}
            error={errors.contractCode?.message}
          />
          <FormField
            label="Tên hợp đồng"
            type="text"
            inputProps={{ ...register("contractName"), placeholder: "Website", disabled: isFormReadOnly }}
            error={errors.contractName?.message}
          />
          <FormField
            label="Tên khách hàng"
            type="text"
            inputProps={{ ...register("customerName"), placeholder: "Nguyen Van A", disabled: isFormReadOnly }}
            error={errors.customerName?.message}
          />
          <FormField
            label="Số điện thoại khách hàng"
            type="text"
            inputProps={{ ...register("customerPhone"), placeholder: "+84", disabled: isFormReadOnly }}
            error={errors.customerPhone?.message}
          />
          <FormField
            label="Email khách hàng"
            type="text"
            inputProps={{ ...register("customerEmail"), placeholder: "nguyenvana@email.com", disabled: isFormReadOnly }}
            error={errors.customerEmail?.message}
          />
          <FormField
            label="Loại hợp đồng"
            type="select"
            options={visibleContractTypeOptions.map((item) => ({ label: item, value: item }))}
            selectProps={{ ...register("contractType"), disabled: isFormReadOnly }}
            error={errors.contractType?.message}
          />
          <FormField
            label="Trạng thái dự án"
            type="select"
            options={visibleProjectStatusOptions.map((item) => ({ label: item, value: item }))}
            selectProps={{ ...register("status"), disabled: isFormReadOnly }}
            error={errors.status?.message}
          />

          {/* Tạm ẩn Mail nhận, giữ lại field/default để dùng lại khi cần gửi mail theo trạng thái.
          <div>
            <p className="text-sm font-semibold text-slate-600">Mail nhận</p>
            <div className="mt-2 flex flex-wrap gap-6 text-sm text-slate-600">
              {MAIL_STATUS_OPTIONS.map((option) => (
                <label key={option} className="flex items-center gap-2">
                  <input type="radio" value={option} {...register("mailStatus")} disabled={isFormReadOnly} />
                  {option}
                </label>
              ))}
            </div>
            {errors.mailStatus && <p className="mt-1 text-xs text-rose-600">{errors.mailStatus.message}</p>}
          </div>
          */}

          <FormField
            label="Nhân viên kinh doanh"
            type="select"
            options={salesOptions.length > 0 ? salesOptions : [{ label: "Chưa có nhân sự kinh doanh", value: "" }]}
            selectProps={{ ...register("selectedSalesStaff"), disabled: isFormReadOnly || salesOptions.length === 0 }}
            error={errors.selectedSalesStaff?.message}
          />
          <FormField
            label="Quản lý"
            type="select"
            options={managerOptions}
            selectProps={{ ...register("selectedManager"), disabled: isFormReadOnly || managerOptions.length === 0 }}
            error={errors.selectedManager?.message}
          />
          {/* Tạm ẩn Danh sách email cc, giữ lại logic để bật lại khi cần.
          <FormField
            label="Danh sách email cc"
            type="text"
            inputProps={{ ...register("ccEmails"), placeholder: "email1@x.com, email2@x.com", disabled: isFormReadOnly }}
            error={errors.ccEmails?.message}
          />
          */}
          <FormField
            label="Ngày dự kiến bàn giao"
            type="datetime-local"
            inputProps={{ ...register("expectedHandoverAt"), disabled: isFormReadOnly }}
            error={errors.expectedHandoverAt?.message}
          />
          <FormField
            label="Trạng thái bàn giao"
            type="select"
            options={HANDOVER_STATUS_OPTIONS.map((item) => ({ label: item, value: item }))}
            selectProps={{ ...register("handoverStatus"), disabled: isFormReadOnly }}
            error={errors.handoverStatus?.message}
          />
          <FormField
            label="Ngày bàn giao"
            type="datetime-local"
            inputProps={{ ...register("handoverAt"), disabled: isFormReadOnly || handoverStatus !== "Đã bàn giao" }}
            error={errors.handoverAt?.message}
          />
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <input type="checkbox" {...register("visible")} disabled={isFormReadOnly} />
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
              disabled={isFormReadOnly}
            />
          </div>

          <div className="lg:col-span-2">
            <FormField
              label="Ghi chú"
              type="textarea"
              inputProps={{ ...register("note"), rows: 3, disabled: isFormReadOnly }}
              error={errors.note?.message}
            />
          </div>
      </FormSection>

      <ImageLightbox
        currentIndex={lightboxIndex}
        images={contractImages}
        onClose={() => setLightboxIndex(null)}
        onNext={() => setLightboxIndex(lightboxIndex + 1)}
        onPrev={() => setLightboxIndex(lightboxIndex - 1)}
      />

      <Modal
        open={handoverConfirmOpen}
        onClose={() => {
          setHandoverConfirmOpen(false);
          setPendingSubmit(null);
        }}
        title="Xác nhận bàn giao"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setHandoverConfirmOpen(false);
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
                setHandoverConfirmOpen(false);
                setPendingSubmit(null);
                if (current) {
                  void persist(current.values, current.mode);
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
          Hợp đồng sẽ chuyển sang trạng thái
          <span className="font-semibold text-slate-800"> Đã bàn giao</span>. Sau khi bàn giao, hợp đồng chỉ được xem chi tiết và không thể chỉnh sửa.
        </p>
      </Modal>
    </FormPageLayout>
  );
}

export default BusinessForm;

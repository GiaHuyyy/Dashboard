import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { FormActions } from "@/components/program-form/FormActions";
import { ProgramInfo } from "@/components/program-form/ProgramInfo";
import { COMPLETED_STATUS, DURATION_UNIT_OPTIONS } from "@/constants/program";
import { businessContractApi, designApi, programApi, staffApi, systemSettingApi } from "@/lib/api-client";
import { useSystemCategoryOptions } from "@/lib/system-categories";
import { calculateConvertByDuration, getConvertSettings, DEFAULT_CONVERT_SETTINGS } from "@/lib/convert";
import { getStaffNamesByRole, toSelectOptions } from "@/lib/staff-roles";
import FormField from "@/components/ui/form-field";
import Modal from "@/components/ui/modal";


const toDateTimeLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
};

const programSchema = z
  .object({
    businessContractId: z.string().trim().min(1, "Vui lòng chọn hợp đồng"),
    module: z.string().trim().min(1, "Vui lòng chọn module"),
    priority: z.string().trim().min(1, "Vui lòng chọn mức độ ưu tiên"),
    durationValue: z.coerce.number().gt(0, "Thời gian phải lớn hơn 0"),
    durationUnit: z.enum(DURATION_UNIT_OPTIONS, { message: "Vui lòng chọn đơn vị thời gian hợp lệ" }),
    convert: z.string().trim().min(1, "Vui lòng nhập quy đổi"),
    bonusPoint: z.coerce.number().gte(0, "Điểm cộng thêm không hợp lệ"),
    assigner: z.string().trim().min(1, "Vui lòng chọn người giao"),
    assignee: z.string().trim().min(1, "Vui lòng chọn người nhận"),
    designTaskId: z.string().trim().optional(),
    design: z.boolean(),
    visible: z.boolean(),
    processingStatus: z.string().trim().min(1, "Vui lòng chọn trạng thái"),
    assignedAt: z.string().trim().min(1, "Vui lòng chọn ngày giao"),
    receivedAt: z.string().trim().min(1, "Vui lòng chọn ngày nhận"),
    dueAt: z.string().trim().min(1, "Vui lòng chọn ngày dự kiến"),
    completedAt: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.design && !values.designTaskId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["designTaskId"],
        message: "Vui lòng chọn thiết kế tham chiếu",
      });
    }
  });

const defaultValues = {
  businessContractId: "",
  module: "",
  priority: "",
  durationValue: 1,
  durationUnit: "ngày",
  convert: "1",
  bonusPoint: 0,
  assigner: "",
  assignee: "",
  designTaskId: "",
  design: false,
  visible: true,
  processingStatus: "",
  assignedAt: "",
  receivedAt: "",
  dueAt: "",
  completedAt: "",
};

function ProgramForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: programId } = useParams();
  const returnPath = location.state?.sourcePath || "/lap-trinh/danh-sach";
  const isEditMode = Boolean(programId);
  const businessContractFromState = location.state?.businessContract || null;

  const [isLoadingProgram, setIsLoadingProgram] = useState(false);
  const [staffReferences, setStaffReferences] = useState([]);
  const [designReferences, setDesignReferences] = useState([]);
  const [programReferences, setProgramReferences] = useState([]);
  const [businessContractReferences, setBusinessContractReferences] = useState([]);
  const [initialSnapshot, setInitialSnapshot] = useState(defaultValues);
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(null);
  const [convertSettings, setConvertSettings] = useState(DEFAULT_CONVERT_SETTINGS);

  const {
    control,
    register,
    handleSubmit,
    getValues,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(programSchema),
    defaultValues,
  });

  const selectedDurationValue = useWatch({ control, name: "durationValue" });
  const selectedDurationUnit = useWatch({ control, name: "durationUnit" });
  const selectedDesign = useWatch({ control, name: "design" });
  const selectedDesignTaskId = useWatch({ control, name: "designTaskId" });
  const selectedBusinessContractId = useWatch({ control, name: "businessContractId" });
  const selectedProcessingStatus = useWatch({ control, name: "processingStatus" });
  const isReadOnlyMode = isEditMode && initialSnapshot.processingStatus === COMPLETED_STATUS;

  const moduleCategories = useSystemCategoryOptions("module");
  const priorityCategories = useSystemCategoryOptions("priority");
  const statusCategories = useSystemCategoryOptions("status");

  const processingStatusValues = useMemo(() => {
    const values = statusCategories.values || [];
    if (isEditMode) return values;
    return values.filter((item) => item !== COMPLETED_STATUS);
  }, [isEditMode, statusCategories.values]);

  const processingStatusOptions = useMemo(
    () => processingStatusValues.map((item) => ({ label: item, value: item })),
    [processingStatusValues],
  );

  const selectedBusinessContract = useMemo(() => {
    if (!selectedBusinessContractId) return null;
    return (
      businessContractReferences.find((item) => String(item.id) === String(selectedBusinessContractId)) ||
      businessContractReferences.find((item) => String(item._id) === String(selectedBusinessContractId)) ||
      businessContractReferences.find((item) => String(item.contractCode) === String(selectedBusinessContractId)) ||
      businessContractReferences.find((item) => item.label === selectedBusinessContractId) ||
      null
    );
  }, [businessContractReferences, selectedBusinessContractId]);

  useEffect(() => {
    const fetchReferences = async () => {
      try {
        const [staffResponse, designResponse, businessResponse, programResponse, settingResponse] = await Promise.all([
          staffApi.references(),
          designApi.references(),
          businessContractApi.references(),
          programApi.references(),
          systemSettingApi.detail(),
        ]);
        const nextStaffReferences = Array.isArray(staffResponse?.staffs) ? staffResponse.staffs : [];
        const nextDesignReferences = Array.isArray(designResponse?.designTasks) ? designResponse.designTasks : [];
        const nextBusinessReferences = Array.isArray(businessResponse?.contracts) ? businessResponse.contracts : [];
        const nextProgramReferences = Array.isArray(programResponse?.programs) ? programResponse.programs : [];
        setConvertSettings(getConvertSettings(settingResponse?.settings));

        setStaffReferences(nextStaffReferences);
        setDesignReferences(nextDesignReferences);
        setBusinessContractReferences(nextBusinessReferences);
        setProgramReferences(nextProgramReferences);

        const managerOptions = getStaffNamesByRole(nextStaffReferences, "Quản lý");
        const programmerOptions = getStaffNamesByRole(nextStaffReferences, "Lập trình viên");
        if (!isEditMode && managerOptions.length > 0) {
          setValue("assigner", managerOptions[0], { shouldValidate: true });
        }
        if (!isEditMode && programmerOptions.length > 0) {
          setValue("assignee", programmerOptions[0], { shouldValidate: true });
        }
      } catch (error) {
        toast.error(error?.message || "Không thể tải dữ liệu tham chiếu");
      }
    };
    void fetchReferences();
  }, [isEditMode, setValue]);

  const assignerOptions = toSelectOptions(getStaffNamesByRole(staffReferences, "Quản lý"));
  const assigneeOptions = toSelectOptions(getStaffNamesByRole(staffReferences, "Lập trình viên"));
  const designTaskOptions = designReferences.map((item) => ({
    label: item?.label || item?.title || "Design",
    value: item?.id,
  }));
  const usedBusinessContractIds = useMemo(() => {
    if (isEditMode) return new Set();
    return new Set(
      programReferences
        .map((item) => item?.businessContractId)
        .filter((value) => value !== undefined && value !== null && value !== ""),
    );
  }, [isEditMode, programReferences]);

  const contractOptions = businessContractReferences.map((item) => {
    const value = item?.id ?? item?._id ?? item?.contractCode ?? item?.label;
    const isUsed = !isEditMode && usedBusinessContractIds.has(value);
    return {
      label: item?.label || `${item.contractCode || "N/A"} - ${item.contractName || "N/A"}`,
      value,
      disabled: isUsed,
    };
  });

  useEffect(() => {
    const nextModule = moduleCategories.options?.[0]?.value || "";
    const nextPriority = priorityCategories.options?.[0]?.value || "";
    const nextStatus = processingStatusValues?.[0] || "";
    if (nextModule && !getValues("module")) {
      setValue("module", nextModule, { shouldValidate: true });
    }
    if (nextPriority && !getValues("priority")) {
      setValue("priority", nextPriority, { shouldValidate: true });
    }
    if (nextStatus && !getValues("processingStatus")) {
      setValue("processingStatus", nextStatus, { shouldValidate: true });
    }
  }, [getValues, moduleCategories.options, priorityCategories.options, processingStatusValues, setValue]);

  useEffect(() => {
    const convertedValue = calculateConvertByDuration(selectedDurationValue, selectedDurationUnit, convertSettings);
    setValue("convert", convertedValue, { shouldValidate: true });
  }, [convertSettings, selectedDurationValue, selectedDurationUnit, setValue]);

  useEffect(() => {
    if (!selectedDesign) {
      setValue("designTaskId", "", { shouldValidate: true });
    }
  }, [selectedDesign, setValue]);

  useEffect(() => {
    if (selectedProcessingStatus === COMPLETED_STATUS) return;
    setValue("completedAt", "", { shouldValidate: true });
  }, [selectedProcessingStatus, setValue]);

  useEffect(() => {
    if (!selectedDesign || selectedDesignTaskId || designReferences.length === 0) return;
    setValue("designTaskId", designReferences[0].id, { shouldValidate: true });
  }, [designReferences, selectedDesign, selectedDesignTaskId, setValue]);

  useEffect(() => {
    if (isEditMode || !businessContractFromState) return;
    const fallbackId =
      businessContractFromState.id ||
      businessContractFromState._id ||
      businessContractFromState.contractCode ||
      businessContractFromState.label ||
      "";
    if (!fallbackId) return;
    setValue("businessContractId", fallbackId, { shouldValidate: true });
  }, [businessContractFromState, isEditMode, setValue]);

  useEffect(() => {
    if (isEditMode) return;
    if (selectedBusinessContractId) return;
    if (businessContractReferences.length === 0) return;
    const firstAvailable = contractOptions.find((option) => !option.disabled && option.value);
    if (!firstAvailable) return;
    setValue("businessContractId", firstAvailable.value, { shouldValidate: true });
  }, [businessContractReferences.length, contractOptions, isEditMode, selectedBusinessContractId, setValue]);

  useEffect(() => {
    if (!isEditMode) return;

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
          businessContractId: program.businessContractId || "",
          module: program.module || "",
          priority: program.priority || "",
          durationValue: safeDuration,
          durationUnit: program.durationUnit || "ngày",
          convert: program.convert || "1",
          bonusPoint: Number(program.bonusPoint) || 0,
          assigner: program.assigner || "",
          assignee: program.assignee || "",
          // eslint-disable-next-line no-extra-boolean-cast
          designTaskId: Boolean(program.design) ? program.designTaskId || "" : "",
          design: Boolean(program.design),
          visible: Boolean(program.visible),
          processingStatus: program.processingStatus || "",
          assignedAt: toDateTimeLocal(program.assignedAt),
          receivedAt: toDateTimeLocal(program.receivedAt),
          dueAt: toDateTimeLocal(program.dueAt),
          completedAt: toDateTimeLocal(program.completedAt),
        };
        reset(formValues);
        setInitialSnapshot(formValues);
      } catch (error) {
        toast.error(error?.message || "Không thể tải dữ liệu chỉnh sửa");
        navigate(returnPath);
      } finally {
        setIsLoadingProgram(false);
      }
    };

    void fetchProgramDetail();
  }, [isEditMode, navigate, programId, reset, returnPath]);

  const persistProgram = async (values, mode) => {
    const shouldSendMail = mode === "save-mail";
    const payload = {
      ...values,
      convert: calculateConvertByDuration(values.durationValue, values.durationUnit, convertSettings),
      bonusPoint: values.bonusPoint,
      sendMail: shouldSendMail,
      receivedAt: values.receivedAt || null,
      completedAt: values.processingStatus === COMPLETED_STATUS ? values.completedAt || null : null,
    };

    try {
      await programApi.validate({
        ...payload,
        currentProgramId: isEditMode ? programId : undefined,
      });
    } catch (error) {
      toast.error(error?.message || "Lưu dữ liệu không thành công");
      return;
    }

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

    if (mode === "save-stay") {
      toast.success(response?.message || (isEditMode ? "Đã cập nhật form tại trang" : "Đã lưu form tại trang"));
      if (!isEditMode && response?.program?.id) {
        navigate(`/lap-trinh/chinh-sua/${response.program.id}`, { replace: true, state: { sourcePath: returnPath } });
        return;
      }
      setInitialSnapshot(values);
      reset(values);
      return;
    }

    if (mode === "save-mail") {
      toast.success(response?.message || (isEditMode ? "Đã cập nhật form và gửi mail" : "Đã lưu form và gửi mail"));
      if (!isEditMode) {
        navigate(returnPath);
      }
      return;
    }

    toast.success(response?.message || (isEditMode ? "Cập nhật thành công" : "Lưu thành công"));
    navigate(returnPath);
  };

  const onInvalid = () => {
    toast.error("Vui lòng kiểm tra lại thông tin form");
  };

  const onSubmit = async (values, mode) => {
    if (isReadOnlyMode) return;
    if (values.processingStatus === COMPLETED_STATUS && initialSnapshot.processingStatus !== COMPLETED_STATUS) {
      setPendingSubmit({ values, mode });
      setCompleteConfirmOpen(true);
      return;
    }
    await persistProgram(values, mode);
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
    <>
      <form className="space-y-4">
        <FormActions
          onSave={() => submitWithMode("save")}
          onSaveMail={() => null}
          onSaveStay={() => submitWithMode("save-stay")}
          onReset={() => reset(initialSnapshot)}
          isSubmitting={isSubmitting}
          isUploading={false}
          isEditMode={isEditMode}
          exitPath={returnPath}
          showSaveMail={false}
          readOnlyMode={isReadOnlyMode}
        />

        <fieldset disabled={isReadOnlyMode}>
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-3 text-lg font-semibold text-slate-700">Nội dung</div>
            <div className="grid gap-5 p-5 lg:grid-cols-2">
              <ProgramInfo
                register={register}
                errors={errors}
                contractOptions={contractOptions}
                selectedContract={selectedBusinessContract}
                designTaskOptions={designTaskOptions}
                moduleOptions={moduleCategories.options}
                priorityOptions={priorityCategories.options}
                designEnabled={Boolean(selectedDesign)}
              />

              <div className="space-y-4 flex flex-col rounded-xl border border-slate-100 p-4">
                <p className="text-md font-semibold text-slate-700">Theo dõi xử lý</p>

                <FormField
                  label="Người giao (Quản lý)"
                  type="select"
                  options={assignerOptions}
                  selectProps={register("assigner")}
                  error={errors.assigner?.message}
                />

                <FormField
                  label="Người nhận (lập trình)"
                  type="select"
                  options={assigneeOptions}
                  selectProps={register("assignee")}
                  error={errors.assignee?.message}
                />

                <FormField
                  label="Trạng thái"
                  type="select"
                  options={
                    processingStatusOptions.length > 0
                      ? processingStatusOptions
                      : [{ label: "Chưa có danh mục", value: "" }]
                  }
                  selectProps={register("processingStatus")}
                  error={errors.processingStatus?.message}
                />

                <FormField
                  label="Ngày giao"
                  type="datetime-local"
                  inputProps={register("assignedAt")}
                  error={errors.assignedAt?.message}
                />

                <FormField
                  label="Ngày nhận"
                  type="datetime-local"
                  inputProps={register("receivedAt")}
                  error={errors.receivedAt?.message}
                />

                <FormField
                  label="Ngày dự kiến"
                  type="datetime-local"
                  inputProps={register("dueAt")}
                  error={errors.dueAt?.message}
                />

                <FormField
                  label="Ngày hoàn thành"
                  type="datetime-local"
                  inputProps={{
                    ...register("completedAt"),
                    disabled: selectedProcessingStatus !== COMPLETED_STATUS,
                  }}
                  error={errors.completedAt?.message}
                />

                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <input type="checkbox" {...register("visible")} />
                  Hiển thị
                </label>
              </div>
            </div>
          </div>
        </fieldset>
      </form>

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
          <span className="font-semibold text-slate-800"> {COMPLETED_STATUS}</span>. Xác nhận để lưu cập nhật.
        </p>
      </Modal>
    </>
  );
}

export default ProgramForm;
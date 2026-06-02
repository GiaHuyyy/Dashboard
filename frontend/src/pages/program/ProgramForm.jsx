import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { useSelector } from "react-redux";

import { FormActions, FormPageLayout, FormSection } from "@/components/forms";
import { COMPLETED_STATUS } from "@/constants/program";
import { businessContractApi, designApi, programApi, staffApi } from "@/lib/api-client";
import { useSystemCategoryOptions } from "@/lib/system-categories";
import { ensureSelectOption, getStaffNamesByRole, toSelectOptions } from "@/lib/staff-roles";
import { hasPermission } from "@/lib/permissions";
import FormField from "@/components/ui/form-field";
import Modal from "@/components/ui/modal";
import { PERMISSIONS } from "@/constants/permissions";


const getContractOptionLabel = (item) =>
  item ? item.label || `${item.contractCode || "N/A"} - ${item.contractName || "N/A"}`.trim() : "";

const isValidDateValue = (value) => {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

const toDateTimeLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
};

function ProgramInfo({
  register,
  errors,
  contractOptions = [],
  designTaskOptions = [],
  moduleOptions = [],
  priorityOptions = [],
  designEnabled = false,
  lockContractSelection = false,
  lockedContractLabel = "",
  selectedProcessingStatus = "",
}) {
  return (
    <div className="space-y-4 flex flex-col rounded-xl border border-slate-100 p-4">
      <p className="text-md font-semibold text-slate-700">Thông tin lập trình</p>

      {lockContractSelection ? (
        <>
          <input type="hidden" {...register("businessContractId")} />
          <FormField
            label="Phiếu gốc / Số HĐ"
            type="text"
            inputProps={{
              value: lockedContractLabel || "Không có dữ liệu",
              readOnly: true,
              placeholder: "Phiếu gốc / Số HĐ đang chỉnh sửa",
            }}
            error={errors.businessContractId?.message}
          />
        </>
      ) : (
        <FormField
          label="Phiếu gốc / Số HĐ"
          type="select"
          options={contractOptions.length > 0 ? contractOptions : [{ label: "Chưa có hợp đồng", value: "" }]}
          selectProps={{ ...register("businessContractId"), disabled: contractOptions.length === 0 }}
          error={errors.businessContractId?.message}
        />
      )}

      <FormField
        label="Module"
        type="select"
        options={moduleOptions.length > 0 ? moduleOptions : [{ label: "Chưa có danh mục", value: "" }]}
        selectProps={{ ...register("module"), disabled: moduleOptions.length === 0 }}
        error={errors.module?.message}
      />

      <FormField
        label="Mức độ ưu tiên"
        type="select"
        options={priorityOptions.length > 0 ? priorityOptions : [{ label: "Chưa có danh mục", value: "" }]}
        selectProps={{ ...register("priority"), disabled: priorityOptions.length === 0 }}
        error={errors.priority?.message}
      />
            {selectedProcessingStatus === COMPLETED_STATUS ? (

      <FormField
        label="Điểm cộng"
        type="number"
        inputProps={{ ...register("bonusPoint"), min: "0", step: "0.125", placeholder: "Nhập điểm cộng" }}
        error={errors.bonusPoint?.message}
      />

                  ) : null}
<div className="grid grid-cols-2 gap-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          <input type="checkbox" {...register("design")} />
          Design
        </label>
      </div>

      {designEnabled ? (
        <FormField
          label="Thiết kế tham chiếu"
          type="select"
          options={designTaskOptions.length > 0 ? designTaskOptions : [{ label: "Chưa có dữ liệu design", value: "" }]}
          selectProps={{ ...register("designTaskId"), disabled: designTaskOptions.length === 0 }}
          error={errors.designTaskId?.message}
        />
      ) : null}

      <FormField
        label="Ghi chú"
        type="textarea"
        inputProps={{
          ...register("note"),
          placeholder: "Nhập ghi chú nếu có",
          rows: 3,
        }}
        error={errors.note?.message}
      />
    </div>
  );
}

const programSchema = z
  .object({
    businessContractId: z.string().trim().min(1, "Vui lòng chọn hợp đồng"),
    module: z.string().trim().min(1, "Vui lòng chọn module"),
    priority: z.string().trim().min(1, "Vui lòng chọn mức độ ưu tiên"),
    bonusPoint: z.coerce.number().gte(0, "Điểm cộng không hợp lệ"),
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
    note: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.design && !values.designTaskId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["designTaskId"],
        message: "Vui lòng chọn thiết kế tham chiếu",
      });
    }

    if (values.processingStatus === COMPLETED_STATUS && !isValidDateValue(values.completedAt)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["completedAt"],
        message: "Vui lòng chọn ngày hoàn thành",
      });
    }
  });

const defaultValues = {
  businessContractId: "",
  module: "",
  priority: "",
  durationValue: 0,
  durationUnit: "ngày",
  convert: "0",
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
  note: "",
};

function ProgramForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: programId } = useParams();
  const returnPath = location.state?.sourcePath || "/lap-trinh/danh-sach";
  const isEditMode = Boolean(programId);
  const currentUser = useSelector((state) => state.auth.user);
  const canSave = hasPermission(currentUser, isEditMode ? PERMISSIONS.PROGRAM_UPDATE : PERMISSIONS.PROGRAM_CREATE);
  const canOverrideCompleted = hasPermission(currentUser, PERMISSIONS.PROGRAM_OVERRIDE_COMPLETED);
  const businessContractFromState = location.state?.businessContract || null;

  const [isLoadingProgram, setIsLoadingProgram] = useState(isEditMode);
  const [staffReferences, setStaffReferences] = useState([]);
  const [designReferences, setDesignReferences] = useState([]);
  const [programReferences, setProgramReferences] = useState([]);
  const [businessContractReferences, setBusinessContractReferences] = useState([]);
  const [initialSnapshot, setInitialSnapshot] = useState(defaultValues);
  const [lockedContractLabel, setLockedContractLabel] = useState("");
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(null);

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
  const selectedDesign = useWatch({ control, name: "design" });
  const selectedDesignTaskId = useWatch({ control, name: "designTaskId" });
  const selectedBusinessContractId = useWatch({ control, name: "businessContractId" });
  const selectedProcessingStatus = useWatch({ control, name: "processingStatus" });
  const selectedAssigner = useWatch({ control, name: "assigner" });
  const selectedAssignee = useWatch({ control, name: "assignee" });
  const isCompletedReadOnlyMode =
    isEditMode && initialSnapshot.processingStatus === COMPLETED_STATUS && !canOverrideCompleted;
  const isReadOnlyMode = !canSave || isCompletedReadOnlyMode;

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

  useEffect(() => {
    let isActive = true;

    const fetchReferences = async () => {
      try {
        const [staffResponse, designResponse, businessResponse, programResponse] = await Promise.all([
          staffApi.references(),
          designApi.references(),
          isEditMode ? Promise.resolve({ contracts: [] }) : businessContractApi.references(),
          isEditMode ? Promise.resolve({ programs: [] }) : programApi.references(),
        ]);
        if (!isActive) return;

        const nextStaffReferences = Array.isArray(staffResponse?.staffs) ? staffResponse.staffs : [];
        const nextDesignReferences = Array.isArray(designResponse?.designTasks) ? designResponse.designTasks : [];
        const nextBusinessReferences = Array.isArray(businessResponse?.contracts) ? businessResponse.contracts : [];
        const nextProgramReferences = Array.isArray(programResponse?.programs) ? programResponse.programs : [];

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
        if (isActive) {
          toast.error(error?.message || "Không thể tải dữ liệu tham chiếu");
        }
      }
    };
    void fetchReferences();

    return () => {
      isActive = false;
    };
  }, [isEditMode, setValue]);

  const assignerOptions = useMemo(
    () => ensureSelectOption(toSelectOptions(getStaffNamesByRole(staffReferences, "Quản lý")), selectedAssigner),
    [selectedAssigner, staffReferences],
  );
  const assigneeOptions = useMemo(
    () => ensureSelectOption(toSelectOptions(getStaffNamesByRole(staffReferences, "Lập trình viên")), selectedAssignee),
    [selectedAssignee, staffReferences],
  );
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
      label: getContractOptionLabel(item),
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
    if (!isEditMode) return undefined;

    let isActive = true;

    const fetchProgramDetail = async () => {
      setIsLoadingProgram(true);
      try {
        const response = await programApi.detail(programId);
        if (!isActive) return;

        const program = response?.program;
        if (!program) {
          toast.error("Không tìm thấy dữ liệu cần chỉnh sửa");
          navigate(returnPath);
          return;
        }
        setLockedContractLabel(
          [program.contractCode, program.contractName].filter(Boolean).join(" - ") ||
            program.businessContractId ||
            "Không có dữ liệu",
        );

        const formValues = {
          businessContractId: program.businessContractId || "",
          module: program.module || "",
          priority: program.priority || "",
          durationValue: Number(program.durationValue) || 0,
          durationUnit: program.durationUnit || "ngày",
          convert: program.convert || "0",
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
          note: program.note || "",
        };
        reset(formValues);
        setInitialSnapshot(formValues);
      } catch (error) {
        if (isActive) {
          toast.error(error?.message || "Không thể tải dữ liệu chỉnh sửa");
          navigate(returnPath);
        }
      } finally {
        if (isActive) {
          setIsLoadingProgram(false);
        }
      }
    };

    void fetchProgramDetail();

    return () => {
      isActive = false;
    };
  }, [isEditMode, navigate, programId, reset, returnPath]);

  const persistProgram = async (values, mode) => {
    const payload = {
      ...values,
      durationValue: 0,
      durationUnit: "ngày",
      time: "",
      convert: "0",
      bonusPoint: values.processingStatus === COMPLETED_STATUS ? values.bonusPoint : 0,
      receivedAt: values.receivedAt || null,
      completedAt: values.processingStatus === COMPLETED_STATUS ? values.completedAt || null : null,
      note: values.note || "",
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

    toast.success(response?.message || (isEditMode ? "Cập nhật thành công" : "Lưu thành công"));
    navigate(returnPath);
  };

  const onInvalid = () => {
    toast.error("Vui lòng kiểm tra lại thông tin form");
  };

  const onSubmit = async (values, mode) => {
    if (!canSave) {
      toast.error("Bạn không có quyền lưu dữ liệu này");
      return;
    }
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
      <FormPageLayout
        disabled={isReadOnlyMode}
        actions={
          <FormActions
            onSave={() => submitWithMode("save")}
            onSaveStay={() => submitWithMode("save-stay")}
            onReset={() => reset(initialSnapshot)}
            isSubmitting={isSubmitting}
            isUploading={false}
            isEditMode={isEditMode}
            exitPath={returnPath}
            showSaveMail={false}
            readOnlyMode={isReadOnlyMode}
          />
        }
      >
        <FormSection title="Nội dung">
          <ProgramInfo
            register={register}
            errors={errors}
            contractOptions={contractOptions}
            designTaskOptions={designTaskOptions}
            lockContractSelection={isEditMode}
            lockedContractLabel={lockedContractLabel}
            moduleOptions={moduleCategories.options}
            priorityOptions={priorityCategories.options}
            designEnabled={Boolean(selectedDesign)}
            selectedProcessingStatus={selectedProcessingStatus}
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
            {selectedProcessingStatus === COMPLETED_STATUS ? (


            <FormField
              label="Ngày hoàn thành"
              type="datetime-local"
              inputProps={{
                ...register("completedAt"),
                disabled: selectedProcessingStatus !== COMPLETED_STATUS,
              }}
              error={errors.completedAt?.message}
            />

                        ) : null}
<label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <input type="checkbox" {...register("visible")} />
              Hiển thị
            </label>
          </div>
        </FormSection>
      </FormPageLayout>

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

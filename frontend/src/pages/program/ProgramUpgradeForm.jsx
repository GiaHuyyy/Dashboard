import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { useSelector } from "react-redux";

import { FormActions, FormPageLayout, FormSection } from "@/components/forms";
import { UPGRADE_COMPLETED_STATUS } from "@/constants/program-upgrade";
import { businessContractApi, programApi, staffApi, upgradeApi } from "@/lib/api-client";
import { useSystemCategoryOptions } from "@/lib/system-categories";
import { ensureSelectOption, getStaffNamesByRole, toSelectOptions } from "@/lib/staff-roles";
import { hasPermission } from "@/lib/permissions";
import FormField from "@/components/ui/form-field";
import Modal from "@/components/ui/modal";
import { PERMISSIONS } from "@/constants/permissions";

const isValidDateValue = (value) => {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

const schema = z
  .object({
    businessContractId: z.string().trim().min(1, "Vui lòng chọn Phiếu gốc / Số HĐ"),
    upgradeItem: z.string().trim().min(3, "Vui lòng nhập hàng mục nâng cấp"),
    priority: z.string().trim().min(1, "Vui lòng chọn mức độ ưu tiên"),
    bonusPoint: z.coerce.number().gte(0, "Điểm cộng không hợp lệ"),
    assigner: z.string().trim().min(1, "Vui lòng chọn người giao"),
    assignee: z.string().trim().min(1, "Vui lòng chọn người nhận"),
    assignedAt: z.string().trim().min(1, "Vui lòng nhập ngày giao").refine(isValidDateValue, "Ngày giao không hợp lệ"),
    receivedAt: z.string().trim().min(1, "Vui lòng nhập ngày nhận").refine(isValidDateValue, "Ngày nhận không hợp lệ"),
    dueAt: z.string().trim().min(1, "Vui lòng nhập ngày dự kiến").refine(isValidDateValue, "Ngày dự kiến không hợp lệ"),
    completedAt: z
      .string()
      .optional()
      .refine((value) => !value || isValidDateValue(value), "Ngày hoàn thành không hợp lệ"),
    status: z.string().trim().min(1, "Vui lòng chọn trạng thái"),
    visible: z.boolean(),
    note: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.status === UPGRADE_COMPLETED_STATUS && !isValidDateValue(values.completedAt)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["completedAt"],
        message: "Vui lòng chọn ngày hoàn thành",
      });
    }
  });

const defaultValues = {
  businessContractId: "",
  upgradeItem: "",
  priority: "",
  durationValue: 0,
  durationUnit: "ngày",
  convert: "0",
  bonusPoint: 0,
  status: "",
  assigner: "",
  assignee: "",
  assignedAt: "",
  receivedAt: "",
  dueAt: "",
  completedAt: "",
  visible: true,
  note: "",
};

const toDateTimeLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const mapUpgradeToForm = (item) => ({
  businessContractId: item.businessContractId || "",
  upgradeItem: item.upgradeItem || "",
  priority: item.priority || "",
  durationValue: Number(item.durationValue) || 0,
  durationUnit: item.durationUnit || "ngày",
  convert: item.convert || "0",
  bonusPoint: Number(item.bonusPoint) || 0,
  status: item.status || "",
  assigner: item.assigner || "",
  assignee: item.assignee || "",
  assignedAt: toDateTimeLocal(item.assignedAt),
  receivedAt: toDateTimeLocal(item.receivedAt),
  dueAt: toDateTimeLocal(item.dueAt),
  completedAt: toDateTimeLocal(item.completedAt),
  visible: Boolean(item.visible ?? true),
  note: item.note || "",
});


const getProgramByBusinessContractId = (programs, businessContractId) =>
  programs.find((item) => item.businessContractId === businessContractId) || null;

const getBusinessContractOptionLabel = (item) =>
  item ? `${item.contractCode || "N/A"} - ${item.contractName || "N/A"} - ${item.customerName || "N/A"}`.trim() : "";

function ProgramUpgradeForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const currentUser = useSelector((state) => state.auth.user);
  const canSave = hasPermission(currentUser, isEditMode ? PERMISSIONS.UPGRADE_UPDATE : PERMISSIONS.UPGRADE_CREATE);
  const canOverrideCompleted = hasPermission(currentUser, PERMISSIONS.UPGRADE_OVERRIDE_COMPLETED);
  const [programReferences, setProgramReferences] = useState([]);
  const [businessContractReferences, setBusinessContractReferences] = useState([]);
  const [staffReferences, setStaffReferences] = useState([]);
  const [isLoadingSources, setIsLoadingSources] = useState(true);
  const [initialSnapshot, setInitialSnapshot] = useState(defaultValues);
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
    resolver: zodResolver(schema),
    defaultValues,
  });

  const selectedBusinessContractId = useWatch({ control, name: "businessContractId" });
  const selectedStatus = useWatch({ control, name: "status" });
  const selectedAssigner = useWatch({ control, name: "assigner" });
  const selectedAssignee = useWatch({ control, name: "assignee" });
  const selectedProgram = useMemo(
    () => getProgramByBusinessContractId(programReferences, selectedBusinessContractId),
    [programReferences, selectedBusinessContractId],
  );
  const selectedBusinessContract = useMemo(
    () => businessContractReferences.find((item) => String(item.id) === String(selectedBusinessContractId)) || null,
    [businessContractReferences, selectedBusinessContractId],
  );
  const isCompletedReadOnlyMode =
    isEditMode && initialSnapshot.status === UPGRADE_COMPLETED_STATUS && !canOverrideCompleted;
  const isReadOnlyMode = !canSave || isCompletedReadOnlyMode;
  const priorityCategories = useSystemCategoryOptions("priority");
  const statusCategories = useSystemCategoryOptions("status");
  const statusValues = useMemo(() => {
    const values = statusCategories.values || [];
    if (isEditMode) return values;
    return values.filter((item) => item !== UPGRADE_COMPLETED_STATUS);
  }, [isEditMode, statusCategories.values]);
  const statusOptions = useMemo(() => statusValues.map((item) => ({ label: item, value: item })), [statusValues]);
  const businessContractRegister = register("businessContractId");

  useEffect(() => {
    if (isEditMode) return;
    const nextPriority = priorityCategories.options?.[0]?.value || "";
    const nextStatus = statusValues?.[0] || "";
    if (nextPriority && !getValues("priority")) {
      setValue("priority", nextPriority, { shouldValidate: true });
    }
    if (nextStatus && !getValues("status")) {
      setValue("status", nextStatus, { shouldValidate: true });
    }
  }, [getValues, isEditMode, priorityCategories.options, setValue, statusValues]);

  useEffect(() => {
    if (selectedStatus === UPGRADE_COMPLETED_STATUS) return;
    setValue("completedAt", "", { shouldValidate: true });
  }, [selectedStatus, setValue]);

  const assignerOptions = useMemo(
    () => ensureSelectOption(toSelectOptions(getStaffNamesByRole(staffReferences, "Quản lý")), selectedAssigner),
    [selectedAssigner, staffReferences],
  );
  const assigneeOptions = useMemo(
    () => ensureSelectOption(toSelectOptions(getStaffNamesByRole(staffReferences, "Lập trình viên")), selectedAssignee),
    [selectedAssignee, staffReferences],
  );

  useEffect(() => {
    const fetchSources = async () => {
      setIsLoadingSources(true);
      try {
        const requests = [staffApi.references(), programApi.references(), businessContractApi.references()];
        if (isEditMode) {
          requests.push(upgradeApi.detail(id));
        }

        const [staffResponse, programResponse, businessResponse, detailResponse] = await Promise.all([...requests]);

        const staffList = Array.isArray(staffResponse?.staffs) ? staffResponse.staffs : [];
        const programs = Array.isArray(programResponse?.programs) ? programResponse.programs : [];
        const contracts = Array.isArray(businessResponse?.contracts) ? businessResponse.contracts : [];
        setStaffReferences(staffList);
        setProgramReferences(programs);
        setBusinessContractReferences(contracts);

        if (isEditMode) {
          const upgrade = detailResponse?.upgrade;
          if (!upgrade) {
            toast.error("Không tìm thấy yêu cầu nâng cấp");
            navigate("/lap-trinh/nang-cap");
            return;
          }
          const linkedProgram = programs.find((item) => item.id === upgrade.programId) || null;
          const formValues = mapUpgradeToForm({
            ...upgrade,
            businessContractId: linkedProgram?.businessContractId || "",
          });
          reset(formValues);
          setInitialSnapshot(formValues);
          return;
        }

        const selected = contracts[0];
        const linkedProgram = getProgramByBusinessContractId(programs, selected?.id);
        const managerOptions = getStaffNamesByRole(staffList, "Quản lý");
        const programmerOptions = getStaffNamesByRole(staffList, "Lập trình viên");
        const nextDefaults = {
          ...defaultValues,
          businessContractId: selected?.id || "",
          durationValue: linkedProgram?.durationValue || defaultValues.durationValue,
          durationUnit: linkedProgram?.durationUnit || defaultValues.durationUnit,
          convert: linkedProgram?.convert || defaultValues.convert,
          assigner: managerOptions[0] || defaultValues.assigner,
          assignee: programmerOptions[0] || defaultValues.assignee,
        };
        reset(nextDefaults);
        setInitialSnapshot(nextDefaults);
      } catch (error) {
        toast.error(error?.message || "Không thể tải dữ liệu phiếu gốc");
      } finally {
        setIsLoadingSources(false);
      }
    };
    void fetchSources();
  }, [id, isEditMode, navigate, reset]);

  const persistUpgrade = async (values, mode) => {
    const selectedLinkedProgram = getProgramByBusinessContractId(programReferences, values.businessContractId);
    if (!selectedLinkedProgram?.id) {
      toast.error("Hợp đồng này chưa có phiếu gốc lập trình để tạo nâng cấp");
      return;
    }
    const payload = {
      programId: selectedLinkedProgram.id,
      upgradeItem: values.upgradeItem,
      priority: values.priority,
      durationValue: values.durationValue,
      durationUnit: values.durationUnit,
      convert: values.convert,
      durationValue: 0,
      durationUnit: "ngày",
      time: "",
      convert: "0",
      bonusPoint: values.status === UPGRADE_COMPLETED_STATUS ? values.bonusPoint : 0,
      status: values.status,
      assigner: values.assigner,
      assignee: values.assignee,
      assignedAt: values.assignedAt,
      receivedAt: values.receivedAt || null,
      dueAt: values.dueAt,
      completedAt: values.status === UPGRADE_COMPLETED_STATUS ? values.completedAt || null : null,
      visible: values.visible,
      note: values.note || "",
    };

    // eslint-disable-next-line no-useless-assignment
    let savedUpgrade = null;
    try {
      if (isEditMode) {
        const response = await upgradeApi.update(id, payload);
        savedUpgrade = response?.upgrade || null;
      } else {
        const response = await upgradeApi.create(payload);
        savedUpgrade = response?.upgrade || null;
      }
    } catch (error) {
      toast.error(error?.message || "Không thể lưu yêu cầu nâng cấp");
      return;
    }

    if (mode === "save-stay") {
      if (!isEditMode && savedUpgrade?.id) {
        toast.success("Đã tạo yêu cầu nâng cấp tại trang");
        navigate(`/lap-trinh/nang-cap/chinh-sua/${savedUpgrade.id}`, { replace: true });
        return;
      }
      toast.success("Đã cập nhật yêu cầu nâng cấp tại trang");
      setInitialSnapshot(values);
      return;
    }

    toast.success(isEditMode ? "Đã cập nhật yêu cầu nâng cấp" : "Đã tạo yêu cầu nâng cấp");
    navigate("/lap-trinh/nang-cap");
  };

  const onSubmit = async (values, mode) => {
    if (!canSave) {
      toast.error("Bạn không có quyền lưu dữ liệu này");
      return;
    }
    if (isReadOnlyMode) {
      return;
    }
    if (values.status === UPGRADE_COMPLETED_STATUS && initialSnapshot.status !== UPGRADE_COMPLETED_STATUS) {
      setPendingSubmit({ values, mode });
      setCompleteConfirmOpen(true);
      return;
    }
    await persistUpgrade(values, mode);
  };

  const submitWithMode = (mode) =>
    handleSubmit(
      (values) => onSubmit(values, mode),
      () => toast.error("Vui lòng kiểm tra lại thông tin form"),
    )();

  if (isLoadingSources) {
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
            onSaveMail={() => null}
            onReset={() => reset(initialSnapshot)}
            isSubmitting={isSubmitting}
            isUploading={false}
            isEditMode={isEditMode}
            exitPath="/lap-trinh/nang-cap"
            showSaveMail={false}
            saveLabel={isEditMode ? "Cập nhật" : "Lưu"}
            saveStayLabel={isEditMode ? "Cập nhật tại trang" : "Lưu tại trang"}
            readOnlyMode={isReadOnlyMode}
          />
        }
      >
        <FormSection title="Nội dung nâng cấp">
          <div className="flex flex-col gap-4 rounded-xl border border-slate-100 p-4">
            <p className="text-md font-semibold text-slate-700">Thông tin nâng cấp</p>

            {isEditMode ? (
              <>
                <input type="hidden" {...businessContractRegister} />
                <FormField
                  label="Phiếu gốc / Số HĐ"
                  type="text"
                  inputProps={{
                    value: getBusinessContractOptionLabel(selectedBusinessContract) || "Không có dữ liệu",
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
                options={
                  businessContractReferences.length === 0
                    ? [{ label: "Không có dữ liệu", value: "" }]
                    : businessContractReferences.map((item) => ({
                        label: getBusinessContractOptionLabel(item),
                        value: item.id,
                      }))
                }
                selectProps={{
                  ...businessContractRegister,
                  disabled: businessContractReferences.length === 0,
                  onChange: (event) => {
                    const selected = getProgramByBusinessContractId(programReferences, event.target.value);
                    businessContractRegister.onChange(event);
                    if (!selected) {
                      return;
                    }
                  },
                }}
                error={errors.businessContractId?.message}
              />
            )}

            <FormField
              label="Module"
              type="text"
              inputProps={{
                value: selectedProgram?.module || "",
                readOnly: true,
                placeholder: "Tự động điền khi chọn Phiếu gốc / Số HĐ",
              }}
            />

            <FormField
              label="Hạng mục nâng cấp"
              type="textarea"
              inputProps={{ ...register("upgradeItem"), rows: 4, placeholder: "Mô tả hàng mục nâng cấp..." }}
              error={errors.upgradeItem?.message}
            />

            <FormField
              label="Mức độ ưu tiên"
              type="select"
              options={
                priorityCategories.options.length > 0
                  ? priorityCategories.options
                  : [{ label: "Chưa có danh mục", value: "" }]
              }
              selectProps={{ ...register("priority"), disabled: priorityCategories.options.length === 0 }}
              error={errors.priority?.message}
            />
            {selectedStatus === UPGRADE_COMPLETED_STATUS ? (

            <FormField
              label="Điểm cộng"
              type="number"
              inputProps={{ ...register("bonusPoint"), min: "0", step: "0.125" }}
              error={errors.bonusPoint?.message}
            />

                        ) : null}
<FormField
              label="Ghi chú"
              type="textarea"
              inputProps={{ ...register("note"), rows: 3, placeholder: "Ghi chú thêm (nếu có)" }}
              error={errors.note?.message}
            />
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-slate-100 p-4">
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
              options={statusOptions.length > 0 ? statusOptions : [{ label: "Chưa có danh mục", value: "" }]}
              selectProps={{ ...register("status"), disabled: statusOptions.length === 0 }}
              error={errors.status?.message}
            />

            <FormField
              label="Ngày giao"
              type="datetime-local"
              inputProps={{ ...register("assignedAt") }}
              error={errors.assignedAt?.message}
            />

            <FormField
              label="Ngày nhận"
              type="datetime-local"
              inputProps={{ ...register("receivedAt") }}
              error={errors.receivedAt?.message}
            />

            <FormField
              label="Ngày dự kiến"
              type="datetime-local"
              inputProps={{ ...register("dueAt") }}
              error={errors.dueAt?.message}
            />
            {selectedStatus === UPGRADE_COMPLETED_STATUS ? (


            <FormField
              label="Ngày hoàn thành"
              type="datetime-local"
              inputProps={{ ...register("completedAt"), disabled: selectedStatus !== UPGRADE_COMPLETED_STATUS }}
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
                  void persistUpgrade(current.values, current.mode);
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
          <span className="font-semibold text-slate-800"> {UPGRADE_COMPLETED_STATUS}</span>. Xác nhận để lưu cập nhật.
        </p>
      </Modal>
    </>
  );
}

export default ProgramUpgradeForm;

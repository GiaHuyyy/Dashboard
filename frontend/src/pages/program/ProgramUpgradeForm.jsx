import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { FormActions } from "@/components/program-form/FormActions";
import { DURATION_UNIT_OPTIONS } from "@/constants/program";
import { UPGRADE_PRIORITY_OPTIONS, UPGRADE_STATUS_OPTIONS } from "@/constants/program-upgrade";
import { programApi, staffApi, upgradeApi } from "@/lib/api-client";
import { getStaffNamesByRole, toSelectOptions } from "@/lib/staff-roles";
import FormField from "@/components/ui/form-field";
import Modal from "@/components/ui/modal";

const schema = z.object({
  programId: z.string().trim().min(1, "Vui lòng chọn Phiếu gốc / Số HĐ"),
  upgradeItem: z.string().trim().min(3, "Vui lòng nhập hạng mục nâng cấp"),
  priority: z.enum(UPGRADE_PRIORITY_OPTIONS, { message: "Vui lòng chọn mức độ ưu tiên" }),
  durationValue: z.coerce.number().gt(0, "Thời gian phải lớn hơn 0"),
  durationUnit: z.enum(DURATION_UNIT_OPTIONS, { message: "Vui lòng chọn đơn vị thời gian hợp lệ" }),
  convert: z.string().trim().min(1, "Vui lòng nhập quy đổi"),
  bonusPoint: z.coerce.number().gte(0, "Điểm cộng thêm không hợp lệ"),
  status: z.enum(UPGRADE_STATUS_OPTIONS, { message: "Vui lòng chọn trạng thái" }),
  assigner: z.string().trim().min(1, "Vui lòng chọn người giao"),
  assignee: z.string().trim().min(1, "Vui lòng chọn người nhận"),
  visible: z.boolean(),
  note: z.string().optional(),
});

const defaultValues = {
  programId: "",
  upgradeItem: "",
  priority: UPGRADE_PRIORITY_OPTIONS[1],
  durationValue: 1,
  durationUnit: "ngày",
  convert: "1",
  bonusPoint: 0,
  status: UPGRADE_STATUS_OPTIONS[0],
  assigner: "",
  assignee: "",
  visible: true,
  note: "",
};

const mapUpgradeToForm = (item) => ({
  programId: item.programId || "",
  upgradeItem: item.upgradeItem || "",
  priority: item.priority || UPGRADE_PRIORITY_OPTIONS[1],
  durationValue: Number(item.durationValue) || 1,
  durationUnit: item.durationUnit || "ngày",
  convert: item.convert || "1",
  bonusPoint: Number(item.bonusPoint) || 0,
  status: item.status || UPGRADE_STATUS_OPTIONS[0],
  assigner: item.assigner || "",
  assignee: item.assignee || "",
  visible: Boolean(item.visible ?? true),
  note: item.note || "",
});

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

function ProgramUpgradeForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [programReferences, setProgramReferences] = useState([]);
  const [staffReferences, setStaffReferences] = useState([]);
  const [isLoadingSources, setIsLoadingSources] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState(defaultValues);
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
    resolver: zodResolver(schema),
    defaultValues,
  });

  const selectedProgramId = useWatch({ control, name: "programId" });
  const selectedDurationValue = useWatch({ control, name: "durationValue" });
  const selectedDurationUnit = useWatch({ control, name: "durationUnit" });
  const selectedProgram = useMemo(
    () => programReferences.find((item) => item.id === selectedProgramId),
    [programReferences, selectedProgramId],
  );
  const isReadOnlyMode = isEditMode && initialSnapshot.status === "Hoàn thành";
  const programRegister = register("programId");

  useEffect(() => {
    const convertedValue = calculateConvertByDuration(selectedDurationValue, selectedDurationUnit);
    setValue("convert", convertedValue, { shouldValidate: true });
  }, [selectedDurationUnit, selectedDurationValue, setValue]);

  useEffect(() => {
    const fetchStaffs = async () => {
      try {
        const response = await staffApi.references();
        const nextReferences = Array.isArray(response?.staffs) ? response.staffs : [];
        setStaffReferences(nextReferences);
        const managerOptions = getStaffNamesByRole(nextReferences, "Quản lý");
        const programmerOptions = getStaffNamesByRole(nextReferences, "Lập trình viên");
        if (!isEditMode && managerOptions.length > 0) {
          setValue("assigner", managerOptions[0], { shouldValidate: true });
        }
        if (!isEditMode && programmerOptions.length > 0) {
          setValue("assignee", programmerOptions[0], { shouldValidate: true });
        }
      } catch (error) {
        toast.error(error?.message || "Không thể tải danh sách nhân sự");
      }
    };
    void fetchStaffs();
  }, [isEditMode, setValue]);

  const assignerOptions = toSelectOptions(getStaffNamesByRole(staffReferences, "Quản lý"));
  const assigneeOptions = toSelectOptions(getStaffNamesByRole(staffReferences, "Lập trình viên"));

  useEffect(() => {
    const fetchSources = async () => {
      setIsLoadingSources(true);
      try {
        const response = await programApi.references();
        const programs = Array.isArray(response?.programs) ? response.programs : [];
        setProgramReferences(programs);
        if (!isEditMode) {
          const selected = programs[0];
          const nextDefaults = {
            ...defaultValues,
            programId: selected?.id || "",
            durationValue: selected?.durationValue || defaultValues.durationValue,
            durationUnit: selected?.durationUnit || defaultValues.durationUnit,
            convert: selected?.convert || defaultValues.convert,
          };
          reset(nextDefaults);
          setInitialSnapshot(nextDefaults);
        }
      } catch (error) {
        toast.error(error?.message || "Không thể tải dữ liệu phiếu gốc");
      } finally {
        setIsLoadingSources(false);
      }
    };
    void fetchSources();
  }, [isEditMode, reset]);

  useEffect(() => {
    if (!isEditMode) return;
    const fetchDetail = async () => {
      setIsLoadingDetail(true);
      try {
        const response = await upgradeApi.detail(id);
        const upgrade = response?.upgrade;
        if (!upgrade) {
          toast.error("Không tìm thấy yêu cầu nâng cấp");
          navigate("/lap-trinh/nang-cap");
          return;
        }
        const formValues = mapUpgradeToForm(upgrade);
        reset(formValues);
        setInitialSnapshot(formValues);
      } catch (error) {
        toast.error(error?.message || "Không thể tải chi tiết yêu cầu nâng cấp");
        navigate("/lap-trinh/nang-cap");
      } finally {
        setIsLoadingDetail(false);
      }
    };
    void fetchDetail();
  }, [id, isEditMode, navigate, reset]);

  const persistUpgrade = async (values, mode) => {
    const payload = {
      programId: values.programId,
      upgradeItem: values.upgradeItem,
      priority: values.priority,
      durationValue: values.durationValue,
      durationUnit: values.durationUnit,
      convert: values.convert,
      bonusPoint: values.bonusPoint,
      status: values.status,
      assigner: values.assigner,
      assignee: values.assignee,
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
    if (isReadOnlyMode) {
      return;
    }
    if (isEditMode && values.status === "Hoàn thành" && initialSnapshot.status !== "Hoàn thành") {
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

  if (isLoadingSources || isLoadingDetail) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Đang tải dữ liệu...</div>
    );
  }

  return (
    <>
      <form className="space-y-4">
        <FormActions
          onSave={() => submitWithMode("save")}
          onSaveStay={() => submitWithMode("save-stay")}
          onSaveMail={() => null}
          onReset={() => reset(isEditMode ? initialSnapshot : defaultValues)}
          isSubmitting={isSubmitting}
          isUploading={false}
          isEditMode={isEditMode}
          exitPath="/lap-trinh/nang-cap"
          showSaveMail={false}
          saveLabel={isEditMode ? "Cập nhật" : "Lưu"}
          saveStayLabel={isEditMode ? "Cập nhật tại trang" : "Lưu tại trang"}
          readOnlyMode={isReadOnlyMode}
        />

        <fieldset disabled={isReadOnlyMode}>
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-3 text-lg font-semibold text-slate-700">
              Nội dung nâng cấp
            </div>
            <div className="grid gap-5 p-5 lg:grid-cols-2">
          <div className="flex flex-col gap-4 rounded-xl border border-slate-100 p-4">
            <p className="text-md font-semibold text-slate-700">Thông tin nâng cấp</p>

            <FormField
              label="Phiếu gốc / Số HĐ"
              type="select"
              options={
                programReferences.length === 0
                  ? [{ label: "Không có dữ liệu", value: "" }]
                  : programReferences.map((item) => ({
                      label: `${item.contractCode} - ${item.contractName || ""}`.trim(),
                      value: item.id,
                    }))
              }
              selectProps={{
                ...programRegister,
                disabled: programReferences.length === 0,
                onChange: (event) => {
                  const selected = programReferences.find((item) => item.id === event.target.value);
                  programRegister.onChange(event);
                  if (!selected) return;
                  setValue("durationValue", selected.durationValue || defaultValues.durationValue, { shouldValidate: true });
                  setValue("durationUnit", selected.durationUnit || defaultValues.durationUnit, { shouldValidate: true });
                  setValue("convert", selected.convert || defaultValues.convert, { shouldValidate: true });
                },
              }}
              error={errors.programId?.message}
            />

            <FormField
              label="Module"
              type="text"
              inputProps={{
                value: selectedProgram?.module || "",
                readOnly: true,
                placeholder: "Tự động theo phiếu gốc",
              }}
            />

            <FormField
              label="Hạng mục nâng cấp"
              type="textarea"
              inputProps={{ ...register("upgradeItem"), rows: 4, placeholder: "Mô tả hạng mục nâng cấp..." }}
              error={errors.upgradeItem?.message}
            />

            <FormField
              label="Mức độ ưu tiên"
              type="select"
              options={UPGRADE_PRIORITY_OPTIONS.map((item) => ({ label: item, value: item }))}
              selectProps={register("priority")}
              error={errors.priority?.message}
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
                options={DURATION_UNIT_OPTIONS.map((item) => ({ label: item, value: item }))}
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

            <FormField
              label="Điểm cộng thêm"
              type="number"
              inputProps={{ ...register("bonusPoint"), min: "0", step: "0.125" }}
              error={errors.bonusPoint?.message}
            />

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
               label="Người giao"
               type="select"
               options={assignerOptions}
               selectProps={register("assigner")}
               error={errors.assigner?.message}
             />

             <FormField
               label="Người nhận"
               type="select"
               options={assigneeOptions}
               selectProps={register("assignee")}
               error={errors.assignee?.message}
             />

            <FormField
              label="Trạng thái"
              type="select"
              options={UPGRADE_STATUS_OPTIONS.map((item) => ({ label: item, value: item }))}
              selectProps={register("status")}
              error={errors.status?.message}
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
          <span className="font-semibold text-slate-800"> Hoàn thành</span>. Xác nhận để lưu cập nhật.
        </p>
      </Modal>
    </>
  );
}

export default ProgramUpgradeForm;

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { FormActions } from "@/components/program-form/FormActions";
import { DURATION_UNIT_OPTIONS } from "@/constants/program";
import {
  CORRECTION_PRIORITY_OPTIONS,
  CORRECTION_STATUS_OPTIONS,
} from "@/constants/program-correction";
import { correctionApi, programApi, staffApi } from "@/lib/api-client";
import FormField from "@/components/ui/form-field";
import Modal from "@/components/ui/modal";

const schema = z.object({
  programId: z.string().trim().min(1, "Vui lòng chọn Phiếu gốc / Số HĐ"),
  issueContent: z.string().trim().min(5, "Vui lòng nhập mô tả lỗi/chỉnh sửa"),
  priority: z.enum(CORRECTION_PRIORITY_OPTIONS, { message: "Vui lòng chọn mức độ ưu tiên" }),
  durationValue: z.coerce.number().gt(0, "Thời gian phải lớn hơn 0"),
  durationUnit: z.enum(DURATION_UNIT_OPTIONS, { message: "Vui lòng chọn đơn vị thời gian hợp lệ" }),
  convert: z.string().trim().min(1, "Vui lòng nhập quy đổi"),
  bonusPoint: z.coerce.number().gte(0, "Điểm cộng thêm không hợp lệ"),
  assigner: z.string().trim().min(1, "Vui lòng chọn người giao"),
  assignee: z.string().trim().min(1, "Vui lòng chọn người nhận"),
  assignedAt: z.string().trim().min(1, "Vui lòng nhập ngày giao"),
  receivedAt: z.string().optional(),
  dueAt: z.string().trim().min(1, "Vui lòng nhập ngày dự kiến"),
  completedAt: z.string().optional(),
  status: z.enum(CORRECTION_STATUS_OPTIONS, { message: "Vui lòng chọn trạng thái" }),
  visible: z.boolean(),
  note: z.string().optional(),
});

const defaultValues = {
  programId: "",
  issueContent: "",
  priority: CORRECTION_PRIORITY_OPTIONS[1],
  durationValue: 1,
  durationUnit: "ngày",
  convert: "1",
  bonusPoint: 0,
  assigner: "",
  assignee: "",
  assignedAt: "",
  receivedAt: "",
  dueAt: "",
  completedAt: "",
  status: CORRECTION_STATUS_OPTIONS[0],
  visible: true,
  note: "",
};

const toDateTimeLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
};

const mapCorrectionToForm = (row) => ({
  programId: row.programId || "",
  issueContent: row.issueContent || "",
  priority: row.priority || CORRECTION_PRIORITY_OPTIONS[1],
  durationValue: Number(row.durationValue) || 1,
  durationUnit: row.durationUnit || "ngày",
  convert: row.convert || "1",
  bonusPoint: Number(row.bonusPoint) || 0,
  assigner: row.assigner || "",
  assignee: row.assignee || "",
  assignedAt: toDateTimeLocal(row.assignedAt),
  receivedAt: toDateTimeLocal(row.receivedAt),
  dueAt: toDateTimeLocal(row.dueAt),
  completedAt: toDateTimeLocal(row.completedAt),
  status: row.status || CORRECTION_STATUS_OPTIONS[0],
  visible: Boolean(row.visible ?? true),
  note: row.note || "",
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

function ProgramCorrectionForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [programReferences, setProgramReferences] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
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
    const fetchStaffs = async () => {
      try {
        const response = await staffApi.references();
        const nextOptions = Array.isArray(response?.staffs) ? response.staffs.map((item) => item.fullName).filter(Boolean) : [];
        setStaffOptions(nextOptions);
        if (!isEditMode && nextOptions.length > 0) {
          setValue("assigner", nextOptions[0], { shouldValidate: true });
          setValue("assignee", nextOptions[0], { shouldValidate: true });
        }
      } catch (error) {
        toast.error(error?.message || "Không thể tải danh sách nhân sự");
      }
    };
    void fetchStaffs();
  }, [isEditMode, setValue]);

  useEffect(() => {
    const convertedValue = calculateConvertByDuration(selectedDurationValue, selectedDurationUnit);
    setValue("convert", convertedValue, { shouldValidate: true });
  }, [selectedDurationUnit, selectedDurationValue, setValue]);

  useEffect(() => {
    const fetchSources = async () => {
      setIsLoadingSources(true);
      try {
        const programResponse = await programApi.references();
        const programs = Array.isArray(programResponse?.programs) ? programResponse.programs : [];

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
        toast.error(error?.message || "Không thể tải dữ liệu nguồn");
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
        const response = await correctionApi.detail(id);
        const correction = response?.correction;
        if (!correction) {
          toast.error("Không tìm thấy yêu cầu chỉnh sửa");
          navigate("/lap-trinh/chinh-sua");
          return;
        }
        const formValues = mapCorrectionToForm(correction);
        reset(formValues);
        setInitialSnapshot(formValues);
      } catch (error) {
        toast.error(error?.message || "Không thể tải chi tiết yêu cầu chỉnh sửa");
        navigate("/lap-trinh/chinh-sua");
      } finally {
        setIsLoadingDetail(false);
      }
    };
    void fetchDetail();
  }, [id, isEditMode, navigate, reset]);

  const persistCorrection = async (values, mode) => {
    const payload = {
      programId: values.programId,
      issueContent: values.issueContent,
      priority: values.priority,
      durationValue: values.durationValue,
      durationUnit: values.durationUnit,
      convert: values.convert,
      bonusPoint: values.bonusPoint,
      assigner: values.assigner,
      assignee: values.assignee,
      assignedAt: values.assignedAt,
      receivedAt: values.receivedAt || null,
      dueAt: values.dueAt,
      completedAt: values.completedAt || null,
      status: values.status,
      visible: values.visible,
      note: values.note || "",
    };

    let savedCorrection = null;
    try {
      if (isEditMode) {
        const response = await correctionApi.update(id, payload);
        savedCorrection = response?.correction || null;
      } else {
        const response = await correctionApi.create(payload);
        savedCorrection = response?.correction || null;
      }
    } catch (error) {
      toast.error(error?.message || "Không thể lưu yêu cầu chỉnh sửa");
      return;
    }

    if (mode === "save-stay") {
      if (!isEditMode && savedCorrection?.id) {
        toast.success("Đã tạo yêu cầu chỉnh sửa tại trang");
        navigate(`/lap-trinh/quan-ly-chinh-sua/${savedCorrection.id}`, { replace: true });
        return;
      }
      toast.success("Đã cập nhật yêu cầu chỉnh sửa tại trang");
      setInitialSnapshot(values);
      return;
    }

    toast.success(isEditMode ? "Đã cập nhật yêu cầu chỉnh sửa" : "Đã tạo yêu cầu chỉnh sửa");
    navigate("/lap-trinh/chinh-sua");
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
    await persistCorrection(values, mode);
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
          exitPath="/lap-trinh/chinh-sua"
          showSaveMail={false}
          saveLabel={isEditMode ? "Cập nhật" : "Lưu"}
          saveStayLabel={isEditMode ? "Cập nhật tại trang" : "Lưu tại trang"}
          readOnlyMode={isReadOnlyMode}
        />

        <fieldset disabled={isReadOnlyMode}>
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-3 text-lg font-semibold text-slate-700">
              Nội dung chỉnh sửa
            </div>
            <div className="grid gap-5 p-5 lg:grid-cols-2">
          <div className="flex flex-col gap-4 rounded-xl border border-slate-100 p-4">
            <p className="text-md font-semibold text-slate-700">Thông tin yêu cầu</p>

            <label className="text-sm font-semibold text-slate-600">
              Phiếu gốc / Số HĐ
              <select
                {...programRegister}
                className={`w-full rounded-md border px-3 py-2 text-sm font-light focus:outline-none ${
                  errors.programId
                    ? "border-rose-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-200"
                    : "border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                }`}
                disabled={programReferences.length === 0}
                onChange={(event) => {
                  const selected = programReferences.find((item) => item.id === event.target.value);
                  programRegister.onChange(event);
                  if (!selected) return;
                  setValue("durationValue", selected.durationValue || defaultValues.durationValue, { shouldValidate: true });
                  setValue("durationUnit", selected.durationUnit || defaultValues.durationUnit, { shouldValidate: true });
                  setValue("convert", selected.convert || defaultValues.convert, { shouldValidate: true });
                }}
              >
                {programReferences.length === 0 ? (
                  <option value="">Không có dữ liệu</option>
                ) : (
                  programReferences.map((item) => (
                    <option key={item.id} value={item.id}>
                      {`${item.contractCode} - ${item.contractName || ""}`.trim()}
                    </option>
                  ))
                )}
              </select>
              {errors.programId ? <p className="mt-1 text-xs text-rose-600">{errors.programId.message}</p> : null}
            </label>

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
              label="Mô tả lỗi / chỉnh sửa"
              type="textarea"
              inputProps={{ ...register("issueContent"), rows: 4, placeholder: "Nhập nội dung yêu cầu chỉnh sửa..." }}
              error={errors.issueContent?.message}
            />

            <FormField
              label="Mức độ ưu tiên"
              type="select"
              options={CORRECTION_PRIORITY_OPTIONS.map((item) => ({ label: item, value: item }))}
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

            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <input type="checkbox" {...register("visible")} />
              Hiển thị
            </label>
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-slate-100 p-4">
            <p className="text-md font-semibold text-slate-700">Theo dõi xử lý</p>

            <FormField
              label="Người giao"
              type="select"
              options={staffOptions.map((item) => ({ label: item, value: item }))}
              selectProps={register("assigner")}
              error={errors.assigner?.message}
            />

            <FormField
              label="Người nhận"
              type="select"
              options={staffOptions.map((item) => ({ label: item, value: item }))}
              selectProps={register("assignee")}
              error={errors.assignee?.message}
            />

            <FormField
              label="Trạng thái"
              type="select"
              options={CORRECTION_STATUS_OPTIONS.map((item) => ({ label: item, value: item }))}
              selectProps={register("status")}
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

            <FormField
              label="Ngày hoàn thành"
              type="datetime-local"
              inputProps={{ ...register("completedAt") }}
              error={errors.completedAt?.message}
            />
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
                  void persistCorrection(current.values, current.mode);
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

export default ProgramCorrectionForm;

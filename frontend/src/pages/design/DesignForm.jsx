import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { useSelector } from "react-redux";

import { FormActions } from "@/components/program-form/FormActions";
import { hasPermission } from "@/lib/permissions";
import FormField from "@/components/ui/form-field";
import Modal from "@/components/ui/modal";
import { designApi, staffApi } from "@/lib/api-client";
import { useSystemCategoryOptions } from "@/lib/system-categories";

const DESIGN_TYPES = ["Logo", "Banner", "Landing page", "UI/UX", "Social post"];
const COMPLETED_STATUS = "Đã hoàn thành";
const DURATION_UNITS = ["h", "ngày"];

const isValidDateValue = (value) => {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

const formatNumber = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "";
  return Number(parsed.toFixed(3));
};

const calculateConvertByDuration = (durationValue, durationUnit) => {
  const numeric = Number(durationValue);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  if (durationUnit === "ngày") return formatNumber(numeric);
  if (durationUnit === "h") return formatNumber(numeric / 8);
  return 0;
};

const schema = z.object({
  title: z.string().trim().min(1, "Vui lòng nhập hạng mục design"),
  designType: z.enum(DESIGN_TYPES, { message: "Vui lòng chọn loại design hợp lệ" }),
  priority: z.string().trim().min(1, "Vui lòng chọn mức ưu tiên hợp lệ"),
  assigner: z.string().trim().min(1, "Vui lòng chọn người giao"),
  assignee: z.string().trim().min(1, "Vui lòng chọn người nhận"),
  durationValue: z.coerce.number().gt(0, "Thời gian phải lớn hơn 0"),
  durationUnit: z.enum(DURATION_UNITS, { message: "Vui lòng chọn đơn vị thời gian hợp lệ" }),
  convert: z.coerce.number().gte(0, "Quy đổi không hợp lệ"),
  bonusPoint: z.coerce.number().gte(0, "Điểm cộng thêm không hợp lệ"),
  status: z.string().trim().min(1, "Vui lòng chọn trạng thái hợp lệ"),
  handoverDate: z.string().trim().min(1, "Vui lòng nhập ngày giao").refine(isValidDateValue, "Ngày giao không hợp lệ"),
  receiveDate: z.string().trim().min(1, "Vui lòng nhập ngày nhận").refine(isValidDateValue, "Ngày nhận không hợp lệ"),
  expectedDate: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập ngày dự kiến")
    .refine(isValidDateValue, "Ngày dự kiến không hợp lệ"),
  completedDate: z
    .string()
    .optional()
    .refine((value) => !value || isValidDateValue(value), "Ngày hoàn thành không hợp lệ"),
  visible: z.boolean(),
  note: z.string().optional(),
});

const defaultValues = {
  title: "",
  designType: DESIGN_TYPES[0],
  priority: "",
  assigner: "",
  assignee: "",
  durationValue: 1,
  durationUnit: "h",
  convert: 0.125,
  bonusPoint: 0,
  status: "",
  handoverDate: "",
  receiveDate: "",
  expectedDate: "",
  completedDate: "",
  visible: true,
  note: "",
};

const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function DesignForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const currentUser = useSelector((state) => state.auth.user);
  const canSave = hasPermission(currentUser, isEditMode ? "design.update" : "design.create");
  const [staffReferences, setStaffReferences] = useState([]);
  const [isLoadingReference, setIsLoadingReference] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState(defaultValues);
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(null);

  const {
    control,
    register,
    handleSubmit,
    getValues,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const durationValue = useWatch({ control, name: "durationValue" });
  const durationUnit = useWatch({ control, name: "durationUnit" });
  const selectedStatus = useWatch({ control, name: "status" });
  const priorityCategories = useSystemCategoryOptions("priority");
  const statusCategories = useSystemCategoryOptions("status");
  const formStatusValues = useMemo(() => {
    const values = statusCategories.values || [];
    if (isEditMode) return values;
    return values.filter((item) => item !== COMPLETED_STATUS);
  }, [isEditMode, statusCategories.values]);
  const formStatusOptions = useMemo(
    () => formStatusValues.map((item) => ({ label: item, value: item })),
    [formStatusValues],
  );

  useEffect(() => {
    if (isEditMode) return;
    const nextPriority = priorityCategories.options?.[0]?.value || "";
    const nextStatus = formStatusValues?.[0] || "";
    if (nextPriority && !getValues("priority")) {
      setValue("priority", nextPriority, { shouldValidate: true });
    }
    if (nextStatus && !getValues("status")) {
      setValue("status", nextStatus, { shouldValidate: true });
    }
  }, [formStatusValues, getValues, isEditMode, priorityCategories.options, setValue]);

  useEffect(() => {
    const nextConvert = calculateConvertByDuration(durationValue, durationUnit);
    setValue("convert", nextConvert, { shouldValidate: true });
  }, [durationUnit, durationValue, setValue]);

  useEffect(() => {
    if (selectedStatus === COMPLETED_STATUS) return;
    setValue("completedDate", "", { shouldValidate: true });
  }, [selectedStatus, setValue]);

  useEffect(() => {
    const fetchStaffReferences = async () => {
      setIsLoadingReference(true);
      try {
        const response = await staffApi.references();
        const staffs = Array.isArray(response?.staffs) ? response.staffs : [];
        setStaffReferences(staffs);

        if (!isEditMode) {
          const manager = staffs.find((item) => item.role === "Quản lý");
          const designer =
            staffs.find((item) => item.role === "Thiết kế") || staffs.find((item) => item.role === "Thiết kế viên");
          const nextDefault = {
            ...defaultValues,
            assigner: manager?.fullName || "",
            assignee: designer?.fullName || "",
          };
          reset(nextDefault);
          setInitialSnapshot(nextDefault);
        }
      } catch (error) {
        toast.error(error?.message || "Không thể tải danh sách nhân sự");
      } finally {
        setIsLoadingReference(false);
      }
    };
    void fetchStaffReferences();
  }, [isEditMode, reset]);

  useEffect(() => {
    if (!isEditMode) return;
    const fetchDetail = async () => {
      setIsLoadingDetail(true);
      try {
        const response = await designApi.detail(id);
        const task = response?.designTask;
        if (!task) {
          toast.error("Không tìm thấy công việc design");
          navigate("/design/danh-sach");
          return;
        }
        const mapped = {
          title: task.title || "",
          designType: task.designType || DESIGN_TYPES[0],
          priority: task.priority || "",
          assigner: task.assigner || "",
          assignee: task.assignee || "",
          durationValue: Number(task.durationValue) || 1,
          durationUnit: task.durationUnit || "h",
          convert: Number(task.convert) || 0,
          bonusPoint: Number(task.bonusPoint) || 0,
          status: task.status || "",
          handoverDate: toDateInput(task.handoverDate),
          receiveDate: toDateInput(task.receiveDate),
          expectedDate: toDateInput(task.expectedDate || task.deadline),
          completedDate: toDateInput(task.completedDate),
          visible: Boolean(task.visible ?? true),
          note: task.note || "",
        };
        reset(mapped);
        setInitialSnapshot(mapped);
      } catch (error) {
        toast.error(error?.message || "Không thể tải chi tiết công việc design");
        navigate("/design/danh-sach");
      } finally {
        setIsLoadingDetail(false);
      }
    };
    void fetchDetail();
  }, [id, isEditMode, navigate, reset]);

  const managerOptions = useMemo(
    () =>
      staffReferences
        .filter((item) => item.role === "Quản lý")
        .map((item) => ({ label: item.fullName, value: item.fullName })),
    [staffReferences],
  );
  const designerOptions = useMemo(
    () =>
      staffReferences
        .filter((item) => item.role === "Thiết kế" || item.role === "Thiết kế viên")
        .map((item) => ({ label: item.fullName, value: item.fullName })),
    [staffReferences],
  );

  const persist = async (values, mode) => {
    const payload = {
      ...values,
      convert: Number(values.convert),
      durationValue: Number(values.durationValue),
      bonusPoint: Number(values.bonusPoint),
      handoverDate: values.handoverDate || null,
      receiveDate: values.receiveDate || null,
      expectedDate: values.expectedDate || null,
      completedDate: values.status === COMPLETED_STATUS ? values.completedDate || null : null,
      note: values.note || "",
    };

    try {
      if (isEditMode) {
        const response = await designApi.update(id, payload);
        toast.success(response?.message || "Đã cập nhật công việc design");
      } else {
        const response = await designApi.create(payload);
        toast.success(response?.message || "Đã thêm công việc design");
        if (mode === "save-stay" && response?.designTask?.id) {
          navigate(`/design/chinh-sua/${response.designTask.id}`, { replace: true });
          return;
        }
      }

      if (mode === "save-stay" && isEditMode) {
        setInitialSnapshot(values);
        reset(values);
        return;
      }
      if (mode !== "save-stay") navigate("/design/danh-sach");
    } catch (error) {
      toast.error(error?.message || "Không thể lưu công việc design");
    }
  };

  const isReadOnlyMode = !canSave;

  const onSubmit = async (values, mode) => {
    if (!canSave) {
      toast.error("Bạn không có quyền lưu dữ liệu này");
      return;
    }
    if (values.status === COMPLETED_STATUS && initialSnapshot.status !== COMPLETED_STATUS) {
      setPendingSubmit({ values, mode });
      setCompleteConfirmOpen(true);
      return;
    }
    await persist(values, mode);
  };

  const submitWithMode = (mode) =>
    handleSubmit(
      (values) => void onSubmit(values, mode),
      () => toast.error("Vui lòng kiểm tra lại thông tin form"),
    )();

  if (isLoadingReference || isLoadingDetail) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Đang tải dữ liệu...</div>
    );
  }

  return (
    <form className="space-y-4">
      <FormActions
        onSave={() => submitWithMode("save")}
        onSaveStay={() => submitWithMode("save-stay")}
        onSaveMail={() => null}
        onReset={() => reset(initialSnapshot)}
        isSubmitting={isSubmitting}
        isUploading={false}
        isEditMode={isEditMode}
        exitPath="/design/danh-sach"
        readOnlyMode={isReadOnlyMode}
        showSaveMail={false}
      />

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-3 text-lg font-semibold text-slate-700">
          Thông tin công việc design
        </div>
        <div className="grid gap-5 p-5 lg:grid-cols-2">
          <div className="flex flex-col gap-4 rounded-xl border border-slate-100 p-4">
            <p className="text-md font-semibold text-slate-700">Thông tin yêu cầu</p>

            <FormField
              label="Hạng mục design"
              type="text"
              inputProps={{ ...register("title"), placeholder: "Ví dụ: Thiết kế landing page sản phẩm A" }}
              error={errors.title?.message}
            />
            <FormField
              label="Loại design"
              type="select"
              options={DESIGN_TYPES.map((item) => ({ label: item, value: item }))}
              selectProps={register("designType")}
              error={errors.designType?.message}
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

            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Thời gian"
                type="number"
                inputProps={{ ...register("durationValue"), min: "0.1", step: "0.1" }}
                error={errors.durationValue?.message}
              />
              <FormField
                label="Đơn vị"
                type="select"
                options={DURATION_UNITS.map((item) => ({ label: item, value: item }))}
                selectProps={register("durationUnit")}
                error={errors.durationUnit?.message}
              />
            </div>

            <FormField
              label="Quy đổi"
              type="number"
              inputProps={{ ...register("convert"), readOnly: true }}
              inputClassName="bg-slate-50"
              error={errors.convert?.message}
            />
            <FormField
              label="Điểm cộng thêm"
              type="number"
              inputProps={{ ...register("bonusPoint"), min: "0", step: "0.001" }}
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
              label="Người giao (Quản lý)"
              type="select"
              options={managerOptions.length > 0 ? managerOptions : [{ label: "Không có dữ liệu", value: "" }]}
              selectProps={{ ...register("assigner"), disabled: managerOptions.length === 0 }}
              error={errors.assigner?.message}
            />
            <FormField
              label="Người nhận (Design)"
              type="select"
              options={designerOptions.length > 0 ? designerOptions : [{ label: "Không có dữ liệu", value: "" }]}
              selectProps={{ ...register("assignee"), disabled: designerOptions.length === 0 }}
              error={errors.assignee?.message}
            />
            <FormField
              label="Trạng thái"
              type="select"
              options={formStatusOptions.length > 0 ? formStatusOptions : [{ label: "Chưa có danh mục", value: "" }]}
              selectProps={{ ...register("status"), disabled: formStatusOptions.length === 0 }}
              error={errors.status?.message}
            />
            <FormField
              label="Ngày giao"
              type="date"
              inputProps={{ ...register("handoverDate") }}
              error={errors.handoverDate?.message}
            />
            <FormField
              label="Ngày nhận"
              type="date"
              inputProps={{ ...register("receiveDate") }}
              error={errors.receiveDate?.message}
            />
            <FormField
              label="Ngày dự kiến"
              type="date"
              inputProps={{ ...register("expectedDate") }}
              error={errors.expectedDate?.message}
            />
            <FormField
              label="Ngày hoàn thành"
              type="date"
              inputProps={{ ...register("completedDate"), disabled: selectedStatus !== COMPLETED_STATUS }}
              error={errors.completedDate?.message}
            />
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <input type="checkbox" {...register("visible")} />
              Hiển thị
            </label>
          </div>
        </div>
      </div>

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
          Bạn đang chuyển trạng thái sang
          <span className="font-semibold text-slate-800"> {COMPLETED_STATUS}</span>. Xác nhận để lưu cập nhật.
        </p>
      </Modal>
    </form>
  );
}

export default DesignForm;
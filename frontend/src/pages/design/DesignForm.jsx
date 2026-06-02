import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { useSelector } from "react-redux";

import { FormActions, FormPageLayout, FormSection } from "@/components/forms";
import FormField from "@/components/ui/form-field";
import Modal from "@/components/ui/modal";
import { designApi, staffApi } from "@/lib/api-client";
import { hasPermission } from "@/lib/permissions";
import { useSystemCategoryOptions } from "@/lib/system-categories";
import { ensureSelectOption, getStaffNamesByRole, toSelectOptions } from "@/lib/staff-roles";
import { PERMISSIONS } from "@/constants/permissions";

const DESIGN_TYPES = ["Logo", "Banner", "Landing page", "UI/UX", "Social post"];
const COMPLETED_STATUS = "Đã hoàn thành";
const isValidDateValue = (value) => {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};


const schema = z.object({
  title: z.string().trim().min(1, "Vui lòng nhập hạng mục design"),
  designType: z.enum(DESIGN_TYPES, { message: "Vui lòng chọn loại design hợp lệ" }),
  priority: z.string().trim().min(1, "Vui lòng chọn mức ưu tiên hợp lệ"),
  assigner: z.string().trim().min(1, "Vui lòng chọn người giao"),
  assignee: z.string().trim().min(1, "Vui lòng chọn người nhận"),
  bonusPoint: z.coerce.number().gte(0, "Điểm cộng không hợp lệ"),
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
}).superRefine((values, ctx) => {
  if (values.status === COMPLETED_STATUS && !values.completedDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["completedDate"],
      message: "Vui lòng chọn ngày hoàn thành",
    });
  }
});

const defaultValues = {
  title: "",
  designType: DESIGN_TYPES[0],
  priority: "",
  assigner: "",
  assignee: "",
  durationValue: 0,
  durationUnit: "ngày",
  convert: 0,
  bonusPoint: 0,
  status: "",
  handoverDate: "",
  receiveDate: "",
  expectedDate: "",
  completedDate: "",
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

function DesignForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const currentUser = useSelector((state) => state.auth.user);
  const canSave = hasPermission(currentUser, isEditMode ? PERMISSIONS.DESIGN_UPDATE : PERMISSIONS.DESIGN_CREATE);
  const canOverrideCompleted = hasPermission(currentUser, PERMISSIONS.DESIGN_OVERRIDE_COMPLETED);
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
  const selectedStatus = useWatch({ control, name: "status" });
  const selectedAssigner = useWatch({ control, name: "assigner" });
  const selectedAssignee = useWatch({ control, name: "assignee" });
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
  const isCompletedLocked = isEditMode && initialSnapshot.status === COMPLETED_STATUS && !canOverrideCompleted;
  const isFormReadOnly = !canSave || isCompletedLocked;

  useEffect(() => {
    if (isEditMode || isLoadingReference || isLoadingDetail) return;

    const nextPriority = priorityCategories.options?.[0]?.value || "";
    const nextStatus = formStatusValues?.[0] || "";
    const currentPriority = getValues("priority");
    const currentStatus = getValues("status");

    if (nextPriority && !currentPriority) {
      setValue("priority", nextPriority, { shouldValidate: true, shouldDirty: false });
    }

    if (nextStatus && (!currentStatus || !formStatusValues.includes(currentStatus))) {
      setValue("status", nextStatus, { shouldValidate: true, shouldDirty: false });
    }

    if (nextPriority || nextStatus) {
      setInitialSnapshot((prev) => ({
        ...prev,
        ...(!prev.priority && nextPriority ? { priority: nextPriority } : {}),
        ...((!prev.status || !formStatusValues.includes(prev.status)) && nextStatus ? { status: nextStatus } : {}),
      }));
    }
  }, [formStatusValues, getValues, isEditMode, isLoadingDetail, isLoadingReference, priorityCategories.options, setValue]);

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
          const managerNames = getStaffNamesByRole(staffs, "Quản lý");
          const designerNames = getStaffNamesByRole(staffs, ["Thiết kế", "Thiết kế viên"]);
          const nextDefault = {
            ...defaultValues,
            assigner: managerNames[0] || "",
            assignee: designerNames[0] || "",
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
          durationValue: Number(task.durationValue) || 0,
          durationUnit: task.durationUnit || "ngày",
          convert: Number(task.convert) || 0,
          bonusPoint: Number(task.bonusPoint) || 0,
          status: task.status || "",
          handoverDate: toDateTimeLocal(task.handoverDate),
          receiveDate: toDateTimeLocal(task.receiveDate),
          expectedDate: toDateTimeLocal(task.expectedDate || task.deadline),
          completedDate: toDateTimeLocal(task.completedDate),
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
    () => ensureSelectOption(toSelectOptions(getStaffNamesByRole(staffReferences, "Quản lý")), selectedAssigner),
    [selectedAssigner, staffReferences],
  );
  const designerOptions = useMemo(
    () => ensureSelectOption(toSelectOptions(getStaffNamesByRole(staffReferences, ["Thiết kế", "Thiết kế viên"])), selectedAssignee),
    [selectedAssignee, staffReferences],
  );

  const persist = async (values, mode) => {
    if (!canSave) {
      toast.error("Bạn không có quyền lưu dữ liệu này");
      return;
    }

    if (isCompletedLocked) {
      toast.error("Công việc design đã hoàn thành, chỉ được xem chi tiết");
      return;
    }

    const payload = {
      ...values,
      convert: 0,
      durationValue: 0,
      durationUnit: "ngày",
      bonusPoint: values.status === COMPLETED_STATUS ? Number(values.bonusPoint) : 0,
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

  const onSubmit = async (values, mode) => {
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
    <>
      <FormPageLayout
        disabled={isFormReadOnly}
        actions={
          <FormActions
            onSave={() => submitWithMode("save")}
            onSaveStay={() => submitWithMode("save-stay")}
            onSaveMail={() => null}
            onReset={() => reset(initialSnapshot)}
            isSubmitting={isSubmitting}
            isUploading={false}
            isEditMode={isEditMode}
            exitPath="/design/danh-sach"
            showSaveMail={false}
            readOnlyMode={isFormReadOnly}
          />
        }
      >
        <FormSection title="Thông tin công việc design">
          <div className="flex flex-col gap-4 rounded-xl border border-slate-100 p-4">
            <p className="text-md font-semibold text-slate-700">Thông tin yêu cầu</p>

            <FormField
              label="Hạng mục design"
              type="text"
              inputProps={{ ...register("title"), placeholder: "Ví dụ: Thiết kế landing page sản phẩm A", disabled: isFormReadOnly }}
              error={errors.title?.message}
            />
            <FormField
              label="Loại design"
              type="select"
              options={DESIGN_TYPES.map((item) => ({ label: item, value: item }))}
              selectProps={{ ...register("designType"), disabled: isFormReadOnly }}
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
              selectProps={{ ...register("priority"), disabled: isFormReadOnly || priorityCategories.options.length === 0 }}
              error={errors.priority?.message}
            />
            {selectedStatus === COMPLETED_STATUS ? (

            <FormField
              label="Điểm cộng"
              type="number"
              inputProps={{ ...register("bonusPoint"), min: "0", step: "0.001", disabled: isFormReadOnly }}
              error={errors.bonusPoint?.message}
            />
                        ) : null}
<FormField
              label="Ghi chú"
              type="textarea"
              inputProps={{ ...register("note"), rows: 3, placeholder: "Ghi chú thêm (nếu có)", disabled: isFormReadOnly }}
              error={errors.note?.message}
            />
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-slate-100 p-4">
            <p className="text-md font-semibold text-slate-700">Theo dõi xử lý</p>

            <FormField
              label="Người giao (Quản lý)"
              type="select"
              options={managerOptions.length > 0 ? managerOptions : [{ label: "Không có dữ liệu", value: "" }]}
              selectProps={{ ...register("assigner"), disabled: isFormReadOnly || managerOptions.length === 0 }}
              error={errors.assigner?.message}
            />
            <FormField
              label="Người nhận (Design)"
              type="select"
              options={designerOptions.length > 0 ? designerOptions : [{ label: "Không có dữ liệu", value: "" }]}
              selectProps={{ ...register("assignee"), disabled: isFormReadOnly || designerOptions.length === 0 }}
              error={errors.assignee?.message}
            />
            <FormField
              label="Trạng thái"
              type="select"
              options={formStatusOptions.length > 0 ? formStatusOptions : [{ label: "Chưa có danh mục", value: "" }]}
              selectProps={{ ...register("status"), disabled: isFormReadOnly || formStatusOptions.length === 0 }}
              error={errors.status?.message}
            />
            <FormField
              label="Ngày giao"
              type="datetime-local"
              inputProps={{ ...register("handoverDate"), disabled: isFormReadOnly }}
              error={errors.handoverDate?.message}
            />
            <FormField
              label="Ngày nhận"
              type="datetime-local"
              inputProps={{ ...register("receiveDate"), disabled: isFormReadOnly }}
              error={errors.receiveDate?.message}
            />
            <FormField
              label="Ngày dự kiến"
              type="datetime-local"
              inputProps={{ ...register("expectedDate"), disabled: isFormReadOnly }}
              error={errors.expectedDate?.message}
            />
            {selectedStatus === COMPLETED_STATUS ? (

            <FormField
              label="Ngày hoàn thành"
              type="datetime-local"
              inputProps={{ ...register("completedDate"), disabled: isFormReadOnly || selectedStatus !== COMPLETED_STATUS }}
              error={errors.completedDate?.message}
            />
                        ) : null}
<label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <input type="checkbox" {...register("visible")} disabled={isFormReadOnly} />
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
    </>
  );
}

export default DesignForm;

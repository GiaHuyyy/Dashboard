import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { FormActions } from "@/components/program-form/FormActions";
import { UPGRADE_PRIORITY_OPTIONS, UPGRADE_STAFF_OPTIONS, UPGRADE_STATUS_OPTIONS } from "@/constants/program-upgrade";
import { programApi, upgradeApi } from "@/lib/api-client";
import FormField from "@/components/ui/form-field";

const schema = z.object({
  programId: z.string().trim().min(1, "Vui lòng chọn Phiếu gốc / Số HĐ"),
  upgradeItem: z.string().trim().min(3, "Vui lòng nhập hạng mục nâng cấp"),
  priority: z.enum(UPGRADE_PRIORITY_OPTIONS, { message: "Vui lòng chọn mức độ ưu tiên" }),
  slaHours: z.coerce.number().gt(0, "SLA phải lớn hơn 0"),
  bonusPoint: z.coerce.number().gte(0, "Điểm cộng thêm không hợp lệ"),
  status: z.enum(UPGRADE_STATUS_OPTIONS, { message: "Vui lòng chọn trạng thái" }),
  assignee: z.string().trim().min(1, "Vui lòng chọn người phụ trách"),
  visible: z.boolean(),
  note: z.string().optional(),
});

const defaultValues = {
  programId: "",
  upgradeItem: "",
  priority: UPGRADE_PRIORITY_OPTIONS[1],
  slaHours: 24,
  bonusPoint: 0,
  status: UPGRADE_STATUS_OPTIONS[0],
  assignee: UPGRADE_STAFF_OPTIONS[0],
  visible: true,
  note: "",
};

const mapUpgradeToForm = (item) => ({
  programId: item.programId || "",
  upgradeItem: item.upgradeItem || "",
  priority: item.priority || UPGRADE_PRIORITY_OPTIONS[1],
  slaHours: Number(item.slaHours) || 24,
  bonusPoint: Number(item.bonusPoint) || 0,
  status: item.status || UPGRADE_STATUS_OPTIONS[0],
  assignee: item.assignee || UPGRADE_STAFF_OPTIONS[0],
  visible: Boolean(item.visible ?? true),
  note: item.note || "",
});

function ProgramUpgradeForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [programReferences, setProgramReferences] = useState([]);
  const [isLoadingSources, setIsLoadingSources] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState(defaultValues);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const selectedProgramId = useWatch({ control, name: "programId" });
  const selectedProgram = useMemo(
    () => programReferences.find((item) => item.id === selectedProgramId),
    [programReferences, selectedProgramId],
  );

  useEffect(() => {
    const fetchSources = async () => {
      setIsLoadingSources(true);
      try {
        const response = await programApi.references();
        const programs = Array.isArray(response?.programs) ? response.programs : [];
        setProgramReferences(programs);
        if (!isEditMode) {
          const nextDefaults = { ...defaultValues, programId: programs[0]?.id || "" };
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

  const onSubmit = async (values, mode) => {
    const payload = {
      programId: values.programId,
      upgradeItem: values.upgradeItem,
      priority: values.priority,
      slaHours: values.slaHours,
      bonusPoint: values.bonusPoint,
      status: values.status,
      assignee: values.assignee,
      visible: values.visible,
      note: values.note || "",
    };

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
        navigate(`/lap-trinh/nang-cap/${savedUpgrade.id}`, { replace: true });
        return;
      }
      toast.success("Đã cập nhật yêu cầu nâng cấp tại trang");
      setInitialSnapshot(values);
      return;
    }

    toast.success(isEditMode ? "Đã cập nhật yêu cầu nâng cấp" : "Đã tạo yêu cầu nâng cấp");
    navigate("/lap-trinh/nang-cap");
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
      />

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
              selectProps={{ ...register("programId"), disabled: programReferences.length === 0 }}
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
              label="Người phụ trách"
              type="select"
              options={UPGRADE_STAFF_OPTIONS.map((item) => ({ label: item, value: item }))}
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

            <FormField
              label="SLA (giờ)"
              type="number"
              inputProps={{ ...register("slaHours"), min: "1", step: "1" }}
              error={errors.slaHours?.message}
            />

            <FormField
              label="Điểm cộng thêm"
              type="number"
              inputProps={{ ...register("bonusPoint"), min: "0", step: "0.125" }}
              error={errors.bonusPoint?.message}
            />

            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <input type="checkbox" {...register("visible")} />
              Hiển thị
            </label>
          </div>
        </div>
      </div>
    </form>
  );
}

export default ProgramUpgradeForm;

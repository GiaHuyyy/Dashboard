import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { useSelector } from "react-redux";

import { FormActions } from "@/components/program-form/FormActions";
import { staffApi } from "@/lib/api-client";
import { hasPermission } from "@/lib/permissions";
import FormField from "@/components/ui/form-field";
import { STAFF_ROLE_OPTIONS, getDepartmentByRole } from "@/lib/staff-roles";

const schema = z.object({
  fullName: z.string().trim().min(2, "Vui lòng nhập họ tên"),
  email: z.string().trim().email("Email không đúng định dạng"),
  phone: z.string().optional(),
  department: z.string().trim().min(1, "Vui lòng nhập phòng ban"),
  role: z.string().trim().min(1, "Vui lòng nhập vai trò"),
  isActive: z.boolean(),
});

const defaultValues = {
  fullName: "",
  email: "",
  phone: "",
  department: "Lập trình",
  role: "Lập trình viên",
  isActive: true,
};

function StaffForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const currentUser = useSelector((state) => state.auth.user);
  const canSave = hasPermission(currentUser, isEditMode ? "staff.update" : "staff.create");

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

  const watchedRole = useWatch({ control, name: "role" });

  useEffect(() => {
    if (!watchedRole) return;
    setValue("department", getDepartmentByRole(watchedRole), { shouldValidate: true });
  }, [setValue, watchedRole]);

  useEffect(() => {
    if (!isEditMode) return;
    const fetchDetail = async () => {
      try {
        const response = await staffApi.detail(id);
        const staff = response?.staff;
        if (!staff) {
          toast.error("Không tìm thấy nhân sự");
          navigate("/nhan-su/danh-sach");
          return;
        }
        reset({
          fullName: staff.fullName || "",
          email: staff.email || "",
          phone: staff.phone || "",
          department: staff.department || getDepartmentByRole(staff.role || "Lập trình viên"),
          role: staff.role || "Lập trình viên",
          isActive: Boolean(staff.isActive),
        });
      } catch (error) {
        toast.error(error?.message || "Không thể tải dữ liệu nhân sự");
        navigate("/nhan-su/danh-sach");
      }
    };
    void fetchDetail();
  }, [id, isEditMode, navigate, reset]);

  const isReadOnlyMode = !canSave;

  const onSubmit = async (values, mode) => {
    if (!canSave) {
      toast.error("Bạn không có quyền lưu dữ liệu này");
      return;
    }
    try {
      if (isEditMode) {
        await staffApi.update(id, values);
      } else {
        const created = await staffApi.create(values);
        if (mode === "save-stay" && created?.staff?.id) {
          toast.success("Đã tạo nhân sự tại trang");
          navigate(`/nhan-su/chinh-sua/${created.staff.id}`, { replace: true });
          return;
        }
      }
      toast.success(isEditMode ? "Đã cập nhật nhân sự" : "Đã tạo nhân sự");
      if (mode !== "save-stay") navigate("/nhan-su/danh-sach");
    } catch (error) {
      toast.error(error?.message || "Không thể lưu dữ liệu nhân sự");
    }
  };

  return (
    <form className="space-y-4">
      <FormActions
        onSave={() => void handleSubmit((values) => onSubmit(values, "save"))()}
        onSaveStay={() => void handleSubmit((values) => onSubmit(values, "save-stay"))()}
        onSaveMail={() => null}
        onReset={() => reset(defaultValues)}
        isSubmitting={isSubmitting}
        isUploading={false}
        isEditMode={isEditMode}
        exitPath="/nhan-su/danh-sach"
        readOnlyMode={isReadOnlyMode}
        readOnlyTitle={!canSave ? "Bạn chỉ có quyền xem nhân sự" : undefined}
        showSaveMail={false}
      />

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-3 text-lg font-semibold text-slate-700">
          Thông tin nhân sự
        </div>
        <div className="grid gap-5 p-5 lg:grid-cols-2">
          <FormField
            label="Họ tên"
            type="text"
            inputProps={{ ...register("fullName"), disabled: isReadOnlyMode }}
            error={errors.fullName?.message}
          />
          <FormField label="Email" type="text" inputProps={{ ...register("email"), disabled: isReadOnlyMode }} error={errors.email?.message} />
          <FormField
            label="Số điện thoại"
            type="text"
            inputProps={{ ...register("phone"), disabled: isReadOnlyMode }}
            error={errors.phone?.message}
          />
           <FormField
             label="Phòng ban"
             type="text"
             inputProps={{ ...register("department"), readOnly: true, disabled: isReadOnlyMode, className: "bg-slate-50" }}
             error={errors.department?.message}
           />
           <FormField
             label="Vai trò"
             type="select"
             options={STAFF_ROLE_OPTIONS.map((item) => ({ label: item, value: item }))}
             selectProps={{ ...register("role"), disabled: isReadOnlyMode }}
             error={errors.role?.message}
           />
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <input type="checkbox" {...register("isActive")} disabled={isReadOnlyMode} />
            Đang hoạt động
          </label>
        </div>
      </div>
    </form>
  );
}

export default StaffForm;
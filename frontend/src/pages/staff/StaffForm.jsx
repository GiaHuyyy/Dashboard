import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { useSelector } from "react-redux";

import { FormActions, FormPageLayout, FormSection } from "@/components/forms";
import { staffApi } from "@/lib/api-client";
import { hasPermission } from "@/lib/permissions";
import FormField from "@/components/ui/form-field";
import {
  STAFF_DEPARTMENT_OPTIONS,
  STAFF_ROLE_OPTIONS,
  getDepartmentByRole,
  getStaffDepartments,
  getStaffRoles,
} from "@/lib/staff-roles";
import { PERMISSIONS } from "@/constants/permissions";

const schema = z.object({
  fullName: z.string().trim().min(2, "Vui lòng nhập họ tên"),
  email: z.string().trim().email("Email không đúng định dạng"),
  phone: z.string().optional(),
  departments: z.array(z.string()).min(1, "Vui lòng chọn ít nhất 1 phòng ban"),
  roles: z.array(z.string()).min(1, "Vui lòng chọn ít nhất 1 vai trò"),
  isActive: z.boolean(),
});

const defaultValues = {
  fullName: "",
  email: "",
  phone: "",
  departments: ["Lập trình"],
  roles: ["Lập trình viên"],
  isActive: true,
};

const CheckboxGroup = ({ label, options = [], fieldName, register, error, disabled = false }) => (
  <div className="text-sm font-semibold text-slate-600">
    <div>{label}</div>
    <div className="mt-2 grid gap-2 rounded-md border border-slate-200 bg-white p-3 sm:grid-cols-2">
      {options.map((option) => (
        <label
          key={option}
          className="flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <input
            type="checkbox"
            value={option}
            disabled={disabled}
            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
            {...register(fieldName)}
          />
          {option}
        </label>
      ))}
    </div>
    {error ? <p className="mt-1 text-xs font-semibold text-rose-600">{error}</p> : null}
  </div>
);

function StaffForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const currentUser = useSelector((state) => state.auth.user);
  const canSave = hasPermission(currentUser, isEditMode ? PERMISSIONS.STAFF_UPDATE : PERMISSIONS.STAFF_CREATE);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

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
        const roles = getStaffRoles(staff);
        const departments = getStaffDepartments(staff);
        reset({
          fullName: staff.fullName || "",
          email: staff.email || "",
          phone: staff.phone || "",
          departments: departments.length > 0 ? departments : [getDepartmentByRole(staff.role || "Lập trình viên")],
          roles: roles.length > 0 ? roles : [staff.role || "Lập trình viên"],
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
    const payload = {
      ...values,
      department: values.departments?.[0] || "",
      role: values.roles?.[0] || "",
    };

    try {
      if (isEditMode) {
        await staffApi.update(id, payload);
      } else {
        const created = await staffApi.create(payload);
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
    <FormPageLayout
      disabled={isReadOnlyMode}
      actions={
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
      }
    >
      <FormSection title="Thông tin nhân sự">
        <FormField
          label="Họ tên"
          type="text"
          inputProps={{ ...register("fullName") }}
          error={errors.fullName?.message}
        />
        <FormField label="Email" type="text" inputProps={{ ...register("email") }} error={errors.email?.message} />
        <FormField
          label="Số điện thoại"
          type="text"
          inputProps={{ ...register("phone") }}
          error={errors.phone?.message}
        />
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          <input type="checkbox" disabled={isReadOnlyMode} {...register("isActive")} />
          Đang hoạt động
        </label>
        <CheckboxGroup
          label="Phòng ban"
          options={STAFF_DEPARTMENT_OPTIONS}
          fieldName="departments"
          register={register}
          error={errors.departments?.message}
          disabled={isReadOnlyMode}
        />
        <CheckboxGroup
          label="Vai trò"
          options={STAFF_ROLE_OPTIONS}
          fieldName="roles"
          register={register}
          error={errors.roles?.message}
          disabled={isReadOnlyMode}
        />
      </FormSection>
    </FormPageLayout>
  );
}

export default StaffForm;

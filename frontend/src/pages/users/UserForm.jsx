import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { FormActions, FormPageLayout, FormSection } from "@/components/forms";
import FormField from "@/components/ui/form-field";
import { userApi } from "@/lib/api-client";
import { PERMISSION_DENIED_MESSAGE, usePermission } from "@/lib/permissions";
import { USER_ROLE_OPTIONS } from "@/lib/user-roles";

const schema = z
  .object({
    name: z.string().trim().min(1, "Vui lòng nhập họ tên"),
    userName: z.string().trim().min(3, "Tên đăng nhập tối thiểu 3 ký tự"),
    password: z.string(),
    confirmPassword: z.string(),
    roles: z.array(z.string()).min(1, "Vui lòng chọn ít nhất một vai trò"),
    isActive: z.boolean(),
    note: z.string().trim().optional(),
  })
  .superRefine((values, ctx) => {
    if (!values.password && !values.confirmPassword) return;

    if (values.password.length < 6) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: "Mật khẩu tối thiểu 6 ký tự",
      });
    }

    if (values.password !== values.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Mật khẩu xác nhận không khớp",
      });
    }
  });

const defaultValues = {
  name: "",
  userName: "",
  password: "",
  confirmPassword: "",
  roles: ["user"],
  isActive: true,
  note: "",
};

function UserForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { canAny } = usePermission();

  const canView = canAny(["permission.user.view", "user.view"]);
  const canSave = canAny(
    isEditMode ? ["permission.user.update", "user.update"] : ["permission.user.create", "user.create"],
  );
  const isReadOnly = isEditMode && canView && !canSave;

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

  useEffect(() => {
    if (!isEditMode) return;

    if (!canView) {
      toast.error(PERMISSION_DENIED_MESSAGE);
      navigate("/phan-quyen/tai-khoan");
      return;
    }

    const fetchDetail = async () => {
      try {
        const response = await userApi.detail(id);
        const user = response?.user;

        if (!user) {
          toast.error("Không tìm thấy tài khoản");
          navigate("/phan-quyen/tai-khoan");
          return;
        }

        reset({
          name: user.name || "",
          userName: user.userName || "",
          password: "",
          confirmPassword: "",
          roles: Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : [user.role || "user"],
          isActive: Boolean(user.isActive),
          note: user.note || "",
        });
      } catch (error) {
        toast.error(error?.message || "Không thể tải dữ liệu tài khoản");
        navigate("/phan-quyen/tai-khoan");
      }
    };

    void fetchDetail();
  }, [canView, id, isEditMode, navigate, reset]);

  const onSubmit = async (values, mode) => {
    if (!canSave) {
      toast.error(PERMISSION_DENIED_MESSAGE);
      return;
    }

    const payload = {
      name: values.name,
      userName: values.userName,
      roles: values.roles,
      isActive: values.isActive,
      note: values.note || "",
    };

    if (values.password) {
      payload.password = values.password;
    }

    try {
      if (isEditMode) {
        await userApi.update(id, payload);
      } else {
        const created = await userApi.create(payload);
        if (mode === "save-stay" && created?.user?.id) {
          toast.success("Đã tạo tài khoản tại trang");
          navigate(`/phan-quyen/tai-khoan/chinh-sua/${created.user.id}`, { replace: true });
          return;
        }
      }

      toast.success(isEditMode ? "Đã cập nhật tài khoản" : "Đã tạo tài khoản");
      if (mode !== "save-stay") navigate("/phan-quyen/tai-khoan");
    } catch (error) {
      toast.error(error?.message || "Không thể lưu tài khoản");
    }
  };

  return (
    <FormPageLayout
      disabled={!canSave}
      actions={
        <FormActions
          onSave={() => void handleSubmit((values) => onSubmit(values, "save"))()}
          onSaveStay={() => void handleSubmit((values) => onSubmit(values, "save-stay"))()}
          onSaveMail={() => null}
          onReset={() => reset(defaultValues)}
          isSubmitting={isSubmitting}
          isUploading={false}
          isEditMode={isEditMode}
          exitPath="/phan-quyen/tai-khoan"
          showSaveMail={false}
          readOnlyMode={!canSave}
          readOnlyTitle={isReadOnly ? "Bạn chỉ có quyền xem tài khoản này" : PERMISSION_DENIED_MESSAGE}
        />
      }
    >
      <FormSection title="Thông tin tài khoản">
          <FormField
            label="Họ tên"
            type="text"
            inputProps={{ ...register("name"), disabled: !canSave }}
            error={errors.name?.message}
          />
          <FormField
            label="Tên đăng nhập"
            type="text"
            inputProps={{ ...register("userName"), disabled: !canSave }}
            error={errors.userName?.message}
          />
          <FormField
            label={isEditMode ? "Mật khẩu mới" : "Mật khẩu"}
            type="password"
            inputProps={{
              ...register("password"),
              placeholder: isEditMode ? "Để trống nếu không đổi mật khẩu" : "Nhập mật khẩu tạm",
              autoComplete: "new-password",
              disabled: !canSave,
            }}
            error={errors.password?.message}
          />
          <FormField
            label="Xác nhận mật khẩu"
            type="password"
            inputProps={{
              ...register("confirmPassword"),
              placeholder: isEditMode ? "Nhập lại mật khẩu mới nếu có đổi" : "Nhập lại mật khẩu",
              autoComplete: "new-password",
              disabled: !canSave,
            }}
            error={errors.confirmPassword?.message}
          />
          <div className="space-y-1 lg:col-span-2">
            <label className="block text-sm font-medium text-slate-600">Vai trò</label>

            <Controller
              name="roles"
              control={control}
              render={({ field }) => (
                <div className="grid gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-4">
                  {USER_ROLE_OPTIONS.map((option) => {
                    const checked = Array.isArray(field.value) && field.value.includes(option.value);

                    return (
                      <label key={option.value} className="flex items-center gap-2 text-sm font-medium text-slate-600">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={isReadOnly || isSubmitting}
                          onChange={(event) => {
                            const currentRoles = Array.isArray(field.value) ? field.value : [];

                            if (event.target.checked) {
                              field.onChange(Array.from(new Set([...currentRoles, option.value])));
                              return;
                            }

                            const nextRoles = currentRoles.filter((item) => item !== option.value);
                            field.onChange(nextRoles.length > 0 ? nextRoles : ["user"]);
                          }}
                        />
                        {option.label}
                      </label>
                    );
                  })}
                </div>
              )}
            />

            {errors.roles?.message ? <p className="text-xs text-red-500">{errors.roles.message}</p> : null}
          </div>
          <label className="flex lg:col-span-2 items-center gap-2 text-sm font-semibold text-slate-600">
            <input type="checkbox" {...register("isActive")} disabled={!canSave} />
            Đang hoạt động
          </label>
          <FormField
            label="Ghi chú"
            type="textarea"
            className="lg:col-span-2"
            inputProps={{ ...register("note"), rows: 3, disabled: !canSave }}
            error={errors.note?.message}
          />
          <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800 lg:col-span-2">
            Tài khoản nội bộ do quản trị viên cấp. Không chia sẻ tài khoản cho người khác và nên đổi mật khẩu tạm sau
            khi nhận tài khoản.
          </div>
      </FormSection>
    </FormPageLayout>
  );
}

export default UserForm;
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { FormActions } from "@/components/program-form/FormActions";
import FormField from "@/components/ui/form-field";
import { userApi } from "@/lib/api-client";
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
  }, [id, isEditMode, navigate, reset]);

  const onSubmit = async (values, mode) => {
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
    <form className="space-y-4">
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
      />

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-3 text-lg font-semibold text-slate-700">
          Thông tin tài khoản
        </div>
        <div className="grid gap-5 p-5 lg:grid-cols-2">
          <FormField label="Họ tên" type="text" inputProps={{ ...register("name") }} error={errors.name?.message} />
          <FormField
            label="Tên đăng nhập"
            type="text"
            inputProps={{ ...register("userName") }}
            error={errors.userName?.message}
          />
          <FormField
            label={isEditMode ? "Mật khẩu mới" : "Mật khẩu"}
            type="password"
            inputProps={{
              ...register("password"),
              placeholder: isEditMode ? "Để trống nếu không đổi mật khẩu" : "Nhập mật khẩu tạm",
              autoComplete: "new-password",
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
            }}
            error={errors.confirmPassword?.message}
          />

          <div className="lg:col-span-2">
            <p className="mb-2 text-sm font-semibold text-slate-600">Vai trò</p>
            <Controller
              control={control}
              name="roles"
              render={({ field }) => {
                const selectedRoles = Array.isArray(field.value) ? field.value : [];

                return (
                  <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-2 lg:grid-cols-4">
                    {USER_ROLE_OPTIONS.map((item) => {
                      const checked = selectedRoles.includes(item.value);

                      return (
                        <label key={item.value} className="flex items-center gap-2 text-sm font-medium text-slate-600">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) => {
                              if (event.target.checked) {
                                field.onChange(Array.from(new Set([...selectedRoles, item.value])));
                                return;
                              }

                              field.onChange(selectedRoles.filter((role) => role !== item.value));
                            }}
                          />
                          {item.label}
                        </label>
                      );
                    })}
                  </div>
                );
              }}
            />
            {errors.roles?.message ? <p className="mt-1 text-xs text-rose-600">{errors.roles.message}</p> : null}
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <input type="checkbox" {...register("isActive")} />
            Đang hoạt động
          </label>
          <FormField
            label="Ghi chú"
            type="textarea"
            className="lg:col-span-2"
            inputProps={{ ...register("note"), rows: 3 }}
            error={errors.note?.message}
          />
          <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800 lg:col-span-2">
            Tài khoản nội bộ do quản trị viên cấp. Một tài khoản có thể có nhiều vai trò, ví dụ vừa Lập trình viên vừa Thiết kế.
          </div>
        </div>
      </div>
    </form>
  );
}

export default UserForm;

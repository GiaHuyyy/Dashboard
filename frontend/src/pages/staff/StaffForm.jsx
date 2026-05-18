import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { FormActions } from "@/components/program-form/FormActions";
import { staffApi } from "@/lib/api-client";
import FormField from "@/components/ui/form-field";

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
        reset({
          fullName: staff.fullName || "",
          email: staff.email || "",
          phone: staff.phone || "",
          department: staff.department || "Lập trình",
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

  const onSubmit = async (values, mode) => {
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
          <FormField
            label="Phòng ban"
            type="text"
            inputProps={{ ...register("department") }}
            error={errors.department?.message}
          />
          <FormField label="Vai trò" type="text" inputProps={{ ...register("role") }} error={errors.role?.message} />
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <input type="checkbox" {...register("isActive")} />
            Đang hoạt động
          </label>
        </div>
      </div>
    </form>
  );
}

export default StaffForm;

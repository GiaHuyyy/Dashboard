import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { registerUser } from "@/store/auth-slice";

const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Vui lòng nhập họ và tên"),
    userName: z.string().trim().min(3, "Tên đăng nhập tối thiểu 3 ký tự"),
    password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
    confirmPassword: z.string().min(6, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Mật khẩu xác nhận không khớp",
  });

function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      userName: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async ({ name, userName, password }) => {
    try {
      await dispatch(registerUser({ name, userName, password })).unwrap();
      toast.success("Đăng ký thành công");
      navigate("/home", { replace: true });
    } catch (error) {
      toast.error(error || "Đăng ký thất bại");
    }
  };

  return (
    <div className="min-h-screen">
      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Dashboard</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Đăng ký</h1>
            <p className="mt-2 text-sm text-slate-500">Tạo tài khoản mới để sử dụng hệ thống.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <label className="block text-sm font-semibold text-slate-600">
              Họ và tên
              <input
                type="text"
                {...register("name")}
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                placeholder="Nguyễn Văn A"
              />
              {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}
            </label>

            <label className="block text-sm font-semibold text-slate-600">
              Tên đăng nhập
              <input
                type="text"
                {...register("userName")}
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                placeholder="user"
              />
              {errors.userName && <p className="mt-1 text-xs text-rose-600">{errors.userName.message}</p>}
            </label>

            <label className="block text-sm font-semibold text-slate-600">
              Mật khẩu
              <input
                type="password"
                {...register("password")}
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                placeholder="********"
              />
              {errors.password && <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>}
            </label>

            <label className="block text-sm font-semibold text-slate-600">
              Xác nhận mật khẩu
              <input
                type="password"
                {...register("confirmPassword")}
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                placeholder="********"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-rose-600">{errors.confirmPassword.message}</p>
              )}
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
            >
              {isLoading ? "Đang xử lý..." : "Tạo tài khoản"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Đã có tài khoản?{" "}
            <Link className="font-semibold text-sky-600 hover:text-sky-700" to="/login">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;

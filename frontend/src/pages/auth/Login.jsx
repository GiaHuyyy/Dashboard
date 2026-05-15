import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { loginUser } from "@/store/auth-slice";

const loginSchema = z.object({
  userName: z.string().trim().min(1, "Vui lòng nhập tên đăng nhập"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      userName: "admin1",
      password: "123456",
    },
  });

  const onSubmit = async (values) => {
    try {
      await dispatch(loginUser(values)).unwrap();
      toast.success("Đăng nhập thành công");
      navigate("/home", { replace: true });
    } catch (error) {
      toast.error(error || "Đăng nhập thất bại");
    }
  };

  return (
    <div className="min-h-screen">
      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Dashboard</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Đăng nhập</h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <label className="block text-sm font-semibold text-slate-600">
              Tên đăng nhập
              <input
                type="text"
                {...register("userName")}
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                placeholder="Nhập tên đăng nhập"
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-400"
            >
              {isLoading ? "Đang xử lý..." : "Đăng nhập"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Chưa có tài khoản?{" "}
            <Link className="font-semibold text-sky-600 hover:text-sky-700" to="/register">
              Đăng ký
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;

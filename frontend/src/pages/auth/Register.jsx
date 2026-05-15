import FormField from "@/components/ui/form-field";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();
  const [formState, setFormState] = useState({ name: "", userName: "", password: "" });

  const handleSubmit = (event) => {
    event.preventDefault();
    navigate("/login", { replace: true });
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              label="Họ và tên"
              value={formState.name}
              onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Nguyễn Văn A"
              required
            />
            <FormField
              label="UserName"
              value={formState.userName}
              onChange={(event) => setFormState((prev) => ({ ...prev, userName: event.target.value }))}
              placeholder="user"
              required
            />
            <FormField
              label="Mật khẩu"
              type="password"
              value={formState.password}
              onChange={(event) => setFormState((prev) => ({ ...prev, password: event.target.value }))}
              placeholder="********"
              required
            />
            <FormField
              label="Xác nhận mật khẩu"
              type="password"
              value={formState.password}
              onChange={(event) => setFormState((prev) => ({ ...prev, password: event.target.value }))}
              placeholder="********"
              required
            />

            <button
              type="submit"
              className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Tạo tài khoản
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

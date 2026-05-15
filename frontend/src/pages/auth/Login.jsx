import FormField from "@/components/ui/form-field";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const DEMO_USER = {
  userName: "admin1",
  password: "123456",
};

function Login() {
  const navigate = useNavigate();
  const [formState, setFormState] = useState({ userName: DEMO_USER.userName, password: DEMO_USER.password });
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    const isValid = formState.userName.trim() === DEMO_USER.userName && formState.password === DEMO_USER.password;

    if (!isValid) {
      setError("Sai tài khoản hoặc mật khẩu.");
      return;
    }

    localStorage.setItem("auth", "true");
    navigate("/home", { replace: true });
    toast.success("Đăng nhập thành công!");
  };

  return (
    <div className="min-h-scree">
      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Dashboard</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Đăng nhập</h1>
            <p className="mt-2 text-sm text-slate-500">
              Tài khoản mẫu: <span className="font-semibold">admin1</span> / 123456
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              label="Tên đăng nhập"
              value={formState.userName}
              onChange={(event) => setFormState((prev) => ({ ...prev, userName: event.target.value }))}
              placeholder="Nhập tên đăng nhập"
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
            {error && <p className="text-sm text-rose-600">{error}</p>}

            <button
              type="submit"
              className="w-full rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              Đăng nhập
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

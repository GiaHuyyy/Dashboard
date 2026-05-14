import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const DEMO_USER = {
  email: "admin@example.com",
  password: "123456",
};

function Login() {
  const navigate = useNavigate();
  const [formState, setFormState] = useState({ email: DEMO_USER.email, password: DEMO_USER.password });
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    const isValid = formState.email.trim() === DEMO_USER.email && formState.password === DEMO_USER.password;

    if (!isValid) {
      setError("Sai tài khoản hoặc mật khẩu.");
      return;
    }

    localStorage.setItem("auth", "true");
    navigate("/home", { replace: true });
    toast.success("Đăng nhập thành công!");
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="pointer-events-none absolute -left-16 top-16 h-56 w-56 rounded-full bg-sky-200/60 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-10 h-56 w-56 rounded-full bg-emerald-200/60 blur-3xl" />

        <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Dashboard</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Dang nhap</h1>
            <p className="mt-2 text-sm text-slate-500">
              Tai khoan mau: <span className="font-semibold">admin@example.com</span> / 123456
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-semibold text-slate-600">
              Email
              <input
                type="email"
                value={formState.email}
                onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                placeholder="admin@example.com"
                required
              />
            </label>
            <label className="block text-sm font-semibold text-slate-600">
              Mat khau
              <input
                type="password"
                value={formState.password}
                onChange={(event) => setFormState((prev) => ({ ...prev, password: event.target.value }))}
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                placeholder="********"
                required
              />
            </label>

            {error && <p className="text-sm text-rose-600">{error}</p>}

            <button
              type="submit"
              className="w-full rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              Dang nhap
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Chua co tai khoan?{" "}
            <Link className="font-semibold text-sky-600 hover:text-sky-700" to="/register">
              Dang ky
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;

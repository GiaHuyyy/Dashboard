import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();
  const [formState, setFormState] = useState({ name: "", email: "", password: "" });

  const handleSubmit = (event) => {
    event.preventDefault();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="pointer-events-none absolute -left-16 top-16 h-56 w-56 rounded-full bg-sky-200/60 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-10 h-56 w-56 rounded-full bg-emerald-200/60 blur-3xl" />

        <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Dashboard</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Dang ky</h1>
            <p className="mt-2 text-sm text-slate-500">Tao tai khoan moi de su dung he thong.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-semibold text-slate-600">
              Ho va ten
              <input
                type="text"
                value={formState.name}
                onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                placeholder="Vo Tuan Anh"
                required
              />
            </label>
            <label className="block text-sm font-semibold text-slate-600">
              Email
              <input
                type="email"
                value={formState.email}
                onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                placeholder="email@example.com"
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

            <button
              type="submit"
              className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Tao tai khoan
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Da co tai khoan?{" "}
            <Link className="font-semibold text-sky-600 hover:text-sky-700" to="/login">
              Dang nhap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;

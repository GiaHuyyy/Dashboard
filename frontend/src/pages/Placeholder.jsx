function Placeholder({ title }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">Nội dung đang cập nhật. Dữ liệu mẫu sẽ được thêm sau.</p>
    </div>
  );
}

export default Placeholder;

function Modal({ open, title, size = "md", footer, onClose, children }) {
  if (!open) return null;

  const sizeClass = size === "sm" ? "max-w-md" : size === "lg" ? "max-w-3xl" : "max-w-2xl";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
      <div
        className={`relative w-full rounded-2xl bg-white shadow-xl ${sizeClass}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h3 className="text-base font-semibold text-slate-700">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-md p-1 hover:bg-slate-100">
            <span className="sr-only">Dong</span>
            <span aria-hidden="true">x</span>
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer ? <div className="border-t border-slate-200 px-5 py-3">{footer}</div> : null}
      </div>
    </div>
  );
}

export default Modal;

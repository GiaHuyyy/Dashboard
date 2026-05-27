export function FormSection({
  title,
  children,
  className = "",
  contentClassName = "grid gap-5 p-5 lg:grid-cols-2",
  headerClassName = "",
}) {
  return (
    <section className={["rounded-2xl border border-slate-200 bg-white shadow-sm", className].filter(Boolean).join(" ")}>
      {title ? (
        <div
          className={[
            "border-b border-slate-200 px-5 py-3 text-lg font-semibold text-slate-700",
            headerClassName,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {title}
        </div>
      ) : null}
      <div className={contentClassName}>{children}</div>
    </section>
  );
}

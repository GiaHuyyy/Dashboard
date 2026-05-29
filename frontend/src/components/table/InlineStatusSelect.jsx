const DEFAULT_STATUS_COLORS = {
  "Mới tạo": "text-slate-600",
  "Đã phân công": "text-sky-700",
  "Đang xử lý": "text-amber-700",
  "Đã hoàn thành": "text-emerald-700",
};

const baseSelectClass =
  "w-full rounded border px-2 py-1.5 text-sm font-semibold shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-70";

const getOptionItems = (value, options = []) => {
  const normalizedValue = value || options[0] || "";
  if (!normalizedValue) return options;
  return options.includes(normalizedValue) ? options : [normalizedValue, ...options];
};

export function InlineStatusSelect({
  value,
  options,
  isCompleted,
  completedLabel = "Đã hoàn thành",
  disabled = false,
  onChange,
  colorMap = DEFAULT_STATUS_COLORS,
  title,
}) {
  const normalizedValue = isCompleted ? completedLabel : value || options[0] || "";
  const optionItems = getOptionItems(normalizedValue, options);
  const textColor = colorMap[normalizedValue] || "text-slate-700";

  if (isCompleted) {
    return (
      <span
        className={`inline-flex min-h-8 w-full items-center rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm font-semibold shadow-sm ${textColor}`}
        title={title}
      >
        {normalizedValue || "-"}
      </span>
    );
  }

  return (
    <select
      className={`${baseSelectClass} border-slate-200 bg-white ${textColor}`}
      value={normalizedValue}
      disabled={disabled}
      title={title}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => {
        event.stopPropagation();
        onChange(event.target.value);
      }}
    >
      {optionItems.map((option) => (
        <option key={option} value={option} className={colorMap[option] || "text-slate-700"}>
          {option}
        </option>
      ))}
    </select>
  );
}

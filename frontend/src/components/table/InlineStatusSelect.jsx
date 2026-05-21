const DEFAULT_STATUS_COLORS = {
  "Mới tạo": "text-slate-600",
  "Đã phân công": "text-sky-700",
  "Đang xử lý": "text-amber-700",
  "Đã hoàn thành": "text-emerald-700",
};

export function InlineStatusSelect({
  value,
  options,
  isCompleted,
  completedLabel = "Đã hoàn thành",
  disabled = false,
  onChange,
  colorMap = DEFAULT_STATUS_COLORS,
}) {
  const textColor = colorMap[value] || "text-slate-700";

  if (isCompleted) {
    return (
      <span className={`${colorMap[completedLabel] || "text-emerald-700"}`}>
        {completedLabel}
      </span>
    );
  }

  return (
    <select
      className={`w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm ${textColor}`}
      value={value}
      disabled={disabled}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => {
        event.stopPropagation();
        onChange(event.target.value);
      }}
    >
      {options.map((option) => (
        <option key={option} value={option} className={colorMap[option] || "text-slate-700"}>
          {option}
        </option>
      ))}
    </select>
  );
}
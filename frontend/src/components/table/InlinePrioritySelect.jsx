import { PRIORITY_COLORS } from "@/constants/priority-colors";

export function InlinePrioritySelect({
  value,
  options,
  isCompleted,
  disabled = false,
  onChange,
  colorMap = PRIORITY_COLORS,
}) {
  if (isCompleted) {
    return (
      <span className={`font-semibold ${colorMap[value] || "text-slate-600"}`}>
        {value}
      </span>
    );
  }

  return (
    <select
      className={`w-full rounded border border-slate-200 px-2 py-1.5 ${colorMap[value] || "text-slate-700"}`}
      value={value}
      disabled={disabled}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => {
        event.stopPropagation();
        onChange(event.target.value);
      }}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

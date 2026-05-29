import { BUSINESS_CONTRACT_STATUS_BADGE_CLASS } from "@/constants/business-contract";

export function InlineProjectStatusSelect({
  value,
  options,
  disabled = false,
  onChange,
  colorMap = BUSINESS_CONTRACT_STATUS_BADGE_CLASS,
  title,
}) {
  const normalizedValue = value || options[0] || "";
  const optionItems = normalizedValue && !options.includes(normalizedValue) ? [normalizedValue, ...options] : options;
  const statusClass = colorMap[normalizedValue] || "border-slate-200 bg-white text-slate-700";

  return (
    <select
      className={`w-full rounded border px-2 py-1.5 text-sm font-semibold shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-70 ${statusClass}`}
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

import { BUSINESS_CONTRACT_TYPE_TEXT_CLASS } from "@/constants/business-contract";

const baseSelectClass =
  "w-full rounded border px-2 py-1.5 text-sm font-semibold shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-70";

const getOptionItems = (value, options = []) => {
  const normalizedValue = value || options[0] || "";
  if (!normalizedValue) return options;
  return options.includes(normalizedValue) ? options : [normalizedValue, ...options];
};

export function InlineContractTypeSelect({
  value,
  options,
  disabled = false,
  onChange,
  colorMap = BUSINESS_CONTRACT_TYPE_TEXT_CLASS,
  title,
}) {
  const normalizedValue = value || options[0] || "";
  const optionItems = getOptionItems(normalizedValue, options);
  const textColor = colorMap[normalizedValue] || "text-slate-700";

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

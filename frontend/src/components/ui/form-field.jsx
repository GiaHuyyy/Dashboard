import { cn } from "@/lib/utils";

const baseInputClass =
  "w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-light focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200";

function FormField({
  label,
  type = "input",
  options = [],
  className,
  inputClassName,
  selectClassName,
  inputProps,
  selectProps,
}) {
  return (
    <label className={cn("text-sm font-semibold text-slate-600", className)}>
      {label}
      <div className="mt-2">
        {type === "select" ? (
          <select className={cn(baseInputClass, selectClassName)} {...selectProps}>
            {options.map((option) => (
              <option key={option.value ?? option.label} value={option.value ?? option.label}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input className={cn(baseInputClass, inputClassName)} {...inputProps} />
        )}
      </div>
    </label>
  );
}

export default FormField;

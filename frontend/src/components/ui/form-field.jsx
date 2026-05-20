import { cn } from "@/lib/utils";

const baseInputClass =
  "w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-light focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200";

function FormField({
  label,
  type = "text",
  options = [],
  className,
  inputClassName,
  selectClassName,
  error,
  inputProps,
  selectProps,
}) {
  const fieldClass = cn(baseInputClass, (error && "border-rose-300 focus:border-rose-400 focus:ring-rose-200") || "");

  return (
    <label className={cn("text-sm font-semibold text-slate-600", className)}>
      {label}
      <div className="">
        {type === "select" ? (
          <select className={cn(fieldClass, selectClassName)} {...selectProps}>
            {options.map((option) => (
              <option
                key={option.value ?? option.label}
                value={option.value ?? option.label}
                disabled={Boolean(option.disabled)}
              >
                {option.label}
              </option>
            ))}
          </select>
        ) : type === "textarea" ? (
          <textarea className={cn(fieldClass, inputClassName)} {...inputProps} />
        ) : type === "checkbox" ? (
          <input type="checkbox" className={cn("h-4 w-4 rounded border-slate-300", inputClassName)} {...inputProps} />
        ) : (
          <input type={type} className={cn(fieldClass, inputClassName)} {...inputProps} />
        )}
      </div>
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
    </label>
  );
}

export default FormField;

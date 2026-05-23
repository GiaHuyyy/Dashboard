const variantStyles = {
  primary: {
    base: "bg-sky-600 text-white",
    hover: "hover:opacity-90",
    disabled: "disabled:bg-sky-400 disabled:cursor-not-allowed",
  },
  info: {
    base: "bg-blue-600 text-white",
    hover: "hover:opacity-90",
    disabled: "disabled:bg-blue-400 disabled:cursor-not-allowed",
  },
  success: {
    base: "bg-emerald-600 text-white",
    hover: "hover:opacity-90",
    disabled: "disabled:bg-emerald-400 disabled:cursor-not-allowed",
  },
  secondary: {
    base: "bg-slate-600 text-white",
    hover: "hover:opacity-90",
    disabled: "disabled:bg-slate-400 disabled:cursor-not-allowed",
  },
  danger: {
    base: "bg-rose-600 text-white",
    hover: "hover:opacity-90",
    disabled: "disabled:bg-rose-400 disabled:cursor-not-allowed",
  },
  "danger-outline": {
    base: "text-rose-700",
    hover: "hover:opacity-75",
    disabled: "disabled:cursor-not-allowed",
  },
  "primary-outline": {
    base: "text-sky-500",
    hover: "hover:opacity-75",
    disabled: "disabled:cursor-not-allowed",
  },
};

const sizeStyles = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-2 text-sm",
  lg: "px-4 py-2 text-sm",
};

export function Button({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  variant = "primary",
  size = "md",
  className = "",
  withHover = true,
  type = "button",
  iconOnly = false,
  gap = "gap-2",
  title,
  ariaLabel,
}) {
  const variantStyle = variantStyles[variant] || variantStyles.primary;
  const sizeStyle = sizeStyles[size] || sizeStyles.md;

  const baseClasses = `inline-flex items-center ${gap} rounded-md font-semibold transition ${variantStyle.base} ${variantStyle.disabled}`;
  const hoverClasses = withHover ? variantStyle.hover : "";
  const sizeClasses = iconOnly ? "p-1" : sizeStyle;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel || label}
      className={`${baseClasses} ${sizeClasses} ${hoverClasses} ${className}`}
    >
      {Icon && <Icon className={iconOnly ? "h-4 w-4" : "h-4 w-4"} />}
      {label && !iconOnly && <span>{label}</span>}
    </button>
  );
}
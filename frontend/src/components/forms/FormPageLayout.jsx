export function FormPageLayout({ actions, children, disabled = false, className = "" }) {
  return (
    <form className={["space-y-4", className].filter(Boolean).join(" ")}>
      {actions}
      <fieldset disabled={disabled} className="m-0 min-w-0 space-y-4 border-0 p-0">
        {children}
      </fieldset>
    </form>
  );
}

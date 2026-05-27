export function FormPageLayout({ actions, children, disabled = false, className = "" }) {
  return (
    <form className={["space-y-4", className].filter(Boolean).join(" ")}>
      {actions}
      <fieldset disabled={disabled} className="contents">
        {children}
      </fieldset>
    </form>
  );
}

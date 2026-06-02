import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const EMPTY_TEXT = "--";

export const formatPoint = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "0";
  return Number(parsed.toFixed(3)).toString();
};

export const formatCurrency = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "0 đ";
  return `${parsed.toLocaleString("vi-VN")} đ`;
};

export const formatValue = (value) => {
  if (value === 0) return "0";
  return value || EMPTY_TEXT;
};

export const Section = ({ title, description, actions, children }) => (
  <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-3">
      <div>
        <h2 className="text-lg font-semibold text-slate-700">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
    <div className="p-5">{children}</div>
  </section>
);

export const StatCard = ({ label, value, subvalue, hint }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
    <div className="flex items-baseline gap-2 text-sky-700">
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {subvalue ? <p className="text-sm font-semibold text-sky-700">{subvalue}</p> : null}
    </div>
    {hint ? <p className="mt-1 text-sm text-slate-500">{hint}</p> : null}
  </div>
);

export const InfoGrid = ({ items }) => (
  <dl className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {items.map((item) => (
      <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.label}</dt>
        <dd className="mt-1 wrap-break-word text-sm font-medium text-slate-700">{formatValue(item.value)}</dd>
      </div>
    ))}
  </dl>
);

export const EmptyState = ({ children = "Chưa có dữ liệu" }) => (
  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
    {children}
  </div>
);

export const DataTable = ({ columns, rows = [], emptyText, onRowClick }) => (
  <div className="w-full overflow-x-auto">
    <Table className="min-w-full text-center text-sm">
      <TableHeader className="bg-slate-50 text-slate-500">
        <TableRow>
          {columns.map((column) => (
            <TableHead
              key={column.key}
              className="border border-slate-200 p-3 text-center font-semibold text-slate-500"
            >
              {column.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length} className="border border-slate-200 p-4 py-8 text-slate-500">
              {emptyText || "Chưa có dữ liệu"}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row, index) => (
            <TableRow
              key={row.id || index}
              className={onRowClick ? "cursor-pointer text-slate-700 hover:bg-slate-50" : "text-slate-700"}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  className={["border border-slate-200 p-3", column.className].filter(Boolean).join(" ")}
                >
                  {column.render ? column.render(row, index) : formatValue(row[column.key])}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);

export const PriceReferencesList = ({ references = [] }) => {
  if (!Array.isArray(references) || references.length === 0) return <span>{EMPTY_TEXT}</span>;

  return (
    <div className="space-y-1 text-left">
      {references.map((item, index) => (
        <div key={`${item.type}-${index}`} className="rounded-lg bg-slate-50 px-2 py-1">
          <p className="font-medium text-slate-700">{[item.type, item.label].filter(Boolean).join(" - ")}</p>
          {item.description ? <p className="text-xs text-slate-500">{item.description}</p> : null}
        </div>
      ))}
    </div>
  );
};

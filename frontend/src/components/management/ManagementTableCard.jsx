import { Search } from "lucide-react";

export function ManagementTableCard({
  title = "Danh sách",
  searchText,
  onSearchChange,
  searchPlaceholder = "Search",
  children,
}) {
  return (
    <div className="mt-6 rounded-tl-2xl rounded-tr-2xl bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-t-3 border-slate-200 border-t-sky-500 px-4 py-3">
        <h2 className="text-base font-semibold text-gray-500">{title}</h2>
        <div className="flex items-center">
          <input
            type="text"
            value={searchText}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 w-44 border border-slate-200 px-3 py-1.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center border border-slate-200 text-slate-500"
            aria-label="Tim kiem"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const buildPageItems = (page, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items = new Set([1, totalPages, page, page - 1, page + 1]);
  if (page <= 3) {
    items.add(2);
    items.add(3);
    items.add(4);
  }
  if (page >= totalPages - 2) {
    items.add(totalPages - 1);
    items.add(totalPages - 2);
    items.add(totalPages - 3);
  }

  const sortedItems = Array.from(items)
    .filter((item) => item >= 1 && item <= totalPages)
    .sort((a, b) => a - b);

  return sortedItems.reduce((result, item, index) => {
    if (index > 0 && item - sortedItems[index - 1] > 1) {
      result.push("ellipsis-" + item);
    }
    result.push(item);
    return result;
  }, []);
};

export function ManagementPagination({
  page = 1,
  limit = 10,
  total = 0,
  onPageChange,
  onLimitChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  disabled = false,
}) {
  const normalizedTotal = Number(total) || 0;
  const normalizedLimit = Number(limit) || 10;
  const totalPages = Math.max(1, Math.ceil(normalizedTotal / normalizedLimit));
  const currentPage = Math.min(Math.max(Number(page) || 1, 1), totalPages);
  const from = normalizedTotal === 0 ? 0 : (currentPage - 1) * normalizedLimit + 1;
  const to = Math.min(currentPage * normalizedLimit, normalizedTotal);
  const pageItems = buildPageItems(currentPage, totalPages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-x border-b border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
      <div>
        Hiển thị <span className="font-semibold text-slate-700">{from}-{to}</span> /{" "}
        <span className="font-semibold text-slate-700">{normalizedTotal}</span> dữ liệu
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2">
          <span>Số dòng</span>
          <select
            value={normalizedLimit}
            disabled={disabled}
            onChange={(event) => onLimitChange?.(Number(event.target.value))}
            className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:bg-slate-50"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={disabled || currentPage <= 1}
            onClick={() => onPageChange?.(currentPage - 1)}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Trang trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {pageItems.map((item) =>
            typeof item === "string" ? (
              <span key={item} className="flex h-9 min-w-9 items-center justify-center px-1 text-slate-400">
                ...
              </span>
            ) : (
              <button
                key={item}
                type="button"
                disabled={disabled}
                onClick={() => onPageChange?.(item)}
                className={`h-9 min-w-9 rounded-md border px-3 text-sm font-semibold ${
                  item === currentPage
                    ? "border-sky-500 bg-sky-50 text-sky-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {item}
              </button>
            ),
          )}

          <button
            type="button"
            disabled={disabled || currentPage >= totalPages}
            onClick={() => onPageChange?.(currentPage + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Trang sau"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ManagementPagination;

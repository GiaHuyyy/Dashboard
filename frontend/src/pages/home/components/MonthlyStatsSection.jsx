import { BarChart3 } from "lucide-react";
import { useMemo } from "react";

const monthlyStatColors = {
  program: "bg-sky-500",
  design: "bg-violet-500",
  correction: "bg-amber-500",
  upgrade: "bg-indigo-500",
  source: "bg-emerald-500",
};

const monthlyStatTextColors = {
  program: "text-sky-600",
  design: "text-violet-600",
  correction: "text-amber-600",
  upgrade: "text-indigo-600",
  source: "text-emerald-600",
};

export function MonthlyStatsSection({
  monthlyStats,
  monthlyTypes,
  monthlyItems,
  monthlyRange,
  setMonthlyRange,
  monthlyRangeOptions,
  monthlyYear,
  setMonthlyYear,
  yearOptions,
  isMonthlyLoading,
}) {
  const visibleMonthlyItems = useMemo(() => {
    if (monthlyRange === "first") return monthlyItems.slice(0, 6);
    if (monthlyRange === "second") return monthlyItems.slice(6, 12);
    return monthlyItems;
  }, [monthlyItems, monthlyRange]);

  const maxMonthlyTotal = Math.max(1, ...visibleMonthlyItems.map((item) => Number(item.total || 0)));

  return (
    <div className="rounded-2xl border-t-sky-500 border-t-3 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-sky-600" />
            <h2 className="text-base font-semibold text-slate-700">Thống kê công việc theo tháng</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Tổng số phiếu Lập trình, Design, Chỉnh sửa, Nâng cấp và Source phát sinh theo từng tháng.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-1">
            {monthlyRangeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setMonthlyRange(option.value)}
                disabled={isMonthlyLoading}
                className={`rounded px-3 py-1.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  monthlyRange === option.value
                    ? "bg-white text-sky-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <select
            value={monthlyYear}
            onChange={(event) => setMonthlyYear(Number(event.target.value))}
            disabled={isMonthlyLoading}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                Năm {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isMonthlyLoading ? (
        <div className="mt-4 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700">
          Đang tải thống kê năm {monthlyYear}...
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {monthlyTypes.map((type) => (
          <div key={type.key} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{type.label}</p>
            <p className={`mt-2 text-2xl font-semibold ${monthlyStatTextColors[type.key] || "text-slate-700"}`}>
              {monthlyStats.totals?.[type.key] || 0}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
        <div className="min-w-205 divide-y divide-slate-100">
          {visibleMonthlyItems.map((item) => {
            const total = Number(item.total || 0);
            const width = `${Math.max(3, Math.round((total / maxMonthlyTotal) * 100))}%`;

            return (
              <div key={item.month} className="grid grid-cols-[90px_1fr_80px] items-center gap-3 px-4 py-3 text-sm">
                <div className="font-semibold text-slate-600">{item.label}</div>
                <div className="space-y-2">
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div className="flex h-full rounded-full" style={{ width }}>
                      {monthlyTypes.map((type) => {
                        const value = Number(item[type.key] || 0);
                        if (value <= 0 || total <= 0) return null;
                        return (
                          <div
                            key={type.key}
                            className={monthlyStatColors[type.key] || "bg-slate-400"}
                            style={{ width: `${(value / total) * 100}%` }}
                            title={`${type.label}: ${value}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    {monthlyTypes.map((type) => (
                      <span key={type.key}>
                        <span
                          className={`mr-1 inline-block h-2 w-2 rounded-full ${monthlyStatColors[type.key] || "bg-slate-400"}`}
                        />
                        {type.label}: <span className="font-semibold text-slate-700">{item[type.key] || 0}</span>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right font-semibold text-slate-700">{total}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

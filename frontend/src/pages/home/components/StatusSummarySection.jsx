import { FolderKanban, SquarePen, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";

const projectStatusTextColors = {
  notReceived: "text-slate-600",
  received: "text-green-600",
  doing: "text-sky-600",
  priority: "text-yellow-600",
  paused: "text-rose-600",
};

const workStatusTextColors = {
  new: "text-slate-600",
  assigned: "text-sky-600",
  processing: "text-amber-600",
  completed: "text-emerald-600",
};

const priorityDotColors = {
  Thấp: "bg-slate-500",
  "Trung bình": "bg-sky-500",
  Cao: "bg-amber-500",
  Khẩn: "bg-rose-500",
};

function StatusFilterSelect({ value, onChange, disabled, options }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function StatusSummaryCard({
  icon: Icon,
  title,
  description,
  total,
  items,
  colorMap,
  isLoading,
  loadingText,
  gridClass,
  month,
  year,
  onMonthChange,
  onYearChange,
  monthOptions,
  yearOptions,
  showPriorityCounts = false,
}) {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border-t-sky-500 border-t-3 border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-sky-600" />
            <h2 className="text-base font-semibold text-slate-700">{title}</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <StatusFilterSelect value={month} onChange={onMonthChange} disabled={isLoading} options={monthOptions} />
          <StatusFilterSelect value={year} onChange={onYearChange} disabled={isLoading} options={yearOptions} />
          <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-sky-700">
            Tổng {total || 0}
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-4 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700">
          {loadingText}
        </div>
      ) : null}

      <div className={`mt-4 grid gap-3 ${gridClass}`}>
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => item.href && navigate(item.href)}
            className="group rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-sky-200 hover:bg-sky-50 hover:shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.label}</p>
            <p className={`mt-2 text-2xl font-semibold ${colorMap[item.key] || "text-slate-700"}`}>{item.value || 0}</p>

            {showPriorityCounts && Array.isArray(item.priorityCounts) ? (
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-200 pt-2 text-xs font-medium text-slate-500">
                {item.priorityCounts.map((priorityItem) => {
                  const priorityLabel = priorityItem.label || priorityItem.priority;
                  return (
                    <span
                      key={priorityItem.key || priorityLabel}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap"
                      title={`${priorityLabel}: ${priorityItem.value || 0}`}
                    >
                      <span className={`h-2 w-2 rounded-full ${priorityDotColors[priorityLabel] || "bg-slate-400"}`} />
                      <span>
                        {priorityLabel}: <span className="font-semibold text-slate-700">{priorityItem.value || 0}</span>
                      </span>
                    </span>
                  );
                })}
              </div>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}

export function StatusSummarySection({
  projectStatusSummary,
  projectStatusItems,
  projectStatusMonth,
  setProjectStatusMonth,
  projectStatusYear,
  setProjectStatusYear,
  isProjectStatusLoading,
  correctionStatusSummary,
  correctionStatusItems,
  correctionStatusMonth,
  setCorrectionStatusMonth,
  correctionStatusYear,
  setCorrectionStatusYear,
  isCorrectionStatusLoading,
  upgradeStatusSummary,
  upgradeStatusItems,
  upgradeStatusMonth,
  setUpgradeStatusMonth,
  upgradeStatusYear,
  setUpgradeStatusYear,
  isUpgradeStatusLoading,
  monthOptions,
  yearOptions,
}) {
  return (
    <>
      <StatusSummaryCard
        icon={FolderKanban}
        title="Thống kê trạng thái dự án"
        description="Thống kê tổng số hợp đồng theo các trạng thái Chưa nhận, Đã nhận, Đang làm, Ưu tiên và Hoãn."
        total={projectStatusSummary.total}
        items={projectStatusItems}
        colorMap={projectStatusTextColors}
        isLoading={isProjectStatusLoading}
        loadingText="Đang tải thống kê trạng thái dự án..."
        gridClass="sm:grid-cols-2 lg:grid-cols-5"
        month={projectStatusMonth}
        year={projectStatusYear}
        onMonthChange={setProjectStatusMonth}
        onYearChange={setProjectStatusYear}
        monthOptions={monthOptions}
        yearOptions={yearOptions}
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <StatusSummaryCard
          icon={SquarePen}
          title="Thống kê trạng thái chỉnh sửa"
          description="Thống kê yêu cầu chỉnh sửa theo 4 trạng thái của danh mục Trạng thái."
          total={correctionStatusSummary.total}
          items={correctionStatusItems}
          colorMap={workStatusTextColors}
          isLoading={isCorrectionStatusLoading}
          loadingText="Đang tải thống kê trạng thái chỉnh sửa..."
          gridClass="sm:grid-cols-2"
          month={correctionStatusMonth}
          year={correctionStatusYear}
          onMonthChange={setCorrectionStatusMonth}
          onYearChange={setCorrectionStatusYear}
          monthOptions={monthOptions}
          yearOptions={yearOptions}
          showPriorityCounts
        />

        <StatusSummaryCard
          icon={Wrench}
          title="Thống kê trạng thái nâng cấp"
          description="Thống kê yêu cầu nâng cấp theo 4 trạng thái của danh mục Trạng thái."
          total={upgradeStatusSummary.total}
          items={upgradeStatusItems}
          colorMap={workStatusTextColors}
          isLoading={isUpgradeStatusLoading}
          loadingText="Đang tải thống kê trạng thái nâng cấp..."
          gridClass="sm:grid-cols-2"
          month={upgradeStatusMonth}
          year={upgradeStatusYear}
          onMonthChange={setUpgradeStatusMonth}
          onYearChange={setUpgradeStatusYear}
          monthOptions={monthOptions}
          yearOptions={yearOptions}
          showPriorityCounts
        />
      </div>
    </>
  );
}

import { EmptyState, Section } from "./profileShared";

const parseTime = (value) => {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
};

const formatChartDate = (value) => {
  const time = parseTime(value);
  if (!time) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(time));
};

const formatChartShortDate = (value) => {
  const time = parseTime(value);
  if (!time) return "";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(time));
};

const getTimelineColorClass = (type) => {
  switch (type) {
    case "contract":
      return "bg-sky-500";
    case "design":
      return "bg-violet-500";
    case "program":
      return "bg-emerald-500";
    case "correction":
      return "bg-amber-500";
    case "upgrade":
      return "bg-indigo-500";
    case "source":
      return "bg-teal-500";
    default:
      return "bg-slate-400";
  }
};

const TIMELINE_LEGEND_ITEMS = [
  { label: "Hợp đồng", type: "contract" },
  { label: "Design", type: "design" },
  { label: "Lập trình", type: "program" },
  { label: "Chỉnh sửa", type: "correction" },
  { label: "Nâng cấp", type: "upgrade" },
  { label: "Source", type: "source" },
];

const TimelineLegend = () => (
  <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
    <span className="font-semibold text-slate-600">Màu:</span>
    {TIMELINE_LEGEND_ITEMS.map((item) => (
      <span key={item.type} className="inline-flex items-center gap-1.5">
        <span className={`h-2.5 w-2.5 rounded-full ${getTimelineColorClass(item.type)}`} />
        {item.label}
      </span>
    ))}
  </div>
);

const buildTimelineChartRows = ({ contract, designs = [], programs = [], corrections = [], upgrades = [], sources = [] }) => {
  const rows = [];
  const pushRow = ({ id, label, description = "", type = "info", start, end, startLabel, endLabel }) => {
    const startTime = parseTime(start);
    const fallbackEnd = end || start;
    const endTime = parseTime(fallbackEnd) || startTime;
    if (!startTime) return;

    rows.push({
      id: id || `${type}-${rows.length}`,
      label: label || "Không có tiêu đề",
      description,
      type,
      start,
      end: fallbackEnd,
      startTime,
      endTime: endTime < startTime ? startTime : endTime,
      startLabel: startLabel || formatChartDate(start),
      endLabel: endLabel || (end ? formatChartDate(end) : formatChartDate(start)),
    });
  };

  pushRow({
    id: `contract-${contract?.id || "current"}`,
    label: "Hợp đồng",
    description: contract?.contractCode || contract?.contractName || "",
    type: "contract",
    start: contract?.createdAt,
    end: contract?.handoverAt || contract?.expectedHandoverAt || contract?.createdAt,
    startLabel: contract?.createdAtLabel,
    endLabel: contract?.handoverAtLabel || contract?.expectedHandoverAtLabel,
  });

  designs.forEach((item) => {
    const start = item.receiveDate || item.handoverDate || item.createdAt;
    const deadline = item.expectedDate || item.deadline;

    pushRow({
      id: `design-${item.id}`,
      label: `Design: ${item.title || item.designType || "Không có tiêu đề"}`,
      description: [item.assignee, item.status].filter(Boolean).join(" - "),
      type: "design",
      start,
      end: item.completedDate || deadline || start,
      startLabel: item.receiveDateLabel || item.handoverDateLabel || item.createdAtLabel,
      endLabel: item.completedDateLabel || item.expectedDateLabel || item.deadlineLabel || (deadline ? "" : "Chưa có ngày dự kiến"),
    });
  });

  programs.forEach((item) => {
    pushRow({
      id: `program-${item.id}`,
      label: `Lập trình: ${item.module || "Không có module"}`,
      description: [item.assignee, item.processingStatus].filter(Boolean).join(" - "),
      type: "program",
      start: item.assignedAt || item.createdAt,
      end: item.completedAt || item.dueAt || item.assignedAt || item.createdAt,
      startLabel: item.assignedAtLabel || item.createdAtLabel,
      endLabel: item.completedAtLabel || item.dueAtLabel || (item.dueAt ? "" : "Chưa có ngày dự kiến"),
    });
  });

  corrections.forEach((item) => {
    pushRow({
      id: `correction-${item.id}`,
      label: `Chỉnh sửa: ${item.issueContent || item.module || "Không có nội dung"}`,
      description: [item.assignee, item.status].filter(Boolean).join(" - "),
      type: "correction",
      start: item.assignedAt || item.createdAt,
      end: item.completedAt || item.dueAt || item.assignedAt || item.createdAt,
      startLabel: item.assignedAtLabel || item.createdAtLabel,
      endLabel: item.completedAtLabel || item.dueAtLabel || (item.dueAt ? "" : "Chưa có ngày dự kiến"),
    });
  });

  upgrades.forEach((item) => {
    pushRow({
      id: `upgrade-${item.id}`,
      label: `Nâng cấp: ${item.upgradeItem || item.module || "Không có nội dung"}`,
      description: [item.assignee, item.status].filter(Boolean).join(" - "),
      type: "upgrade",
      start: item.assignedAt || item.createdAt,
      end: item.completedAt || item.dueAt || item.assignedAt || item.createdAt,
      startLabel: item.assignedAtLabel || item.createdAtLabel,
      endLabel: item.completedAtLabel || item.dueAtLabel || (item.dueAt ? "" : "Chưa có ngày dự kiến"),
    });
  });

  sources.forEach((item) => {
    pushRow({
      id: `source-${item.id}`,
      label: `Source: ${item.domain || item.module || "Không có tên miền"}`,
      description: item.sendStatus || "",
      type: "source",
      start: item.createdAt,
      end: item.sentAt || item.expiresAt || item.createdAt,
      startLabel: item.createdAtLabel,
      endLabel: item.sentAtLabel || item.expiresAtLabel,
    });
  });

  return rows.sort((a, b) => a.startTime - b.startTime);
};

const TimelineList = ({ items = [] }) => {
  if (items.length === 0) return <EmptyState>Chưa có timeline</EmptyState>;

  return (
    <div className="max-h-105 space-y-3 overflow-y-auto pr-2">
      {items.map((item, index) => (
        <div key={`${item.date}-${index}`} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
          <div className={`mt-1 h-3 w-3 shrink-0 rounded-full ${getTimelineColorClass(item.type)}`} />
          <div>
            <p className="text-sm font-semibold text-slate-700">{item.title}</p>
            <p className="text-xs text-slate-500">{item.dateLabel}</p>
            {item.description ? <p className="mt-1 text-sm text-slate-600">{item.description}</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
};

const TimelineChart = ({ rows = [] }) => {
  if (rows.length === 0) return <EmptyState>Chưa có timeline</EmptyState>;

  const minTime = Math.min(...rows.map((item) => item.startTime));
  const maxTime = Math.max(...rows.map((item) => item.endTime));
  const range = Math.max(maxTime - minTime, 24 * 60 * 60 * 1000);

  return (
    <div className="max-h-115 overflow-x-auto overflow-y-auto rounded-xl border border-slate-200">
      <div className="divide-y divide-slate-100 bg-white" style={{ minWidth: 1280 }}>
        <div className="grid grid-cols-[260px_1fr] bg-slate-50 text-xs font-semibold text-slate-500">
          <div className="border-r border-slate-200 p-3">Công việc</div>
          <div className="flex items-center justify-between p-3">
            <span>{formatChartShortDate(minTime)}</span>
            <span>{formatChartShortDate(maxTime)}</span>
          </div>
        </div>
        {rows.map((row) => {
          const left = Math.min(((row.startTime - minTime) / range) * 100, 97.5);
          const rawWidth = ((row.endTime - row.startTime) / range) * 100;
          const width = row.isMilestone ? 1.2 : Math.min(Math.max(rawWidth, 2.5), 100 - left);

          return (
            <div key={row.id} className="grid grid-cols-[260px_1fr] text-sm">
              <div className="border-r border-slate-200 p-3">
                <p className="line-clamp-2 font-semibold text-slate-700">{row.label}</p>
                {row.description ? <p className="mt-1 line-clamp-1 text-xs text-slate-500">{row.description}</p> : null}
              </div>
              <div className="relative min-h-16 p-3">
                <div className="absolute inset-x-3 top-1/2 h-px bg-slate-100" />
                <div
                  className={`absolute top-1/2 h-6 -translate-y-1/2 rounded-full px-3 text-xs font-semibold leading-6 text-white shadow-sm ${getTimelineColorClass(row.type)}`}
                  style={{ left: `${left}%`, width: `${width}%`, minWidth: row.isMilestone ? 28 : undefined }}
                  title={`${row.label}: ${row.startLabel || "--"}${row.isMilestone ? "" : ` - ${row.endLabel || "--"}`}`}
                >
                  <span className="block truncate">{row.isMilestone ? row.startLabel || "--" : `${row.startLabel || "--"} → ${row.endLabel || "--"}`}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export function ContractTimelineSection({ contract, profile, timelineView, onTimelineViewChange }) {
  const timelineChartRows = buildTimelineChartRows({
    contract,
    designs: profile?.designs,
    programs: profile?.programs,
    corrections: profile?.corrections,
    upgrades: profile?.upgrades,
    sources: profile?.sources,
  });

  return (
    <Section
      title="Timeline xử lý"
      description="Các mốc chính từ hợp đồng tới source và bàn giao."
      actions={
        <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-semibold">
          <button
            type="button"
            className={[
              "rounded-lg px-3 py-1.5 transition",
              timelineView === "list" ? "bg-white text-sky-700 shadow-sm" : "text-slate-500 hover:text-slate-700",
            ].join(" ")}
            onClick={() => onTimelineViewChange("list")}
          >
            Danh sách
          </button>
          <button
            type="button"
            className={[
              "rounded-lg px-3 py-1.5 transition",
              timelineView === "chart" ? "bg-white text-sky-700 shadow-sm" : "text-slate-500 hover:text-slate-700",
            ].join(" ")}
            onClick={() => onTimelineViewChange("chart")}
          >
            Biểu đồ
          </button>
        </div>
      }
    >
      <TimelineLegend />
      {timelineView === "chart" ? (
        <TimelineChart rows={timelineChartRows} />
      ) : (
        <TimelineList items={profile?.timeline || []} />
      )}
    </Section>
  );
}

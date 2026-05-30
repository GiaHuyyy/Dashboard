import { AlertTriangle, ArrowRight, BarChart3, Clock3, FileText, FolderKanban, RefreshCcw, SquarePen, Wrench, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { ManagementPagination } from "@/components/management/ManagementPagination";
import { Button } from "@/components/ui/button-v2";
import { dashboardApi } from "@/lib/api-client";

const emptyCards = {
  program: { label: "Lập trình đang xử lý", value: 0, warning: 0, overdue: 0, href: "/lap-trinh/danh-sach" },
  correction: { label: "Chỉnh sửa đang xử lý", value: 0, warning: 0, overdue: 0, href: "/lap-trinh/chinh-sua" },
  upgrade: { label: "Nâng cấp đang xử lý", value: 0, warning: 0, overdue: 0, href: "/lap-trinh/nang-cap" },
  design: { label: "Design đang xử lý", value: 0, warning: 0, overdue: 0, href: "/design/danh-sach" },
  source: { label: "Source hết hạn link", value: 0, warning: 0, overdue: 0, href: "/he-thong/source" },
  contract: { label: "Hợp đồng chưa bàn giao", value: 0, warning: 0, overdue: 0, href: "/kinh-doanh/danh-sach" },
};

const typeLabels = {
  program: "program",
  correction: "chỉnh sửa",
  upgrade: "upgrade",
  design: "design",
  source: "source",
  contract: "contract",
};

const alertTypeOptions = [
  { value: "all", label: "Tất cả loại" },
  { value: "program", label: "Lập trình" },
  { value: "correction", label: "Chỉnh sửa" },
  { value: "upgrade", label: "Nâng cấp" },
  { value: "design", label: "Design" },
  { value: "source", label: "Source" },
  { value: "contract", label: "Hợp đồng" },
];

const alertStatusOptions = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "overdue", label: "Quá hạn" },
  { value: "warning", label: "Sắp đến hạn" },
];

const monthlyRangeOptions = [
  { value: "first", label: "6 tháng đầu" },
  { value: "second", label: "6 tháng cuối" },
  { value: "all", label: "12 tháng" },
];

const projectStatusMonthOptions = [
  { value: "all", label: "Tất cả tháng" },
  ...Array.from({ length: 12 }, (_, index) => ({ value: String(index + 1), label: `Tháng ${index + 1}` })),
];

const buildProjectStatusYearOptions = () => {
  const currentYear = new Date().getFullYear();
  return [
    { value: "all", label: "Tất cả năm" },
    ...Array.from({ length: 6 }, (_, index) => {
      const year = currentYear - index;
      return { value: String(year), label: `Năm ${year}` };
    }),
  ];
};

const getDefaultMonthlyRange = () => {
  const currentMonth = new Date().getMonth() + 1;
  return currentMonth <= 6 ? "first" : "second";
};

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

const buildYearOptions = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, index) => currentYear - index);
};

const getCardHint = (card = {}) => {
  const overdue = Number(card.overdue || 0);
  const warning = Number(card.warning || 0);

  if (overdue <= 0 && warning <= 0) {
    return <span className="text-slate-400">Không có cảnh báo</span>;
  }

  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {overdue > 0 ? <span className="font-semibold text-rose-600">{overdue} quá hạn</span> : null}
      {warning > 0 ? <span className="font-semibold text-amber-600">{warning} sắp đến hạn</span> : null}
    </span>
  );
};

function Home() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState({
    cards: emptyCards,
    alerts: [],
    alertSummary: {},
    warningBeforeHours: 24,
    projectStatusSummary: { items: [], total: 0 },
    programWorkStatusSummary: {
      correction: { items: [], total: 0 },
      upgrade: { items: [], total: 0 },
    },
  });
  const [monthlyStats, setMonthlyStats] = useState({ items: [], types: [], totals: {} });
  const [isMonthlyLoading, setIsMonthlyLoading] = useState(false);
  const hasLoadedSummaryRef = useRef(false);
  const [alertTypeFilter, setAlertTypeFilter] = useState("all");
  const [alertStatusFilter, setAlertStatusFilter] = useState("all");
  const [alertPage, setAlertPage] = useState(1);
  const [alertLimit, setAlertLimit] = useState(5);
  const [monthlyYear, setMonthlyYear] = useState(new Date().getFullYear());
  const [monthlyRange, setMonthlyRange] = useState(getDefaultMonthlyRange);
  const [projectStatusMonth, setProjectStatusMonth] = useState("all");
  const [projectStatusYear, setProjectStatusYear] = useState("all");
  const [isProjectStatusLoading, setIsProjectStatusLoading] = useState(false);
  const [correctionStatusMonth, setCorrectionStatusMonth] = useState("all");
  const [correctionStatusYear, setCorrectionStatusYear] = useState("all");
  const [isCorrectionStatusLoading, setIsCorrectionStatusLoading] = useState(false);
  const [upgradeStatusMonth, setUpgradeStatusMonth] = useState("all");
  const [upgradeStatusYear, setUpgradeStatusYear] = useState("all");
  const [isUpgradeStatusLoading, setIsUpgradeStatusLoading] = useState(false);

  const cards = useMemo(() => ({ ...emptyCards, ...(summary.cards || {}) }), [summary.cards]);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    const shouldSyncMonthlyStats = !hasLoadedSummaryRef.current;

    try {
      const response = await dashboardApi.summary();
      setSummary({
        cards: { ...emptyCards, ...(response?.cards || {}) },
        alerts: Array.isArray(response?.alerts) ? response.alerts : [],
        alertSummary: response?.alertSummary || {},
        warningBeforeHours: response?.warningBeforeHours ?? 24,
        projectStatusSummary: response?.projectStatusSummary || { items: [], total: 0 },
        programWorkStatusSummary: response?.programWorkStatusSummary || {
          correction: { items: [], total: 0 },
          upgrade: { items: [], total: 0 },
        },
      });

      if (shouldSyncMonthlyStats) {
        setMonthlyStats(response?.monthlyStats || { items: [], types: [], totals: {} });
      }
      hasLoadedSummaryRef.current = true;
    } catch (error) {
      toast.error(error?.message || "Không thể tải dashboard tổng quan");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMonthlyStats = useCallback(async (year) => {
    setIsMonthlyLoading(true);
    try {
      const response = await dashboardApi.monthlyStats({ year });
      setMonthlyStats(response?.monthlyStats || { items: [], types: [], totals: {} });
    } catch (error) {
      toast.error(error?.message || "Không thể tải thống kê công việc theo tháng");
    } finally {
      setIsMonthlyLoading(false);
    }
  }, []);

  const fetchProjectStatusSummary = useCallback(async ({ month, year }) => {
    setIsProjectStatusLoading(true);
    try {
      const response = await dashboardApi.projectStatusSummary({ month, year });
      setSummary((current) => ({
        ...current,
        projectStatusSummary: response?.projectStatusSummary || { items: [], total: 0 },
      }));
    } catch (error) {
      toast.error(error?.message || "Không thể tải thống kê trạng thái dự án");
    } finally {
      setIsProjectStatusLoading(false);
    }
  }, []);

  const fetchCorrectionStatusSummary = useCallback(async ({ month, year }) => {
    setIsCorrectionStatusLoading(true);
    try {
      const response = await dashboardApi.programWorkStatusSummary({ month, year });
      const nextCorrectionSummary = response?.programWorkStatusSummary?.correction || { items: [], total: 0 };
      setSummary((current) => ({
        ...current,
        programWorkStatusSummary: {
          correction: nextCorrectionSummary,
          upgrade: current.programWorkStatusSummary?.upgrade || { items: [], total: 0 },
        },
      }));
    } catch (error) {
      toast.error(error?.message || "Không thể tải thống kê trạng thái chỉnh sửa");
    } finally {
      setIsCorrectionStatusLoading(false);
    }
  }, []);

  const fetchUpgradeStatusSummary = useCallback(async ({ month, year }) => {
    setIsUpgradeStatusLoading(true);
    try {
      const response = await dashboardApi.programWorkStatusSummary({ month, year });
      const nextUpgradeSummary = response?.programWorkStatusSummary?.upgrade || { items: [], total: 0 };
      setSummary((current) => ({
        ...current,
        programWorkStatusSummary: {
          correction: current.programWorkStatusSummary?.correction || { items: [], total: 0 },
          upgrade: nextUpgradeSummary,
        },
      }));
    } catch (error) {
      toast.error(error?.message || "Không thể tải thống kê trạng thái nâng cấp");
    } finally {
      setIsUpgradeStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    if (!hasLoadedSummaryRef.current) return;
    void fetchMonthlyStats(monthlyYear);
  }, [fetchMonthlyStats, monthlyYear]);


  useEffect(() => {
    if (!hasLoadedSummaryRef.current) return;
    void fetchProjectStatusSummary({ month: projectStatusMonth, year: projectStatusYear });
  }, [fetchProjectStatusSummary, projectStatusMonth, projectStatusYear]);

  useEffect(() => {
    if (!hasLoadedSummaryRef.current) return;
    void fetchCorrectionStatusSummary({ month: correctionStatusMonth, year: correctionStatusYear });
  }, [fetchCorrectionStatusSummary, correctionStatusMonth, correctionStatusYear]);

  useEffect(() => {
    if (!hasLoadedSummaryRef.current) return;
    void fetchUpgradeStatusSummary({ month: upgradeStatusMonth, year: upgradeStatusYear });
  }, [fetchUpgradeStatusSummary, upgradeStatusMonth, upgradeStatusYear]);

  const cardItems = [cards.program, cards.correction, cards.upgrade, cards.design, cards.source, cards.contract];
  const monthlyItems = Array.isArray(monthlyStats.items) ? monthlyStats.items : [];
  const monthlyTypes = Array.isArray(monthlyStats.types) ? monthlyStats.types : [];
  const projectStatusSummary = summary.projectStatusSummary || { items: [], total: 0 };
  const projectStatusItems = Array.isArray(projectStatusSummary.items) ? projectStatusSummary.items : [];
  const programWorkStatusSummary = summary.programWorkStatusSummary || {};
  const correctionStatusSummary = programWorkStatusSummary.correction || { items: [], total: 0 };
  const upgradeStatusSummary = programWorkStatusSummary.upgrade || { items: [], total: 0 };
  const correctionStatusItems = Array.isArray(correctionStatusSummary.items) ? correctionStatusSummary.items : [];
  const upgradeStatusItems = Array.isArray(upgradeStatusSummary.items) ? upgradeStatusSummary.items : [];
  const visibleMonthlyItems = useMemo(() => {
    if (monthlyRange === "first") return monthlyItems.slice(0, 6);
    if (monthlyRange === "second") return monthlyItems.slice(6, 12);
    return monthlyItems;
  }, [monthlyItems, monthlyRange]);
  const maxMonthlyTotal = Math.max(1, ...visibleMonthlyItems.map((item) => Number(item.total || 0)));
  const yearOptions = buildYearOptions();
  const projectStatusYearOptions = buildProjectStatusYearOptions();
  const totalOverdue = summary.alertSummary?.overdue || 0;
  const totalWarning = summary.alertSummary?.warning || 0;

  const filteredAlerts = useMemo(() => {
    return (summary.alerts || []).filter((item) => {
      const matchesType = alertTypeFilter === "all" || item.type === alertTypeFilter;
      const matchesStatus = alertStatusFilter === "all" || item.status === alertStatusFilter;
      return matchesType && matchesStatus;
    });
  }, [alertStatusFilter, alertTypeFilter, summary.alerts]);

  const pagedAlerts = useMemo(() => {
    const start = (alertPage - 1) * alertLimit;
    return filteredAlerts.slice(start, start + alertLimit);
  }, [alertLimit, alertPage, filteredAlerts]);

  useEffect(() => {
    setAlertPage(1);
  }, [alertLimit, alertStatusFilter, alertTypeFilter]);

  const handleAlertLimitChange = (nextLimit) => {
    setAlertLimit(nextLimit);
    setAlertPage(1);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-sky-600" />
              <h2 className="text-base font-semibold text-slate-700">Thống kê trạng thái dự án</h2>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Thống kê tổng số hợp đồng theo các trạng thái Chưa nhận, Đã nhận, Đang làm, Ưu tiên và Hoãn.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <select
              value={projectStatusMonth}
              onChange={(event) => setProjectStatusMonth(event.target.value)}
              disabled={isProjectStatusLoading}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              {projectStatusMonthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={projectStatusYear}
              onChange={(event) => setProjectStatusYear(event.target.value)}
              disabled={isProjectStatusLoading}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              {projectStatusYearOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
              Tổng {projectStatusSummary.total || 0}
            </span>
          </div>
        </div>

        {isProjectStatusLoading ? (
          <div className="mt-4 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700">
            Đang tải thống kê trạng thái dự án...
          </div>
        ) : null}

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {projectStatusItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => item.href && navigate(item.href)}
              className="group rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-sky-200 hover:bg-sky-50 hover:shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.label}</p>
              <p className={`mt-2 text-2xl font-semibold ${projectStatusTextColors[item.key] || "text-slate-700"}`}>
                {item.value || 0}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <SquarePen className="h-5 w-5 text-sky-600" />
                <h2 className="text-base font-semibold text-slate-700">Thống kê trạng thái chỉnh sửa</h2>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Thống kê yêu cầu chỉnh sửa theo 4 trạng thái của danh mục Trạng thái.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <select
                value={correctionStatusMonth}
                onChange={(event) => setCorrectionStatusMonth(event.target.value)}
                disabled={isCorrectionStatusLoading}
                className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                {projectStatusMonthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={correctionStatusYear}
                onChange={(event) => setCorrectionStatusYear(event.target.value)}
                disabled={isCorrectionStatusLoading}
                className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                {projectStatusYearOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
                Tổng {correctionStatusSummary.total || 0}
              </span>
            </div>
          </div>

          {isCorrectionStatusLoading ? (
            <div className="mt-4 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700">
              Đang tải thống kê trạng thái chỉnh sửa...
            </div>
          ) : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {correctionStatusItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => item.href && navigate(item.href)}
                className="group rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-sky-200 hover:bg-sky-50 hover:shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.label}</p>
                <p className={`mt-2 text-2xl font-semibold ${workStatusTextColors[item.key] || "text-slate-700"}`}>
                  {item.value || 0}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-sky-600" />
                <h2 className="text-base font-semibold text-slate-700">Thống kê trạng thái nâng cấp</h2>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Thống kê yêu cầu nâng cấp theo 4 trạng thái của danh mục Trạng thái.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <select
                value={upgradeStatusMonth}
                onChange={(event) => setUpgradeStatusMonth(event.target.value)}
                disabled={isUpgradeStatusLoading}
                className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                {projectStatusMonthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={upgradeStatusYear}
                onChange={(event) => setUpgradeStatusYear(event.target.value)}
                disabled={isUpgradeStatusLoading}
                className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                {projectStatusYearOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
                Tổng {upgradeStatusSummary.total || 0}
              </span>
            </div>
          </div>

          {isUpgradeStatusLoading ? (
            <div className="mt-4 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700">
              Đang tải thống kê trạng thái nâng cấp...
            </div>
          ) : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {upgradeStatusItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => item.href && navigate(item.href)}
                className="group rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-sky-200 hover:bg-sky-50 hover:shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.label}</p>
                <p className={`mt-2 text-2xl font-semibold ${workStatusTextColors[item.key] || "text-slate-700"}`}>
                  {item.value || 0}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-sky-600" />
              <h2 className="text-base font-semibold text-slate-700">Thống kê nhanh công việc cần xử lý</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Theo dõi nhanh công việc đang xử lý, source sắp hết hạn và hợp đồng chưa bàn giao.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
              Cảnh báo trước hạn {summary.warningBeforeHours || 0} giờ
            </span>
            <Button
              type="button"
              icon={RefreshCcw}
              variant="secondary"
              label={isLoading ? "Đang tải..." : "Tải lại"}
              disabled={isLoading}
              onClick={() => void fetchSummary()}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          {cardItems.map((card) => (
            <button
              key={card.label}
              type="button"
              onClick={() => card.href && navigate(card.href)}
              className="group rounded-lg border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-sky-200 hover:bg-sky-50"
            >
              <div className="flex items-center justify-between gap-2 text-sky-600">
                <FileText className="h-4 w-4" />
                <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-sky-600" />
              </div>
              <p className="mt-3 text-2xl font-semibold text-slate-800">{card.value || 0}</p>
              <p className="mt-1 min-h-10 text-sm font-semibold text-slate-600">{card.label}</p>
              <p className="mt-3 text-sm">{getCardHint(card)}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-tl-2xl rounded-tr-2xl bg-white shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border-t-3 border-slate-200 border-t-sky-500 px-4 py-3">
            <div>
              <h2 className="text-base font-semibold text-gray-500">Cảnh báo gần nhất</h2>
              <p className="mt-1 text-sm text-slate-400">Quá hạn được ưu tiên hiển thị trước.</p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {totalOverdue > 0 ? (
                <span className="rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-sm font-semibold text-rose-700">
                  <AlertTriangle className="mr-1 inline h-4 w-4" />
                  {totalOverdue} quá hạn
                </span>
              ) : null}
              {totalWarning > 0 ? (
                <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                  {totalWarning} sắp đến hạn
                </span>
              ) : null}
              <select
                value={alertTypeFilter}
                onChange={(event) => setAlertTypeFilter(event.target.value)}
                className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                {alertTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={alertStatusFilter}
                onChange={(event) => setAlertStatusFilter(event.target.value)}
                className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                {alertStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3 border-x border-b border-slate-200 p-4">
            {isLoading ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Đang tải cảnh báo...
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Không có cảnh báo phù hợp.
              </div>
            ) : (
              pagedAlerts.map((item, index) => (
                <button
                  key={`${item.type}-${item.title}-${item.deadline}-${index}`}
                  type="button"
                  onClick={() => item.href && navigate(item.href)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-sky-200 hover:bg-sky-50"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                        {typeLabels[item.type] || item.type}
                      </span>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${item.badgeClass || "border-slate-100 bg-slate-50 text-slate-600"}`}
                      >
                        {item.statusLabel}
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-sm font-medium text-slate-500">
                      <Clock3 className="h-4 w-4" />
                      {item.deadlineLabel || "-"}
                    </span>
                  </div>
                  <p className="mt-2 font-semibold text-slate-700">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                </button>
              ))
            )}
          </div>
          {!isLoading && filteredAlerts.length > 0 ? (
            <ManagementPagination
              page={alertPage}
              limit={alertLimit}
              total={filteredAlerts.length}
              onPageChange={setAlertPage}
              onLimitChange={handleAlertLimitChange}
              pageSizeOptions={[5, 10, 20]}
            />
          ) : null}
        </div>

        <div className="rounded-tl-2xl rounded-tr-2xl bg-white shadow-sm">
          <div className="rounded-2xl border-t-3 border-slate-200 border-t-sky-500 px-4 py-3">
            <h2 className="text-base font-semibold text-gray-500">Ghi chú SLA</h2>
          </div>
          <div className="space-y-3 border-x border-b border-slate-200 p-4 text-sm text-slate-500">
            <p>
              <span className="font-semibold text-slate-700">Sắp đến hạn</span> khi thời gian còn lại nhỏ hơn hoặc bằng
              cấu hình cảnh báo trước hạn.
            </p>
            <p>
              <span className="font-semibold text-slate-700">Quá hạn</span> khi đã vượt quá ngày dự kiến hoặc hạn hiệu
              lực link.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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
          <div className="min-w-[820px] divide-y divide-slate-100">
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
    </div>
  );
}

export default Home;

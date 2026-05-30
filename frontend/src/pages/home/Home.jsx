import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { dashboardApi } from "@/lib/api-client";
import { MonthlyStatsSection } from "./components/MonthlyStatsSection";
import { StatusSummarySection } from "./components/StatusSummarySection";
import { WorkAlertsSection } from "./components/WorkAlertsSection";

const emptyCards = {
  program: { label: "Lập trình đang xử lý", value: 0, warning: 0, overdue: 0, href: "/lap-trinh/danh-sach" },
  correction: { label: "Chỉnh sửa đang xử lý", value: 0, warning: 0, overdue: 0, href: "/lap-trinh/chinh-sua" },
  upgrade: { label: "Nâng cấp đang xử lý", value: 0, warning: 0, overdue: 0, href: "/lap-trinh/nang-cap" },
  design: { label: "Design đang xử lý", value: 0, warning: 0, overdue: 0, href: "/design/danh-sach" },
  source: { label: "Source hết hạn link", value: 0, warning: 0, overdue: 0, href: "/he-thong/source" },
  contract: { label: "Hợp đồng chưa bàn giao", value: 0, warning: 0, overdue: 0, href: "/kinh-doanh/danh-sach" },
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

const statusMonthOptions = [
  { value: "all", label: "Tất cả tháng" },
  ...Array.from({ length: 12 }, (_, index) => ({ value: String(index + 1), label: `Tháng ${index + 1}` })),
];

const buildStatusYearOptions = () => {
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

const buildYearOptions = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, index) => currentYear - index);
};

function Home() {
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

  const projectStatusSummary = summary.projectStatusSummary || { items: [], total: 0 };
  const projectStatusItems = Array.isArray(projectStatusSummary.items) ? projectStatusSummary.items : [];
  const programWorkStatusSummary = summary.programWorkStatusSummary || {};
  const correctionStatusSummary = programWorkStatusSummary.correction || { items: [], total: 0 };
  const upgradeStatusSummary = programWorkStatusSummary.upgrade || { items: [], total: 0 };
  const correctionStatusItems = Array.isArray(correctionStatusSummary.items) ? correctionStatusSummary.items : [];
  const upgradeStatusItems = Array.isArray(upgradeStatusSummary.items) ? upgradeStatusSummary.items : [];
  const monthlyItems = Array.isArray(monthlyStats.items) ? monthlyStats.items : [];
  const monthlyTypes = Array.isArray(monthlyStats.types) ? monthlyStats.types : [];
  const cardItems = [cards.program, cards.correction, cards.upgrade, cards.design, cards.source, cards.contract];
  const yearOptions = buildYearOptions();
  const statusYearOptions = buildStatusYearOptions();

  const handleAlertLimitChange = (nextLimit) => {
    setAlertLimit(nextLimit);
    setAlertPage(1);
  };

  return (
    <div className="space-y-5">
      <StatusSummarySection
        projectStatusSummary={projectStatusSummary}
        projectStatusItems={projectStatusItems}
        projectStatusMonth={projectStatusMonth}
        setProjectStatusMonth={setProjectStatusMonth}
        projectStatusYear={projectStatusYear}
        setProjectStatusYear={setProjectStatusYear}
        isProjectStatusLoading={isProjectStatusLoading}
        correctionStatusSummary={correctionStatusSummary}
        correctionStatusItems={correctionStatusItems}
        correctionStatusMonth={correctionStatusMonth}
        setCorrectionStatusMonth={setCorrectionStatusMonth}
        correctionStatusYear={correctionStatusYear}
        setCorrectionStatusYear={setCorrectionStatusYear}
        isCorrectionStatusLoading={isCorrectionStatusLoading}
        upgradeStatusSummary={upgradeStatusSummary}
        upgradeStatusItems={upgradeStatusItems}
        upgradeStatusMonth={upgradeStatusMonth}
        setUpgradeStatusMonth={setUpgradeStatusMonth}
        upgradeStatusYear={upgradeStatusYear}
        setUpgradeStatusYear={setUpgradeStatusYear}
        isUpgradeStatusLoading={isUpgradeStatusLoading}
        monthOptions={statusMonthOptions}
        yearOptions={statusYearOptions}
      />

      <WorkAlertsSection
        cardItems={cardItems}
        alerts={summary.alerts}
        alertSummary={summary.alertSummary}
        warningBeforeHours={summary.warningBeforeHours}
        isLoading={isLoading}
        onReload={() => void fetchSummary()}
        alertTypeFilter={alertTypeFilter}
        setAlertTypeFilter={setAlertTypeFilter}
        alertStatusFilter={alertStatusFilter}
        setAlertStatusFilter={setAlertStatusFilter}
        alertPage={alertPage}
        setAlertPage={setAlertPage}
        alertLimit={alertLimit}
        onAlertLimitChange={handleAlertLimitChange}
        alertTypeOptions={alertTypeOptions}
        alertStatusOptions={alertStatusOptions}
      />

      <MonthlyStatsSection
        monthlyStats={monthlyStats}
        monthlyTypes={monthlyTypes}
        monthlyItems={monthlyItems}
        monthlyRange={monthlyRange}
        setMonthlyRange={setMonthlyRange}
        monthlyRangeOptions={monthlyRangeOptions}
        monthlyYear={monthlyYear}
        setMonthlyYear={setMonthlyYear}
        yearOptions={yearOptions}
        isMonthlyLoading={isMonthlyLoading}
      />
    </div>
  );
}

export default Home;

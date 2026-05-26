import { AlertTriangle, ArrowRight, Clock3, FileText, RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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

const getCardHint = (card = {}) => {
  if (card.overdue > 0) return <span className="font-semibold text-rose-600">{card.overdue} quá hạn</span>;
  if (card.warning > 0) return <span className="font-semibold text-amber-600">{card.warning} sắp đến hạn</span>;
  return <span className="text-slate-400">Không có cảnh báo</span>;
};

function Home() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState({ cards: emptyCards, alerts: [], alertSummary: {}, warningBeforeHours: 24 });

  const cards = useMemo(() => ({ ...emptyCards, ...(summary.cards || {}) }), [summary.cards]);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await dashboardApi.summary();
      setSummary({
        cards: { ...emptyCards, ...(response?.cards || {}) },
        alerts: Array.isArray(response?.alerts) ? response.alerts : [],
        alertSummary: response?.alertSummary || {},
        warningBeforeHours: response?.warningBeforeHours ?? 24,
      });
    } catch (error) {
      toast.error(error?.message || "Không thể tải dashboard tổng quan");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  const cardItems = [cards.program, cards.correction, cards.upgrade, cards.design, cards.source, cards.contract];
  const totalOverdue = summary.alertSummary?.overdue || 0;
  const totalWarning = summary.alertSummary?.warning || 0;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-base font-semibold text-slate-700">Dashboard tổng quan</h1>
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
          <div className="flex items-center justify-between rounded-2xl border-t-3 border-slate-200 border-t-sky-500 px-4 py-3">
            <div>
              <h2 className="text-base font-semibold text-gray-500">Cảnh báo gần nhất</h2>
              <p className="mt-1 text-sm text-slate-400">Quá hạn được ưu tiên hiển thị trước.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
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
            </div>
          </div>

          <div className="space-y-3 border-x border-b border-slate-200 p-4">
            {isLoading ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">Đang tải cảnh báo...</div>
            ) : summary.alerts.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">Không có cảnh báo.</div>
            ) : (
              summary.alerts.map((item, index) => (
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
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${item.badgeClass || "border-slate-100 bg-slate-50 text-slate-600"}`}>
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
              <span className="font-semibold text-slate-700">Quá hạn</span> khi đã vượt quá ngày dự kiến hoặc hạn hiệu lực link.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;

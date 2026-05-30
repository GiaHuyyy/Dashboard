import { AlertTriangle, ArrowRight, CircleAlert, Clock3, FileText, RefreshCcw, Zap } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { ManagementPagination } from "@/components/management/ManagementPagination";
import { Button } from "@/components/ui/button-v2";

const typeLabels = {
  program: "program",
  correction: "chỉnh sửa",
  upgrade: "upgrade",
  design: "design",
  source: "source",
  contract: "contract",
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

export function WorkAlertsSection({
  cardItems,
  alerts,
  alertSummary,
  warningBeforeHours,
  isLoading,
  onReload,
  alertTypeFilter,
  setAlertTypeFilter,
  alertStatusFilter,
  setAlertStatusFilter,
  alertPage,
  setAlertPage,
  alertLimit,
  onAlertLimitChange,
  alertTypeOptions,
  alertStatusOptions,
}) {
  const navigate = useNavigate();
  const totalOverdue = alertSummary?.overdue || 0;
  const totalWarning = alertSummary?.warning || 0;

  const filteredAlerts = useMemo(() => {
    return (alerts || []).filter((item) => {
      const matchesType = alertTypeFilter === "all" || item.type === alertTypeFilter;
      const matchesStatus = alertStatusFilter === "all" || item.status === alertStatusFilter;
      return matchesType && matchesStatus;
    });
  }, [alertStatusFilter, alertTypeFilter, alerts]);

  const pagedAlerts = useMemo(() => {
    const start = (alertPage - 1) * alertLimit;
    return filteredAlerts.slice(start, start + alertLimit);
  }, [alertLimit, alertPage, filteredAlerts]);

  useEffect(() => {
    setAlertPage(1);
  }, [alertLimit, alertStatusFilter, alertTypeFilter, setAlertPage]);

  return (
    <>
      <div className="rounded-2xl border-t-sky-500 border-t-3 bg-white p-4 shadow-sm">
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
              Cảnh báo trước hạn {warningBeforeHours || 0} giờ
            </span>
            <Button
              type="button"
              icon={RefreshCcw}
              variant="secondary"
              label={isLoading ? "Đang tải..." : "Tải lại"}
              disabled={isLoading}
              onClick={onReload}
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

      <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-tl-2xl rounded-tr-2xl bg-white shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border-t-3 border-t-sky-500 px-4 py-3">
            <div>
              <h2 className="text-base font-semibold text-gray-500">Cảnh báo gần nhất</h2>
              <p className="mt-1 text-sm text-slate-400">Quá hạn được ưu tiên hiển thị trước.</p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {totalOverdue > 0 ? (
                <span className="rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-sm font-semibold text-rose-700">
                  <AlertTriangle className="mr-1 mb-0.5 inline h-4 w-4" />
                  {totalOverdue} quá hạn
                </span>
              ) : null}
              {totalWarning > 0 ? (
                <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                  <CircleAlert className="mr-1 mb-0.5 inline h-4 w-4" />
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
              onLimitChange={onAlertLimitChange}
              pageSizeOptions={[5, 10, 20]}
            />
          ) : null}
        </div>

        <div className="rounded-tl-2xl rounded-tr-2xl bg-white shadow-sm">
          <div className="rounded-2xl border-t-3 border-slate-200 border-t-sky-500 px-4 py-3">
            <h2 className="text-base font-semibold text-gray-500">Ghi chú SLA</h2>
          </div>
          <div className="space-y-3 p-4 text-sm text-slate-500">
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
    </>
  );
}

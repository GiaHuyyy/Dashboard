import { AlertTriangle, ArrowRight, Clock3, FileText, RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button-v2";
import { dashboardApi } from "@/lib/api-client";

const statusClassMap = {
  overdue: "border-rose-100 bg-rose-50 text-rose-700",
  upcoming: "border-amber-100 bg-amber-50 text-amber-700",
  pending: "border-sky-100 bg-sky-50 text-sky-700",
};

const statusLabelMap = {
  overdue: "Quá hạn",
  upcoming: "Sắp đến hạn",
  pending: "Chưa xử lý",
};

function Home() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await dashboardApi.summary();
      setData(response);
    } catch (error) {
      toast.error(error?.message || "Không thể tải dữ liệu dashboard");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  const totalOverdue = useMemo(
    () => (data?.summaryCards || []).reduce((sum, item) => sum + Number(item.dangerValue || 0), 0),
    [data?.summaryCards],
  );

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
        Đang tải dashboard tổng quan...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-base font-semibold text-slate-700">Dashboard tổng quan</p>
            <p className="mt-1 text-sm text-slate-500">
              Theo dõi nhanh công việc đang xử lý, source hết hạn và hợp đồng chưa bàn giao.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
              Cảnh báo trước hạn {data?.warningBeforeDeadlineHours || 24} giờ
            </div>
            <Button icon={RefreshCcw} variant="secondary" label="Tải lại" onClick={() => void fetchSummary()} />
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {(data?.summaryCards || []).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => navigate(item.path)}
              className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-sky-300 hover:bg-sky-50"
            >
              <div className="flex items-center justify-between gap-2">
                <FileText className="h-4 w-4 text-sky-600" />
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </div>
              <p className="mt-3 text-2xl font-semibold text-slate-800">{item.value || 0}</p>
              <p className="mt-1 min-h-10 text-sm font-medium text-slate-600">{item.label}</p>
              {item.dangerValue ? (
                <p className="mt-2 text-xs font-semibold text-rose-600">{item.dangerValue} quá hạn</p>
              ) : item.subValue ? (
                <p className="mt-2 text-xs font-semibold text-amber-600">{item.subValue}</p>
              ) : (
                <p className="mt-2 text-xs text-slate-400">Không có cảnh báo</p>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="rounded-tl-2xl rounded-tr-2xl bg-white shadow-sm">
          <div className="flex items-center justify-between rounded-2xl border-t-3 border-slate-200 border-t-sky-500 px-4 py-3">
            <div>
              <h2 className="text-base font-semibold text-gray-500">Cảnh báo cần xử lý</h2>
              <p className="mt-1 text-sm text-slate-500">Các công việc quá hạn, sắp đến hạn và hợp đồng chưa bàn giao.</p>
            </div>
            <div className="rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
              {totalOverdue} quá hạn
            </div>
          </div>
          <div className="border-x border-b border-slate-200 p-4">
            {(data?.alerts || []).length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                Chưa có cảnh báo cần xử lý.
              </div>
            ) : (
              <div className="space-y-3">
                {data.alerts.map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    type="button"
                    onClick={() => navigate(item.path)}
                    className="flex w-full items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-sky-300 hover:bg-sky-50"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                            statusClassMap[item.status] || "border-slate-200 bg-slate-50 text-slate-600"
                          }`}
                        >
                          {statusLabelMap[item.status] || item.status}
                        </span>
                        <span className="text-xs font-semibold uppercase text-slate-400">{item.type}</span>
                      </div>
                      <p className="mt-2 truncate text-sm font-semibold text-slate-700">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                    </div>
                    <div className="shrink-0 text-right text-xs text-slate-500">
                      <Clock3 className="ml-auto h-4 w-4 text-slate-400" />
                      <p className="mt-1 whitespace-nowrap">{item.dateLabel || "-"}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-tl-2xl rounded-tr-2xl bg-white shadow-sm">
          <div className="rounded-2xl border-t-3 border-slate-200 border-t-amber-500 px-4 py-3">
            <h2 className="text-base font-semibold text-gray-500">Gợi ý kiểm tra</h2>
          </div>
          <div className="space-y-3 border-x border-b border-slate-200 p-4 text-sm text-slate-600">
            <div className="flex gap-2 rounded-lg border border-amber-100 bg-amber-50 p-3 text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>Ưu tiên xử lý các dòng có nhãn Quá hạn trước khi cập nhật các việc sắp đến hạn.</p>
            </div>
            <p>Source hết hạn link nên được cập nhật hạn hiệu lực hoặc gửi lại link mới nếu khách chưa tải.</p>
            <p>Hợp đồng chưa bàn giao nên được kiểm tra lại trước khi chốt trạng thái bàn giao.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;

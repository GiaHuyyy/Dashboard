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
      toast.error(error?.message || "Không thể tải dashboard tổng quan");
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
              Theo dõi nhanh công việc đang xử lý, source sắp hết hạn và hợp đồng chưa bàn giao.
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
              <h2 className="text-base font-semibold text-gray-500">Cảnh báo gần nhất</h2>
              <p className="mt-1 text-sm text-slate-400">Quá hạn được ưu tiên hiển thị trước.</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">
              <AlertTriangle className="h-4 w-4" />
              {totalOverdue} quá hạn
            </div>
          </div>

          <div className="border-x border-b border-slate-200 p-4">
            {(data?.alerts || []).length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                Chưa có cảnh báo quá hạn hoặc sắp đến hạn.
              </div>
            ) : (
              <div className="space-y-3">
                {(data?.alerts || []).map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    type="button"
                    onClick={() => navigate(item.path)}
                    className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-sky-300 hover:bg-sky-50"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-600">
                            {item.type}
                          </span>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                              statusClassMap[item.status] || statusClassMap.pending
                            }`}
                          >
                            {statusLabelMap[item.status] || item.status}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-slate-700">{item.title}</p>
                        {item.subtitle ? <p className="mt-1 text-xs text-slate-500">{item.subtitle}</p> : null}
                        <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
                        <Clock3 className="h-4 w-4" />
                        {item.dateLabel || "-"}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-700">Logic cảnh báo</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-500">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="font-semibold text-slate-700">Program / Chỉnh sửa / Nâng cấp / Design</p>
              <p className="mt-1">Dựa vào ngày dự kiến. Đã hoàn thành thì không cảnh báo.</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="font-semibold text-slate-700">Source</p>
              <p className="mt-1">Dựa vào hạn hiệu lực link, chỉ cảnh báo source đã gửi nhưng chưa xác nhận tải.</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="font-semibold text-slate-700">Hợp đồng</p>
              <p className="mt-1">Dựa vào ngày dự kiến bàn giao. Đã bàn giao thì không cảnh báo.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;

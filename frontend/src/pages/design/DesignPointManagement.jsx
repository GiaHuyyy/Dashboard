import { Download, Lock, LockOpen } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { ManagementPagination } from "@/components/management/ManagementPagination";
import { ManagementTableCard } from "@/components/management/ManagementTableCard";
import { Button } from "@/components/ui/button-v2";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { designPointApi } from "@/lib/api-client";

const MONTH_OPTIONS = ["Tất cả", ...Array.from({ length: 12 }, (_, index) => `Tháng ${index + 1}`)];
const YEAR_OPTIONS = ["Tất cả", "2026", "2025", "2024"];
const STATUS_OPTIONS = ["Tất cả", "Đã nhận", "Đang xử lý", "Hoàn thành"];

const normalizeSearchValue = (value) => String(value ?? "").toLowerCase();

const toCsvRow = (values) =>
  values
    .map((value) => {
      const normalized = String(value ?? "");
      if (normalized.includes(",") || normalized.includes('"') || normalized.includes("\n")) {
        return `"${normalized.replace(/"/g, '""')}"`;
      }
      return normalized;
    })
    .join(",");

function DesignPointManagement() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({
    totalConvertPoint: 0,
    totalBonusPoint: 0,
    totalPoint: 0,
  });
  const [ownerRows, setOwnerRows] = useState([]);
  const [detailRows, setDetailRows] = useState([]);
  const [assigneeOptions, setAssigneeOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssignee, setSelectedAssignee] = useState("Tất cả");
  const [selectedMonth, setSelectedMonth] = useState("Tất cả");
  const [selectedYear, setSelectedYear] = useState("Tất cả");
  const [selectedStatus, setSelectedStatus] = useState("Tất cả");
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebouncedValue(searchText, 300);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const fetchPoints = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await designPointApi.list({
        assignee: selectedAssignee === "Tất cả" ? "all" : selectedAssignee,
        month: selectedMonth === "Tất cả" ? "all" : Number(selectedMonth.split(" ")[1]),
        year: selectedYear === "Tất cả" ? "all" : Number(selectedYear),
        status: selectedStatus === "Tất cả" ? "all" : selectedStatus,
      });
      setSummary(response?.summary || {});
      setOwnerRows(Array.isArray(response?.owners) ? response.owners : []);
      setDetailRows(Array.isArray(response?.details) ? response.details : []);
      setAssigneeOptions(Array.isArray(response?.assigneeOptions) ? response.assigneeOptions : []);
    } catch (error) {
      toast.error(error?.message || "Không thể tải dữ liệu quản lý điểm design");
    } finally {
      setIsLoading(false);
    }
  }, [selectedAssignee, selectedMonth, selectedYear, selectedStatus]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchPoints();
  }, [fetchPoints]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchText, selectedAssignee, selectedMonth, selectedYear, selectedStatus]);

  const fullAssigneeOptions = useMemo(() => ["Tất cả", ...assigneeOptions], [assigneeOptions]);

  const filteredDetailRows = useMemo(() => {
    const keyword = debouncedSearchText.trim().toLowerCase();
    if (!keyword) return detailRows;

    return detailRows.filter((item) => {
      const searchable = [
        item.title,
        item.designType,
        item.priority,
        item.status,
        item.assigner,
        item.assignee,
        item.convertPoint,
        item.bonusPoint,
        item.totalPoint,
        item.createdAtLabel,
      ]
        .map(normalizeSearchValue)
        .join(" ");
      return searchable.includes(keyword);
    });
  }, [debouncedSearchText, detailRows]);

  const paginatedDetailRows = useMemo(() => {
    const startIndex = (page - 1) * limit;
    return filteredDetailRows.slice(startIndex, startIndex + limit);
  }, [filteredDetailRows, limit, page]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredDetailRows.length / limit));
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [filteredDetailRows.length, limit, page]);

  const handleLimitChange = (nextLimit) => {
    setLimit(nextLimit);
    setPage(1);
  };

  const exportCsv = () => {
    if (filteredDetailRows.length === 0) {
      toast.error("Không có dữ liệu để xuất");
      return;
    }
    const header = [
      "Hạng mục",
      "Loại design",
      "Mức độ ưu tiên",
      "Trạng thái",
      "Người giao (Quản lý)",
      "Người nhận",
      "Quy đổi",
      "Điểm thêm",
      "Tổng điểm",
      "Ngày",
    ];
    const rows = filteredDetailRows.map((item) => [
      item.title,
      item.designType,
      item.priority,
      item.status,
      item.assigner,
      item.assignee,
      item.convertPoint,
      item.bonusPoint,
      item.totalPoint,
      item.createdAtLabel,
    ]);
    const csv = [toCsvRow(header), ...rows.map(toCsvRow)].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `quan-ly-diem-design-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <Button icon={Lock} label="Chốt kỳ" variant="primary" onClick={() => toast.success("Đã chốt kỳ")} />
        <Button
          icon={LockOpen}
          label="Mở khóa kỳ"
          variant="secondary"
          onClick={() => toast.success("Đã mở khóa kỳ")}
        />
        <Button icon={Download} label="Xuất file" variant="success" onClick={exportCsv} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select
          className="w-56 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          value={selectedAssignee}
          onChange={(event) => setSelectedAssignee(event.target.value)}
        >
          {fullAssigneeOptions.map((option) => (
            <option key={option} value={option}>
              {option === "Tất cả" ? "Chọn người nhận" : option}
            </option>
          ))}
        </select>

        <select
          className="w-48 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          value={selectedMonth}
          onChange={(event) => setSelectedMonth(event.target.value)}
        >
          {MONTH_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === "Tất cả" ? "Chọn tháng" : option}
            </option>
          ))}
        </select>

        <select
          className="w-48 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          value={selectedYear}
          onChange={(event) => setSelectedYear(event.target.value)}
        >
          {YEAR_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === "Tất cả" ? "Chọn năm" : option}
            </option>
          ))}
        </select>

        <select
          className="w-48 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          value={selectedStatus}
          onChange={(event) => setSelectedStatus(event.target.value)}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-t-3 border-t-sky-500 border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Điểm quy đổi</p>
          <p className="text-2xl font-semibold text-slate-800">{summary.totalConvertPoint ?? 0}</p>
        </div>
        <div className="rounded-xl border border-t-3 border-t-sky-500 border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Điểm cộng thêm</p>
          <p className="text-2xl font-semibold text-slate-800">{summary.totalBonusPoint ?? 0}</p>
        </div>
        <div className="rounded-xl border border-t-3 border-t-sky-500 border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Tổng điểm</p>
          <p className="text-2xl font-semibold text-sky-700">{summary.totalPoint ?? 0}</p>
        </div>
      </div>

      <div className="mt-6 rounded-tl-2xl rounded-tr-2xl border-t-3 border-t-sky-500 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-600">Tổng quan theo nhân sự design</h2>
        </div>
        <Table className="min-w-full text-center text-sm">
          <TableHeader className="bg-slate-50 text-slate-500">
            <TableRow>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Nhân sự
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Điểm quy đổi
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Điểm thêm
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Tổng điểm
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="border border-slate-200 p-4 py-8 text-slate-500">
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : ownerRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="border border-slate-200 p-4 py-8 text-slate-500">
                  Chưa có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              ownerRows.map((row) => (
                <TableRow key={row.assignee} className="text-slate-700">
                  <TableCell className="border border-slate-200 p-4 text-left">{row.assignee}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.convertPoint}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.bonusPoint}</TableCell>
                  <TableCell className="border border-slate-200 p-4 font-semibold text-sky-700">
                    {row.totalPoint}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ManagementTableCard
        searchText={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm hạng mục, loại design"
      >
        <Table className="min-w-full text-center text-sm">
          <TableHeader className="bg-slate-50 text-slate-500">
            <TableRow>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                STT
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Hạng mục
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Loại
              </TableHead>
              <TableHead className="border border-slate-200 p-4 px-7 text-center font-semibold text-slate-500">
                Ưu tiên
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Trạng thái
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Người giao (Quản lý)
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Người nhận
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Quy đổi
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Điểm thêm
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Tổng điểm
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Ngày
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={11} className="border border-slate-200 p-4 py-8 text-slate-500">
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : filteredDetailRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="border border-slate-200 p-4 py-8 text-slate-500">
                  Chưa có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              paginatedDetailRows.map((row, index) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer text-slate-700 hover:bg-sky-50"
                  title="Bấm để mở phiếu design"
                  onClick={() => navigate(`/design/chinh-sua/${row.id}`)}
                >
                  <TableCell className="border border-slate-200 p-4">
                    <span className="border px-3 py-1.5">{(page - 1) * limit + index + 1}</span>
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4 text-left font-semibold text-sky-700">
                    {row.title}
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.designType}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.priority}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.status}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.assigner}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.assignee}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.convertPoint}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.bonusPoint}</TableCell>
                  <TableCell className="border border-slate-200 p-4 font-semibold text-sky-700">
                    {row.totalPoint}
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.createdAtLabel}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <ManagementPagination
          page={page}
          limit={limit}
          total={filteredDetailRows.length}
          onPageChange={setPage}
          onLimitChange={handleLimitChange}
          disabled={isLoading}
        />
      </ManagementTableCard>
    </>
  );
}

export default DesignPointManagement;

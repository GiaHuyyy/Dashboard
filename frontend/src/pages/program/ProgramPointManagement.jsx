import { Download, Lock, LockOpen } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ManagementTableCard } from "@/components/program/ManagementTableCard";
import { pointApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button-v2";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const MONTH_OPTIONS = ["Tất cả", ...Array.from({ length: 12 }, (_, index) => `Tháng ${index + 1}`)];
const YEAR_OPTIONS = ["Tất cả", "2026", "2025", "2024"];

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

function ProgramPointManagement() {
  const [summary, setSummary] = useState({
    totalProgramPoint: 0,
    totalUpgradePoint: 0,
    totalPoint: 0,
    totalCorrectionPoint: 0,
  });
  const [ownerRows, setOwnerRows] = useState([]);
  const [detailRows, setDetailRows] = useState([]);
  const [assigneeOptions, setAssigneeOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssignee, setSelectedAssignee] = useState("Tất cả");
  const [selectedMonth, setSelectedMonth] = useState("Tất cả");
  const [selectedYear, setSelectedYear] = useState("Tất cả");
  const [searchText, setSearchText] = useState("");

  const fetchPoints = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await pointApi.list({
        assignee: selectedAssignee === "Tất cả" ? "all" : selectedAssignee,
        month: selectedMonth === "Tất cả" ? "all" : Number(selectedMonth.split(" ")[1]),
        year: selectedYear === "Tất cả" ? "all" : Number(selectedYear),
        search: searchText.trim(),
      });
      setSummary(response?.summary || {});
      setOwnerRows(Array.isArray(response?.owners) ? response.owners : []);
      setDetailRows(Array.isArray(response?.details) ? response.details : []);
      setAssigneeOptions(Array.isArray(response?.assigneeOptions) ? response.assigneeOptions : []);
    } catch (error) {
      toast.error(error?.message || "Không thể tải dữ liệu quản lý điểm");
    } finally {
      setIsLoading(false);
    }
  }, [searchText, selectedAssignee, selectedMonth, selectedYear]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchPoints();
  }, [fetchPoints]);

  const fullAssigneeOptions = useMemo(() => ["Tất cả", ...assigneeOptions], [assigneeOptions]);

  const exportCsv = () => {
    if (detailRows.length === 0) {
      toast.error("Không có dữ liệu để xuất");
      return;
    }
    const header = [
      "Nguồn điểm",
      "Phiếu gốc (HĐ)",
      "Module",
      "Mô tả",
      "Trạng thái",
      "Lập trình",
      "Điểm quy đổi",
      "Điểm cộng thêm",
      "Tổng điểm",
      "Ngày",
    ];
    const rows = detailRows.map((item) => [
      item.source,
      item.contractCode,
      item.module,
      item.description,
      item.status,
      item.assignee,
      item.convertPoint ?? "",
      item.bonusPoint ?? "",
      item.point,
      item.createdAtLabel,
    ]);
    const csv = [toCsvRow(header), ...rows.map(toCsvRow)].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `quan-ly-diem-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <Button icon={Lock} label="Chốt kỳ" variant="primary" onClick={() => toast.success("Đã chốt kỳ (UI flow)")} />
        <Button
          icon={LockOpen}
          label="Mở khóa kỳ"
          variant="secondary"
          onClick={() => toast.success("Đã mở khóa kỳ (UI flow)")}
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
              {option === "Tất cả" ? "Chọn lập trình" : option}
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
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Điểm lập trình</p>
          <p className="text-2xl font-semibold text-slate-800">{summary.totalProgramPoint ?? 0}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Điểm nâng cấp</p>
          <p className="text-2xl font-semibold text-slate-800">{summary.totalUpgradePoint ?? 0}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Tổng điểm</p>
          <p className="text-2xl font-semibold text-sky-700">{summary.totalPoint ?? 0}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Điểm chỉnh sửa</p>
          <p className="text-2xl font-semibold text-amber-700">{summary.totalCorrectionPoint ?? 0}</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-600">Tổng quan theo lập trình viên</h2>
        </div>
        <Table className="min-w-full text-center text-sm">
          <TableHeader className="bg-slate-50 text-slate-500">
            <TableRow>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Lập trình
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Điểm lập trình
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Điểm nâng cấp
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Điểm chỉnh sửa
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Tổng điểm
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="border border-slate-200 p-4 py-8 text-slate-500">
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : ownerRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="border border-slate-200 p-4 py-8 text-slate-500">
                  Chưa có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              ownerRows.map((row) => (
                <TableRow key={row.assignee} className="text-slate-700">
                  <TableCell className="border border-slate-200 p-4 text-left">{row.assignee}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.programPoint}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.upgradePoint}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.correctionPoint}</TableCell>
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
        searchPlaceholder="Tìm phiếu gốc, mô tả"
      >
        <Table className="min-w-full text-center text-sm">
          <TableHeader className="bg-slate-50 text-slate-500">
            <TableRow>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                STT
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Nguồn điểm
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Phiếu gốc (HĐ)
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Module
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Mô tả
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Trạng thái
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Lập trình
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Điểm quy đổi
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Điểm cộng thêm
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
            ) : detailRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="border border-slate-200 p-4 py-8 text-slate-500">
                  Chưa có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              detailRows.map((row, index) => (
                <TableRow key={`${row.source}-${row.id}`} className="text-slate-700">
                  <TableCell className="border border-slate-200 p-4">
                    <span className="border px-3 py-1.5">{index + 1}</span>
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.source}</TableCell>
                  <TableCell className="border border-slate-200 p-4 font-semibold text-sky-700">
                    {row.contractCode}
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4 text-left">{row.module}</TableCell>
                  <TableCell className="border border-slate-200 p-4 text-left">{row.description}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.status}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.assignee}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.convertPoint ?? 0}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.bonusPoint ?? 0}</TableCell>
                  <TableCell className="border border-slate-200 p-4 font-semibold text-sky-700">{row.point}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.createdAtLabel}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ManagementTableCard>
    </>
  );
}

export default ProgramPointManagement;

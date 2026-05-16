import { SquarePen, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { ManagementActions } from "@/components/program/ManagementActions";
import { ManagementTableCard } from "@/components/program/ManagementTableCard";
import { CORRECTION_STAFF_OPTIONS, CORRECTION_STATUS_OPTIONS } from "@/constants/program-correction";
import { correctionApi } from "@/lib/api-client";
import Modal from "@/components/ui/modal";
import { Button } from "@/components/ui/button-v2";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const PRIORITY_COLORS = {
  Thấp: "text-slate-600",
  "Trung bình": "text-sky-700",
  Cao: "text-amber-700",
  Khẩn: "text-rose-700",
};

const MONTH_OPTIONS = ["Tất cả", ...Array.from({ length: 12 }, (_, index) => `Tháng ${index + 1}`)];
const YEAR_OPTIONS = ["Tất cả", "2026", "2025", "2024"];
const PROGRAMMER_OPTIONS = ["Tất cả", ...CORRECTION_STAFF_OPTIONS];

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

function ProgramEditManagement() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProgrammer, setSelectedProgrammer] = useState("Tất cả");
  const [selectedMonth, setSelectedMonth] = useState("Tất cả");
  const [selectedYear, setSelectedYear] = useState("Tất cả");
  const [searchText, setSearchText] = useState("");
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState(null);

  const fetchCorrections = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await correctionApi.list({
        assignee: selectedProgrammer === "Tất cả" ? "all" : selectedProgrammer,
        month: selectedMonth === "Tất cả" ? "all" : Number(selectedMonth.split(" ")[1]),
        year: selectedYear === "Tất cả" ? "all" : Number(selectedYear),
        search: searchText.trim(),
        limit: 200,
      });
      setRows(Array.isArray(response?.corrections) ? response.corrections : []);
    } catch (error) {
      toast.error(error?.message || "Không thể tải danh sách chỉnh sửa");
    } finally {
      setIsLoading(false);
    }
  }, [searchText, selectedMonth, selectedProgrammer, selectedYear]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchCorrections();
  }, [fetchCorrections]);

  const openCreateForm = () => {
    navigate("/lap-trinh/quan-ly-chinh-sua/them-moi");
  };

  const openEditForm = (row) => {
    navigate(`/lap-trinh/quan-ly-chinh-sua/${row.id}`);
  };

  const deleteManyLabel = "Xóa tất cả";
  const displayedRows = useMemo(() => rows, [rows]);

  const handleInlineUpdate = async (rowId, patch) => {
    const target = rows.find((item) => item.id === rowId);
    if (!target) return;
    const payload = {
      programId: target.programId,
      issueContent: target.issueContent,
      priority: target.priority,
      assigner: target.assigner,
      assignee: target.assignee,
      assignedAt: target.assignedAt,
      receivedAt: target.receivedAt || null,
      dueAt: target.dueAt,
      completedAt: target.completedAt || null,
      status: target.status,
      visible: target.visible,
      note: target.note || "",
      ...patch,
    };

    try {
      const response = await correctionApi.update(rowId, payload);
      const updated = response?.correction;
      if (!updated) return;
      setRows((prev) => prev.map((item) => (item.id === rowId ? updated : item)));
    } catch (error) {
      toast.error(error?.message || "Cập nhật không thành công");
    }
  };

  const handleDeleteRow = async (rowId) => {
    try {
      await correctionApi.remove(rowId);
      setRows((prev) => prev.filter((item) => item.id !== rowId));
      toast.success("Đã xóa yêu cầu chỉnh sửa");
    } catch (error) {
      toast.error(error?.message || "Xóa dữ liệu không thành công");
    }
  };

  const handleDeleteAll = async () => {
    try {
      const response = await correctionApi.removeMany([]);
      setRows([]);
      setDeleteAllOpen(false);
      toast.success(`Đã xóa toàn bộ (${response?.deletedCount || 0}) yêu cầu chỉnh sửa`);
    } catch (error) {
      toast.error(error?.message || "Xóa dữ liệu không thành công");
    }
  };

  return (
    <>
      <ManagementActions
        onAdd={openCreateForm}
        onDeleteAll={() => setDeleteAllOpen(true)}
        deleteDisabled={rows.length === 0}
        deleteLabel={deleteManyLabel}
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select
          className="w-56 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          value={selectedProgrammer}
          onChange={(event) => setSelectedProgrammer(event.target.value)}
        >
          {PROGRAMMER_OPTIONS.map((option) => (
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

      <ManagementTableCard searchText={searchText} onSearchChange={setSearchText} searchPlaceholder="Tìm số HĐ, module, mô tả">
        <Table className="min-w-full text-center text-sm">
          <TableHeader className="bg-slate-50 text-slate-500">
            <TableRow>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">Số HĐ</TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">Module</TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">Mức độ</TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">Trạng thái</TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">Người giao</TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Chuyển lập trình
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">Ngày giao</TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">Ngày nhận</TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">Ngày dự kiến</TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Ngày hoàn thành
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">Hiển thị</TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={12} className="border border-slate-200 p-4 py-8 text-slate-500">
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : displayedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="border border-slate-200 p-4 py-8 text-slate-500">
                  Chưa có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              displayedRows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer text-slate-700 hover:bg-slate-50"
                  onClick={() => openEditForm(row)}
                >
                  <TableCell className="border border-slate-200 p-4 font-semibold text-sky-700">{row.contractCode}</TableCell>
                  <TableCell className="border border-slate-200 p-4 text-left">{row.module}</TableCell>
                  <TableCell className={`border border-slate-200 p-4 font-semibold ${PRIORITY_COLORS[row.priority] || "text-slate-700"}`}>
                    {row.priority}
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4" onClick={(event) => event.stopPropagation()}>
                    <select
                      className="w-full rounded border border-slate-200 px-2 py-1.5"
                      value={row.status}
                      onChange={(event) => void handleInlineUpdate(row.id, { status: event.target.value })}
                    >
                      {CORRECTION_STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4 text-left">{row.assigner}</TableCell>
                  <TableCell className="border border-slate-200 p-4" onClick={(event) => event.stopPropagation()}>
                    <select
                      className="w-full rounded border border-slate-200 px-2 py-1.5"
                      value={row.assignee}
                      onChange={(event) => void handleInlineUpdate(row.id, { assignee: event.target.value })}
                    >
                      {CORRECTION_STAFF_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4 text-slate-500">{formatDateTime(row.assignedAt)}</TableCell>
                  <TableCell className="border border-slate-200 p-4 text-slate-500">{formatDateTime(row.receivedAt)}</TableCell>
                  <TableCell className="border border-slate-200 p-4 text-slate-500">{formatDateTime(row.dueAt)}</TableCell>
                  <TableCell className="border border-slate-200 p-4 text-slate-500">{formatDateTime(row.completedAt)}</TableCell>
                  <TableCell className="border border-slate-200 p-4 text-center" onClick={(event) => event.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={row.visible}
                      onChange={(event) => void handleInlineUpdate(row.id, { visible: event.target.checked })}
                    />
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        icon={SquarePen}
                        onClick={(event) => {
                          event.stopPropagation();
                          openEditForm(row);
                        }}
                        variant="primary-outline"
                        iconOnly
                        className="text-sky-500"
                      />
                      <Button
                        icon={Trash2}
                        onClick={(event) => {
                          event.stopPropagation();
                          setDeleteRow(row);
                        }}
                        variant="danger-outline"
                        iconOnly
                        className="text-rose-700"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ManagementTableCard>

      <Modal
        open={deleteAllOpen}
        onClose={() => setDeleteAllOpen(false)}
        title="Xác nhận xóa"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={() => setDeleteAllOpen(false)} className="rounded-md border px-4 py-2 text-sm">
              Hủy
            </button>
            <button type="button" onClick={() => void handleDeleteAll()} className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white">
              Xóa
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">Bạn có chắc muốn xóa toàn bộ danh sách chỉnh sửa?</p>
      </Modal>

      <Modal
        open={Boolean(deleteRow)}
        onClose={() => setDeleteRow(null)}
        title="Xác nhận xóa"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={() => setDeleteRow(null)} className="rounded-md border px-4 py-2 text-sm">
              Hủy
            </button>
            <button
              type="button"
              onClick={() => {
                if (deleteRow?.id) {
                  void handleDeleteRow(deleteRow.id);
                }
                setDeleteRow(null);
              }}
              className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Xóa
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          Bạn có chắc muốn xóa mục
          <span className="font-semibold text-slate-800"> {deleteRow?.contractCode}</span>?
        </p>
      </Modal>
    </>
  );
}

export default ProgramEditManagement;

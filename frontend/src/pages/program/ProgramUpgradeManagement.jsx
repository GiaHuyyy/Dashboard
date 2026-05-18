import { SquarePen, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { ManagementActions } from "@/components/program/ManagementActions";
import { ManagementTableCard } from "@/components/program/ManagementTableCard";
import { UPGRADE_STAFF_OPTIONS, UPGRADE_STATUS_OPTIONS } from "@/constants/program-upgrade";
import { upgradeApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button-v2";
import Modal from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const PRIORITY_COLORS = {
  Thấp: "text-slate-600",
  "Trung bình": "text-sky-700",
  Cao: "text-amber-700",
  Khẩn: "text-rose-700",
};

const MONTH_OPTIONS = ["Tất cả", ...Array.from({ length: 12 }, (_, index) => `Tháng ${index + 1}`)];
const YEAR_OPTIONS = ["Tất cả", "2026", "2025", "2024"];
const ASSIGNEE_OPTIONS = ["Tất cả", ...UPGRADE_STAFF_OPTIONS];

function ProgramUpgradeManagement() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssignee, setSelectedAssignee] = useState("Tất cả");
  const [selectedMonth, setSelectedMonth] = useState("Tất cả");
  const [selectedYear, setSelectedYear] = useState("Tất cả");
  const [searchText, setSearchText] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState(null);

  const fetchUpgrades = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await upgradeApi.list({
        assignee: selectedAssignee === "Tất cả" ? "all" : selectedAssignee,
        month: selectedMonth === "Tất cả" ? "all" : Number(selectedMonth.split(" ")[1]),
        year: selectedYear === "Tất cả" ? "all" : Number(selectedYear),
        search: searchText.trim(),
        limit: 200,
      });
      const nextRows = Array.isArray(response?.upgrades) ? response.upgrades : [];
      setRows(nextRows);
      setSelectedIds((prev) => prev.filter((id) => nextRows.some((item) => item.id === id)));
    } catch (error) {
      toast.error(error?.message || "Không thể tải danh sách nâng cấp");
    } finally {
      setIsLoading(false);
    }
  }, [searchText, selectedAssignee, selectedMonth, selectedYear]);

  useEffect(() => {
    void fetchUpgrades();
  }, [fetchUpgrades]);

  const displayedRows = rows;
  const displayedIds = displayedRows.map((item) => item.id);
  const isAllFilteredSelected = displayedIds.length > 0 && displayedIds.every((id) => selectedIds.includes(id));
  const deleteManyLabel = selectedIds.length > 0 ? `Xóa tất cả [ ${selectedIds.length} ]` : "Xóa tất cả";

  const handleToggleAll = (checked) => {
    if (checked) {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...displayedIds])));
      return;
    }
    setSelectedIds((prev) => prev.filter((id) => !displayedIds.includes(id)));
  };

  const handleToggleRow = (id, checked) => {
    setSelectedIds((prev) => {
      if (checked) {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      }
      return prev.filter((item) => item !== id);
    });
  };

  const handleInlineUpdate = async (rowId, patch) => {
    const target = rows.find((item) => item.id === rowId);
    if (!target) return;
    const payload = {
      programId: target.programId,
      upgradeItem: target.upgradeItem,
      priority: target.priority,
      slaHours: target.slaHours,
      bonusPoint: target.bonusPoint,
      status: target.status,
      assignee: target.assignee,
      visible: target.visible,
      note: target.note || "",
      ...patch,
    };
    try {
      const response = await upgradeApi.update(rowId, payload);
      const updated = response?.upgrade;
      if (!updated) return;
      setRows((prev) => prev.map((item) => (item.id === rowId ? updated : item)));
    } catch (error) {
      toast.error(error?.message || "Cập nhật không thành công");
    }
  };

  const handleDeleteOne = async (rowId) => {
    try {
      await upgradeApi.remove(rowId);
      setRows((prev) => prev.filter((item) => item.id !== rowId));
      setSelectedIds((prev) => prev.filter((item) => item !== rowId));
      toast.success("Đã xóa yêu cầu nâng cấp");
    } catch (error) {
      toast.error(error?.message || "Xóa dữ liệu không thành công");
    }
  };

  const handleDeleteMany = async () => {
    try {
      if (selectedIds.length > 0) {
        const response = await upgradeApi.removeMany(selectedIds);
        setRows((prev) => prev.filter((item) => !selectedIds.includes(item.id)));
        setSelectedIds([]);
        toast.success(`Đã xóa ${response?.deletedCount || selectedIds.length} yêu cầu nâng cấp`);
      } else {
        const response = await upgradeApi.removeMany([]);
        setRows([]);
        toast.success(`Đã xóa toàn bộ (${response?.deletedCount || 0}) yêu cầu nâng cấp`);
      }
    } catch (error) {
      toast.error(error?.message || "Xóa dữ liệu không thành công");
    } finally {
      setDeleteOpen(false);
      setDeleteRow(null);
    }
  };

  return (
    <>
      <ManagementActions
        onAdd={() => navigate("/lap-trinh/nang-cap/them-moi")}
        onDeleteAll={() => {
          setDeleteRow(null);
          setDeleteOpen(true);
        }}
        deleteDisabled={rows.length === 0}
        deleteLabel={deleteManyLabel}
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select
          className="w-56 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          value={selectedAssignee}
          onChange={(event) => setSelectedAssignee(event.target.value)}
        >
          {ASSIGNEE_OPTIONS.map((option) => (
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

      <ManagementTableCard
        searchText={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm số HĐ, module, hạng mục"
      >
        <Table className="min-w-full text-center text-sm">
          <TableHeader className="bg-slate-50 text-slate-500">
            <TableRow>
              <TableHead className="w-12 border border-slate-200 px-4">
                <input
                  type="checkbox"
                  className="ml-px"
                  checked={isAllFilteredSelected}
                  onChange={(event) => handleToggleAll(event.target.checked)}
                  onClick={(event) => event.stopPropagation()}
                />
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                STT
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Phiếu gốc (HĐ)
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Module
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Hạng mục nâng cấp
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Ưu tiên
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                SLA
              </TableHead>
              <TableHead className="border border-slate-200 p-4 px-6 text-center font-semibold text-slate-500">
                Trạng thái
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Điểm cộng thêm
              </TableHead>
              <TableHead className="border border-slate-200 p-4 px-10 text-center font-semibold text-slate-500">
                Lập trình
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Hiển thị
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Thao tác
              </TableHead>
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
              displayedRows.map((row, index) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer text-slate-700 hover:bg-slate-50"
                  onClick={() => navigate(`/lap-trinh/nang-cap/${row.id}`)}
                >
                  <TableCell className="border border-slate-200 p-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={(event) => handleToggleRow(row.id, event.target.checked)}
                      onClick={(event) => event.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4">
                    <span className="border px-3 py-1.5">{index + 1}</span>
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4 font-semibold text-sky-700">
                    {row.contractCode}
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4 text-left">{row.module}</TableCell>
                  <TableCell className="border border-slate-200 p-4 text-left">{row.upgradeItem}</TableCell>
                  <TableCell
                    className={`border border-slate-200 p-4 font-semibold ${PRIORITY_COLORS[row.priority] || "text-slate-700"}`}
                  >
                    {row.priority}
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.slaHours}h</TableCell>
                  <TableCell className="border border-slate-200 p-4" onClick={(event) => event.stopPropagation()}>
                    <select
                      className="w-full rounded border border-slate-200 px-2 py-1.5"
                      value={row.status}
                      onChange={(event) => void handleInlineUpdate(row.id, { status: event.target.value })}
                    >
                      {UPGRADE_STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.bonusPoint}</TableCell>
                  <TableCell className="border border-slate-200 p-4" onClick={(event) => event.stopPropagation()}>
                    <select
                      className="w-full rounded border border-slate-200 px-2 py-1.5"
                      value={row.assignee}
                      onChange={(event) => void handleInlineUpdate(row.id, { assignee: event.target.value })}
                    >
                      {UPGRADE_STAFF_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell
                    className="border border-slate-200 p-4 text-center"
                    onClick={(event) => event.stopPropagation()}
                  >
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
                          navigate(`/lap-trinh/nang-cap/${row.id}`);
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
                          setDeleteOpen(true);
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
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteRow(null);
        }}
        title="Xác nhận xóa"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setDeleteOpen(false);
                setDeleteRow(null);
              }}
              className="rounded-md border px-4 py-2 text-sm"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => {
                if (deleteRow?.id) {
                  void handleDeleteOne(deleteRow.id);
                  setDeleteOpen(false);
                  setDeleteRow(null);
                  return;
                }
                void handleDeleteMany();
              }}
              className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Xóa
            </button>
          </div>
        }
      >
        {deleteRow ? (
          <p className="text-sm text-slate-600">
            Bạn có chắc muốn xóa mục
            <span className="font-semibold text-slate-800"> {deleteRow.contractCode}</span>?
          </p>
        ) : selectedIds.length > 0 ? (
          <p className="text-sm text-slate-600">Bạn có chắc muốn xóa {selectedIds.length} mục đã chọn?</p>
        ) : (
          <p className="text-sm text-slate-600">Bạn có chắc muốn xóa toàn bộ danh sách nâng cấp?</p>
        )}
      </Modal>
    </>
  );
}

export default ProgramUpgradeManagement;

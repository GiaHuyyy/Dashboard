import { SquarePen, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { ManagementActions } from "@/components/program/ManagementActions";
import { ManagementTableCard } from "@/components/program/ManagementTableCard";
import { Button } from "@/components/ui/button-v2";
import Modal from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { designApi } from "@/lib/api-client";

const DESIGN_TYPES = ["all", "Logo", "Banner", "Landing page", "UI/UX", "Social post"];
const STATUS_OPTIONS = ["all", "Đã nhận", "Đang xử lý", "Hoàn thành"];

function DesignManagement() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState(null);
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedAssignee, setSelectedAssignee] = useState("all");

  const fetchRows = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await designApi.list({
        search: searchText.trim(),
        designType: selectedType,
        status: selectedStatus,
        assignee: selectedAssignee,
      });
      const nextRows = Array.isArray(response?.designTasks) ? response.designTasks : [];
      setRows(nextRows);
      setSelectedIds((prev) => prev.filter((id) => nextRows.some((item) => item.id === id)));
    } catch (error) {
      toast.error(error?.message || "Không thể tải danh sách design");
    } finally {
      setIsLoading(false);
    }
  }, [searchText, selectedType, selectedStatus, selectedAssignee]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const displayedRows = useMemo(() => rows, [rows]);
  const displayedIds = displayedRows.map((item) => item.id);
  const isAllFilteredSelected = displayedIds.length > 0 && displayedIds.every((id) => selectedIds.includes(id));
  const deleteManyLabel = selectedIds.length > 0 ? `Xóa tất cả [ ${selectedIds.length} ]` : "Xóa tất cả";
  const assigneeOptions = useMemo(
    () => ["all", ...Array.from(new Set(rows.map((item) => item.assignee).filter(Boolean)))],
    [rows],
  );

  const openCreate = () => navigate("/design/them-moi");
  const openEdit = (row) => navigate(`/design/chinh-sua/${row.id}`);

  const handleToggleAll = (checked) => {
    if (checked) {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...displayedIds])));
      return;
    }
    setSelectedIds((prev) => prev.filter((id) => !displayedIds.includes(id)));
  };

  const handleToggleRow = (id, checked) => {
    setSelectedIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((item) => item !== id);
    });
  };

  const handleDelete = async () => {
    try {
      if (deleteRow?.id) {
        await designApi.remove(deleteRow.id);
        setRows((prev) => prev.filter((item) => item.id !== deleteRow.id));
        toast.success("Đã xóa công việc design");
      } else if (selectedIds.length > 0) {
        const response = await designApi.removeMany(selectedIds);
        setRows((prev) => prev.filter((item) => !selectedIds.includes(item.id)));
        toast.success(`Đã xóa ${response?.deletedCount || selectedIds.length} công việc design`);
      } else {
        const response = await designApi.removeMany([]);
        setRows([]);
        toast.success(`Đã xóa toàn bộ (${response?.deletedCount || 0}) công việc design`);
      }
    } catch (error) {
      toast.error(error?.message || "Xóa dữ liệu không thành công");
    } finally {
      setDeleteOpen(false);
      setDeleteRow(null);
      setSelectedIds([]);
    }
  };

  return (
    <>
      <ManagementActions
        onAdd={openCreate}
        onDeleteAll={() => {
          setDeleteRow(null);
          setDeleteOpen(true);
        }}
        deleteDisabled={rows.length === 0}
        deleteLabel={deleteManyLabel}
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select
          className="w-52 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          value={selectedType}
          onChange={(event) => setSelectedType(event.target.value)}
        >
          {DESIGN_TYPES.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "Loại design" : option}
            </option>
          ))}
        </select>

        <select
          className="w-52 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          value={selectedStatus}
          onChange={(event) => setSelectedStatus(event.target.value)}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "Trạng thái" : option}
            </option>
          ))}
        </select>

        <select
          className="w-52 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          value={selectedAssignee}
          onChange={(event) => setSelectedAssignee(event.target.value)}
        >
          {assigneeOptions.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "Người nhận" : option}
            </option>
          ))}
        </select>
      </div>

      <ManagementTableCard
        searchText={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm công việc design"
      >
        <Table className="min-w-full text-center text-sm">
          <TableHeader className="bg-slate-50 text-slate-500">
            <TableRow>
              <TableHead className="w-12 border border-slate-200 px-4">
                <input
                  type="checkbox"
                  checked={isAllFilteredSelected}
                  onChange={(event) => handleToggleAll(event.target.checked)}
                  onClick={(event) => event.stopPropagation()}
                />
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                STT
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Hạng mục
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Loại
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Mức ưu tiên
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Thời gian
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Quy đổi
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Điểm thêm
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Người giao
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Người nhận
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Trạng thái
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Ngày tạo
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
                <TableCell colSpan={14} className="border border-slate-200 p-4 py-8 text-slate-500">
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : displayedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={14} className="border border-slate-200 p-4 py-8 text-slate-500">
                  Chưa có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              displayedRows.map((row, index) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer text-slate-700 hover:bg-slate-50"
                  onClick={() => openEdit(row)}
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
                  <TableCell className="border border-slate-200 p-4 text-left font-semibold text-sky-700">
                    {row.title}
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.designType}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.priority}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.durationLabel}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.convert}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.bonusPoint}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.assigner}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.assignee}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.status}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.createdAt}</TableCell>
                  <TableCell className="border border-slate-200 p-4">
                    <input
                      type="checkbox"
                      checked={Boolean(row.visible)}
                      readOnly
                      onClick={(event) => event.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        icon={SquarePen}
                        iconOnly
                        variant="primary-outline"
                        onClick={(event) => {
                          event.stopPropagation();
                          openEdit(row);
                        }}
                      />
                      <Button
                        icon={Trash2}
                        iconOnly
                        variant="danger-outline"
                        onClick={(event) => {
                          event.stopPropagation();
                          setDeleteRow(row);
                          setDeleteOpen(true);
                        }}
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
            <button type="button" onClick={() => setDeleteOpen(false)} className="rounded-md border px-4 py-2 text-sm">
              Hủy
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Xóa
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          Bạn có chắc muốn xóa công việc design{" "}
          <span className="font-semibold text-slate-800">{deleteRow?.title || "đang chọn"}</span>?
        </p>
      </Modal>
    </>
  );
}

export default DesignManagement;

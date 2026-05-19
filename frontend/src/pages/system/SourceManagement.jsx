import { RotateCw, SquarePen, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { ManagementActions } from "@/components/program/ManagementActions";
import { ManagementTableCard } from "@/components/program/ManagementTableCard";
import { SOURCE_SEND_STATUS_OPTIONS } from "@/constants/program-source";
import { sourceApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button-v2";
import Modal from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function SourceManagement() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState(null);
  const [sendingRowId, setSendingRowId] = useState(null);

  const fetchRows = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await sourceApi.list({
        status: selectedStatus,
        search: searchText.trim(),
        limit: 200,
      });
      const nextRows = Array.isArray(response?.sources) ? response.sources : [];
      setRows(nextRows);
      setSelectedIds((prev) => prev.filter((id) => nextRows.some((item) => item.id === id)));
    } catch (error) {
      toast.error(error?.message || "Không thể tải danh sách source");
    } finally {
      setIsLoading(false);
    }
  }, [searchText, selectedStatus]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchRows();
  }, [fetchRows]);

  const displayedRows = useMemo(() => rows, [rows]);
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

  const handleDeleteOne = (row) => {
    setDeleteRow(row);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    try {
      if (deleteRow?.id) {
        await sourceApi.remove(deleteRow.id);
        toast.success("Đã xóa source");
      } else if (selectedIds.length > 0) {
        const response = await sourceApi.removeMany(selectedIds);
        toast.success(`Đã xóa ${response?.deletedCount || selectedIds.length} source`);
      } else {
        const response = await sourceApi.removeMany([]);
        toast.success(`Đã xóa toàn bộ (${response?.deletedCount || 0}) source`);
      }
      setDeleteOpen(false);
      setDeleteRow(null);
      setSelectedIds([]);
      await fetchRows();
    } catch (error) {
      toast.error(error?.message || "Xóa dữ liệu không thành công");
    }
  };

  const handleSendAgain = async (rowId) => {
    if (sendingRowId === rowId) return;
    setSendingRowId(rowId);
    try {
      const response = await sourceApi.sendMail(rowId);
      const updated = response?.source;
      if (updated) {
        setRows((prev) => prev.map((item) => (item.id === rowId ? updated : item)));
      }
      toast.success(response?.message || "Gửi lại mail thành công");
    } catch (error) {
      toast.error(error?.message || "Gửi lại mail thất bại");
    } finally {
      setSendingRowId(null);
    }
  };

  return (
    <>
      <ManagementActions
        onAdd={() => navigate("/he-thong/source/them-moi")}
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
          value={selectedStatus}
          onChange={(event) => setSelectedStatus(event.target.value)}
        >
          <option value="all">Trạng thái</option>
          {SOURCE_SEND_STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <ManagementTableCard
        searchText={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm số HĐ, module, link"
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
                Domain
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Link source
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Ngày tạo
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Ngày gửi
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Ngày hết hạn tải
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Trạng thái
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Trạng thái tải
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Ngày tải về
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Số lượt tải
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
                <TableCell colSpan={15} className="border border-slate-200 p-4 py-8 text-slate-500">
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : displayedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={15} className="border border-slate-200 p-4 py-8 text-slate-500">
                  Chưa có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              displayedRows.map((row, index) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer text-slate-700 hover:bg-slate-50"
                  onClick={() => navigate(`/he-thong/source/chinh-sua/${row.id}`)}
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
                    <TableCell className="border border-slate-200 p-4 font-bold text-sky-700">{row.contractCode}</TableCell>
                    <TableCell className="border border-slate-200 p-4">{row.module}</TableCell>
                    <TableCell className="max-w-52 border border-slate-200 p-4 text-left">
                      <a
                      href={row.domain}
                      target="_blank"
                      rel="noreferrer"
                      className="block overflow-x-auto text-sky-700 underline"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {row.domain || "-"}
                    </a>
                    </TableCell>
                  <TableCell className="max-w-60 border border-slate-200 p-4 text-left">
                    <a
                      href={row.sourceLink}
                      target="_blank"
                      rel="noreferrer"
                      className="block overflow-x-auto text-sky-700 underline"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {row.sourceLink || "-"}
                    </a>
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.createdAtLabel || "-"}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.sentAtLabel || "-"}</TableCell>
                  <TableCell className="border border-slate-200 p-4">
                    <div className="flex items-center gap-2">
                      <span>{row.expiresAtLabel || "-"}</span>
                      <Button
                        icon={RotateCw}
                        label={sendingRowId === row.id ? "Đang gửi" : "Gửi lại"}
                        variant="info"
                        size="sm"
                        disabled={sendingRowId === row.id}
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleSendAgain(row.id);
                        }}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4">
                    <span className={row.sendStatus === "Đã gửi" ? "text-emerald-700" : "text-slate-600"}>
                      {row.sendStatus}
                    </span>
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4">
                    <span className={row.downloadStatus === "Đã tải" ? "text-emerald-700" : "text-slate-600"}>
                      {row.downloadStatus}
                    </span>
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.downloadedAtLabel || "-"}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.downloadCount || 0} lượt tải</TableCell>
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
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/he-thong/source/chinh-sua/${row.id}`);
                        }}
                        variant="primary-outline"
                        iconOnly
                        className="text-sky-500"
                      />
                      <Button
                        icon={Trash2}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeleteOne(row);
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
              onClick={() => void handleDelete()}
              className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Xóa
            </button>
          </div>
        }
      >
        {deleteRow ? (
          <p className="text-sm text-slate-600">
            Bạn có chắc muốn xóa source của hợp đồng
            <span className="font-semibold text-slate-800"> {deleteRow.contractCode}</span>?
          </p>
        ) : (
          <p className="text-sm text-slate-600">
            {selectedIds.length > 0
              ? `Bạn có chắc muốn xóa ${selectedIds.length} source đã chọn?`
              : "Bạn có chắc muốn xóa toàn bộ source?"}
          </p>
        )}
      </Modal>
    </>
  );
}

export default SourceManagement;

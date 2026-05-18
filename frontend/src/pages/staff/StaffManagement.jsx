import { SquarePen, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { ManagementActions } from "@/components/program/ManagementActions";
import { ManagementTableCard } from "@/components/program/ManagementTableCard";
import { staffApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button-v2";
import Modal from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function StaffManagement() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState(null);

  const fetchRows = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await staffApi.list({ search: searchText.trim() });
      setRows(Array.isArray(response?.staffs) ? response.staffs : []);
    } catch (error) {
      toast.error(error?.message || "Không thể tải danh sách nhân sự");
    } finally {
      setIsLoading(false);
    }
  }, [searchText]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const activeCount = useMemo(() => rows.filter((item) => item.isActive).length, [rows]);

  const handleDelete = async () => {
    if (!deleteRow?.id) return;
    try {
      await staffApi.remove(deleteRow.id);
      toast.success("Đã xóa nhân sự");
      setDeleteOpen(false);
      setDeleteRow(null);
      await fetchRows();
    } catch (error) {
      toast.error(error?.message || "Xóa dữ liệu không thành công");
    }
  };

  return (
    <>
      <ManagementActions
        onAdd={() => navigate("/nhan-su/them-moi")}
        onDeleteAll={() => null}
        deleteDisabled
        deleteLabel={`Đang hoạt động: ${activeCount}`}
      />

      <ManagementTableCard
        searchText={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm tên, email, SĐT"
      >
        <Table className="min-w-full text-center text-sm">
          <TableHeader className="bg-slate-50 text-slate-500">
            <TableRow>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                STT
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Họ tên
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Email
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                SĐT
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Phòng ban
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Vai trò
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Trạng thái
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Thao tác
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="border border-slate-200 p-4 py-8 text-slate-500">
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="border border-slate-200 p-4 py-8 text-slate-500">
                  Chưa có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer text-slate-700 hover:bg-slate-50"
                  onClick={() => navigate(`/nhan-su/chinh-sua/${row.id}`)}
                >
                  <TableCell className="border border-slate-200 p-4">
                    <span className="border px-3 py-1.5">{index + 1}</span>
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4 text-left font-semibold text-sky-700">
                    {row.fullName}
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4 text-left">{row.email}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.phone || "-"}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.department || "-"}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.role || "-"}</TableCell>
                  <TableCell className="border border-slate-200 p-4">
                    {row.isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        icon={SquarePen}
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/nhan-su/chinh-sua/${row.id}`);
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
          Bạn có chắc muốn xóa nhân sự
          <span className="font-semibold text-slate-800"> {deleteRow?.fullName}</span>?
        </p>
      </Modal>
    </>
  );
}

export default StaffManagement;

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, SquarePen, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { programApi } from "@/lib/api-client";
import Modal from "@/components/ui/modal";
import { Button } from "@/components/ui/button-v2";

const moduleOptions = ["Không tính điểm", "Cơ bản", "Cơ bản + Responsive", "Cơ bản + Mobile", "Giỏ hàng cơ bản"];

function ListProgram() {
  const navigate = useNavigate();
  const [selectedModule, setSelectedModule] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [programs, setPrograms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeRow, setActiveRow] = useState(null);

  useEffect(() => {
    const fetchPrograms = async () => {
      setIsLoading(true);
      try {
        const response = await programApi.list(selectedModule);
        setPrograms(response.programs || []);
      } catch (error) {
        toast.error(error?.message || "Không thể tải danh sách lập trình");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrograms();
  }, [selectedModule]);

  const filteredPrograms = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return programs;
    return programs.filter((item) => item.module.toLowerCase().includes(keyword));
  }, [programs, searchText]);

  const openDelete = (row) => {
    setActiveRow(row);
    setDeleteOpen(true);
  };

  const closeDelete = () => setDeleteOpen(false);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <Button
          icon={Plus}
          label="Thêm mới"
          onClick={() => navigate("/lap-trinh/them-moi")}
          variant="primary"
          size="lg"
          className="shadow-sm"
          gap="gap-1"
        />
        <Button
          icon={Trash2}
          label="Xóa tất cả"
          onClick={() => {}}
          variant="danger"
          size="lg"
          className="shadow-sm"
          gap="gap-1"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select
          className="w-56 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          value={selectedModule}
          onChange={(event) => setSelectedModule(event.target.value)}
        >
          <option value="all">Chọn loại điểm</option>
          {moduleOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 rounded-tl-2xl rounded-tr-2xl bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-t-3 border-slate-200 border-t-sky-500 px-4 py-3">
          <h2 className="text-base font-semibold text-gray-500">Danh sách</h2>
          <div className="flex items-center">
            <input
              type="text"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search"
              className="h-9 w-44 border border-slate-200 px-3 py-1.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center border border-slate-200 text-slate-500"
              aria-label="Tim kiem"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>

        <Table className="min-w-full text-center text-sm">
          <TableHeader className="bg-slate-50 text-slate-500">
            <TableRow>
              <TableHead className="w-12 border border-slate-200 px-4">
                <input type="checkbox" />
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                STT
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Module
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Thời gian
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Quy đổi
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Ngày tạo
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Design
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
                <TableCell colSpan={9} className="border border-slate-200 p-4 py-8 text-slate-500">
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : filteredPrograms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="border border-slate-200 p-4 py-8 text-slate-500">
                  Chưa có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              filteredPrograms.map((row, index) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer text-slate-700 hover:bg-slate-50"
                  onClick={() => navigate(`/lap-trinh/chinh-sua/${row.id}`)}
                >
                  <TableCell className="border border-slate-200 p-4">
                    <input type="checkbox" />
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4">
                    <span className="border px-3 py-1.5">{index + 1}</span>
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4 text-slate-500">{row.module}</TableCell>
                  <TableCell className="border border-slate-200 p-4 text-slate-500">{row.time}</TableCell>
                  <TableCell className="border border-slate-200 p-4 text-slate-500">{row.convert}</TableCell>
                  <TableCell className="border border-slate-200 p-4 text-slate-500">{row.createdAt}</TableCell>
                  <TableCell className="border border-slate-200 p-4 text-center">
                    <input type="checkbox" checked={row.design} readOnly />
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4 text-center">
                    <input type="checkbox" checked={row.visible} readOnly />
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        icon={SquarePen}
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/lap-trinh/chinh-sua/${row.id}`);
                        }}
                        variant="primary-outline"
                        iconOnly
                        className="text-sky-500"
                      />
                      <Button
                        icon={Trash2}
                        onClick={(event) => {
                          event.stopPropagation();
                          openDelete(row);
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
      </div>

      <Modal
        open={deleteOpen}
        onClose={closeDelete}
        title="Xác nhận xóa"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={closeDelete} className="rounded-md border px-4 py-2 text-sm">
              Hủy
            </button>
            <button
              type="button"
              onClick={() => {
                toast.success("Đã xóa");
                closeDelete();
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
          <span className="font-semibold text-slate-800"> {activeRow?.module}</span>?
        </p>
      </Modal>
    </>
  );
}

export default ListProgram;

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, SquarePen, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const tableRows = [
  {
    id: 0,
    module: "Không tính điểm",
    time: "0.1",
    convert: "0",
    createdAt: "24/09/2024 20:41:47",
    design: false,
    visible: true,
  },
  {
    id: 1,
    module: "Cơ bản",
    time: "1 ngày",
    convert: "1",
    createdAt: "09/06/2024 14:27:35",
    design: false,
    visible: true,
  },
  {
    id: 2,
    module: "Cơ bản + Responsive",
    time: "1.2 ngày",
    convert: "1.2",
    createdAt: "09/06/2024 14:29:33",
    design: false,
    visible: true,
  },
  {
    id: 3,
    module: "Cơ bản + Mobile",
    time: "1.5 ngày",
    convert: "1.5",
    createdAt: "28/06/2024 15:50:51",
    design: false,
    visible: true,
  },
  {
    id: 4,
    module: "Giỏ hàng cơ bản",
    time: "2 h",
    convert: "0.25",
    createdAt: "09/06/2024 14:35:20",
    design: false,
    visible: true,
  },
];

function ListProgram() {
  const navigate = useNavigate();

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <button
          type="button"
          onClick={() => navigate("/lap-trinh/them-moi")}
          className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
        >
          <Plus className="h-4 w-4" />
          Thêm mới
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
        >
          <Trash2 className="h-4 w-4" />
          Xóa tất cả
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select
          className="w-56 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          defaultValue=""
        >
          <option value="" disabled>
            Chọn loại điểm
          </option>
          <option>Cơ bản</option>
          <option>Responsive</option>
          <option>Mobile</option>
        </select>
      </div>

      <div className="mt-6 rounded-tl-2xl rounded-tr-2xl bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between border-t-3 rounded-2xl border-t-sky-500 gap-3 border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold text-gray-500">Danh sách</h2>
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Search"
              className="w-44 h-9 border border-slate-200 px-3 py-1.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
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
              <TableHead className="border border-slate-200 px-4 text-center font-semibold text-slate-500">
                STT
              </TableHead>
              <TableHead className="border border-slate-200 px-4 text-center font-semibold text-slate-500">
                Module
              </TableHead>
              <TableHead className="border border-slate-200 px-4 text-center font-semibold text-slate-500">
                Thời gian
              </TableHead>
              <TableHead className="border border-slate-200 px-4 text-center font-semibold text-slate-500">
                Quy đổi
              </TableHead>
              <TableHead className="border border-slate-200 px-4 text-center font-semibold text-slate-500">
                Ngày tạo
              </TableHead>
              <TableHead className="border border-slate-200 px-4 text-center font-semibold text-slate-500">
                Design
              </TableHead>
              <TableHead className="border border-slate-200 px-4 text-center font-semibold text-slate-500">
                Hiển thị
              </TableHead>
              <TableHead className="border border-slate-200 px-4 text-center font-semibold text-slate-500">
                Thao tác
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableRows.map((row) => (
              <TableRow key={row.id} className="text-slate-700">
                <TableCell className="border border-slate-200 px-4">
                  <input type="checkbox" />
                </TableCell>
                <TableCell className="border border-slate-200 px-4">
                  <span className="inline-flex h-8 w-8 items-center justify-center border border-slate-200 bg-white text-sm font-semibold">
                    {row.id}
                  </span>
                </TableCell>
                <TableCell className="border border-slate-200 px-4  text-slate-500">{row.module}</TableCell>
                <TableCell className="border border-slate-200 text-slate-500 px-4">{row.time}</TableCell>
                <TableCell className="border border-slate-200 text-slate-500 px-4">{row.convert}</TableCell>
                <TableCell className="border border-slate-200  px-4 text-slate-500">{row.createdAt}</TableCell>
                <TableCell className="border border-slate-200 px-4 text-center">
                  <input type="checkbox" defaultChecked={row.design} />
                </TableCell>
                <TableCell className="border border-slate-200 px-4 text-center">
                  <input type="checkbox" defaultChecked={row.visible} />
                </TableCell>
                <TableCell className="border border-slate-200 px-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button type="button" className=" px-2 py-1">
                      <SquarePen className="h-4 w-4 text-sky-500    " />
                    </button>
                    <button type="button" className="px-2 py-1 text-xs text-rose-700">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

export default ListProgram;

import { RotateCw, Save, SquareArrowRightExit } from "lucide-react";
import { useNavigate } from "react-router-dom";

function ProgramForm() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white"
        >
          <Save className="h-4 w-4" />
          Lưu
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
        >
          <Save className="h-4 w-4" />
          Lưu gửi mail
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
        >
          <Save className="h-4 w-4" />
          Lưu tại trang
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md bg-slate-600 px-3 py-2 text-sm font-semibold text-white"
        >
          <RotateCw className="h-4 w-4" />
          Làm lại
        </button>
        <button
          type="button"
          onClick={() => navigate("/lap-trinh/danh-sach")}
          className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-3 py-2 text-sm font-semibold text-white"
        >
          <SquareArrowRightExit className="h-4 w-4" />
          Thoát
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-3 text-md font-semibold text-slate-600">Nội dung</div>
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-600 md:col-span-2">
            Tên hợp đồng
            <input
              className="mt-2 w-full rounded-md font-light border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              defaultValue="VÕ TUẤN ANH"
            />
          </label>
          <label className="text-sm font-semibold text-slate-600 md:col-span-2">
            Số hợp đồng
            <input
              className="mt-2 w-full rounded-md font-light border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              defaultValue="0260223QT"
            />
          </label>
          <label className="text-sm font-semibold text-slate-600 md:col-span-2">
            Trạng thái
            <select className="mt-2 w-full font-light rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200">
              <option>Đã nhận</option>
              <option>Đang xử lý</option>
              <option>Hoàn thành</option>
            </select>
          </label>

          <div className="md:col-span-2">
            <p className="text-sm font-semibold text-slate-600">Mail nhận</p>
            <div className="mt-2 flex flex-wrap gap-6 text-sm text-slate-600">
              <label className="flex items-center gap-2">
                <input type="radio" name="mail-status" defaultChecked />
                Mail nhận
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="mail-status" />
                Mail dự kiến
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="mail-status" />
                Mail hoàn thành
              </label>
            </div>
          </div>

          <label className="text-sm font-semibold text-slate-600 md:col-span-2">
            Chọn nhân viên kinh doanh
            <select className="mt-2 w-full font-light rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200">
              <option>ĐỖ VAN SANG</option>
              <option>TRẦN LAN</option>
              <option>NGUYỄN HUY</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-600 md:col-span-2">
            Họ tên kinh doanh nhận mail
            <input
              className="mt-2 w-full rounded-md font-light border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              defaultValue="ĐỖ VAN SANG"
            />
          </label>
          <label className="text-sm font-semibold text-slate-600 md:col-span-2">
            Email kinh doanh nhận
            <input
              className="mt-2 w-full rounded-md font-light border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              defaultValue="thanhdv.sota@gmail.com"
            />
          </label>
          <label className="text-sm font-semibold text-slate-600 md:col-span-2">
            Danh sách email cc <span className="text-red-600">(phân cách bằng dấu phẩy)</span>
            <input
              className="mt-2 w-full rounded-md font-light border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              placeholder="example@gmail.com, example2@gmail.com"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

export default ProgramForm;

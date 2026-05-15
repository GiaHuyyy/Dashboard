import { RotateCw, Save, SquareArrowRightExit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import FormField from "@/components/ui/form-field";

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
          <FormField label="Tên hợp đồng" placeholder="VÕ TUẤN ANH" className="md:col-span-2" inputProps={{ defaultValue: "VÕ TUẤN ANH" }} />
          <FormField label="Số hợp đồng" placeholder="0260223QT" className="md:col-span-2" inputProps={{ defaultValue: "0260223QT" }} />
          <FormField
            label="Trạng thái"
            className="md:col-span-2"
            type="select"
            options={[{ label: "Đã nhận" }, { label: "Đang xử lý" }, { label: "Hoàn thành" }]}
          />

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

          <FormField
            label="Chọn nhân viên kinh doanh"
            className="md:col-span-2"
            type="select"
            options={[{ label: "ĐỖ VAN SANG" }, { label: "TRẦN LAN" }, { label: "NGUYỄN HUY" }]}
          />
          <FormField
            label="Họ tên kinh doanh nhận mail"
            placeholder="ĐỖ VAN SANG"
            className="md:col-span-2"
            inputProps={{ defaultValue: "ĐỖ VAN SANG" }}
          />
          <FormField
            label="Email kinh doanh nhận"
            placeholder="thanhdv.sota@gmail.com"
            className="md:col-span-2"
            inputProps={{ defaultValue: "thanhdv.sota@gmail.com" }}
          />
          <FormField
            label={
              <>
                Danh sách email cc <span className="text-red-600">(phân cách bằng dấu phẩy)</span>
              </>
            }
            className="md:col-span-2"
            inputProps={{ placeholder: "example@gmail.com, example2@gmail.com" }}
          />
        </div>
      </div>
    </div>
  );
}

export default ProgramForm;

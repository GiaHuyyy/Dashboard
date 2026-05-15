import { zodResolver } from "@hookform/resolvers/zod";
import { RotateCw, Save, SquareArrowRightExit } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { programApi } from "@/lib/api-client";

const moduleOptions = ["Không tính điểm", "Cơ bản", "Cơ bản + Responsive", "Cơ bản + Mobile", "Giỏ hàng cơ bản"];
const timeToConvertMap = {
  "0.1": "0",
  "1 ngày": "1",
  "1.2 ngày": "1.2",
  "1.5 ngày": "1.5",
  "2 h": "0.25",
};
const timeOptions = Object.keys(timeToConvertMap);
const statusOptions = ["Đã nhận", "Đang xử lý", "Hoàn thành"];
const mailStatusOptions = ["Mail nhận", "Mail dự kiến", "Mail hoàn thành"];
const salesStaffOptions = ["ĐỖ VAN SANG", "TRẦN LAN", "NGUYỄN HUY"];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const programSchema = z.object({
  module: z.enum(moduleOptions, { message: "Vui lòng chọn module hợp lệ" }),
  time: z.enum(timeOptions, { message: "Vui lòng chọn thời gian hợp lệ" }),
  convert: z.string().trim().min(1, "Vui lòng nhập quy đổi"),
  design: z.boolean(),
  visible: z.boolean(),
  contractName: z.string().trim().min(1, "Vui lòng nhập tên hợp đồng"),
  contractCode: z.string().trim().min(1, "Vui lòng nhập số hợp đồng"),
  status: z.enum(statusOptions, { message: "Vui lòng chọn trạng thái hợp lệ" }),
  mailStatus: z.enum(mailStatusOptions, { message: "Vui lòng chọn mail nhận hợp lệ" }),
  selectedSalesStaff: z.string().trim().min(1, "Vui lòng chọn nhân viên kinh doanh"),
  salesReceiverName: z.string().trim().min(1, "Vui lòng nhập họ tên kinh doanh nhận mail"),
  salesReceiverEmail: z.string().trim().email("Email kinh doanh nhận không hợp lệ"),
  ccEmails: z
    .string()
    .optional()
    .refine((value) => {
      if (!value?.trim()) return true;
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .every((email) => emailRegex.test(email));
    }, "Danh sách email cc không hợp lệ"),
});

const defaultValues = {
  module: moduleOptions[0],
  time: timeOptions[0],
  convert: timeToConvertMap[timeOptions[0]],
  design: false,
  visible: true,
  contractName: "",
  contractCode: "",
  status: statusOptions[0],
  mailStatus: mailStatusOptions[0],
  selectedSalesStaff: salesStaffOptions[0],
  salesReceiverName: "",
  salesReceiverEmail: "",
  ccEmails: "",
};

function ProgramForm() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(programSchema),
    defaultValues,
  });

  const selectedTime = watch("time");

  useEffect(() => {
    const convertedValue = timeToConvertMap[selectedTime] || "";
    setValue("convert", convertedValue, { shouldValidate: true });
  }, [selectedTime, setValue]);

  const onSubmit = async (values, mode) => {
    const payload = {
      ...values,
      ccEmails: values.ccEmails
        ? values.ccEmails
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
    };

    try {
      await programApi.create(payload);
    } catch (error) {
      toast.error(error?.message || "Lưu dữ liệu không thành công");
      return;
    }

    if (mode === "save-mail") {
      toast.success("Đã lưu form và đánh dấu gửi mail");
      return;
    }

    if (mode === "save-stay") {
      toast.success("Đã lưu form tại trang");
      return;
    }

    toast.success("Lưu thành công");
    navigate("/lap-trinh/danh-sach");
  };

  const onInvalid = () => {
    toast.error("Vui lòng kiểm tra lại thông tin form");
  };

  const submitWithMode = (mode) =>
    handleSubmit(
      async (values) => {
        await onSubmit(values, mode);
      },
      () => onInvalid(),
    )();

  return (
    <form className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <button
          type="button"
          onClick={() => submitWithMode("save")}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-sky-400"
        >
          <Save className="h-4 w-4" />
          Lưu
        </button>
        <button
          type="button"
          onClick={() => submitWithMode("save-mail")}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          <Save className="h-4 w-4" />
          Lưu gửi mail
        </button>
        <button
          type="button"
          onClick={() => submitWithMode("save-stay")}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-emerald-400"
        >
          <Save className="h-4 w-4" />
          Lưu tại trang
        </button>
        <button
          type="button"
          onClick={() => reset(defaultValues)}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-md bg-slate-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
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
        <div className="grid gap-5 p-5 lg:grid-cols-2">
          <div className="space-y-4 rounded-xl border border-slate-100 p-4">
            <p className="text-sm font-semibold text-slate-700">Thông tin lập trình</p>

            <label className="text-sm font-semibold text-slate-600">
              Module
              <select
                {...register("module")}
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-light focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                {moduleOptions.map((moduleItem) => (
                  <option key={moduleItem} value={moduleItem}>
                    {moduleItem}
                  </option>
                ))}
              </select>
              {errors.module && <p className="mt-1 text-xs text-rose-600">{errors.module.message}</p>}
            </label>

            <label className="text-sm font-semibold text-slate-600">
              Thời gian
              <select
                {...register("time")}
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-light focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                {timeOptions.map((timeItem) => (
                  <option key={timeItem} value={timeItem}>
                    {timeItem}
                  </option>
                ))}
              </select>
              {errors.time && <p className="mt-1 text-xs text-rose-600">{errors.time.message}</p>}
            </label>

            <label className="text-sm font-semibold text-slate-600">
              Quy đổi
              <input
                type="text"
                {...register("convert")}
                readOnly
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-light focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                placeholder="1.2"
              />
              {errors.convert && <p className="mt-1 text-xs text-rose-600">{errors.convert.message}</p>}
            </label>

            <div className="mt-3 grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <input type="checkbox" {...register("design")} />
                Design
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <input type="checkbox" {...register("visible")} />
                Hiển thị
              </label>
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-slate-100 p-4">
            <p className="text-sm font-semibold text-slate-700">Thông tin hợp đồng</p>

            <label className="text-sm font-semibold text-slate-600">
              Tên hợp đồng
              <input
                type="text"
                {...register("contractName")}
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-light focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                placeholder="VÕ TUẤN ANH"
              />
              {errors.contractName && <p className="mt-1 text-xs text-rose-600">{errors.contractName.message}</p>}
            </label>

            <label className="text-sm font-semibold text-slate-600">
              Số hợp đồng
              <input
                type="text"
                {...register("contractCode")}
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-light focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                placeholder="0260223QT"
              />
              {errors.contractCode && <p className="mt-1 text-xs text-rose-600">{errors.contractCode.message}</p>}
            </label>

            <label className="text-sm font-semibold text-slate-600">
              Trạng thái
              <select
                {...register("status")}
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-light focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              {errors.status && <p className="mt-1 text-xs text-rose-600">{errors.status.message}</p>}
            </label>

            <div>
              <p className="text-sm font-semibold text-slate-600">Mail nhận</p>
              <div className="mt-2 flex flex-wrap gap-6 text-sm text-slate-600">
                {mailStatusOptions.map((option) => (
                  <label key={option} className="flex items-center gap-2">
                    <input type="radio" value={option} {...register("mailStatus")} />
                    {option}
                  </label>
                ))}
              </div>
              {errors.mailStatus && <p className="mt-1 text-xs text-rose-600">{errors.mailStatus.message}</p>}
            </div>

            <label className="text-sm font-semibold text-slate-600">
              Chọn nhân viên kinh doanh
              <select
                {...register("selectedSalesStaff")}
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-light focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                {salesStaffOptions.map((staff) => (
                  <option key={staff} value={staff}>
                    {staff}
                  </option>
                ))}
              </select>
              {errors.selectedSalesStaff && (
                <p className="mt-1 text-xs text-rose-600">{errors.selectedSalesStaff.message}</p>
              )}
            </label>

            <label className="text-sm font-semibold text-slate-600">
              Họ tên kinh doanh nhận mail
              <input
                type="text"
                {...register("salesReceiverName")}
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-light focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                placeholder="ĐỖ VAN SANG"
              />
              {errors.salesReceiverName && (
                <p className="mt-1 text-xs text-rose-600">{errors.salesReceiverName.message}</p>
              )}
            </label>

            <label className="text-sm font-semibold text-slate-600">
              Email kinh doanh nhận
              <input
                type="text"
                {...register("salesReceiverEmail")}
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-light focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                placeholder="thanhdv.sota@gmail.com"
              />
              {errors.salesReceiverEmail && (
                <p className="mt-1 text-xs text-rose-600">{errors.salesReceiverEmail.message}</p>
              )}
            </label>

            <label className="text-sm font-semibold text-slate-600">
              Danh sách email cc <span className="text-red-600">(phân cách bằng dấu phẩy)</span>
              <input
                type="text"
                {...register("ccEmails")}
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-light focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                placeholder="example@gmail.com, example2@gmail.com"
              />
              {errors.ccEmails && <p className="mt-1 text-xs text-rose-600">{errors.ccEmails.message}</p>}
            </label>
          </div>
        </div>
      </div>
    </form>
  );
}

export default ProgramForm;

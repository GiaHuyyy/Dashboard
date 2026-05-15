import FormField from "@/components/ui/form-field";

const statusOptions = ["Đã nhận", "Đang xử lý", "Hoàn thành"];
const mailStatusOptions = ["Mail nhận", "Mail dự kiến", "Mail hoàn thành"];
const salesStaffOptions = ["ĐỖ VAN SANG", "TRẦN LAN", "NGUYỄN HUY"];

export function ContractInfo({ register, errors }) {
  return (
    <div className="space-y-4 rounded-xl border border-slate-100 p-4">
      <p className="text-sm font-semibold text-slate-700">Thông tin hợp đồng</p>

      <FormField
        label="Tên hợp đồng"
        type="text"
        inputProps={{ ...register("contractName"), placeholder: "VÕ TUẤN ANH" }}
        error={errors.contractName?.message}
      />

      <FormField
        label="Số hợp đồng"
        type="text"
        inputProps={{ ...register("contractCode"), placeholder: "0260223QT" }}
        error={errors.contractCode?.message}
      />

      <FormField
        label="Trạng thái"
        type="select"
        options={statusOptions.map((item) => ({ label: item, value: item }))}
        selectProps={register("status")}
        error={errors.status?.message}
      />

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

      <FormField
        label="Chọn nhân viên kinh doanh"
        type="select"
        options={salesStaffOptions.map((item) => ({ label: item, value: item }))}
        selectProps={register("selectedSalesStaff")}
        error={errors.selectedSalesStaff?.message}
      />

      <FormField
        label="Họ tên kinh doanh nhận mail"
        type="text"
        inputProps={{ ...register("salesReceiverName"), placeholder: "ĐỖ VAN SANG" }}
        error={errors.salesReceiverName?.message}
      />

      <FormField
        label="Email kinh doanh nhận"
        type="text"
        inputProps={{ ...register("salesReceiverEmail"), placeholder: "thanhdv.sota@gmail.com" }}
        error={errors.salesReceiverEmail?.message}
      />

      <FormField
        label={
          <>
            Danh sách email cc <span className="text-red-600">(phân cách bằng dấu phẩy)</span>
          </>
        }
        type="text"
        inputProps={{ ...register("ccEmails"), placeholder: "example@gmail.com, example2@gmail.com" }}
        error={errors.ccEmails?.message}
      />
    </div>
  );
}

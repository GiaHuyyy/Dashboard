import FormField from "@/components/ui/form-field";
import { DURATION_UNIT_OPTIONS } from "@/constants/program";

export function ProgramInfo({
  register,
  errors,
  contractOptions = [],
  designTaskOptions = [],
  moduleOptions = [],
  priorityOptions = [],
  designEnabled = false,
}) {
  return (
    <div className="space-y-4 flex flex-col rounded-xl border border-slate-100 p-4">
      <p className="text-md font-semibold text-slate-700">Thông tin lập trình</p>

      <FormField
        label="Phiếu gốc (HĐ)"
        type="select"
        options={contractOptions.length > 0 ? contractOptions : [{ label: "Chưa có hợp đồng", value: "" }]}
        selectProps={{ ...register("businessContractId"), disabled: contractOptions.length === 0 }}
        error={errors.businessContractId?.message}
      />

      <FormField
        label="Module"
        type="select"
        options={moduleOptions.length > 0 ? moduleOptions : [{ label: "Chưa có danh mục", value: "" }]}
        selectProps={{ ...register("module"), disabled: moduleOptions.length === 0 }}
        error={errors.module?.message}
      />

      <FormField
        label="Mức độ ưu tiên"
        type="select"
        options={priorityOptions.length > 0 ? priorityOptions : [{ label: "Chưa có danh mục", value: "" }]}
        selectProps={{ ...register("priority"), disabled: priorityOptions.length === 0 }}
        error={errors.priority?.message}
      />

      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Thời gian"
          type="number"
          inputProps={{ ...register("durationValue"), min: "0.1", step: "0.1", placeholder: "Nhập số" }}
          error={errors.durationValue?.message}
        />
        <FormField
          label="Đơn vị"
          type="select"
          options={DURATION_UNIT_OPTIONS.map((item) => ({ label: item, value: item }))}
          selectProps={register("durationUnit")}
          error={errors.durationUnit?.message}
        />
      </div>

      <FormField
        label="Quy đổi"
        type="text"
        inputProps={{ ...register("convert"), readOnly: true, placeholder: "Tự động" }}
        error={errors.convert?.message}
      />

      <FormField
        label="Điểm cộng thêm"
        type="number"
        inputProps={{ ...register("bonusPoint"), min: "0", step: "0.125", placeholder: "Nhập điểm cộng thêm" }}
        error={errors.bonusPoint?.message}
      />

      {designEnabled ? (
        <FormField
          label="Thiết kế tham chiếu"
          type="select"
          options={designTaskOptions.length > 0 ? designTaskOptions : [{ label: "Chưa có dữ liệu design", value: "" }]}
          selectProps={{ ...register("designTaskId"), disabled: designTaskOptions.length === 0 }}
          error={errors.designTaskId?.message}
        />
      ) : null}

      <div className="grid grid-cols-2 gap-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          <input type="checkbox" {...register("design")} />
          Design
        </label>
      </div>
    </div>
  );
}

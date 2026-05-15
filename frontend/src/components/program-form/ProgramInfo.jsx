import FormField from "@/components/ui/form-field";
import { ImageUpload } from "./ImageUpload";

const moduleOptions = ["Không tính điểm", "Cơ bản", "Cơ bản + Responsive", "Cơ bản + Mobile", "Giỏ hàng cơ bản"];
const durationUnitOptions = ["h", "ngày"];

export function ProgramInfo({
  register,
  errors,
  contractImages,
  onFilesSelected,
  onRemoveImage,
  onImageClick,
  isUploading,
}) {
  return (
    <div className="space-y-4 gap-1 flex flex-col rounded-xl border border-slate-100 p-4">
      <p className="text-sm font-semibold text-slate-700">Thông tin lập trình</p>

      <FormField
        label="Module"
        type="select"
        options={moduleOptions.map((item) => ({ label: item, value: item }))}
        selectProps={register("module")}
        error={errors.module?.message}
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
          options={durationUnitOptions.map((item) => ({ label: item, value: item }))}
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

      <div className="grid grid-cols-2 gap-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          <input type="checkbox" {...register("design")} />
          Design
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          <input type="checkbox" {...register("visible")} />
          Hiển thị
        </label>
      </div>

      <ImageUpload
        previews={contractImages}
        onFilesSelected={onFilesSelected}
        onRemoveImage={onRemoveImage}
        onImageClick={onImageClick}
        isUploading={isUploading}
        maxImages={6}
      />
    </div>
  );
}

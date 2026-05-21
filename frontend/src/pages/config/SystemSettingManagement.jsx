import { Clock3, HelpCircle, RotateCcw, Save, Settings2, UploadCloud } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button-v2";
import FormField from "@/components/ui/form-field";
import { systemSettingApi } from "@/lib/api-client";

const formSchema = z.object({
  source: z.object({
    defaultExpireValue: z.coerce.number().min(0, "Hạn tải source không hợp lệ"),
    defaultExpireUnit: z.enum(["hour", "day"]),
    allowSendExpiredSource: z.boolean(),
    autoMarkSentAfterMailSuccess: z.boolean(),
    autoSetDownloadedAt: z.boolean(),
  }),
  time: z.object({
    workingHoursPerDay: z.coerce.number().min(0.1, "Số giờ / ngày công không hợp lệ"),
    roundingDigits: z.coerce.number().int("Số chữ số làm tròn phải là số nguyên").min(0).max(6),
  }),
  upload: z.object({
    maxUploadSizeMb: z.coerce.number().min(1, "Dung lượng upload không hợp lệ"),
    maxFilesPerUpload: z.coerce.number().int("Số file phải là số nguyên").min(1, "Số file không hợp lệ"),
    allowedExtensions: z.string().trim().min(1, "Vui lòng nhập định dạng file cho phép"),
  }),
  sla: z.object({
    warningBeforeDeadlineHours: z.coerce.number().min(0, "Thời gian cảnh báo không hợp lệ"),
    programDefaultDueDays: z.coerce.number().min(0, "Hạn lập trình không hợp lệ"),
    correctionDefaultDueDays: z.coerce.number().min(0, "Hạn chỉnh sửa không hợp lệ"),
    upgradeDefaultDueDays: z.coerce.number().min(0, "Hạn nâng cấp không hợp lệ"),
  }),
});

const defaultValues = {
  source: {
    defaultExpireValue: 7,
    defaultExpireUnit: "day",
    allowSendExpiredSource: true,
    autoMarkSentAfterMailSuccess: true,
    autoSetDownloadedAt: true,
  },
  time: {
    workingHoursPerDay: 8,
    roundingDigits: 3,
  },
  upload: {
    maxUploadSizeMb: 10,
    maxFilesPerUpload: 5,
    allowedExtensions: "jpg,png,jpeg,webp,pdf,doc,docx,xls,xlsx,zip,rar",
  },
  sla: {
    warningBeforeDeadlineHours: 24,
    programDefaultDueDays: 3,
    correctionDefaultDueDays: 1,
    upgradeDefaultDueDays: 2,
  },
};

const mergeSettingsWithDefault = (settings = {}) => ({
  ...defaultValues,
  ...settings,
  source: {
    ...defaultValues.source,
    ...(settings.source || {}),
  },
  time: {
    ...defaultValues.time,
    ...(settings.time || {}),
  },
  upload: {
    ...defaultValues.upload,
    ...(settings.upload || {}),
  },
  sla: {
    ...defaultValues.sla,
    ...(settings.sla || {}),
  },
});

const formatConvertPreview = (hours, workingHoursPerDay, roundingDigits) => {
  const parsedHours = Number(hours);
  const parsedWorkingHours = Number(workingHoursPerDay);
  const parsedDigits = Number(roundingDigits);

  if (!Number.isFinite(parsedHours) || !Number.isFinite(parsedWorkingHours) || parsedWorkingHours <= 0) return "-";

  return Number(
    (parsedHours / parsedWorkingHours).toFixed(Number.isFinite(parsedDigits) ? parsedDigits : 3),
  ).toString();
};

function SystemSettingManagement() {
  const [isLoading, setIsLoading] = useState(true);
  const [showSourceHint, setShowSourceHint] = useState(false);
  const [showConvertHint, setShowConvertHint] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const sourceExpireValue = watch("source.defaultExpireValue");
  const sourceExpireUnit = watch("source.defaultExpireUnit");
  const workingHoursPerDay = watch("time.workingHoursPerDay");
  const roundingDigits = watch("time.roundingDigits");
  const maxUploadSizeMb = watch("upload.maxUploadSizeMb");

  const sourceExpireLabel = useMemo(() => {
    const unitLabel = sourceExpireUnit === "hour" ? "giờ" : "ngày";
    return `${sourceExpireValue || 0} ${unitLabel}`;
  }, [sourceExpireValue, sourceExpireUnit]);

  const oneHourPreview = useMemo(
    () => formatConvertPreview(1, workingHoursPerDay, roundingDigits),
    [workingHoursPerDay, roundingDigits],
  );

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await systemSettingApi.detail();
      reset(mergeSettingsWithDefault(response?.settings || {}));
    } catch (error) {
      toast.error(error?.message || "Không thể tải cấu hình SLA/tham số");
    } finally {
      setIsLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
        Đang tải cấu hình SLA/tham số...
      </div>
    );
  }

  const onSubmit = async (values) => {
    try {
      const response = await systemSettingApi.update({ settings: values });
      reset(mergeSettingsWithDefault(response?.settings || values));
      toast.success(response?.message || "Đã lưu cấu hình SLA/tham số");
    } catch (error) {
      toast.error(error?.message || "Không thể lưu cấu hình SLA/tham số");
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-base font-semibold text-slate-700">Cấu hình SLA / tham số</p>
            <p className="mt-1 text-sm text-slate-500">
              Thiết lập hạn tải source, quy đổi điểm/ngày công, upload và các mốc cảnh báo mặc định.
            </p>
          </div>
          <div className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
            Tham số hệ thống
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <Settings2 className="h-4 w-4 text-sky-600" />
              Hạn source mặc định
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Hiện tại: <span className="font-semibold text-slate-700">{sourceExpireLabel}</span>
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <Clock3 className="h-4 w-4 text-sky-600" />
              Quy đổi điểm/ngày công
            </div>
            <p className="mt-2 text-sm text-slate-500">
              1 giờ = <span className="font-semibold text-slate-700">{oneHourPreview}</span>
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <UploadCloud className="h-4 w-4 text-sky-600" />
              Giới hạn upload
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Tối đa: <span className="font-semibold text-slate-700">{`${maxUploadSizeMb || 0} MB`}</span>
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="rounded-tl-2xl rounded-tr-2xl bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 rounded-2xl border-t-3 border-slate-200 border-t-sky-500 px-4 py-3">
            <h2 className="text-base font-semibold text-gray-500">Cấu hình source</h2>
            <button
              type="button"
              onClick={() => setShowSourceHint((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-sky-700 hover:bg-sky-50"
            >
              <HelpCircle className="h-4 w-4" />
              {showSourceHint ? "Ẩn gợi ý" : "Gợi ý"}
            </button>
          </div>
          <div className="grid gap-4 border-x border-b border-slate-200 p-4 md:grid-cols-2">
            <FormField
              label="Hạn tải source mặc định"
              type="number"
              inputProps={register("source.defaultExpireValue", { valueAsNumber: true })}
              error={errors.source?.defaultExpireValue?.message}
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Đơn vị hạn tải</label>
              <select
                {...register("source.defaultExpireUnit")}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-light focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                <option value="hour">Giờ</option>
                <option value="day">Ngày</option>
              </select>
            </div>
            <FormField
              label="Cho phép gửi source đã quá hạn"
              type="checkbox"
              inputProps={register("source.allowSendExpiredSource")}
            />
            <FormField
              label="Tự cập nhật trạng thái gửi khi gửi mail thành công"
              type="checkbox"
              inputProps={register("source.autoMarkSentAfterMailSuccess")}
            />
            <FormField
              label="Tự set ngày tải khi xác nhận đã tải"
              type="checkbox"
              inputProps={register("source.autoSetDownloadedAt")}
            />
            {showSourceHint ? (
              <div className="md:col-span-2 rounded-lg border border-sky-100 bg-sky-50 p-3 text-sm text-sky-800">
                <span className="font-semibold">Gợi ý:</span> Hạn tải source mặc định dùng để tự điền hạn hiệu lực link
                khi tạo source mới. Nếu tắt cho phép gửi source đã quá hạn, hệ thống sẽ chặn gửi mail khi link đã hết
                hạn. Hai tùy chọn tự cập nhật giúp hệ thống tự đổi trạng thái gửi sau khi gửi mail thành công và tự điền
                ngày xác nhận tải khi chọn đã tải.
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-tl-2xl rounded-tr-2xl bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 rounded-2xl border-t-3 border-slate-200 border-t-sky-500 px-4 py-3">
            <h2 className="text-base font-semibold text-gray-500">Quy đổi điểm/ngày công</h2>
            <button
              type="button"
              onClick={() => setShowConvertHint((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-sky-700 hover:bg-sky-50"
            >
              <HelpCircle className="h-4 w-4" />
              {showConvertHint ? "Ẩn công thức" : "Công thức"}
            </button>
          </div>
          <div className="grid gap-4 border-x border-b border-slate-200 p-4 md:grid-cols-2">
            <FormField
              label="Số giờ tương đương 1 ngày công"
              type="number"
              inputProps={{ ...register("time.workingHoursPerDay", { valueAsNumber: true }), step: "0.1" }}
              error={errors.time?.workingHoursPerDay?.message}
            />
            <FormField
              label="Số chữ số làm tròn khi quy đổi"
              type="number"
              inputProps={register("time.roundingDigits", { valueAsNumber: true })}
              error={errors.time?.roundingDigits?.message}
            />
            {showConvertHint ? (
              <div className="md:col-span-2 rounded-lg border border-sky-100 bg-sky-50 p-3 text-sm text-sky-800">
                <span className="font-semibold">Công thức:</span> Giá trị quy đổi = Số giờ thực hiện / Số giờ tương
                đương 1 ngày công. Ví dụ nếu 1 ngày công = {workingHoursPerDay || 8} giờ thì 1 giờ = {oneHourPreview}, 8
                giờ = {formatConvertPreview(8, workingHoursPerDay, roundingDigits)}.
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-tl-2xl rounded-tr-2xl bg-white shadow-sm">
          <div className="rounded-2xl border-t-3 border-slate-200 border-t-sky-500 px-4 py-3">
            <h2 className="text-base font-semibold text-gray-500">Cấu hình upload</h2>
          </div>
          <div className="grid gap-4 border-x border-b border-slate-200 p-4 md:grid-cols-2">
            <FormField
              label="Giới hạn dung lượng upload mặc định MB"
              type="number"
              inputProps={register("upload.maxUploadSizeMb", { valueAsNumber: true })}
              error={errors.upload?.maxUploadSizeMb?.message}
            />
            <FormField
              label="Số file tối đa mỗi lần upload"
              type="number"
              inputProps={register("upload.maxFilesPerUpload", { valueAsNumber: true })}
              error={errors.upload?.maxFilesPerUpload?.message}
            />
            <FormField
              label="Định dạng file cho phép"
              className="md:col-span-2"
              inputProps={register("upload.allowedExtensions")}
              error={errors.upload?.allowedExtensions?.message}
            />
          </div>
        </div>

        <div className="rounded-tl-2xl rounded-tr-2xl bg-white shadow-sm">
          <div className="rounded-2xl border-t-3 border-slate-200 border-t-sky-500 px-4 py-3">
            <h2 className="text-base font-semibold text-gray-500">Cảnh báo / SLA</h2>
          </div>
          <div className="grid gap-4 border-x border-b border-slate-200 p-4 md:grid-cols-2">
            <FormField
              label="Cảnh báo trước hạn bao nhiêu giờ"
              type="number"
              inputProps={register("sla.warningBeforeDeadlineHours", { valueAsNumber: true })}
              error={errors.sla?.warningBeforeDeadlineHours?.message}
            />
            <FormField
              label="Hạn dự kiến lập trình mặc định"
              type="number"
              inputProps={register("sla.programDefaultDueDays", { valueAsNumber: true })}
              error={errors.sla?.programDefaultDueDays?.message}
            />
            <FormField
              label="Hạn dự kiến chỉnh sửa mặc định"
              type="number"
              inputProps={register("sla.correctionDefaultDueDays", { valueAsNumber: true })}
              error={errors.sla?.correctionDefaultDueDays?.message}
            />
            <FormField
              label="Hạn dự kiến nâng cấp mặc định"
              type="number"
              inputProps={register("sla.upgradeDefaultDueDays", { valueAsNumber: true })}
              error={errors.sla?.upgradeDefaultDueDays?.message}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <Button
            icon={RotateCcw}
            variant="secondary"
            label="Tải lại"
            onClick={() => void fetchSettings()}
            disabled={isLoading || isSubmitting}
          />
          <Button
            type="submit"
            icon={Save}
            variant="primary"
            label={isSubmitting ? "Đang lưu..." : "Lưu cấu hình"}
            disabled={isLoading || isSubmitting}
          />
        </div>
      </form>
    </div>
  );
}

export default SystemSettingManagement;

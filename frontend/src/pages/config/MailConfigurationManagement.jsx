import { Mail, Save, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button-v2";
import FormField from "@/components/ui/form-field";
import { mailConfigurationApi } from "@/lib/api-client";
import { usePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/constants/permissions";

const formSchema = z
  .object({
    smtpHost: z.string().trim(),
    smtpPort: z.coerce.number().int("SMTP port phải là số nguyên").min(1, "SMTP port không hợp lệ").max(65535),
    smtpSecure: z.boolean(),
    smtpUser: z.string().trim(),
    smtpPassword: z.string(),
    fromEmail: z.string().trim(),
    fromName: z.string().trim(),
    enableRealSend: z.boolean(),
    note: z.string().trim(),
  })
  .superRefine((values, ctx) => {
    if (!values.enableRealSend) return;

    if (!values.smtpHost) {
      ctx.addIssue({ code: "custom", path: ["smtpHost"], message: "Vui lòng nhập SMTP host" });
    }
    if (!values.smtpUser) {
      ctx.addIssue({ code: "custom", path: ["smtpUser"], message: "Vui lòng nhập SMTP user" });
    }
    if (!values.fromEmail) {
      ctx.addIssue({ code: "custom", path: ["fromEmail"], message: "Vui lòng nhập email người gửi" });
    }
  });

const defaultValues = {
  smtpHost: "",
  smtpPort: 587,
  smtpSecure: false,
  smtpUser: "",
  smtpPassword: "",
  fromEmail: "",
  fromName: "Dashboard",
  enableRealSend: false,
  note: "",
};

function MailConfigurationManagement() {
  const [isLoading, setIsLoading] = useState(true);
  const { can } = usePermission();
  const canUpdate = can(PERMISSIONS.CONFIG_MAIL_UPDATE);

  const [hasSmtpPassword, setHasSmtpPassword] = useState(false);
  const [updatedAt, setUpdatedAt] = useState("");

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

  const enableRealSend = watch("enableRealSend");
  const smtpSecure = watch("smtpSecure");
  const smtpPort = watch("smtpPort");

  const statusInfo = useMemo(() => {
    if (enableRealSend) {
      return {
        label: "Đang bật gửi mail thật",
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    }

    return {
      label: "Đang tắt gửi mail thật",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }, [enableRealSend]);

  const fetchConfiguration = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await mailConfigurationApi.detail();
      const config = response?.mailConfiguration || {};
      reset({
        smtpHost: config.smtpHost || "",
        smtpPort: Number(config.smtpPort || 587),
        smtpSecure: Boolean(config.smtpSecure),
        smtpUser: config.smtpUser || "",
        smtpPassword: "",
        fromEmail: config.fromEmail || "",
        fromName: config.fromName || "Dashboard",
        enableRealSend: Boolean(config.enableRealSend),
        note: config.note || "",
      });
      setHasSmtpPassword(Boolean(config.hasSmtpPassword));
      setUpdatedAt(config.updatedAt || "");
    } catch (error) {
      toast.error(error?.message || "Không thể tải cấu hình mail");
    } finally {
      setIsLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    void fetchConfiguration();
  }, [fetchConfiguration]);

  const onSubmit = async (values) => {
    try {
      const response = await mailConfigurationApi.update(values);
      const config = response?.mailConfiguration || {};
      setHasSmtpPassword(Boolean(config.hasSmtpPassword));
      setUpdatedAt(config.updatedAt || "");
      reset({
        ...values,
        smtpPassword: "",
      });
      toast.success(response?.message || "Đã lưu cấu hình mail");
    } catch (error) {
      toast.error(error?.message || "Không thể lưu cấu hình mail");
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-base font-semibold text-sky-700">Cấu hình mail</p>
            <p className="mt-1 text-sm text-slate-500">
              Thiết lập SMTP, email người gửi và chế độ bật/tắt gửi mail thật cho các phiếu lập trình, source và hợp đồng.
            </p>
          </div>
          <div className={`rounded-full border px-4 py-2 text-sm font-semibold ${statusInfo.className}`}>
            {statusInfo.label}
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <Mail className="h-4 w-4 text-sky-600" />
              SMTP
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Port hiện tại: <span className="font-semibold text-slate-700">{smtpPort || "-"}</span>
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <ShieldCheck className="h-4 w-4 text-sky-600" />
              Bảo mật
            </div>
            <p className="mt-2 text-sm text-slate-500">{smtpSecure ? "SSL/TLS đang bật" : "SSL/TLS đang tắt"}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <Save className="h-4 w-4 text-sky-600" />
              Cập nhật
            </div>
            <p className="mt-2 text-sm text-slate-500">{updatedAt || "Chưa có dữ liệu cập nhật"}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="rounded-tl-2xl rounded-tr-2xl bg-white shadow-sm">
        <div className="rounded-2xl border-t-3 border-slate-200 border-t-sky-500 px-4 py-3">
          <h2 className="text-base font-semibold text-sky-700">Thông tin SMTP</h2>
        </div>

        <fieldset disabled={!canUpdate} className="grid gap-4 border-x border-b border-slate-200 p-4 md:grid-cols-2">
          <FormField label="SMTP host" inputProps={register("smtpHost")} error={errors.smtpHost?.message} />
          <FormField
            label="SMTP port"
            type="number"
            inputProps={register("smtpPort", { valueAsNumber: true })}
            error={errors.smtpPort?.message}
          />
          <FormField label="SMTP user" inputProps={register("smtpUser")} error={errors.smtpUser?.message} />
          <div>
            <FormField
              label="SMTP password"
              type="password"
              inputProps={{
                ...register("smtpPassword"),
                placeholder: hasSmtpPassword ? "Để trống nếu không đổi mật khẩu" : "Nhập mật khẩu SMTP",
                autoComplete: "new-password",
              }}
              error={errors.smtpPassword?.message}
            />
            {hasSmtpPassword ? (
              <p className="mt-1 text-xs text-slate-500">
                Đã có mật khẩu SMTP được mã hóa trong database. Để trống nếu muốn giữ mật khẩu cũ.
              </p>
            ) : null}
          </div>
          <FormField label="Email người gửi" inputProps={register("fromEmail")} error={errors.fromEmail?.message} />
          <FormField label="Tên người gửi" inputProps={register("fromName")} error={errors.fromName?.message} />
          <FormField label="Dùng SSL/TLS" type="checkbox" inputProps={register("smtpSecure")} />
          <FormField label="Bật gửi mail thật" type="checkbox" inputProps={register("enableRealSend")} />
          <FormField
            label="Ghi chú"
            type="textarea"
            className="md:col-span-2"
            inputProps={{ ...register("note"), rows: 3 }}
            error={errors.note?.message}
          />

          <div className="rounded-lg border border-sky-100 bg-sky-50 p-3 text-sm text-slate-600 md:col-span-2">
            Gợi ý Gmail: dùng <span className="font-semibold text-slate-700">smtp.gmail.com</span>. Nếu port là{" "}
            <span className="font-semibold text-slate-700">587</span> thì tắt SSL/TLS. Nếu port là{" "}
            <span className="font-semibold text-slate-700">465</span> thì bật SSL/TLS.
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 md:col-span-2">
            <Button
              variant="secondary"
              label="Tải lại"
              onClick={() => void fetchConfiguration()}
              disabled={isLoading || isSubmitting || !canUpdate}
              title={!canUpdate ? "Bạn không có quyền lưu cấu hình mail" : undefined}
            />
            <Button
              type="submit"
              icon={Save}
              variant="primary"
              label={isSubmitting ? "Đang lưu..." : "Lưu cấu hình"}
              disabled={isLoading || isSubmitting}
            />
          </div>
        </fieldset>
      </form>
    </div>
  );
}

export default MailConfigurationManagement;
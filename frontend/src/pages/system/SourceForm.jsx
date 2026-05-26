import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { useSelector } from "react-redux";

import { FormActions } from "@/components/forms/FormActions";
import { hasPermission } from "@/lib/permissions";
import FormField from "@/components/ui/form-field";
import { SOURCE_DOWNLOAD_STATUS_OPTIONS, SOURCE_SEND_STATUS_OPTIONS } from "@/constants/program-source";
import {
  administrationPriceApi,
  advertisingPriceApi,
  domainPriceApi,
  hostPriceApi,
  packagePriceApi,
  programApi,
  sourceApi,
  sslPriceApi,
  systemSettingApi,
} from "@/lib/api-client";

const schema = z.object({
  programId: z.string().trim().min(1, "Vui lòng chọn Phiếu gốc (HĐ)"),
  domain: z.string().trim().min(1, "Vui lòng chọn Domain"),
  sourceLink: z.string().trim().url("Link source không hợp lệ"),
  expiresAt: z.string().trim().min(1, "Vui lòng chọn hạn hiệu lực link"),
  hostPriceId: z.string().optional(),
  sslPriceId: z.string().optional(),
  packagePriceId: z.string().optional(),
  administrationPriceId: z.string().optional(),
  advertisingPriceId: z.string().optional(),
  sendStatus: z.enum(SOURCE_SEND_STATUS_OPTIONS, { message: "Vui lòng chọn trạng thái gửi" }),
  downloadStatus: z.enum(SOURCE_DOWNLOAD_STATUS_OPTIONS, { message: "Vui lòng chọn xác nhận tải" }),
  downloadedAt: z.string().optional(),
  downloadCount: z.coerce.number().int("Số lượt tải phải là số nguyên").gte(0, "Số lượt tải không hợp lệ"),
  visible: z.boolean(),
  note: z.string().optional(),
});

const defaultValues = {
  programId: "",
  domain: "",
  sourceLink: "",
  expiresAt: "",
  hostPriceId: "",
  sslPriceId: "",
  packagePriceId: "",
  administrationPriceId: "",
  advertisingPriceId: "",
  sendStatus: SOURCE_SEND_STATUS_OPTIONS[0],
  downloadStatus: SOURCE_DOWNLOAD_STATUS_OPTIONS[0],
  downloadedAt: "",
  downloadCount: 0,
  visible: true,
  note: "",
};

const toDateTimeLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
};

const getSystemSettings = (response) => response?.settings || response?.systemSettings || {};

const getDefaultSourceExpiresAt = (settings) => {
  const sourceSettings = settings?.source || {};
  const rawValue = Number(sourceSettings.defaultExpireValue ?? 7);
  const expireValue = Number.isFinite(rawValue) && rawValue >= 0 ? rawValue : 7;
  const expireUnit = sourceSettings.defaultExpireUnit === "hour" ? "hour" : "day";

  const date = new Date();
  if (expireUnit === "hour") {
    date.setHours(date.getHours() + expireValue);
  } else {
    date.setDate(date.getDate() + expireValue);
  }

  return toDateTimeLocal(date);
};

const formatCurrency = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "";
  return `${parsed.toLocaleString("vi-VN")} đ`;
};

const appendPriceLabel = (label, price) => {
  const priceLabel = formatCurrency(price);
  return priceLabel ? `${label} - ${priceLabel}` : label;
};

const mapSourceToForm = (source) => ({
  programId: source.programId || "",
  domain: source.domain || "",
  sourceLink: source.sourceLink || "",
  expiresAt: toDateTimeLocal(source.expiresAt),
  hostPriceId: source.hostPriceId || "",
  sslPriceId: source.sslPriceId || "",
  packagePriceId: source.packagePriceId || "",
  administrationPriceId: source.administrationPriceId || "",
  advertisingPriceId: source.advertisingPriceId || "",
  sendStatus: source.sendStatus || SOURCE_SEND_STATUS_OPTIONS[0],
  downloadStatus: source.downloadStatus || SOURCE_DOWNLOAD_STATUS_OPTIONS[0],
  downloadedAt: toDateTimeLocal(source.downloadedAt),
  downloadCount: Number(source.downloadCount) || 0,
  visible: Boolean(source.visible ?? true),
  note: source.note || "",
});

function SourceForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const currentUser = useSelector((state) => state.auth.user);
  const canSave = hasPermission(currentUser, isEditMode ? "source.update" : "source.create");
  const canSendMail = hasPermission(currentUser, "source.sendMail");
  const returnPath = location.state?.sourcePath || "/he-thong/source";
  const [programReferences, setProgramReferences] = useState([]);
  const [domainPriceReferences, setDomainPriceReferences] = useState([]);
  const [hostPriceReferences, setHostPriceReferences] = useState([]);
  const [sslPriceReferences, setSslPriceReferences] = useState([]);
  const [packagePriceReferences, setPackagePriceReferences] = useState([]);
  const [administrationPriceReferences, setAdministrationPriceReferences] = useState([]);
  const [advertisingPriceReferences, setAdvertisingPriceReferences] = useState([]);
  const [isLoadingSources, setIsLoadingSources] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState(defaultValues);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const selectedProgramId = useWatch({ control, name: "programId" });
  const selectedDownloadStatus = useWatch({ control, name: "downloadStatus" });
  const selectedProgram = useMemo(
    () => programReferences.find((item) => item.id === selectedProgramId),
    [programReferences, selectedProgramId],
  );

  useEffect(() => {
    if (selectedDownloadStatus !== "Đã tải") {
      setValue("downloadedAt", "", { shouldValidate: true });
    }
  }, [selectedDownloadStatus, setValue]);

  useEffect(() => {
    const fetchProgramReferences = async () => {
      setIsLoadingSources(true);
      try {
        const [
          programResponse,
          domainResponse,
          hostResponse,
          sslResponse,
          packageResponse,
          administrationResponse,
          advertisingResponse,
          settingResponse,
        ] = await Promise.all([
          programApi.references(),
          domainPriceApi.list(),
          hostPriceApi.list(),
          sslPriceApi.list(),
          packagePriceApi.list(),
          administrationPriceApi.list(),
          advertisingPriceApi.list(),
          systemSettingApi.detail(),
        ]);

        const programs = Array.isArray(programResponse?.programs) ? programResponse.programs : [];
        const domainPrices = Array.isArray(domainResponse?.domainPrices) ? domainResponse.domainPrices : [];
        const hostPrices = Array.isArray(hostResponse?.hostPrices) ? hostResponse.hostPrices : [];
        const sslPrices = Array.isArray(sslResponse?.sslPrices) ? sslResponse.sslPrices : [];
        const packagePrices = Array.isArray(packageResponse?.packagePrices) ? packageResponse.packagePrices : [];
        const administrationPrices = Array.isArray(administrationResponse?.administrationPrices)
          ? administrationResponse.administrationPrices
          : [];
        const advertisingPrices = Array.isArray(advertisingResponse?.advertisingPrices)
          ? advertisingResponse.advertisingPrices
          : [];
        const systemSettings = getSystemSettings(settingResponse);

        setProgramReferences(programs);
        setDomainPriceReferences(domainPrices);
        setHostPriceReferences(hostPrices);
        setSslPriceReferences(sslPrices);
        setPackagePriceReferences(packagePrices);
        setAdministrationPriceReferences(administrationPrices);
        setAdvertisingPriceReferences(advertisingPrices);

        if (!isEditMode) {
          const first = programs[0];
          const firstDomain = domainPrices[0];
          const nextDefault = {
            ...defaultValues,
            programId: first?.id || "",
            domain: firstDomain?.extension || "",
            expiresAt: getDefaultSourceExpiresAt(systemSettings),
          };
          reset(nextDefault);
          setInitialSnapshot(nextDefault);
        }
      } catch (error) {
        toast.error(error?.message || "Không thể tải danh sách phiếu gốc");
      } finally {
        setIsLoadingSources(false);
      }
    };
    void fetchProgramReferences();
  }, [isEditMode, reset]);

  useEffect(() => {
    if (!isEditMode) return;
    const fetchDetail = async () => {
      setIsLoadingDetail(true);
      try {
        const response = await sourceApi.detail(id);
        const source = response?.source;
        if (!source) {
          toast.error("Không tìm thấy source");
          navigate(returnPath);
          return;
        }
        const mapped = mapSourceToForm(source);
        reset(mapped);
        setInitialSnapshot(mapped);
      } catch (error) {
        toast.error(error?.message || "Không thể tải chi tiết source");
        navigate(returnPath);
      } finally {
        setIsLoadingDetail(false);
      }
    };
    void fetchDetail();
  }, [id, isEditMode, navigate, reset, returnPath]);

  const persistSource = async (values, mode) => {
    const payload = {
      programId: values.programId,
      domain: values.domain,
      sourceLink: values.sourceLink,
      expiresAt: values.expiresAt,
      hostPriceId: values.hostPriceId || null,
      sslPriceId: values.sslPriceId || null,
      packagePriceId: values.packagePriceId || null,
      administrationPriceId: values.administrationPriceId || null,
      advertisingPriceId: values.advertisingPriceId || null,
      sendStatus: values.sendStatus,
      downloadStatus: values.downloadStatus,
      downloadedAt: values.downloadStatus === "Đã tải" ? values.downloadedAt || null : null,
      downloadCount: values.downloadCount,
      visible: values.visible,
      note: values.note || "",
      sendMail: mode === "save-mail",
    };

    let savedSource = null;
    let message = "";
    try {
      if (isEditMode) {
        const response = await sourceApi.update(id, payload);
        savedSource = response?.source || null;
        message = response?.message || "Cập nhật source thành công";
      } else {
        const response = await sourceApi.create(payload);
        savedSource = response?.source || null;
        message = response?.message || "Lưu source thành công";
      }
    } catch (error) {
      toast.error(error?.message || "Không thể lưu source");
      return;
    }

    if (mode === "save-stay") {
      toast.success(message);
      if (!isEditMode && savedSource?.id) {
        navigate(`/he-thong/source/chinh-sua/${savedSource.id}`, { replace: true });
        return;
      }
      const nextSnapshot = mapSourceToForm(savedSource || values);
      setInitialSnapshot(nextSnapshot);
      reset(nextSnapshot);
      return;
    }

    toast.success(message);
    navigate(returnPath);
  };

  const isReadOnlyMode = !canSave;

  const onSubmit = async (values, mode) => {
    if (!canSave) {
      toast.error("Bạn không có quyền lưu dữ liệu này");
      return;
    }
    if (mode === "save-mail" && !canSendMail) {
      toast.error("Bạn không có quyền gửi mail source");
      return;
    }
    await persistSource(values, mode);
  };

  const submitWithMode = (mode) =>
    handleSubmit(
      (values) => onSubmit(values, mode),
      () => toast.error("Vui lòng kiểm tra lại thông tin form"),
    )();

  if (isLoadingSources || isLoadingDetail) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Đang tải dữ liệu...</div>
    );
  }

  return (
    <form className="space-y-4">
      <FormActions
        onSave={() => submitWithMode("save")}
        onSaveMail={() => submitWithMode("save-mail")}
        onSaveStay={() => submitWithMode("save-stay")}
        onReset={() => reset(initialSnapshot)}
        isSubmitting={isSubmitting}
        isUploading={false}
        isEditMode={isEditMode}
        exitPath={returnPath}
        readOnlyMode={isReadOnlyMode}
        saveMailDisabled={!canSendMail}
      />

      <fieldset disabled={isReadOnlyMode} className="contents">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-3 text-lg font-semibold text-slate-700">Nội dung source</div>
        <div className="grid gap-5 p-5 lg:grid-cols-2">
          <div className="flex flex-col gap-4 rounded-xl border border-slate-100 p-4">
            <p className="text-md font-semibold text-slate-700">Thông tin source</p>

            <FormField
              label="Phiếu gốc / Số HĐ"
              type="select"
              options={
                programReferences.length === 0
                  ? [{ label: "Không có dữ liệu", value: "" }]
                  : programReferences.map((item) => ({
                      label: `${item.contractCode} - ${item.contractName} - ${item.customerName}`.trim(),
                      value: item.id,
                    }))
              }
              selectProps={{
                ...register("programId"),
                disabled: programReferences.length === 0,
              }}
              error={errors.programId?.message}
            />

            <FormField
              label="Module"
              type="text"
              inputProps={{
                value: selectedProgram?.module || "",
                readOnly: true,
                placeholder: "Tự động theo phiếu gốc",
              }}
            />

            <FormField
              label="Link source"
              type="text"
              inputProps={{ ...register("sourceLink"), placeholder: "https://..." }}
              error={errors.sourceLink?.message}
            />

            <FormField
              label="Hạn hiệu lực link"
              type="datetime-local"
              inputProps={{ ...register("expiresAt") }}
              error={errors.expiresAt?.message}
            />

            <FormField
              label="Trạng thái gửi"
              type="select"
              options={SOURCE_SEND_STATUS_OPTIONS.map((item) => ({ label: item, value: item }))}
              selectProps={register("sendStatus")}
              error={errors.sendStatus?.message}
            />

            <FormField
              label="Ghi chú"
              type="textarea"
              inputProps={{ ...register("note"), rows: 3, placeholder: "Ghi chú thêm (nếu có)" }}
              error={errors.note?.message}
            />
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-slate-100 p-4">
            <p className="text-md font-semibold text-slate-700">Theo dõi tải source</p>

            <FormField
              label="Xác nhận tải"
              type="select"
              options={SOURCE_DOWNLOAD_STATUS_OPTIONS.map((item) => ({ label: item, value: item }))}
              selectProps={register("downloadStatus")}
              error={errors.downloadStatus?.message}
            />

            <FormField
              label="Ngày xác nhận tải"
              type="datetime-local"
              inputProps={{
                ...register("downloadedAt"),
                disabled: selectedDownloadStatus !== "Đã tải",
              }}
              error={errors.downloadedAt?.message}
            />

            <FormField
              label="Số lượt tải"
              type="number"
              inputProps={{ ...register("downloadCount"), min: "0", step: "1" }}
              error={errors.downloadCount?.message}
            />

            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <input type="checkbox" {...register("visible")} />
              Hiển thị
            </label>

            <FormField
              label="Email kinh doanh nhận"
              type="text"
              inputProps={{
                value: selectedProgram?.salesReceiverEmail || "",
                readOnly: true,
                placeholder: "Tự động theo phiếu gốc",
              }}
            />

            <FormField
              label="Danh sách email cc"
              type="text"
              inputProps={{
                value: Array.isArray(selectedProgram?.ccEmails) ? selectedProgram.ccEmails.join(", ") : "",
                readOnly: true,
                placeholder: "Tự động theo phiếu gốc",
              }}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-3 text-lg font-semibold text-slate-700">
          Tham chiếu bảng giá
        </div>
        <div className="grid gap-5 p-5 lg:grid-cols-2">
          <FormField
            label="Bảng giá domain"
            type="select"
            options={
              domainPriceReferences.length === 0
                ? [{ label: "Không có dữ liệu", value: "" }]
                : domainPriceReferences.map((item) => ({
                    label: appendPriceLabel(`${item.extension} - ${item.provider}`.trim(), item.registerPrice),
                    value: item.extension,
                  }))
            }
            selectProps={{
              ...register("domain"),
              disabled: domainPriceReferences.length === 0,
            }}
            error={errors.domain?.message}
          />

          <FormField
            label="Bảng giá host"
            type="select"
            options={
              hostPriceReferences.length === 0
                ? [{ label: "Không có dữ liệu", value: "" }]
                : hostPriceReferences.map((item) => ({
                    label: appendPriceLabel(`${item.name} - ${item.storage}`.trim(), item.monthlyPrice),
                    value: item.id,
                  }))
            }
            selectProps={{
              ...register("hostPriceId"),
              disabled: hostPriceReferences.length === 0,
            }}
            error={errors.hostPriceId?.message}
          />

          <FormField
            label="Bảng giá SSL"
            type="select"
            options={
              sslPriceReferences.length === 0
                ? [{ label: "Không có dữ liệu", value: "" }]
                : sslPriceReferences.map((item) => ({
                    label: appendPriceLabel(
                      `${item.name} - ${item.sslType} - ${item.validityMonths} tháng`.trim(),
                      item.price,
                    ),
                    value: item.id,
                  }))
            }
            selectProps={{
              ...register("sslPriceId"),
              disabled: sslPriceReferences.length === 0,
            }}
            error={errors.sslPriceId?.message}
          />

          <FormField
            label="Bảng giá trọn gói"
            type="select"
            options={
              packagePriceReferences.length === 0
                ? [{ label: "Không có dữ liệu", value: "" }]
                : packagePriceReferences.map((item) => ({
                    label: appendPriceLabel(item.name || "Gói trọn gói", item.yearlyPrice),
                    value: item.id,
                  }))
            }
            selectProps={{
              ...register("packagePriceId"),
              disabled: packagePriceReferences.length === 0,
            }}
            error={errors.packagePriceId?.message}
          />

          <FormField
            label="Bảng giá quản trị"
            type="select"
            options={
              administrationPriceReferences.length === 0
                ? [{ label: "Không có dữ liệu", value: "" }]
                : administrationPriceReferences.map((item) => ({
                    label: appendPriceLabel(
                      `${item.serviceName} - ${item.scope} - ${item.frequency}`.trim(),
                      item.price,
                    ),
                    value: item.id,
                  }))
            }
            selectProps={{
              ...register("administrationPriceId"),
              disabled: administrationPriceReferences.length === 0,
            }}
            error={errors.administrationPriceId?.message}
          />

          <FormField
            label="Bảng giá quảng cáo"
            type="select"
            options={
              advertisingPriceReferences.length === 0
                ? [{ label: "Không có dữ liệu", value: "" }]
                : advertisingPriceReferences.map((item) => ({
                    label: appendPriceLabel(`${item.platform} - ${item.packageName}`.trim(), item.minimumBudget),
                    value: item.id,
                  }))
            }
            selectProps={{
              ...register("advertisingPriceId"),
              disabled: advertisingPriceReferences.length === 0,
            }}
            error={errors.advertisingPriceId?.message}
          />
        </div>
      </div>
      </fieldset>
    </form>
  );
}

export default SourceForm;
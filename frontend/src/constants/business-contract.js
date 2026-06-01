export const BUSINESS_CONTRACT_PROJECT_STATUS_CATEGORY_TYPE = "contractProjectStatus";
export const BUSINESS_CONTRACT_TYPE_CATEGORY_TYPE = "contractType";

export const HANDOVER_STATUS_OPTIONS = ["Chưa bàn giao", "Đã bàn giao"];


export const BUSINESS_CONTRACT_STATUS_OPTIONS = ["Chưa nhận", "Đã nhận", "Đang làm", "Ưu tiên", "Hoãn"];

export const BUSINESS_CONTRACT_LEGACY_STATUS_OPTIONS = ["Đang xử lý", "Hoàn thành"];

export const BUSINESS_CONTRACT_ALLOWED_STATUS_OPTIONS = [
  ...BUSINESS_CONTRACT_STATUS_OPTIONS,
  ...BUSINESS_CONTRACT_LEGACY_STATUS_OPTIONS,
];

export const BUSINESS_CONTRACT_TYPE_TEXT_CLASS = {
  "Giao diện": "text-violet-700",
  "Lập trình": "text-sky-700",
  "Nâng cấp": "text-amber-700",
  Upsource: "text-emerald-700",
};

export const BUSINESS_CONTRACT_STATUS_BADGE_CLASS = {
  "Chưa nhận": "border-slate-200 bg-slate-50 text-slate-600",
  "Đã nhận": "border-sky-100 bg-sky-50 text-sky-700",
  "Đang làm": "border-indigo-100 bg-indigo-50 text-indigo-700",
  "Ưu tiên": "border-amber-100 bg-amber-50 text-amber-700",
  "Hoãn": "border-rose-100 bg-rose-50 text-rose-700",
  "Đang xử lý": "border-indigo-100 bg-indigo-50 text-indigo-700",
  "Hoàn thành": "border-emerald-100 bg-emerald-50 text-emerald-700",
};

import { RotateCw, Save, SquareArrowRightExit } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function FormActions({ onSave, onSaveMail, onSaveStay, onReset, isSubmitting, isUploading }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <button
        type="button"
        onClick={onSave}
        disabled={isSubmitting || isUploading}
        className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-sky-400"
      >
        <Save className="h-4 w-4" />
        Lưu
      </button>
      <button
        type="button"
        onClick={onSaveMail}
        disabled={isSubmitting || isUploading}
        className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-blue-400"
      >
        <Save className="h-4 w-4" />
        Lưu gửi mail
      </button>
      <button
        type="button"
        onClick={onSaveStay}
        disabled={isSubmitting || isUploading}
        className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-emerald-400"
      >
        <Save className="h-4 w-4" />
        Lưu tại trang
      </button>
      <button
        type="button"
        onClick={onReset}
        disabled={isSubmitting || isUploading}
        className="inline-flex items-center gap-2 rounded-md bg-slate-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        <RotateCw className="h-4 w-4" />
        Làm lại
      </button>
      <button
        type="button"
        onClick={() => navigate("/lap-trinh/danh-sach")}
        disabled={isSubmitting || isUploading}
        className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-rose-400"
      >
        <SquareArrowRightExit className="h-4 w-4" />
        Thoát
      </button>
    </div>
  );
}

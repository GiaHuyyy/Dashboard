import { RotateCw, Save, SquareArrowRightExit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button-v2";

export function FormActions({ onSave, onSaveMail, onSaveStay, onReset, isSubmitting, isUploading, isEditMode }) {
  const navigate = useNavigate();
  const isDisabled = isSubmitting || isUploading;
  const primaryLabel = isEditMode ? "Cập nhật" : "Lưu";
  const saveMailLabel = isEditMode ? "Cập nhật gửi mail" : "Lưu gửi mail";
  const saveStayLabel = isEditMode ? "Cập nhật tại trang" : "Lưu tại trang";

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <Button icon={Save} label={primaryLabel} onClick={onSave} disabled={isDisabled} variant="primary" />
      <Button icon={Save} label={saveMailLabel} onClick={onSaveMail} disabled={isDisabled} variant="info" />
      <Button icon={Save} label={saveStayLabel} onClick={onSaveStay} disabled={isDisabled} variant="success" />
      <Button icon={RotateCw} label="Làm lại" onClick={onReset} disabled={isDisabled} variant="secondary" />
      <Button
        icon={SquareArrowRightExit}
        label="Thoát"
        onClick={() => navigate("/lap-trinh/danh-sach")}
        disabled={isDisabled}
        variant="danger"
      />
    </div>
  );
}

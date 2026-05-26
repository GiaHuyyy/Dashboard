import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button-v2";

export function ManagementActions({
  onAdd,
  onDeleteAll,
  deleteLabel = "Xóa tất cả",
  deleteDisabled = false,
  addDisabled = false,
  addTitle,
  deleteTitle,
  showDeleteAll = true,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <Button
        icon={Plus}
        label="Thêm mới"
        onClick={onAdd}
        variant="primary"
        size="lg"
        className="shadow-sm"
        gap="gap-1"
        disabled={addDisabled}
        title={addTitle}
      />
      {showDeleteAll && (
        <Button
          icon={Trash2}
          label={deleteLabel}
          onClick={onDeleteAll}
          variant="danger"
          size="lg"
          className="shadow-sm"
          gap="gap-1"
          disabled={deleteDisabled}
          title={deleteTitle}
        />
      )}
    </div>
  );
}
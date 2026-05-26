import { Eye, SquarePen, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { ManagementActions } from "@/components/management/ManagementActions";
import { ManagementTableCard } from "@/components/management/ManagementTableCard";
import { Button } from "@/components/ui/button-v2";
import Modal from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useManagementList } from "@/hooks/useManagementList";
import { emailTemplateApi } from "@/lib/api-client";
import { PERMISSION_DENIED_MESSAGE, usePermission } from "@/lib/permissions";

const TEMPLATE_TYPES = [
  { value: "source", label: "Source" },
  { value: "contract", label: "Hợp đồng" },
];

const ALLOWED_TEMPLATE_TYPES = TEMPLATE_TYPES.map((item) => item.value);

const TEMPLATE_STATUS_OPTIONS = [
  { value: "draft", label: "Bản nháp" },
  { value: "active", label: "Đang dùng" },
];

const getTypeLabel = (value) => TEMPLATE_TYPES.find((item) => item.value === value)?.label || value;

function EmailTemplateManagement() {
  const navigate = useNavigate();
  const [activeType, setActiveType] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewRow, setPreviewRow] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState("");
  const { can } = usePermission();

  const canView = can("template.view");
  const canCreate = can("template.create");
  const canUpdate = can("template.update");
  const canDelete = can("template.delete");
  const getEmailTemplateListParams = useCallback(
    (value) => ({
      templateType: activeType,
      status: statusFilter,
      search: value.trim(),
      limit: 200,
    }),
    [activeType, statusFilter],
  );
  const filterAllowedTemplates = useCallback(
    (items) => items.filter((item) => ALLOWED_TEMPLATE_TYPES.includes(item.templateType)),
    [],
  );

  const {
    rows,
    setRows,
    searchText,
    setSearchText,
    isLoading,
    selectedIds,
    deleteOpen,
    setDeleteOpen,
    deleteRow,
    setDeleteRow,
    displayedRows,
    isAllFilteredSelected,
    deleteManyLabel,
    handleToggleAll,
    handleToggleRow,
    handleDelete,
  } = useManagementList({
    listApi: emailTemplateApi.list,
    removeApi: emailTemplateApi.remove,
    removeManyApi: emailTemplateApi.removeMany,
    responseKey: "templates",
    getListParams: getEmailTemplateListParams,
    transformRows: filterAllowedTemplates,
    loadErrorMessage: "Không thể tải thư viện mẫu email",
    noDeletePermissionMessage: PERMISSION_DENIED_MESSAGE,
    deleteOneSuccessMessage: "Đã xóa mẫu email",
    deleteManySuccessMessage: ({ deletedCount, selectedCount }) =>
      `Đã xóa ${deletedCount || selectedCount} mẫu email`,
    deleteAllSuccessMessage: ({ deletedCount }) => `Đã xóa toàn bộ (${deletedCount || 0}) mẫu email`,
    deleteErrorMessage: "Xóa mẫu email không thành công",
  });

  const openPreview = (row) => {
    setPreviewRow(row);
    setPreviewOpen(true);
  };
  const handleStatusChange = async (row, nextStatus) => {
    if (!row?.id || nextStatus === row.status) return;

    if (!canUpdate) {
      toast.error(PERMISSION_DENIED_MESSAGE);
      return;
    }

    setUpdatingStatusId(row.id);
    try {
      const response = await emailTemplateApi.update(row.id, { status: nextStatus });
      const updated = response?.template || { ...row, status: nextStatus };
      setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, ...updated } : item)));
      toast.success("Đã cập nhật trạng thái mẫu email");
    } catch (error) {
      toast.error(error?.message || "Không thể cập nhật trạng thái mẫu email");
    } finally {
      setUpdatingStatusId("");
    }
  };

  const openDetail = (row) => {
    if (!canView) {
      toast.error(PERMISSION_DENIED_MESSAGE);
      return;
    }

    navigate(`/bieu-mau/mau-email/chinh-sua/${row.id}`);
  };

  return (
    <>
      <ManagementActions
        onAdd={() => navigate("/bieu-mau/mau-email/them-moi")}
        addDisabled={!canCreate}
        addTitle={!canCreate ? PERMISSION_DENIED_MESSAGE : undefined}
        onDeleteAll={() => {
          setDeleteRow(null);
          setDeleteOpen(true);
        }}
        deleteDisabled={rows.length === 0 || !canDelete}
        deleteTitle={!canDelete ? PERMISSION_DENIED_MESSAGE : undefined}
        deleteLabel={deleteManyLabel}
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
          <select
            value={activeType}
            onChange={(event) => setActiveType(event.target.value)}
            className="w-52 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          >
            <option value="all">Tất cả</option>
            {TEMPLATE_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-52 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          >
            <option value="all">Tất cả trạng thái</option>
            {TEMPLATE_STATUS_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

      <ManagementTableCard
        title="Danh sách mẫu email"
        searchText={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm mẫu email"
      >
        <Table className="min-w-full text-center text-sm">
          <TableHeader className="bg-slate-50 text-slate-500">
            <TableRow>
              <TableHead className="w-12 border border-slate-200 px-4">
                <input
                  type="checkbox"
                  checked={isAllFilteredSelected}
                  disabled={!canDelete}
                  title={!canDelete ? PERMISSION_DENIED_MESSAGE : undefined}
                  onChange={(event) => handleToggleAll(event.target.checked)}
                  onClick={(event) => event.stopPropagation()}
                />
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                STT
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Loại mẫu
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Tên mẫu
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Tiêu đề email
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Trạng thái
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Default
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Cập nhật
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Thao tác
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="border border-slate-200 p-4 py-8 text-slate-500">
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : displayedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="border border-slate-200 p-4 py-8 text-slate-500">
                  Chưa có mẫu email
                </TableCell>
              </TableRow>
            ) : (
              displayedRows.map((row, index) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer text-slate-700 hover:bg-slate-50"
                  onClick={() => openDetail(row)}
                >
                  <TableCell className="border border-slate-200 p-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      disabled={!canDelete}
                      title={!canDelete ? PERMISSION_DENIED_MESSAGE : undefined}
                      onChange={(event) => handleToggleRow(row.id, event.target.checked)}
                      onClick={(event) => event.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4">
                    <span className="border px-3 py-1.5">{index + 1}</span>
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4">{getTypeLabel(row.templateType)}</TableCell>
                  <TableCell className="border border-slate-200 p-4 text-left font-semibold text-sky-700">
                    {row.name}
                  </TableCell>
                  <TableCell className="max-w-70 truncate border border-slate-200 p-4 text-left">
                    {row.subject}
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4" onClick={(event) => event.stopPropagation()}>
                    <select
                      value={row.status || "draft"}
                      disabled={updatingStatusId === row.id || !canUpdate}
                      title={!canUpdate ? PERMISSION_DENIED_MESSAGE : undefined}
                      onChange={(event) => void handleStatusChange(row, event.target.value)}
                      className={`w-full min-w-30 rounded-md border border-slate-200 px-2 py-1.5 text-sm font-medium focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 ${
                        row.status === "active" ? "text-emerald-700" : "text-amber-700"
                      }`}
                    >
                      {TEMPLATE_STATUS_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4">
                    {row.isDefault ? <span className="font-semibold text-sky-700">Default</span> : "-"}
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.updatedAt || "-"}</TableCell>
                  <TableCell
                    className="border border-slate-200 p-4 text-center"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        icon={Eye}
                        variant="primary-outline"
                        iconOnly
                        className="text-sky-500"
                        onClick={() => openPreview(row)}
                      />
                      <Button
                        icon={SquarePen}
                        variant="primary-outline"
                        iconOnly
                        className="text-sky-500"
                        onClick={() => openDetail(row)}
                      />
                      <Button
                        icon={Trash2}
                        variant="danger-outline"
                        iconOnly
                        className="text-rose-700"
                        disabled={!canDelete}
                        title={!canDelete ? PERMISSION_DENIED_MESSAGE : "Xóa"}
                        onClick={() => {
                          if (!canDelete) {
                            toast.error(PERMISSION_DENIED_MESSAGE);
                            return;
                          }
                          setDeleteRow(row);
                          setDeleteOpen(true);
                        }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ManagementTableCard>

      <Modal
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewRow(null);
        }}
        title="Preview mẫu email"
        size="lg"
      >
        <div className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700">
          <p className="font-semibold text-slate-800">{previewRow?.subject || "Tiêu đề email"}</p>
          <div className="mt-3 whitespace-pre-wrap leading-6">{previewRow?.body || "Nội dung mẫu email"}</div>
        </div>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteRow(null);
        }}
        title="Xác nhận xóa"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              label="Hủy"
              onClick={() => {
                setDeleteOpen(false);
                setDeleteRow(null);
              }}
            />
            <Button variant="danger" label="Xóa" onClick={() => void handleDelete({ canDelete: canDelete })} disabled={!canDelete} title={!canDelete ? PERMISSION_DENIED_MESSAGE : undefined} />
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          {deleteRow?.id
            ? `Bạn có chắc chắn muốn xóa mẫu email "${deleteRow.name}"?`
            : "Bạn có chắc chắn muốn xóa các mẫu email đã chọn?"}
        </p>
      </Modal>
    </>
  );
}

export default EmailTemplateManagement;
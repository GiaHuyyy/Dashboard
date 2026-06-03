import { ExternalLink, ImageOff, SquarePen, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { ManagementActions } from "@/components/management/ManagementActions";
import { ManagementTableCard } from "@/components/management/ManagementTableCard";
import { ManagementPagination } from "@/components/management/ManagementPagination";
import { Button } from "@/components/ui/button-v2";
import Modal from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useManagementList } from "@/hooks/useManagementList";
import { websiteTemplateApi } from "@/lib/api-client";
import { usePermission } from "@/lib/permissions";
import { useSystemCategoryOptions } from "@/lib/system-categories";
import { PERMISSIONS } from "@/constants/permissions";

const PLATFORM_OPTIONS = [
  { label: "Tất cả nền tảng", value: "all" },
  { label: "React", value: "React" },
  { label: "HTML/CSS", value: "HTML/CSS" },
  { label: "WordPress", value: "WordPress" },
  { label: "Laravel", value: "Laravel" },
  { label: "Khác", value: "Khác" },
];

const getGoogleDriveFileId = (url) => {
  const value = String(url || "").trim();
  if (!value) return "";

  const fileMatch = value.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
  if (fileMatch?.[1]) return fileMatch[1];

  const idMatch = value.match(/[?&]id=([^&]+)/i);
  if (idMatch?.[1]) return idMatch[1];

  return "";
};

const getPreviewImageUrl = (url) => {
  const value = String(url || "").trim();
  if (!value) return "";
  const driveFileId = getGoogleDriveFileId(value);
  if (driveFileId) {
    return `https://drive.google.com/thumbnail?id=${encodeURIComponent(driveFileId)}&sz=w1000`;
  }

  return value;
};

const openExternalLink = (url) => {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
};

function PreviewImage({ src, alt }) {
  const [hasError, setHasError] = useState(false);
  const imageUrl = useMemo(() => getPreviewImageUrl(src), [src]);

  if (!imageUrl || hasError) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 text-[11px] text-slate-400">
        <ImageOff />
        Chưa có ảnh
      </div>
    );
  }

  return (
    <button
      type="button"
      className="mx-auto block rounded-xl border border-slate-200 bg-slate-50 p-1 shadow-sm transition hover:border-sky-300 hover:shadow-md"
      onClick={() => openExternalLink(src)}
      title="Bấm để mở ảnh gốc"
    >
      <img
        src={imageUrl}
        alt={alt}
        className="h-20 w-32 rounded-lg bg-white object-contain"
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
      />
    </button>
  );
}

function WebsiteTemplateManagement() {
  const navigate = useNavigate();
  const { can } = usePermission();
  const canCreate = can(PERMISSIONS.WEBSITE_TEMPLATE_CREATE);
  const canUpdate = can(PERMISSIONS.WEBSITE_TEMPLATE_UPDATE);
  const canDelete = can(PERMISSIONS.WEBSITE_TEMPLATE_DELETE);
  const { options: categoryOptions } = useSystemCategoryOptions("websiteTemplate", {
    includeAll: true,
    allLabel: "Tất cả danh mục",
    allValue: "all",
  });

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [selectedActive, setSelectedActive] = useState("all");
  const getWebsiteTemplateListParams = useCallback(
    ({ searchText, page, limit }) => ({
      search: searchText.trim(),
      category: selectedCategory,
      platform: selectedPlatform,
      active: selectedActive,
      page,
      limit,
    }),
    [selectedActive, selectedCategory, selectedPlatform],
  );

  const {
    rows,
    setRows,
    total,
    page,
    limit,
    setPage,
    setLimit,
    rowNumberOffset,
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
    listApi: websiteTemplateApi.list,
    removeApi: websiteTemplateApi.remove,
    removeManyApi: websiteTemplateApi.removeMany,
    responseKey: "websiteTemplates",
    getListParams: getWebsiteTemplateListParams,
    enablePagination: true,
    loadErrorMessage: "Không thể tải danh sách website mẫu",
    noDeletePermissionMessage: "Bạn không có quyền xóa website mẫu",
    deleteOneSuccessMessage: "Đã xóa website mẫu",
    deleteManySuccessMessage: ({ deletedCount, selectedCount }) =>
      `Đã xóa ${deletedCount || selectedCount} website mẫu`,
    deleteAllSuccessMessage: ({ deletedCount }) => `Đã xóa toàn bộ (${deletedCount || 0}) website mẫu`,
  });

  const handleToggleActive = async (row, nextValue) => {
    if (!canUpdate) {
      toast.error("Bạn không có quyền sửa website mẫu");
      return;
    }

    try {
      const response = await websiteTemplateApi.update(row.id, { isActive: nextValue });
      const updated = response?.websiteTemplate || row;
      setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, ...updated } : item)));
      toast.success(`Đã ${nextValue ? "bật" : "tắt"} website mẫu "${updated.name}"`);
    } catch (error) {
      toast.error(error?.message || "Không thể cập nhật trạng thái");
    }
  };

  return (
    <>
      <ManagementActions
        onAdd={() => navigate("/kho-mau/website-mau/them-moi")}
        onDeleteAll={() => {
          setDeleteRow(null);
          setDeleteOpen(true);
        }}
        addDisabled={!canCreate}
        addTitle={!canCreate ? "Bạn không có quyền thêm website mẫu" : undefined}
        deleteDisabled={rows.length === 0 || !canDelete}
        deleteTitle={!canDelete ? "Bạn không có quyền xóa website mẫu" : undefined}
        deleteLabel={deleteManyLabel}
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select
          className="w-56 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          value={selectedCategory}
          onChange={(event) => { setSelectedCategory(event.target.value); setPage(1); }}
        >
          {categoryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          className="w-52 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          value={selectedPlatform}
          onChange={(event) => { setSelectedPlatform(event.target.value); setPage(1); }}
        >
          {PLATFORM_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          className="w-44 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          value={selectedActive}
          onChange={(event) => { setSelectedActive(event.target.value); setPage(1); }}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="true">Đang bật</option>
          <option value="false">Đang tắt</option>
        </select>
      </div>

      <ManagementTableCard
        title="Danh sách Website mẫu"
        searchText={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm tên, link, tag, ghi chú"
      >
        <Table className="min-w-full text-center text-sm">
          <TableHeader className="bg-slate-50 text-slate-500">
            <TableRow>
              <TableHead className="w-12 border border-slate-200 px-4">
                <input
                  type="checkbox"
                  checked={isAllFilteredSelected}
                  disabled={!canDelete}
                  onChange={(event) => handleToggleAll(event.target.checked)}
                  onClick={(event) => event.stopPropagation()}
                />
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                STT
              </TableHead>
              <TableHead className="w-40 border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Ảnh preview
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Website mẫu
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Danh mục
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Nền tảng
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Tags
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Link
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Kích hoạt
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Ngày tạo
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Thao tác
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={11} className="border border-slate-200 p-4 py-8 text-slate-500">
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : displayedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="border border-slate-200 p-4 py-8 text-slate-500">
                  Chưa có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              displayedRows.map((row, index) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer text-slate-700 hover:bg-slate-50"
                  onClick={() => navigate(`/kho-mau/website-mau/chinh-sua/${row.id}`)}
                >
                  <TableCell className="border border-slate-200 p-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      disabled={!canDelete}
                      onChange={(event) => handleToggleRow(row.id, event.target.checked)}
                      onClick={(event) => event.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4">
                    <span className="border px-3 py-1.5">{rowNumberOffset + index + 1}</span>
                  </TableCell>
                  <TableCell className="border border-slate-200" onClick={(event) => event.stopPropagation()}>
                    <PreviewImage src={row.previewImage} alt={row.name} />
                  </TableCell>
                  <TableCell className="max-w-72 border border-slate-200 p-4 text-left">
                    <div className="font-semibold text-sky-700">{row.name}</div>
                    {row.description ? (
                      <div className="mt-1 line-clamp-2 text-xs text-slate-500">{row.description}</div>
                    ) : null}
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.category || "-"}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.platform || "-"}</TableCell>
                  <TableCell
                    className="max-w-56 border border-slate-200 p-4 text-left truncate"
                    title={row.tags?.join(", ")}
                  >
                    {Array.isArray(row.tags) && row.tags.length > 0 ? row.tags.join(", ") : "-"}
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4" onClick={(event) => event.stopPropagation()}>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <Button
                        icon={ExternalLink}
                        label="Demo"
                        size="sm"
                        onClick={() => openExternalLink(row.demoUrl)}
                      />
                      <Button
                        icon={ExternalLink}
                        label="Template"
                        size="sm"
                        variant="secondary"
                        disabled={!row.templateUrl}
                        onClick={() => openExternalLink(row.templateUrl)}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4" onClick={(event) => event.stopPropagation()}>
                    <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={Boolean(row.isActive)}
                        disabled={!canUpdate}
                        onChange={(event) => handleToggleActive(row, event.target.checked)}
                      />
                      {row.isActive ? "Đang bật" : "Đang tắt"}
                    </label>
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.createdAt || "-"}</TableCell>
                  <TableCell
                    className="border border-slate-200 p-4 text-center"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        icon={SquarePen}
                        variant="primary-outline"
                        iconOnly
                        onClick={() => navigate(`/kho-mau/website-mau/chinh-sua/${row.id}`)}
                        disabled={!canUpdate}
                        title={!canUpdate ? "Bạn không có quyền sửa website mẫu" : undefined}
                      />
                      <Button
                        icon={Trash2}
                        variant="danger-outline"
                        iconOnly
                        disabled={!canDelete}
                        title={!canDelete ? "Bạn không có quyền xóa website mẫu" : undefined}
                        onClick={() => {
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
        <ManagementPagination
          page={page}
          limit={limit}
          total={total}
          onPageChange={setPage}
          onLimitChange={setLimit}
          disabled={isLoading}
        />
      </ManagementTableCard>

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
            <Button
              variant="danger"
              label="Xóa"
              onClick={() => void handleDelete({ canDelete: canDelete })}
              disabled={!canDelete}
              title={!canDelete ? "Bạn không có quyền xóa website mẫu" : undefined}
            />
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          {deleteRow?.id
            ? `Bạn có chắc chắn muốn xóa website mẫu "${deleteRow.name}"?`
            : "Bạn có chắc chắn muốn xóa các website mẫu đã chọn?"}
        </p>
      </Modal>
    </>
  );
}

export default WebsiteTemplateManagement;
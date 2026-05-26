import { ExternalLink, ImageOff, SquarePen, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { ManagementActions } from "@/components/program/ManagementActions";
import { ManagementTableCard } from "@/components/program/ManagementTableCard";
import { Button } from "@/components/ui/button-v2";
import Modal from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { websiteTemplateApi } from "@/lib/api-client";
import { usePermission } from "@/lib/permissions";
import { useSystemCategoryOptions } from "@/lib/system-categories";

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
  if (/^data:image\//i.test(value)) return value;

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
        <ImageOff  />
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
  const canCreate = can("websiteTemplate.create");
  const canUpdate = can("websiteTemplate.update");
  const canDelete = can("websiteTemplate.delete");
  const { options: categoryOptions } = useSystemCategoryOptions("websiteTemplate", {
    includeAll: true,
    allLabel: "Tất cả danh mục",
    allValue: "all",
  });

  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [selectedActive, setSelectedActive] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState(null);

  const fetchRows = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await websiteTemplateApi.list({
        search: searchText.trim(),
        category: selectedCategory,
        platform: selectedPlatform,
        active: selectedActive,
        limit: 200,
      });
      const nextRows = Array.isArray(response?.websiteTemplates) ? response.websiteTemplates : [];
      setRows(nextRows);
      setSelectedIds((prev) => prev.filter((id) => nextRows.some((item) => item.id === id)));
    } catch (error) {
      toast.error(error?.message || "Không thể tải danh sách website mẫu");
    } finally {
      setIsLoading(false);
    }
  }, [searchText, selectedActive, selectedCategory, selectedPlatform]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const displayedRows = useMemo(() => rows, [rows]);
  const displayedIds = displayedRows.map((item) => item.id);
  const isAllFilteredSelected = displayedIds.length > 0 && displayedIds.every((id) => selectedIds.includes(id));
  const deleteManyLabel = selectedIds.length > 0 ? `Xóa tất cả [ ${selectedIds.length} ]` : "Xóa tất cả";

  const handleToggleAll = (checked) => {
    if (checked) {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...displayedIds])));
      return;
    }
    setSelectedIds((prev) => prev.filter((id) => !displayedIds.includes(id)));
  };

  const handleToggleRow = (id, checked) => {
    setSelectedIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((item) => item !== id);
    });
  };

  const handleDelete = async () => {
    try {
      if (deleteRow?.id) {
        await websiteTemplateApi.remove(deleteRow.id);
        toast.success("Đã xóa website mẫu");
      } else if (selectedIds.length > 0) {
        const response = await websiteTemplateApi.removeMany(selectedIds);
        toast.success(`Đã xóa ${response?.deletedCount || selectedIds.length} website mẫu`);
      } else {
        const response = await websiteTemplateApi.removeMany([]);
        toast.success(`Đã xóa toàn bộ (${response?.deletedCount || 0}) website mẫu`);
      }
      setDeleteOpen(false);
      setDeleteRow(null);
      setSelectedIds([]);
      await fetchRows();
    } catch (error) {
      toast.error(error?.message || "Xóa dữ liệu không thành công");
    }
  };

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
          onChange={(event) => setSelectedCategory(event.target.value)}
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
          onChange={(event) => setSelectedPlatform(event.target.value)}
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
          onChange={(event) => setSelectedActive(event.target.value)}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="true">Đang bật</option>
          <option value="false">Đang tắt</option>
        </select>
      </div>

      <ManagementTableCard
        title="Danh sách website mẫu"
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
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">STT</TableHead>
              <TableHead className="w-40 border border-slate-200 p-4 px-10 text-center font-semibold text-slate-500">Ảnh</TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Website mẫu
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Danh mục
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Nền tảng
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">Tags</TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">Link</TableHead>
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
                    <span className="border px-3 py-1.5">{index + 1}</span>
                  </TableCell>
                  <TableCell className="border border-slate-200" onClick={(event) => event.stopPropagation()}>
                    <PreviewImage src={row.previewImage} alt={row.name} />
                  </TableCell>
                  <TableCell className="max-w-72 border border-slate-200 p-4 text-left">
                    <div className="font-semibold text-sky-700">{row.name}</div>
                    {row.description ? <div className="mt-1 line-clamp-2 text-xs text-slate-500">{row.description}</div> : null}
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.category || "-"}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.platform || "-"}</TableCell>
                  <TableCell className="max-w-56 border border-slate-200 p-4 text-left">
                    {Array.isArray(row.tags) && row.tags.length > 0 ? row.tags.join(", ") : "-"}
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4" onClick={(event) => event.stopPropagation()}>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <Button icon={ExternalLink} label="Demo" size="sm" onClick={() => openExternalLink(row.demoUrl)} />
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
                  <TableCell className="border border-slate-200 p-4 text-center" onClick={(event) => event.stopPropagation()}>
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
              onClick={handleDelete}
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

import { SquarePen, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ManagementActions } from "@/components/program/ManagementActions";
import { ManagementTableCard } from "@/components/program/ManagementTableCard";
import { Button } from "@/components/ui/button-v2";
import FormField from "@/components/ui/form-field";
import Modal from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { systemCategoryApi } from "@/lib/api-client";
import { usePermission } from "@/lib/permissions";

const CATEGORY_TYPES = [
  { value: "module", label: "Module", description: "Danh mục module" },
  { value: "status", label: "Trạng thái", description: "Danh mục trạng thái" },
  { value: "priority", label: "Ưu tiên", description: "Danh mục ưu tiên" },
  { value: "websiteTemplate", label: "Website mẫu", description: "danh mục website mẫu" },
];

const formSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên danh mục"),
  sortOrder: z.coerce.number().int("Thứ tự phải là số nguyên").gte(0, "Thứ tự không hợp lệ"),
  isActive: z.boolean(),
});

const defaultValues = {
  name: "",
  sortOrder: 1,
  isActive: true,
};

function SystemCategoryManagement() {
  const [activeType, setActiveType] = useState("module");
  const { can } = usePermission();
  const canUpdate = can("config.category.update");

  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const activeTab = useMemo(() => CATEGORY_TYPES.find((item) => item.value === activeType), [activeType]);

  const fetchRows = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await systemCategoryApi.list({
        type: activeType,
        search: searchText.trim(),
        limit: 200,
      });
      const nextRows = Array.isArray(response?.categories) ? response.categories : [];
      setRows(nextRows);
      setSelectedIds((prev) => prev.filter((id) => nextRows.some((item) => item.id === id)));
    } catch (error) {
      toast.error(error?.message || "Không thể tải danh mục hệ thống");
    } finally {
      setIsLoading(false);
    }
  }, [activeType, searchText]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const displayedRows = useMemo(() => rows, [rows]);
  const displayedIds = displayedRows.map((item) => item.id);
  const isAllFilteredSelected = displayedIds.length > 0 && displayedIds.every((id) => selectedIds.includes(id));
  const deleteManyLabel = selectedIds.length > 0 ? `Xóa tất cả [ ${selectedIds.length} ]` : "Xóa tất cả";

  const openCreate = () => {
    const nextSortOrder = rows.length > 0 ? Math.max(...rows.map((item) => Number(item.sortOrder || 0))) + 1 : 1;
    setEditingRow(null);
    reset({
      ...defaultValues,
      sortOrder: nextSortOrder,
    });
    setFormOpen(true);
  };

  const openEdit = (row) => {
    setEditingRow(row);
    reset({
      name: row.name || "",
      sortOrder: Number(row.sortOrder || 0),
      isActive: Boolean(row.isActive),
    });
    setFormOpen(true);
  };

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
        await systemCategoryApi.remove(deleteRow.id);
        toast.success("Đã xóa danh mục");
      } else if (selectedIds.length > 0) {
        const response = await systemCategoryApi.removeMany(selectedIds);
        toast.success(`Đã xóa ${response?.deletedCount || selectedIds.length} danh mục`);
      } else {
        const response = await systemCategoryApi.removeMany([]);
        toast.success(`Đã xóa toàn bộ (${response?.deletedCount || 0}) danh mục`);
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
    try {
      const response = await systemCategoryApi.update(row.id, { isActive: nextValue });
      const updated = response?.category || row;
      setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, ...updated } : item)));
      toast.success(`Đã ${nextValue ? "bật" : "tắt"} danh mục "${updated.name}"`);
    } catch (error) {
      toast.error(error?.message || "Không thể cập nhật trạng thái");
    }
  };

  const onSubmit = async (values) => {
    const payload = {
      name: values.name,
      type: activeType,
      sortOrder: values.sortOrder,
      isActive: values.isActive,
    };

    try {
      if (editingRow?.id) {
        await systemCategoryApi.update(editingRow.id, payload);
        toast.success("Đã cập nhật danh mục");
      } else {
        await systemCategoryApi.create(payload);
        toast.success("Đã thêm danh mục");
      }
      setFormOpen(false);
      setEditingRow(null);
      await fetchRows();
    } catch (error) {
      toast.error(error?.message || "Không thể lưu danh mục");
    }
  };

  return (
    <>
      <ManagementActions
        onAdd={openCreate}
        onDeleteAll={() => {
          setDeleteRow(null);
          setDeleteOpen(true);
        }}
        addDisabled={!canUpdate}
        addTitle={!canUpdate ? "Bạn không có quyền thêm danh mục" : undefined}
        deleteDisabled={rows.length === 0 || !canUpdate}
        deleteTitle={!canUpdate ? "Bạn không có quyền xóa danh mục" : undefined}
        deleteLabel={deleteManyLabel}
      />

     <div className="mt-4 flex flex-wrap items-center gap-3">
        <select
          className="w-52 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          value={activeType}
          onChange={(event) => setActiveType(event.target.value)}
        >
          {CATEGORY_TYPES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <ManagementTableCard
        title={`Danh sách ${activeTab?.description || "danh mục"}`}
        searchText={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo tên danh mục"
      >
        <Table className="min-w-full text-center text-sm">
          <TableHeader className="bg-slate-50 text-slate-500">
            <TableRow>
              <TableHead className="w-12 border border-slate-200 px-4">
                <input
                  type="checkbox"
                  checked={isAllFilteredSelected}
                  disabled={!canUpdate}
                  onChange={(event) => handleToggleAll(event.target.checked)}
                  onClick={(event) => event.stopPropagation()}
                />
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                STT
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Tên danh mục
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Thứ tự
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Trạng thái
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
                <TableCell colSpan={7} className="border border-slate-200 p-4 py-8 text-slate-500">
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : displayedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="border border-slate-200 p-4 py-8 text-slate-500">
                  Chưa có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              displayedRows.map((row, index) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer text-slate-700 hover:bg-slate-50"
                  onClick={() => openEdit(row)}
                >
                  <TableCell className="border border-slate-200 p-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      disabled={!canUpdate}
                      onChange={(event) => handleToggleRow(row.id, event.target.checked)}
                      onClick={(event) => event.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4">
                    <span className="border px-3 py-1.5">{index + 1}</span>
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4 text-left font-semibold text-sky-700">
                    {row.name}
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.sortOrder}</TableCell>
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
                        onClick={() => openEdit(row)}
                        disabled={!canUpdate}
                        title={!canUpdate ? "Bạn không có quyền sửa danh mục" : undefined}
                      />
                      <Button
                        icon={Trash2}
                        variant="danger-outline"
                        iconOnly
                        disabled={!canUpdate}
                        title={!canUpdate ? "Bạn không có quyền xóa danh mục" : undefined}
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
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingRow(null);
        }}
        title={editingRow ? "Cập nhật danh mục" : "Thêm danh mục"}
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              label="Hủy"
              onClick={() => {
                setFormOpen(false);
                setEditingRow(null);
              }}
              disabled={isSubmitting}
            />
            <Button
              variant="primary"
              label={editingRow ? "Cập nhật" : "Thêm mới"}
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting || !canUpdate}
              title={!canUpdate ? "Bạn không có quyền lưu danh mục" : undefined}
            />
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-slate-600">Loại danh mục</p>
            <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {activeTab?.label || ""}
            </div>
          </div>
          <FormField label="Tên danh mục" inputProps={{ ...register("name"), disabled: !canUpdate }} error={errors.name?.message} />
          <FormField
            label="Thứ tự"
            type="number"
            inputProps={{ ...register("sortOrder", { valueAsNumber: true }), disabled: !canUpdate }}
            error={errors.sortOrder?.message}
          />
          <FormField label="Kích hoạt" type="checkbox" inputProps={{ ...register("isActive"), disabled: !canUpdate }} />
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
            <Button
              variant="danger"
              label="Xóa"
              onClick={handleDelete}
              disabled={!canUpdate}
              title={!canUpdate ? "Bạn không có quyền xóa danh mục" : undefined}
            />
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          {deleteRow?.id
            ? `Bạn có chắc chắn muốn xóa danh mục "${deleteRow.name}"?`
            : "Bạn có chắc chắn muốn xóa các danh mục đã chọn?"}
        </p>
      </Modal>
    </>
  );
}

export default SystemCategoryManagement;
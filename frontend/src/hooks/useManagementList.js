import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const defaultGetRowId = (row) => row?.id;

const defaultGetListParams = (searchText) => ({ search: searchText.trim() });

const defaultTransformRows = (rows) => rows;

const resolveMessage = (message, payload) => (typeof message === "function" ? message(payload) : message);


export function useManagementList({
  listApi,
  removeApi,
  removeManyApi,
  responseKey,
  getListParams = defaultGetListParams,
  getRowId = defaultGetRowId,
  transformRows = defaultTransformRows,
  loadErrorMessage = "Không thể tải dữ liệu",
  deleteErrorMessage = "Xóa dữ liệu không thành công",
  noDeletePermissionMessage = "Bạn không có quyền xóa dữ liệu",
  deleteOneSuccessMessage = "Đã xóa dữ liệu",
  deleteManySuccessMessage = ({ deletedCount, selectedCount }) => `Đã xóa ${deletedCount || selectedCount} dữ liệu`,
  deleteAllSuccessMessage = ({ deletedCount }) => `Đã xóa toàn bộ (${deletedCount || 0}) dữ liệu`,
} = {}) {
  const [rows, setRows] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState(null);

  const fetchRows = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await listApi(getListParams(searchText));
      const rawRows = Array.isArray(response?.[responseKey]) ? response[responseKey] : [];
      const transformedRows = transformRows(rawRows);
      const nextRows = Array.isArray(transformedRows) ? transformedRows : [];
      setRows(nextRows);
      setSelectedIds((prev) => prev.filter((id) => nextRows.some((item) => getRowId(item) === id)));
    } catch (error) {
      toast.error(error?.message || loadErrorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [getListParams, getRowId, listApi, loadErrorMessage, responseKey, searchText, transformRows]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const displayedRows = useMemo(() => rows, [rows]);
  const displayedIds = useMemo(() => displayedRows.map((item) => getRowId(item)), [displayedRows, getRowId]);
  const isAllFilteredSelected =
    displayedIds.length > 0 && displayedIds.every((id) => selectedIds.includes(id));
  const deleteManyLabel = selectedIds.length > 0 ? `Xóa tất cả [ ${selectedIds.length} ]` : "Xóa tất cả";

  const handleToggleAll = useCallback(
    (checked) => {
      if (checked) {
        setSelectedIds((prev) => Array.from(new Set([...prev, ...displayedIds])));
        return;
      }
      setSelectedIds((prev) => prev.filter((id) => !displayedIds.includes(id)));
    },
    [displayedIds],
  );

  const handleToggleRow = useCallback((id, checked) => {
    setSelectedIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((item) => item !== id);
    });
  }, []);

  const handleDelete = useCallback(
    async ({ canDelete = true } = {}) => {
      if (!canDelete) {
        toast.error(noDeletePermissionMessage);
        return;
      }

      try {
        if (deleteRow && getRowId(deleteRow)) {
          const deleteId = getRowId(deleteRow);
          await removeApi(deleteId);
          setRows((prev) => prev.filter((item) => getRowId(item) !== deleteId));
          toast.success(resolveMessage(deleteOneSuccessMessage, { row: deleteRow }));
        } else if (selectedIds.length > 0) {
          const response = await removeManyApi(selectedIds);
          setRows((prev) => prev.filter((item) => !selectedIds.includes(getRowId(item))));
          toast.success(
            resolveMessage(deleteManySuccessMessage, {
              deletedCount: response?.deletedCount,
              selectedCount: selectedIds.length,
            }),
          );
        } else {
          const response = await removeManyApi([]);
          setRows([]);
          toast.success(resolveMessage(deleteAllSuccessMessage, { deletedCount: response?.deletedCount }));
        }
      } catch (error) {
        toast.error(error?.message || deleteErrorMessage);
      } finally {
        setDeleteOpen(false);
        setDeleteRow(null);
        setSelectedIds([]);
      }
    },
    [
      deleteAllSuccessMessage,
      deleteErrorMessage,
      deleteManySuccessMessage,
      deleteOneSuccessMessage,
      deleteRow,
      getRowId,
      noDeletePermissionMessage,
      removeApi,
      removeManyApi,
      selectedIds,
    ],
  );

  return {
    rows,
    setRows,
    searchText,
    setSearchText,
    isLoading,
    selectedIds,
    setSelectedIds,
    deleteOpen,
    setDeleteOpen,
    deleteRow,
    setDeleteRow,
    displayedRows,
    displayedIds,
    isAllFilteredSelected,
    deleteManyLabel,
    fetchRows,
    handleToggleAll,
    handleToggleRow,
    handleDelete,
  };
}

export default useManagementList;
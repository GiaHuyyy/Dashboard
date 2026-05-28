import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useDebouncedValue } from "./useDebouncedValue";

const defaultGetRowId = (row) => row?.id;

const defaultGetListParams = ({ searchText, page, limit, enablePagination }) => {
  const params = { search: searchText.trim() };
  if (enablePagination) {
    params.page = page;
    params.limit = limit;
  }
  return params;
};

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
  initialPage = 1,
  initialLimit = 10,
  enablePagination = false,
  searchDebounceMs = 2000,
} = {}) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [searchText, setSearchTextState] = useState("");
  const debouncedSearchText = useDebouncedValue(searchText, searchDebounceMs);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState(null);

  const setSearchText = useCallback((value) => {
    setSearchTextState(value);
    setPage(1);
  }, []);

  const handleLimitChange = useCallback((nextLimit) => {
    setLimit(nextLimit);
    setPage(1);
  }, []);

  const fetchRows = useCallback(async () => {
    setIsLoading(true);
    try {
      const listParams =
        getListParams === defaultGetListParams
          ? getListParams({ searchText: debouncedSearchText, page, limit, enablePagination })
          : getListParams(debouncedSearchText);
      const response = await listApi(listParams);
      const rawRows = Array.isArray(response?.[responseKey]) ? response[responseKey] : [];
      const transformedRows = transformRows(rawRows);
      const nextRows = Array.isArray(transformedRows) ? transformedRows : [];
      const nextTotal = Number(response?.total ?? nextRows.length) || 0;
      setRows(nextRows);
      setTotal(nextTotal);
      setSelectedIds((prev) => prev.filter((id) => nextRows.some((item) => getRowId(item) === id)));
    } catch (error) {
      toast.error(error?.message || loadErrorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchText, enablePagination, getListParams, getRowId, limit, listApi, loadErrorMessage, page, responseKey, transformRows]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const displayedRows = useMemo(() => rows, [rows]);
  const displayedIds = useMemo(() => displayedRows.map((item) => getRowId(item)), [displayedRows, getRowId]);
  const isAllFilteredSelected =
    displayedIds.length > 0 && displayedIds.every((id) => selectedIds.includes(id));
  const deleteManyLabel = selectedIds.length > 0 ? `Xóa tất cả [ ${selectedIds.length} ]` : "Xóa tất cả";
  const totalPages = Math.max(1, Math.ceil((Number(total) || 0) / (Number(limit) || 10)));
  const rowNumberOffset = (Math.max(Number(page) || 1, 1) - 1) * (Number(limit) || 10);

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
          setTotal((prev) => Math.max(0, prev - 1));
          toast.success(resolveMessage(deleteOneSuccessMessage, { row: deleteRow }));
        } else if (selectedIds.length > 0) {
          const response = await removeManyApi(selectedIds);
          const deletedCount = Number(response?.deletedCount || selectedIds.length) || 0;
          setRows((prev) => prev.filter((item) => !selectedIds.includes(getRowId(item))));
          setTotal((prev) => Math.max(0, prev - deletedCount));
          toast.success(
            resolveMessage(deleteManySuccessMessage, {
              deletedCount: response?.deletedCount,
              selectedCount: selectedIds.length,
            }),
          );
        } else {
          const response = await removeManyApi([]);
          setRows([]);
          setTotal(0);
          setPage(1);
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

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return {
    rows,
    setRows,
    total,
    page,
    limit,
    totalPages,
    setPage,
    setLimit: handleLimitChange,
    rowNumberOffset,
    searchText,
    debouncedSearchText,
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

import { useCallback, useMemo, useState } from "react";

export function useRowSelection(displayedIds = []) {
  const [selectedIds, setSelectedIds] = useState([]);

  const isAllSelected = useMemo(
    () => displayedIds.length > 0 && displayedIds.every((id) => selectedIds.includes(id)),
    [displayedIds, selectedIds],
  );

  const toggleAll = useCallback(
    (checked) => {
      if (checked) {
        setSelectedIds((prev) => Array.from(new Set([...prev, ...displayedIds])));
        return;
      }

      setSelectedIds((prev) => prev.filter((id) => !displayedIds.includes(id)));
    },
    [displayedIds],
  );

  const toggleRow = useCallback((id, checked) => {
    setSelectedIds((prev) => {
      if (checked) {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      }

      return prev.filter((item) => item !== id);
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const syncWithData = useCallback((nextIds = []) => {
    setSelectedIds((prev) => prev.filter((id) => nextIds.includes(id)));
  }, []);

  return {
    selectedIds,
    isAllSelected,
    toggleAll,
    toggleRow,
    clearSelection,
    syncWithData,
    setSelectedIds,
  };
}
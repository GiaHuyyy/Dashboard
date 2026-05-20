import { useCallback, useEffect, useMemo, useState } from "react";

import { systemCategoryApi } from "@/lib/api-client";

export const useSystemCategoryOptions = (type, { includeAll = false, allLabel = "Tất cả", allValue = "all" } = {}) => {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    if (!type) return;
    setIsLoading(true);
    try {
      const response = await systemCategoryApi.list({ type, limit: 500 });
      const nextRows = Array.isArray(response?.categories) ? response.categories : [];
      setRows(nextRows);
    } catch {
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [type]);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  const activeRows = useMemo(() => rows.filter((item) => item.isActive), [rows]);
  const values = useMemo(() => activeRows.map((item) => item.name), [activeRows]);
  const options = useMemo(() => {
    const base = activeRows.map((item) => ({ label: item.name, value: item.name }));
    if (!includeAll) return base;
    return [{ label: allLabel, value: allValue }, ...base];
  }, [activeRows, includeAll, allLabel, allValue]);

  return {
    options,
    values,
    raw: activeRows,
    isLoading,
    refresh: fetchCategories,
  };
};

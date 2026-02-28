import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import type { TableColumnDef } from '../types';

type TableKey = 'orderColumns' | 'inventoryColumns';

export function useTableConfig(tableKey: TableKey, allColumns: TableColumnDef[]) {
  const allIds = allColumns.map((c) => c.id);
  const defaultIds = allColumns.filter((c) => c.defaultVisible !== false).map((c) => c.id);

  const [visibleIds, setVisibleIds] = useState<string[]>(() => {
    const stored = localStorage.getItem(`tableConfig:${tableKey}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as string[];
        return parsed.filter((id) => allIds.includes(id));
      } catch { /* ignore */ }
    }
    return defaultIds;
  });
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from server on mount
  useEffect(() => {
    api.get('/account/preferences')
      .then(({ data }) => {
        const prefs = data.data;
        if (prefs && prefs[tableKey] && Array.isArray(prefs[tableKey])) {
          const serverIds = (prefs[tableKey] as string[]).filter((id) => allIds.includes(id));
          if (serverIds.length >= 2) {
            setVisibleIds(serverIds);
            localStorage.setItem(`tableConfig:${tableKey}`, JSON.stringify(serverIds));
          }
        }
      })
      .catch(() => { /* use local fallback */ })
      .finally(() => setLoading(false));
  }, []);

  // Debounced save to server
  const saveToServer = useCallback((ids: string[]) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      api.patch('/account/preferences', { [tableKey]: ids }).catch(() => {});
    }, 800);
  }, [tableKey]);

  const toggleColumn = useCallback((columnId: string) => {
    setVisibleIds((prev) => {
      let next: string[];
      if (prev.includes(columnId)) {
        // Don't allow fewer than 2 columns
        if (prev.length <= 2) return prev;
        next = prev.filter((id) => id !== columnId);
      } else {
        // Insert in original order
        next = allIds.filter((id) => prev.includes(id) || id === columnId);
      }
      localStorage.setItem(`tableConfig:${tableKey}`, JSON.stringify(next));
      saveToServer(next);
      return next;
    });
  }, [allIds, tableKey, saveToServer]);

  const isVisible = useCallback((columnId: string) => visibleIds.includes(columnId), [visibleIds]);

  return { visibleIds, toggleColumn, isVisible, loading };
}

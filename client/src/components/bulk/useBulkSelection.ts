import { useState, useCallback, useMemo } from 'react';

export interface UseBulkSelectionOptions {
  initialSelected?: string[];
}

export interface BulkSelectionState {
  selectedIds: Set<string>;
  selectedCount: number;
  isAllMatching: boolean;
  isSelected: (id: string) => boolean;
  toggleSelect: (id: string) => void;
  selectPage: (pageIds: string[]) => void;
  deselectPage: (pageIds: string[]) => void;
  togglePage: (pageIds: string[]) => void;
  selectAllMatching: (allIds?: string[]) => void;
  clearSelection: () => void;
  setSelectedIds: (ids: string[] | Set<string>) => void;
  isAllSelected: (pageIds: string[]) => boolean;
  isPartiallySelected: (pageIds: string[]) => boolean;
  getSelectedList: () => string[];
}

export function useBulkSelection(options: UseBulkSelectionOptions = {}): BulkSelectionState {
  const [selectedIds, setSelectedIdsState] = useState<Set<string>>(
    () => new Set(options.initialSelected || [])
  );
  const [isAllMatching, setIsAllMatching] = useState<boolean>(false);

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  const toggleSelect = useCallback((id: string) => {
    setSelectedIdsState((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setIsAllMatching(false);
  }, []);

  const selectPage = useCallback((pageIds: string[]) => {
    setSelectedIdsState((prev) => {
      const next = new Set(prev);
      pageIds.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  const deselectPage = useCallback((pageIds: string[]) => {
    setSelectedIdsState((prev) => {
      const next = new Set(prev);
      pageIds.forEach((id) => next.delete(id));
      return next;
    });
    setIsAllMatching(false);
  }, []);

  const togglePage = useCallback((pageIds: string[]) => {
    if (pageIds.length === 0) return;
    setSelectedIdsState((prev) => {
      const allSelected = pageIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
    setIsAllMatching(false);
  }, []);

  const selectAllMatching = useCallback((allIds?: string[]) => {
    if (allIds && allIds.length > 0) {
      setSelectedIdsState(new Set(allIds));
    }
    setIsAllMatching(true);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIdsState(new Set());
    setIsAllMatching(false);
  }, []);

  const setSelectedIds = useCallback((ids: string[] | Set<string>) => {
    setSelectedIdsState(new Set(ids));
    setIsAllMatching(false);
  }, []);

  const isAllSelected = useCallback(
    (pageIds: string[]) => {
      if (pageIds.length === 0) return false;
      return pageIds.every((id) => selectedIds.has(id));
    },
    [selectedIds]
  );

  const isPartiallySelected = useCallback(
    (pageIds: string[]) => {
      if (pageIds.length === 0) return false;
      const someSelected = pageIds.some((id) => selectedIds.has(id));
      const allSelected = pageIds.every((id) => selectedIds.has(id));
      return someSelected && !allSelected;
    },
    [selectedIds]
  );

  const getSelectedList = useCallback(() => Array.from(selectedIds), [selectedIds]);

  const selectedCount = useMemo(() => selectedIds.size, [selectedIds]);

  return {
    selectedIds,
    selectedCount,
    isAllMatching,
    isSelected,
    toggleSelect,
    selectPage,
    deselectPage,
    togglePage,
    selectAllMatching,
    clearSelection,
    setSelectedIds,
    isAllSelected,
    isPartiallySelected,
    getSelectedList,
  };
}


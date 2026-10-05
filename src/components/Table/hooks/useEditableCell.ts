import { useState, useCallback } from "react";

export interface UseEditableCellOptions<T = any> {
  onSave?: (
    record: T,
    dataIndex: string,
    newValue: any,
    oldValue: any
  ) => Promise<boolean | void> | boolean | void;
}

export function useEditableCell<T = any>(options?: UseEditableCellOptions<T>) {
  const [editingCell, setEditingCell] = useState<{
    rowKey: string;
    dataIndex: string;
  } | null>(null);

  const startEditing = useCallback((rowKey: string, dataIndex: string) => {
    setEditingCell({ rowKey, dataIndex });
  }, []);

  const stopEditing = useCallback(() => {
    setEditingCell(null);
  }, []);

  const isEditing = useCallback(
    (rowKey: string, dataIndex: string) => {
      return (
        editingCell?.rowKey === rowKey &&
        editingCell?.dataIndex === dataIndex
      );
    },
    [editingCell]
  );

  return {
    editingCell,
    startEditing,
    stopEditing,
    isEditing,
    onSave: options?.onSave,
  };
}

export default useEditableCell;

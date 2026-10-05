import React, { useState, useMemo } from "react";
import { Checkbox, Button, Input, Space, Divider } from "antd";
import { HolderOutlined, RotateLeftOutlined, SearchOutlined } from "@ant-design/icons";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ColumnDefinition } from "./types";
export type { ColumnDefinition };

interface SortableItemProps {
  id: string;
  title: string;
  isChecked: boolean;
  isRequired?: boolean;
  isAction?: boolean;
  onToggle: (key: string, checked: boolean) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({
  id,
  title,
  isChecked,
  isRequired,
  isAction,
  onToggle,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: isAction });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "6px 8px",
    marginBottom: "4px",
    backgroundColor: isDragging ? "#e6f4ff" : "#ffffff",
    border: "1px solid",
    borderColor: isDragging ? "#1677ff" : "#f1f5f9",
    borderRadius: "6px",
    userSelect: "none",
    boxShadow: isDragging ? "0 4px 12px rgba(0,0,0,0.12)" : "none",
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
        {!isAction ? (
          <span
            {...attributes}
            {...listeners}
            style={{
              cursor: "grab",
              color: "#94a3b8",
              display: "flex",
              alignItems: "center",
              padding: "2px",
            }}
            className="hover:text-blue-600"
            title="Drag to reorder"
          >
            <HolderOutlined />
          </span>
        ) : (
          <span style={{ width: 14 }} />
        )}
        <Checkbox
          checked={isChecked}
          disabled={isRequired || isAction}
          onChange={(e) => onToggle(id, e.target.checked)}
          style={{ minWidth: 0, overflow: "hidden" }}
        >
          <span
            style={{
              fontSize: "13px",
              color: isChecked ? "#1e293b" : "#64748b",
              fontWeight: isRequired || isChecked ? 500 : 400,
            }}
            className="truncate"
          >
            {title}
          </span>
        </Checkbox>
      </div>
      {isAction ? (
        <span className="text-[11px] text-slate-400 font-mono px-1.5 py-0.5 bg-slate-100 rounded shrink-0">
          Fixed End
        </span>
      ) : isRequired ? (
        <span className="text-[11px] text-blue-500 font-medium px-1.5 py-0.5 bg-blue-50 rounded shrink-0">
          Required
        </span>
      ) : null}
    </div>
  );
};

export interface SortableColumnCustomizerProps {
  allColumns: ColumnDefinition[];
  visibleColumnKeys: string[];
  setVisibleColumnKeys: (keys: string[] | ((prev: string[]) => string[])) => void;
  onReset?: () => void;
  title?: string;
}

export const SortableColumnCustomizer: React.FC<SortableColumnCustomizerProps> = ({
  allColumns,
  visibleColumnKeys,
  setVisibleColumnKeys,
  onReset,
  title = "Customize Columns",
}) => {
  const [searchText, setSearchText] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 2,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Construct master ordered keys list preserving current active order + missing columns + action last
  const currentOrderedKeys = useMemo(() => {
    const activeKeys = [...visibleColumnKeys];
    const missingKeys = allColumns
      .map((c) => c.key)
      .filter((k) => !activeKeys.includes(k) && k !== "action" && k !== "operations");

    // Remove action if in active
    const actionIndex = activeKeys.findIndex((k) => k === "action" || k === "operations");
    let actionKey: string | null = null;
    if (actionIndex !== -1) {
      actionKey = activeKeys.splice(actionIndex, 1)[0];
    } else if (allColumns.some((c) => c.key === "action")) {
      actionKey = "action";
    }

    const fullOrder = [...activeKeys, ...missingKeys];
    if (actionKey) {
      fullOrder.push(actionKey);
    }
    return fullOrder;
  }, [allColumns, visibleColumnKeys]);

  // Filter keys by search query if any
  const filteredKeys = useMemo(() => {
    if (!searchText.trim()) return currentOrderedKeys;
    const q = searchText.trim().toLowerCase();
    return currentOrderedKeys.filter((key) => {
      const col = allColumns.find((c) => c.key === key);
      return col?.title.toLowerCase().includes(q) || key.toLowerCase().includes(q);
    });
  }, [currentOrderedKeys, allColumns, searchText]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = currentOrderedKeys.indexOf(String(active.id));
      const newIndex = currentOrderedKeys.indexOf(String(over.id));

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedAll = arrayMove(currentOrderedKeys, oldIndex, newIndex);
        // Only keep visible keys in their newly ordered sequence
        const newVisibleKeys = reorderedAll.filter((k) => visibleColumnKeys.includes(k));
        setVisibleColumnKeys(newVisibleKeys);
      }
    }
  };

  const handleToggle = (key: string, checked: boolean) => {
    if (checked) {
      const position = currentOrderedKeys.indexOf(key);
      const newVisible = [...visibleColumnKeys];
      if (position !== -1) {
        newVisible.splice(position, 0, key);
      } else {
        newVisible.push(key);
      }
      const uniqueVisible = Array.from(new Set(newVisible));
      setVisibleColumnKeys(uniqueVisible);
    } else {
      setVisibleColumnKeys((prev) => prev.filter((k) => k !== key));
    }
  };

  const handleSelectAll = () => {
    const allKeys = allColumns.map((c) => c.key);
    setVisibleColumnKeys(allKeys);
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
    } else {
      const defaultKeys = allColumns
        .filter((c) => c.defaultVisible !== false)
        .map((c) => c.key);
      setVisibleColumnKeys(defaultKeys);
    }
  };

  return (
    <div style={{ width: 280, padding: "4px 2px" }}>
      {/* Header: Title + Select All / Reset Actions */}
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-slate-700 text-sm">{title}</span>
        <Space size={4}>
          <Button
            size="small"
            type="link"
            onClick={handleSelectAll}
            style={{ padding: 0, fontSize: "12px" }}
          >
            Select All
          </Button>
          <span className="text-slate-300">|</span>
          <Button
            size="small"
            type="link"
            onClick={handleReset}
            style={{ padding: 0, fontSize: "12px" }}
          >
            Reset
          </Button>
        </Space>
      </div>

      {/* Column Search Bar */}
      <Input
        size="small"
        placeholder="Search column..."
        prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        allowClear
        className="mb-2.5 rounded"
      />

      {/* Draggable Column List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={filteredKeys}
          strategy={verticalListSortingStrategy}
        >
          <div style={{ maxHeight: 300, overflowY: "auto", paddingRight: 2 }}>
            {filteredKeys.map((key) => {
              const colDef = allColumns.find((c) => c.key === key);
              if (!colDef) return null;

              const isChecked = visibleColumnKeys.includes(key);
              const isAction = key === "action" || key === "operations";

              return (
                <SortableItem
                  key={key}
                  id={key}
                  title={colDef.title}
                  isChecked={isChecked}
                  isRequired={colDef.required}
                  isAction={isAction}
                  onToggle={handleToggle}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      <div className="text-[11px] text-slate-400 mt-2 text-center">
        Drag handle to reorder columns
      </div>
    </div>
  );
};

export default SortableColumnCustomizer;

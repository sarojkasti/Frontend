import React from "react";
import { Checkbox, Button, Divider } from "antd";
import { HolderOutlined, RotateLeftOutlined } from "@ant-design/icons";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ColumnDefinition } from "@/components/Client/clientColumnsConfig";

interface SortableItemProps {
  id: string;
  title: string;
  isChecked: boolean;
  isRequired?: boolean;
  onToggle: (key: string, checked: boolean) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({
  id,
  title,
  isChecked,
  isRequired,
  onToggle
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "6px 10px",
    marginBottom: "4px",
    backgroundColor: isDragging ? "#e6f4ff" : "#f8fafc",
    border: "1px solid",
    borderColor: isDragging ? "#1677ff" : "#e2e8f0",
    borderRadius: "6px",
    userSelect: "none",
    boxShadow: isDragging ? "0 4px 12px rgba(0,0,0,0.1)" : "none"
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
        <span
          {...attributes}
          {...listeners}
          style={{
            cursor: "grab",
            color: "#94a3b8",
            display: "flex",
            alignItems: "center",
            padding: "2px 4px",
            borderRadius: "4px"
          }}
          className="hover:text-blue-600 hover:bg-slate-200/50"
        >
          <HolderOutlined />
        </span>
        <Checkbox
          checked={isChecked}
          disabled={isRequired}
          onChange={(e) => onToggle(id, e.target.checked)}
          style={{ width: "100%" }}
        >
          <span style={{ fontSize: "12px", color: isChecked ? "#1e293b" : "#64748b", fontWeight: isChecked ? 600 : 400 }}>
            {title}
          </span>
        </Checkbox>
      </div>
    </div>
  );
};

interface SortableColumnCustomizerProps {
  allColumns: ColumnDefinition[];
  visibleColumnKeys: string[];
  setVisibleColumnKeys: (keys: string[] | ((prev: string[]) => string[])) => void;
  onReset: () => void;
}

export const SortableColumnCustomizer: React.FC<SortableColumnCustomizerProps> = ({
  allColumns,
  visibleColumnKeys,
  setVisibleColumnKeys,
  onReset
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 2
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  // Construct master order array ensuring all column keys are included
  const currentOrderedKeys = React.useMemo(() => {
    const activeKeys = [...visibleColumnKeys];
    const missingKeys = allColumns
      .map((c) => c.key)
      .filter((k) => !activeKeys.includes(k));

    // Keep action at the very end
    const actionIndex = activeKeys.indexOf("action");
    if (actionIndex !== -1) {
      activeKeys.splice(actionIndex, 1);
    }

    const fullOrder = [...activeKeys, ...missingKeys];
    if (allColumns.some((c) => c.key === "action")) {
      fullOrder.push("action");
    }
    return fullOrder;
  }, [allColumns, visibleColumnKeys]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = currentOrderedKeys.indexOf(String(active.id));
      const newIndex = currentOrderedKeys.indexOf(String(over.id));

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedAll = arrayMove(currentOrderedKeys, oldIndex, newIndex);
        // Filter reordered keys to only include currently checked visible keys
        const newVisibleKeys = reorderedAll.filter((k) =>
          visibleColumnKeys.includes(k)
        );
        setVisibleColumnKeys(newVisibleKeys);
      }
    }
  };

  const handleToggle = (key: string, checked: boolean) => {
    if (checked) {
      // Find position of key in currentOrderedKeys
      const position = currentOrderedKeys.indexOf(key);
      const newVisible = [...visibleColumnKeys];
      if (position !== -1) {
        newVisible.splice(position, 0, key);
      } else {
        newVisible.push(key);
      }
      // Remove duplicates while preserving order
      const uniqueVisible = Array.from(new Set(newVisible));
      setVisibleColumnKeys(uniqueVisible);
    } else {
      setVisibleColumnKeys((prev) => prev.filter((k) => k !== key));
    }
  };

  return (
    <div style={{ width: 260, padding: 4 }}>
      <div className="flex justify-between items-center mb-2 font-semibold text-slate-700 text-xs">
        <span>Customize & Reorder Columns</span>
        <Button
          size="small"
          type="link"
          icon={<RotateLeftOutlined />}
          onClick={onReset}
          style={{ padding: 0, fontSize: 11 }}
        >
          Reset
        </Button>
      </div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>
        Drag handle <HolderOutlined /> to reorder columns up or down
      </div>
      <Divider style={{ margin: "6px 0 10px 0" }} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={currentOrderedKeys}
          strategy={verticalListSortingStrategy}
        >
          <div style={{ maxHeight: 280, overflowY: "auto", paddingRight: 2 }}>
            {currentOrderedKeys.map((key) => {
              const colDef = allColumns.find((c) => c.key === key);
              if (!colDef) return null;

              const isChecked = visibleColumnKeys.includes(key);

              return (
                <SortableItem
                  key={key}
                  id={key}
                  title={colDef.title}
                  isChecked={isChecked}
                  isRequired={colDef.required}
                  onToggle={handleToggle}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

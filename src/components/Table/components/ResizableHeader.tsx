import React, { useState, useRef } from "react";

export interface ResizableHeaderProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  onResize?: (width: number) => void;
  columnKey?: string;
  resizable?: boolean;
}

/**
 * High-performance resizable table header cell for Ant Design Table.
 * Supports interactive drag-to-resize with mouse events, visual indicator,
 * and strict click suppression to prevent column sorting or filter triggers
 * when dragging to resize.
 */
export const ResizableHeader: React.FC<ResizableHeaderProps> = ({
  width,
  minWidth = 60,
  maxWidth = 800,
  onResize,
  children,
  columnKey,
  resizable = true,
  style,
  className,
  ...restProps
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const dragOccurredRef = useRef(false);

  // If not resizable, no width, action column, or no onResize callback, render standard <th>
  if (!resizable || !width || !onResize || columnKey === "action" || columnKey === "operations") {
    return (
      <th style={style} className={className} {...restProps}>
        {children}
      </th>
    );
  }

  const { onClick: thOnClick, ...domProps } = restProps;

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Measure the actual rendered width of the <th> element in DOM
    const thElement = (e.currentTarget as HTMLElement).closest("th");
    const currentRenderedWidth = thElement
      ? Math.round(thElement.getBoundingClientRect().width)
      : width;

    const startX = e.clientX;
    const startWidth = currentRenderedWidth;

    setIsDragging(true);
    isDraggingRef.current = true;
    dragOccurredRef.current = false;

    // Visual drag cursor overlay on body
    const originalCursor = document.body.style.cursor;
    const originalUserSelect = document.body.style.userSelect;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      moveEvent.stopPropagation();
      const delta = moveEvent.clientX - startX;
      if (Math.abs(delta) > 2) {
        dragOccurredRef.current = true;
      }
      const rawWidth = startWidth + delta;
      const clampedWidth = Math.min(Math.max(minWidth, rawWidth), maxWidth);
      onResize(clampedWidth);
    };

    const onMouseUp = (upEvent: MouseEvent) => {
      upEvent.preventDefault();
      upEvent.stopPropagation();
      setIsDragging(false);
      isDraggingRef.current = false;
      dragOccurredRef.current = true;

      document.body.style.cursor = originalCursor;
      document.body.style.userSelect = originalUserSelect;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);

      // Kill the browser's synthetic click event at the window capture level
      // before it can reach <th>, .ant-table-column-sorters, or any filter dropdown
      const killClick = (clickEvent: MouseEvent) => {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
        clickEvent.stopImmediatePropagation();
      };

      window.addEventListener("click", killClick, { capture: true, once: true });

      // Safety timer to remove listener and reset the drag flag
      setTimeout(() => {
        window.removeEventListener("click", killClick, { capture: true });
        dragOccurredRef.current = false;
      }, 300);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  return (
    <th
      {...domProps}
      style={{
        ...style,
        position: "relative",
        userSelect: "none",
      }}
      className={`${className || ""} group`}
      onClick={(e) => {
        // Drop any click that was triggered by dragging or resizing
        if (isDraggingRef.current || dragOccurredRef.current) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        thOnClick?.(e);
      }}
    >
      {/* Full-screen invisible overlay during drag to prevent hover and clicks on table headers */}
      {isDragging && (
        <div
          className="fixed inset-0 z-[999999] cursor-col-resize select-none"
          style={{ touchAction: "none" }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        />
      )}

      {children}

      <div
        className={`absolute right-0 top-0 bottom-0 w-3 cursor-col-resize z-20 flex items-center justify-center select-none transition-opacity duration-150 ${
          isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100 hover:opacity-100"
        }`}
        style={{
          touchAction: "none",
        }}
        onClickCapture={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        onMouseDown={handleMouseDown}
        title="Drag to adjust column width"
      >
        <span
          className={`h-full ${
            isDragging
              ? "w-[2px] bg-blue-600 shadow-sm"
              : "w-[2px] bg-blue-500"
          }`}
        />
      </div>
    </th>
  );
};

export default ResizableHeader;


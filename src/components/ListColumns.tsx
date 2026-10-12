import { useEffect, useRef, useState } from "react";
import { useFileManagerContext } from "../context";
import { COLUMN_MAX_WIDTH, columnLabel, columnMinWidth, columnWidth, isFlexibleColumn } from "../core/columns";
import type { FileManagerColumn } from "../types";

export function ListColumns() {
  const { visibleColumns, sortBy, sortDirection, setSortBy, setSortDirection, customSort, labels } =
    useFileManagerContext();
  return (
    <div className="rfm-list-header" onKeyDown={(event) => event.stopPropagation()}>
      {visibleColumns.map((column) => {
        const active = !customSort && sortBy === column;
        const name = columnLabel(column, labels);
        return (
          <div className="rfm-column-header" key={column}>
            <button
              type="button"
              className="rfm-column-sort"
              disabled={customSort}
              aria-pressed={active}
              aria-label={
                active
                  ? `${name}, ${labels.sortedBy(name, sortDirection === "asc" ? labels.ascending : labels.descending)}`
                  : name
              }
              onClick={() => {
                if (active && sortDirection === "asc") {
                  setSortDirection("desc");
                } else {
                  setSortBy(active ? null : column);
                  setSortDirection("asc");
                }
              }}
            >
              <span>{name}</span>
              {active && (
                <svg
                  className="rfm-sort-arrow"
                  data-direction={sortDirection}
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="m6 15 6-6 6 6" />
                </svg>
              )}
            </button>
            <ColumnResize column={column} />
          </div>
        );
      })}
      <span aria-hidden="true" />
    </div>
  );
}

function ColumnResize({ column }: { column: FileManagerColumn }) {
  const { columnWidths, setColumnWidths, labels } = useFileManagerContext();
  const drag = useRef<{ pointerId: number; x: number; width: number; direction: number } | null>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const flexible = isFlexibleColumn(column, columnWidths);
  const [measuredWidth, setMeasuredWidth] = useState(columnMinWidth(column));
  const width = flexible ? measuredWidth : columnWidth(column, columnWidths);

  useEffect(() => {
    if (!flexible) return;
    const header = handleRef.current?.parentElement;
    if (!header) return;
    const update = () => {
      const next = header.getBoundingClientRect().width;
      if (next > 0) setMeasuredWidth(Math.round(next));
    };
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => observer.disconnect();
  }, [flexible]);

  const currentWidth = () =>
    flexible ? handleRef.current?.parentElement?.getBoundingClientRect().width || width : width;
  const setWidth = (next: number) =>
    setColumnWidths({
      ...columnWidths,
      [column]: Math.round(Math.min(COLUMN_MAX_WIDTH, Math.max(columnMinWidth(column), next))),
    });
  return (
    <div
      ref={handleRef}
      className="rfm-column-resize"
      role="separator"
      tabIndex={0}
      aria-label={labels.resizeColumn(columnLabel(column, labels))}
      aria-orientation="vertical"
      aria-valuemin={columnMinWidth(column)}
      aria-valuemax={Math.max(COLUMN_MAX_WIDTH, width)}
      aria-valuenow={width}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.focus();
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = {
          pointerId: event.pointerId,
          x: event.clientX,
          width: currentWidth(),
          direction: getComputedStyle(event.currentTarget).direction === "rtl" ? -1 : 1,
        };
      }}
      onPointerMove={(event) => {
        const current = drag.current;
        if (current?.pointerId !== event.pointerId) return;
        setWidth(current.width + (event.clientX - current.x) * current.direction);
      }}
      onPointerUp={(event) => {
        if (drag.current?.pointerId !== event.pointerId) return;
        drag.current = null;
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onLostPointerCapture={() => {
        drag.current = null;
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
      onKeyDown={(event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const direction = getComputedStyle(event.currentTarget).direction === "rtl" ? -1 : 1;
        setWidth(
          event.key === "Home"
            ? columnMinWidth(column)
            : event.key === "End"
              ? COLUMN_MAX_WIDTH
              : currentWidth() + (event.key === "ArrowRight" ? 10 : -10) * direction
        );
      }}
    />
  );
}

import type { FileManagerLabels } from "../labels";
import type { FileManagerColumn, FileManagerColumnWidths, FileManagerNode } from "../types";
import { formatBytes } from "../formatBytes";
import { dateTimestamp, getExtension } from "./tree";

export const FILE_MANAGER_COLUMNS: FileManagerColumn[] = ["name", "size", "kind", "modifiedAt", "addedAt"];

const DEFAULT_WIDTHS: Record<FileManagerColumn, number> = {
  name: 180,
  size: 90,
  kind: 120,
  modifiedAt: 165,
  addedAt: 165,
};

export function columnMinWidth(column: FileManagerColumn): number {
  return column === "name" ? 180 : 80;
}

export const COLUMN_MAX_WIDTH = 600;

export function isFlexibleColumn(column: FileManagerColumn, widths: FileManagerColumnWidths): boolean {
  return column === "name" && (widths.name === undefined || !Number.isFinite(widths.name));
}

export function columnTrack(column: FileManagerColumn, widths: FileManagerColumnWidths): string {
  return isFlexibleColumn(column, widths)
    ? `minmax(${columnMinWidth(column)}px, 1fr)`
    : `${columnWidth(column, widths)}px`;
}

export function columnWidth(column: FileManagerColumn, widths: FileManagerColumnWidths): number {
  const width = widths[column];
  return width !== undefined && Number.isFinite(width)
    ? Math.min(COLUMN_MAX_WIDTH, Math.max(columnMinWidth(column), width))
    : DEFAULT_WIDTHS[column];
}

export function columnLabel(column: FileManagerColumn, labels: FileManagerLabels): string {
  switch (column) {
    case "name":
      return labels.name;
    case "size":
      return labels.size;
    case "kind":
      return labels.kind;
    case "modifiedAt":
      return labels.dateModified;
    case "addedAt":
      return labels.dateAdded;
  }
}

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "short", timeStyle: "short" });

export function columnValue(node: FileManagerNode, column: FileManagerColumn, labels: FileManagerLabels): string {
  switch (column) {
    case "name":
      return node.name;
    case "size":
      return node.kind === "folder"
        ? labels.itemsCount(node.children?.length ?? 0)
        : formatBytes(node.size) || labels.unavailable;
    case "kind":
      return node.kind === "folder" ? labels.folder : getExtension(node)?.toUpperCase() || labels.file;
    case "modifiedAt":
    case "addedAt": {
      const timestamp = dateTimestamp(node[column]);
      return timestamp === undefined ? labels.unavailable : dateFormatter.format(timestamp);
    }
  }
}

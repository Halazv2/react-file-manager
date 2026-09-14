import type { DragEvent, Dispatch, SetStateAction } from "react";

import type { DropTargetId } from "./types";

function isCrossingBoundary(event: DragEvent<HTMLElement>): boolean {
  const related = event.relatedTarget as Node | null;
  return !(related && event.currentTarget.contains(related));
}

export interface FolderDropTargetOptions {
  canManage: boolean;
  targetId: string | "root";
  setDropTargetId: Dispatch<SetStateAction<DropTargetId>>;
  onDropOnFolder: (
    event: DragEvent,
    targetFolderId: string | null
  ) => void | Promise<void>;
  onHoverExpand?: () => void;
  clearExpandTimer?: () => void;
}

export function folderDropTargetHandlers({
  canManage,
  targetId,
  setDropTargetId,
  onDropOnFolder,
  onHoverExpand,
  clearExpandTimer
}: FolderDropTargetOptions) {
  const folderId = targetId === "root" ? null : targetId;

  return {
    onDragEnter: (event: DragEvent<HTMLElement>) => {
      if (!canManage || !isCrossingBoundary(event)) return;
      event.preventDefault();
      setDropTargetId(targetId);
      onHoverExpand?.();
    },
    onDragOver: (event: DragEvent<HTMLElement>) => {
      if (!canManage) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      setDropTargetId(targetId);
    },
    onDragLeave: (event: DragEvent<HTMLElement>) => {
      if (!isCrossingBoundary(event)) return;
      setDropTargetId((current) => (current === targetId ? null : current));
      clearExpandTimer?.();
    },
    onDrop: (event: DragEvent<HTMLElement>) => {
      void onDropOnFolder(event, folderId);
    }
  };
}

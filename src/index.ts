"use client";

export { FileManager } from "./FileManager";
export {
  FILE_MANAGER_DRAG_MIME,
  filesFromDroppedItems,
  isExternalFileDrag,
  isInternalFileManagerDrag,
  planExternalDrop,
  readDataTransferItems,
  readFileSystemEntries,
} from "./droppedItems";
export { folderDropTargetHandlers } from "./dropTarget";
export { defaultNodeIcon, FileTypeIcon, FolderTypeIcon } from "./fileIcons";
export type { FileTypeIconProps, FolderTypeIconProps } from "./fileIcons";
export { buildFilePreview, isImageExtension, isPdfExtension, isTextExtension } from "./preview";
export { getFavoriteFolderIds, getRecentFolderIds, MAX_RECENT_FOLDERS, pushRecentFolderId, toggleFavoriteFolderId } from "./pins";
export { formatBytes } from "./formatBytes";
export { folderContainsId, folderHasChildFolders, getBreadcrumbs, getExtension, getFolderContents, getNodeById, listFolder, moveNodes, searchNodes } from "./tree";
export type {
  DropTargetId,
  FileManagerAction,
  FileManagerClassNames,
  FileManagerDropItem,
  FileManagerItem,
  FileManagerKind,
  FileManagerNode,
  FileManagerProps,
  FileManagerSortBy,
  FileManagerTheme,
  FileManagerView,
  FilePreviewResult,
  PreviewKind,
} from "./types";

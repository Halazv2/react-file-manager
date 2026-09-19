"use client";

export { FileManager } from "./FileManager";
export { useFileManagerController as useFileManager } from "./hooks/useFileManagerController";
export { Item as FileManagerRow } from "./components/Item";
export { Sidebar as FileManagerSidebar } from "./components/Sidebar";
export { Browser as FileManagerBrowser } from "./components/Browser";
export { DetailsPane as FileManagerDetailsPane } from "./components/DetailsPane";
export {
  FILE_MANAGER_DRAG_MIME,
  filesFromDroppedItems,
  isExternalFileDrag,
  isInternalFileManagerDrag,
  planExternalDrop,
  readDataTransferItems,
  readFileSystemEntries,
} from "./core/droppedItems";
export { folderDropTargetHandlers } from "./adapters/dropTarget";
export { defaultNodeIcon, FileTypeIcon, FolderTypeIcon } from "./fileIcons";
export type { FileTypeIconProps, FolderTypeIconProps } from "./fileIcons";
export { buildFilePreview, isImageExtension, isPdfExtension, isTextExtension } from "./adapters/preview";
export { getFavoriteFolderIds, getRecentFolderIds, MAX_RECENT_FOLDERS, pushRecentFolderId, toggleFavoriteFolderId } from "./adapters/pins";
export { DEFAULT_LABELS, resolveLabels } from "./labels";
export type { FileManagerLabels } from "./labels";
export { folderContainsId, folderHasChildFolders, folderHasChildren, getBreadcrumbs, getExtension, getFolderContents, getNodeById, listFolder, moveNodes, searchNodes } from "./core/tree";
export type {
  DropTargetId,
  FileManagerAction,
  FileManagerClassNames,
  FileManagerComponents,
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

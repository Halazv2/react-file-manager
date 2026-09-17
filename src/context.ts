import { createContext, useContext } from "react";
import type {
  DragEvent,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
  RefObject
} from "react";

import type {
  DropTargetId,
  FileManagerAction,
  FileManagerItem,
  FileManagerNode,
  FileManagerView,
  FilePreviewResult
} from "./types";

export interface FileManagerContextValue {
  nodes: FileManagerNode[];
  folderId: string | null;
  viewFolderId: string | null;
  expandedIds: Set<string>;
  dropTargetId: DropTargetId;
  selectedIds: string[];
  selectedNode: FileManagerItem | null;
  focusedIndex: number;
  view: FileManagerView;
  searchQuery: string;
  canManage: boolean;
  rootLabel: string;
  isBusy: boolean;
  items: FileManagerItem[];
  viewItems: FileManagerItem[];
  breadcrumbs: FileManagerNode[];
  showDetails: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  folderDropHandlers: (targetId: string | "root") => {
    onDragEnter: (event: DragEvent<HTMLElement>) => void;
    onDragOver: (event: DragEvent<HTMLElement>) => void;
    onDragLeave: (event: DragEvent<HTMLElement>) => void;
    onDrop: (event: DragEvent<HTMLElement>) => void;
  };
  openFolder: (id: string | null) => void;
  toggleExpanded: (event: MouseEvent, id: string) => void;
  collapseAll: () => void;
  selectItem: (node: FileManagerItem, event?: MouseEvent) => void;
  activateItem: (node: FileManagerItem) => void;
  onDragStart: (node: FileManagerItem, event: DragEvent) => void;
  onInternalDragEnd: () => void;
  onDropOnFolder: (
    event: DragEvent,
    targetFolderId: string | null
  ) => void | Promise<void>;
  setView: (view: FileManagerView) => void;
  setSearchQuery: (query: string) => void;
  handleKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  renderIcon?: (node: FileManagerNode) => ReactNode;
  renderPreview?: (node: FileManagerItem | null) => ReactNode;
  renderActions?: (node: FileManagerNode) => ReactNode;
  onCreateFolder?: (parentId: string | null) => void;
  onCreateFile?: (folderId: string | null) => void;
  onUpload?: (files: File[], folderId: string | null) => void | Promise<void>;
  onOpenFile?: (id: string) => void;
  onDownloadFile?: (id: string) => void | Promise<void>;
  onDownloadFolder?: (id: string) => void | Promise<void>;
  onRename?: (id: string, name: string) => void | Promise<void>;
  onDelete?: (ids: string[]) => void;
  storageKey?: string;
  favoriteIds: string[];
  recentIds: string[];
  pinnedFolders: FileManagerItem[];
  toggleFavorite: (event: MouseEvent, id: string) => void;
  preview: FilePreviewResult | null;
  isPreviewLoading: boolean;
  previewEnabled: boolean;
  resolveItemActions: (node: FileManagerItem) => FileManagerAction[];
  bulkActions: FileManagerAction[];
  contextMenu: { x: number; y: number; node: FileManagerItem } | null;
  openContextMenu: (node: FileManagerItem, event: MouseEvent) => void;
  closeContextMenu: () => void;
}

export const FileManagerContext = createContext<FileManagerContextValue | null>(
  null
);

export function useFileManagerContext(): FileManagerContextValue {
  const value = useContext(FileManagerContext);
  if (!value) {
    throw new Error("FileManager components must be used inside <FileManager>");
  }
  return value;
}

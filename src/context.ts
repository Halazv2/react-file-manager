import { createContext, useContext } from "react";
import type {
  DragEvent,
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
  ReactNode,
  RefObject
} from "react";

import type { FileManagerLabels } from "./labels";
import type {
  DropTargetId,
  FileManagerAction,
  FileManagerClassNames,
  FileManagerComponents,
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
  selectTreeNode: (node: FileManagerItem) => void;
  activateItem: (node: FileManagerItem) => void;
  onDragStart: (node: FileManagerItem, event: DragEvent) => void;
  onPointerDragDown: (node: FileManagerItem, event: PointerEvent<HTMLElement>) => void;
  html5Draggable: boolean;
  onInternalDragEnd: () => void;
  onDropOnFolder: (
    event: DragEvent,
    targetFolderId: string | null
  ) => void | Promise<void>;
  setView: (view: FileManagerView) => void;
  setSearchQuery: (query: string) => void;
  handleKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  renderIcon?: (node: FileManagerNode, size?: number) => ReactNode;
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
  toggleFavorite: (event: MouseEvent | null, id: string) => void;
  pinFolder: (id: string) => void;
  preview: FilePreviewResult | null;
  isPreviewLoading: boolean;
  previewEnabled: boolean;
  resolveItemActions: (node: FileManagerItem) => FileManagerAction[];
  bulkActions: FileManagerAction[];
  contextMenu: { x: number; y: number; node: FileManagerItem } | null;
  openContextMenu: (node: FileManagerItem, event: MouseEvent) => void;
  closeContextMenu: () => void;
  classNames?: FileManagerClassNames;
  rootRef: RefObject<HTMLDivElement | null>;
  labels: FileManagerLabels;
  liveMessage: string;
  dragNotice: string | null;
  editingId: string | null;
  startRename: (id: string) => void;
  commitRename: (id: string, name: string) => void;
  cancelRename: () => void;
  components?: FileManagerComponents;
  showFilesInTree: boolean;
  treeRevealOnFileSelect: boolean;
}

export const FileManagerContext = createContext<FileManagerContextValue | null>(
  null
);

export const FileManagerStateContext = createContext<FileManagerContextValue | null>(null);
export const FileManagerActionsContext = createContext<FileManagerContextValue | null>(null);

export function useFileManagerContext(): FileManagerContextValue {
  const combined = useContext(FileManagerContext);
  const state = useContext(FileManagerStateContext);
  const value = combined ?? state;
  if (!value) {
    throw new Error("FileManager components must be used inside <FileManager>");
  }
  return value;
}

export function useFileManagerActions(): FileManagerContextValue {
  const actions = useContext(FileManagerActionsContext);
  return actions ?? useFileManagerContext();
}


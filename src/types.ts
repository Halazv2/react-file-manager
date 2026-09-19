import type { CSSProperties, ComponentType, ReactNode } from "react";

import type { FileManagerDropItem } from "./core/droppedItems";
import type { FileManagerLabels } from "./labels";

export type { FileManagerDropItem };

export type FileManagerKind = "folder" | "file";

export type FileManagerView = "list" | "cards";

export type FileManagerTheme = "light" | "dark";

export interface FileManagerNode {
  id: string;
  name: string;
  kind: FileManagerKind;
  children?: FileManagerNode[];
  extension?: string;
  size?: number;
  meta?: Record<string, unknown>;
}

export type FileManagerSortBy = "name" | "size" | "kind";

export type FileManagerItem = FileManagerNode & {
  path?: string;
};

export type DropTargetId = string | null | "root";

export interface FileManagerAction {
  id: string;
  label: string;
  danger?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  onClick: () => void | Promise<void>;
}

export type PreviewKind = "image" | "pdf" | "text" | "icon";

export interface FilePreviewResult {
  kind: PreviewKind;
  url?: string;
  text?: string;
  pages?: number;
}

export interface FileManagerClassNames {
  root?: string;
  layout?: string;
  sidebar?: string;
  browser?: string;
  details?: string;
  item?: string;
  treeRow?: string;
  toolbar?: string;
  search?: string;
  menu?: string;
  more?: string;
  bulkBar?: string;
  iconButton?: string;
  viewToggle?: string;
}

export interface FileManagerComponents {
  Row?: ComponentType<{ item: FileManagerItem; index: number }>;
  Sidebar?: ComponentType;
  Browser?: ComponentType;
  DetailsPane?: ComponentType;
}

export interface FileManagerProps {
  nodes: FileManagerNode[];
  folderId?: string | null;
  defaultFolderId?: string | null;
  onFolderChange?: (id: string | null) => void;
  selectedIds?: string[];
  defaultSelectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  view?: FileManagerView;
  defaultView?: FileManagerView;
  onViewChange?: (view: FileManagerView) => void;
  searchQuery?: string;
  defaultSearchQuery?: string;
  onSearchChange?: (query: string) => void;
  canManage?: boolean;
  rootLabel?: string;
  className?: string;
  style?: CSSProperties;
  theme?: FileManagerTheme;
  classNames?: FileManagerClassNames;
  showDetails?: boolean;
  springLoadDelay?: number;
  isBusy?: boolean;
  sortBy?: FileManagerSortBy;
  sortDirection?: "asc" | "desc";
  sortComparator?: (a: FileManagerNode, b: FileManagerNode) => number;
  /** localStorage key prefix for pins/recents. */
  storageKey?: string;
  favoriteIds?: string[];
  defaultFavoriteIds?: string[];
  onFavoritesChange?: (ids: string[]) => void;
  enablePreview?: boolean;
  pdfWorkerSrc?: string;
  previewFetchInit?: RequestInit;
  onMove?: (
    ids: string[],
    targetFolderId: string | null
  ) => void | Promise<void>;
  onOpenFile?: (id: string) => void;
  onOpenFolder?: (id: string | null) => void;
  onUpload?: (
    files: File[],
    folderId: string | null
  ) => void | Promise<void>;
  /** OS folder/file drops. Folders keep their tree; files are `{ kind: "file", file }`. */
  onImport?: (
    items: FileManagerDropItem[],
    folderId: string | null
  ) => void | Promise<void>;
  onCreateFolder?: (parentId: string | null) => void;
  onCreateFile?: (folderId: string | null) => void;
  onDelete?: (ids: string[]) => void;
  onRename?: (id: string, name: string) => void | Promise<void>;
  onDownloadFile?: (id: string) => void | Promise<void>;
  onDownloadFolder?: (id: string) => void | Promise<void>;
  onGetPreviewUrl?: (id: string) => string | null | Promise<string | null>;
  getItemActions?: (node: FileManagerNode) => FileManagerAction[];
  getBulkActions?: (ids: string[]) => FileManagerAction[];
  renderIcon?: (node: FileManagerNode, size?: number) => ReactNode;
  renderPreview?: (node: FileManagerItem | null) => ReactNode;
  renderActions?: (node: FileManagerNode) => ReactNode;
  onError?: (error: unknown, context: { operation: string }) => void;
  labels?: Partial<FileManagerLabels>;
  components?: FileManagerComponents;
}

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

/** Extra inspector row. `stacked` puts the value under the label. */
export interface FileManagerDetailRow {
  id: string;
  label: string;
  value: ReactNode;
  stacked?: boolean;
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

/** Node as it was before the action. `parentId` is `null` at the root. */
export interface FileManagerActionItem {
  id: string;
  name: string;
  kind: FileManagerKind;
  parentId: string | null;
}

/** Folder an action targeted. `id` is `null` at the root. */
export interface FileManagerActionDestination {
  id: string | null;
  name: string;
}

export type FileManagerActionUndo = () => void | Promise<void>;

export interface FileManagerMoveAction {
  type: "move";
  item: FileManagerActionItem;
  items: FileManagerActionItem[];
  destination: FileManagerActionDestination;
  /** Set when every item started in the same folder. */
  previous?: { parentId: string | null };
  current: { parentId: string | null };
  undo?: FileManagerActionUndo;
}

export interface FileManagerCopyAction {
  type: "copy" | "duplicate";
  item: FileManagerActionItem;
  items: FileManagerActionItem[];
  destination: FileManagerActionDestination;
  previous?: { parentId: string | null };
  current: { parentId: string | null };
  undo?: FileManagerActionUndo;
}

export interface FileManagerRenameAction {
  type: "rename";
  item: FileManagerActionItem;
  previous: { name: string };
  current: { name: string };
  undo?: FileManagerActionUndo;
}

export interface FileManagerDeleteAction {
  type: "delete";
  item: FileManagerActionItem;
  items: FileManagerActionItem[];
  undo?: FileManagerActionUndo;
}

export interface FileManagerRestoreAction {
  type: "restore";
  item: FileManagerActionItem;
  items: FileManagerActionItem[];
  destination?: FileManagerActionDestination;
  undo?: FileManagerActionUndo;
}

export interface FileManagerCreateAction {
  type: "create";
  kind: FileManagerKind;
  /** Parent folder the item was created in. */
  destination: FileManagerActionDestination;
  undo?: FileManagerActionUndo;
}

export interface FileManagerUploadAction {
  type: "upload";
  count: number;
  names: string[];
  destination: FileManagerActionDestination;
  undo?: FileManagerActionUndo;
}

export interface FileManagerImportAction {
  type: "import";
  count: number;
  items: Array<{ name: string; kind: FileManagerKind }>;
  destination: FileManagerActionDestination;
  undo?: FileManagerActionUndo;
}

/**
 * Structured result of a successful file or folder mutation.
 * Built-in flows emit `move`, `rename`, `delete`, `create`, `upload`, and `import`.
 * `copy`, `duplicate`, and `restore` stay in the union so those payloads stay typed.
 */
export type FileManagerActionEvent =
  | FileManagerMoveAction
  | FileManagerCopyAction
  | FileManagerRenameAction
  | FileManagerDeleteAction
  | FileManagerRestoreAction
  | FileManagerCreateAction
  | FileManagerUploadAction
  | FileManagerImportAction;

export type FileManagerActionType = FileManagerActionEvent["type"];

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
  onMove?: (ids: string[], targetFolderId: string | null) => void | Promise<void>;
  onOpenFile?: (id: string) => void;
  onOpenFolder?: (id: string | null) => void;
  onUpload?: (files: File[], folderId: string | null) => void | Promise<void>;
  /** OS folder/file drops. Folders keep their tree; files are `{ kind: "file", file }`. */
  onImport?: (items: FileManagerDropItem[], folderId: string | null) => void | Promise<void>;
  onCreateFolder?: (parentId: string | null) => void;
  onCreateFile?: (folderId: string | null) => void;
  onDelete?: (ids: string[]) => void;
  onRename?: (id: string, name: string) => void | Promise<void>;
  onDownloadFile?: (id: string) => void | Promise<void>;
  onDownloadFolder?: (id: string) => void | Promise<void>;
  onGetPreviewUrl?: (id: string) => string | null | Promise<string | null>;
  getItemActions?: (node: FileManagerNode) => FileManagerAction[];
  getBulkActions?: (ids: string[]) => FileManagerAction[];
  /** Extra inspector rows after Type / Pages. */
  getDetailRows?: (node: FileManagerItem) => FileManagerDetailRow[];
  /** Extra inspector actions, shown with View and Download. */
  renderDetailActions?: (node: FileManagerItem) => ReactNode;
  renderIcon?: (node: FileManagerNode, size?: number) => ReactNode;
  renderPreview?: (node: FileManagerItem | null) => ReactNode;
  renderActions?: (node: FileManagerNode) => ReactNode;
  onError?: (error: unknown, context: { operation: string }) => void;
  /**
   * Fired after a file or folder mutation succeeds.
   * A thrown host callback skips the event. Hosts that omit this prop are unchanged.
   */
  onAction?: (event: FileManagerActionEvent) => void | Promise<void>;
  labels?: Partial<FileManagerLabels>;
  components?: FileManagerComponents;
  /** When true (default), the sidebar tree lists files under folders. */
  showFilesInTree?: boolean;
  /** When true (default), selecting a file in the tree opens its parent folder in the browser. */
  treeRevealOnFileSelect?: boolean;
}

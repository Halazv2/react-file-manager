import type { ReactNode } from "react";

export type FileManagerKind = "folder" | "file";

export type FileManagerView = "list" | "cards";

export interface FileManagerNode {
  id: string;
  name: string;
  kind: FileManagerKind;
  children?: FileManagerNode[];
  extension?: string;
  size?: number;
  meta?: Record<string, unknown>;
}

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
  showDetails?: boolean;
  springLoadDelay?: number;
  isBusy?: boolean;
  /** localStorage key prefix for pins/recents. */
  storageKey?: string;
  enablePreview?: boolean;
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
  onCreateFolder?: (parentId: string | null) => void;
  onCreateFile?: (folderId: string | null) => void;
  onDelete?: (ids: string[]) => void;
  onRename?: (id: string, name: string) => void | Promise<void>;
  onDownloadFile?: (id: string) => void | Promise<void>;
  onDownloadFolder?: (id: string) => void | Promise<void>;
  onGetPreviewUrl?: (id: string) => string | null | Promise<string | null>;
  getItemActions?: (node: FileManagerNode) => FileManagerAction[];
  getBulkActions?: (ids: string[]) => FileManagerAction[];
  renderIcon?: (node: FileManagerNode) => ReactNode;
  renderPreview?: (node: FileManagerItem | null) => ReactNode;
  renderActions?: (node: FileManagerNode) => ReactNode;
}

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
  onDelete?: (ids: string[]) => void;
  renderIcon?: (node: FileManagerNode) => ReactNode;
  renderPreview?: (node: FileManagerNode | null) => ReactNode;
  renderActions?: (node: FileManagerNode) => ReactNode;
}

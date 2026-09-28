export interface FileManagerLabels {
  fileManager: string;
  search: string;
  searchAria: string;
  listView: string;
  cardView: string;
  uploadFiles: string;
  createFolder: string;
  createFolderHere: string;
  emptyFolder: string;
  noMatchingFiles: string;
  folderContents: string;
  addNew: string;
  uploadDocument: string;
  collapseAll: string;
  pinnedRecent: string;
  pin: string;
  unpin: string;
  pinFolder: string;
  unpinFolder: string;
  expandFolder: string;
  collapseFolder: string;
  open: string;
  download: string;
  rename: string;
  delete: string;
  view: string;
  detailsEmpty: string;
  keyboardHint: string;
  loadingPreview: string;
  firstPagePreview: string;
  type: string;
  folder: string;
  file: string;
  items: string;
  size: string;
  pages: string;
  pinned: string;
  renameInput: string;
  selectedCount: (count: number) => string;
  itemsCount: (count: number) => string;
  pagesCount: (count: number) => string;
  manageItem: (name: string) => string;
  moved: (count: number) => string;
  deleted: (count: number) => string;
  uploaded: (count: number) => string;
  imported: (count: number) => string;
  renamed: (name: string) => string;
  searchResults: (query: string) => string;
  operationFailed: (operation: string) => string;
  dragOutPreparing: string;
  dragOutReady: string;
}

export const DEFAULT_LABELS: FileManagerLabels = {
  fileManager: "File manager",
  search: "Search",
  searchAria: "Search files",
  listView: "List view",
  cardView: "Card view",
  uploadFiles: "Upload files",
  createFolder: "Create folder",
  createFolderHere: "Create Folder here",
  emptyFolder: "This folder is empty",
  noMatchingFiles: "No matching files",
  folderContents: "Folder contents",
  addNew: "Add New",
  uploadDocument: "Upload Document",
  collapseAll: "Collapse all",
  pinnedRecent: "Pinned & recent",
  pin: "Pin",
  unpin: "Unpin",
  pinFolder: "Pin folder",
  unpinFolder: "Unpin folder",
  expandFolder: "Expand folder",
  collapseFolder: "Collapse folder",
  open: "Open",
  download: "Download",
  rename: "Rename",
  delete: "Delete",
  view: "View",
  detailsEmpty: "Select a file or folder to view details",
  keyboardHint: "↑↓ navigate · Shift range · ⌘/Ctrl toggle · Enter open · Esc clear",
  loadingPreview: "Loading preview…",
  firstPagePreview: "First page preview",
  type: "Type",
  folder: "Folder",
  file: "file",
  items: "Items",
  size: "Size",
  pages: "Pages",
  pinned: "Pinned",
  renameInput: "Rename item",
  selectedCount: (count) => `${count} selected`,
  itemsCount: (count) => `${count} item${count === 1 ? "" : "s"}`,
  pagesCount: (count) => `${count} page${count === 1 ? "" : "s"}`,
  manageItem: (name) => `Manage ${name}`,
  moved: (count) => `Moved ${count} item${count === 1 ? "" : "s"}`,
  deleted: (count) => `Deleted ${count} item${count === 1 ? "" : "s"}`,
  uploaded: (count) => `Uploaded ${count} file${count === 1 ? "" : "s"}`,
  imported: (count) => `Imported ${count} item${count === 1 ? "" : "s"}`,
  renamed: (name) => `Renamed to ${name}`,
  searchResults: (query) => `Showing results for ${query}`,
  operationFailed: (operation) => `${operation} failed`,
  dragOutPreparing: "Preparing files. Drag them out again in a moment.",
  dragOutReady: "Files are ready. Drag them out of the browser.",
};

export function resolveLabels(partial?: Partial<FileManagerLabels>): FileManagerLabels {
  if (!partial) return DEFAULT_LABELS;
  return { ...DEFAULT_LABELS, ...partial };
}

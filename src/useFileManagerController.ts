import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import type { DragEvent, KeyboardEvent, MouseEvent } from "react";

import type { FileManagerContextValue } from "./context";
import { folderDropTargetHandlers } from "./dropTarget";
import {
  getFavoriteFolderIds,
  getRecentFolderIds,
  MAX_RECENT_FOLDERS,
  pushRecentFolderId,
  toggleFavoriteFolderId
} from "./pins";
import { buildFilePreview } from "./preview";
import { idsInRange } from "./selection";
import {
  folderContainsId,
  folderHasChildFolders,
  getBreadcrumbs,
  getExtension,
  getNodeById,
  listFolder,
  searchNodes
} from "./tree";
import type {
  DropTargetId,
  FileManagerAction,
  FileManagerItem,
  FileManagerProps,
  FileManagerView,
  FilePreviewResult
} from "./types";

const DRAG_MIME = "application/x-file-manager-item";

function useControllableState<T>(
  controlled: T | undefined,
  defaultValue: T,
  onChange?: (value: T) => void
): [T, (value: T) => void] {
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const isControlled = controlled !== undefined;
  const value = isControlled ? controlled : uncontrolled;

  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) setUncontrolled(next);
      onChange?.(next);
    },
    [isControlled, onChange]
  );

  return [value, setValue];
}

export function useFileManagerController(
  props: FileManagerProps
): FileManagerContextValue {
  const {
    nodes,
    canManage = true,
    rootLabel = "My files",
    showDetails = true,
    springLoadDelay = 500,
    isBusy = false,
    storageKey,
    enablePreview,
    onMove,
    onOpenFile,
    onOpenFolder,
    onUpload,
    onCreateFolder,
    onCreateFile,
    onDelete,
    onRename,
    onDownloadFile,
    onDownloadFolder,
    onGetPreviewUrl,
    getItemActions,
    getBulkActions,
    renderIcon,
    renderPreview,
    renderActions
  } = props;

  const previewEnabled =
    enablePreview !== undefined ? enablePreview : Boolean(onGetPreviewUrl);

  const [folderId, setFolderId] = useControllableState(
    props.folderId,
    props.defaultFolderId ?? null,
    props.onFolderChange
  );
  const [selectedIds, setSelectedIds] = useControllableState(
    props.selectedIds,
    props.defaultSelectedIds ?? [],
    props.onSelectionChange
  );
  const [view, setView] = useControllableState<FileManagerView>(
    props.view,
    props.defaultView ?? "list",
    props.onViewChange
  );
  const [searchQuery, setSearchQuery] = useControllableState(
    props.searchQuery,
    props.defaultSearchQuery ?? "",
    props.onSearchChange
  );

  const deferredSearch = useDeferredValue(searchQuery);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [selectedNode, setSelectedNode] = useState<FileManagerItem | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [dropTargetId, setDropTargetId] = useState<DropTargetId>(null);
  const [springFolderId, setSpringFolderId] = useState<
    string | null | undefined
  >(undefined);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() =>
    storageKey ? getFavoriteFolderIds(storageKey) : []
  );
  const [recentIds, setRecentIds] = useState<string[]>(() =>
    storageKey ? getRecentFolderIds(storageKey) : []
  );
  const [preview, setPreview] = useState<FilePreviewResult | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: FileManagerItem;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragItem = useRef<{ id: string; kind: "folder" | "file" } | null>(null);
  const selectedIdsRef = useRef<string[]>([]);
  const suppressClickRef = useRef(false);
  const selectionAnchorIndex = useRef(0);
  const dragExpandTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingExpandId = useRef<string | null>(null);
  const springTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSpringKey = useRef<string | null>(null);
  const dropDidHappen = useRef(false);
  const previewRequest = useRef(0);

  selectedIdsRef.current = selectedIds;
  const viewFolderId = springFolderId !== undefined ? springFolderId : folderId;

  const items = useMemo(() => {
    if (deferredSearch.trim() && springFolderId === undefined) {
      return searchNodes(nodes, deferredSearch, rootLabel);
    }
    return listFolder(nodes, folderId);
  }, [deferredSearch, folderId, nodes, rootLabel, springFolderId]);

  const viewItems = useMemo(() => {
    if (springFolderId === undefined) return items;
    return listFolder(nodes, springFolderId);
  }, [items, nodes, springFolderId]);

  const breadcrumbs = useMemo(
    () => getBreadcrumbs(nodes, viewFolderId),
    [nodes, viewFolderId]
  );

  const pinnedFolders = useMemo(() => {
    if (!storageKey) return [];
    const seen = new Set<string>();
    const pinned: FileManagerItem[] = [];
    const recents: FileManagerItem[] = [];

    for (const id of favoriteIds) {
      if (seen.has(id)) continue;
      const folder = getNodeById(nodes, id);
      if (!folder || folder.kind !== "folder") continue;
      seen.add(id);
      pinned.push(folder);
    }

    for (const id of recentIds) {
      if (recents.length >= MAX_RECENT_FOLDERS) break;
      if (seen.has(id)) continue;
      const folder = getNodeById(nodes, id);
      if (!folder || folder.kind !== "folder") continue;
      seen.add(id);
      recents.push(folder);
    }

    return [...pinned, ...recents];
  }, [favoriteIds, recentIds, nodes, storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    setFavoriteIds(getFavoriteFolderIds(storageKey));
    setRecentIds(getRecentFolderIds(storageKey));
  }, [storageKey]);

  useEffect(() => {
    const pathIds = breadcrumbs.map((folder) => folder.id);
    if (!pathIds.length) return;
    setExpandedIds((current) => {
      const next = new Set(current);
      let changed = false;
      for (const id of pathIds) {
        if (!next.has(id)) {
          next.add(id);
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [breadcrumbs]);

  useEffect(() => {
    setFocusedIndex(-1);
    selectionAnchorIndex.current = 0;
  }, [folderId, deferredSearch, view]);

  useEffect(() => {
    return () => {
      if (dragExpandTimer.current) clearTimeout(dragExpandTimer.current);
      if (springTimer.current) clearTimeout(springTimer.current);
    };
  }, []);

  const loadPreview = useCallback(
    async (item: FileManagerItem): Promise<void> => {
      if (!previewEnabled || item.kind !== "file" || !onGetPreviewUrl) {
        setPreview(null);
        return;
      }
      const requestId = ++previewRequest.current;
      const extension = getExtension(item);
      setIsPreviewLoading(true);
      setPreview(null);
      try {
        const url = await onGetPreviewUrl(item.id);
        if (!url) {
          if (requestId === previewRequest.current) setPreview({ kind: "icon" });
          return;
        }
        const result = await buildFilePreview(url, extension);
        if (requestId === previewRequest.current) setPreview(result);
      } catch {
        if (requestId === previewRequest.current) setPreview({ kind: "icon" });
      } finally {
        if (requestId === previewRequest.current) setIsPreviewLoading(false);
      }
    },
    [onGetPreviewUrl, previewEnabled]
  );

  const clearSearch = useCallback((): void => {
    setSearchQuery("");
  }, [setSearchQuery]);

  const openFolder = useCallback(
    (id: string | null): void => {
      setFolderId(id);
      setSelectedNode(null);
      setSelectedIds([]);
      setPreview(null);
      clearSearch();
      if (id && storageKey) {
        setRecentIds(pushRecentFolderId(storageKey, id));
      }
      onOpenFolder?.(id);
    },
    [clearSearch, onOpenFolder, setFolderId, setSelectedIds, storageKey]
  );

  const toggleFavorite = useCallback(
    (event: MouseEvent, id: string): void => {
      event.stopPropagation();
      if (!storageKey) return;
      setFavoriteIds(toggleFavoriteFolderId(storageKey, id));
    },
    [storageKey]
  );

  const clearHoverTimers = useCallback((): void => {
    if (dragExpandTimer.current) {
      clearTimeout(dragExpandTimer.current);
      dragExpandTimer.current = null;
    }
    pendingExpandId.current = null;
    if (springTimer.current) {
      clearTimeout(springTimer.current);
      springTimer.current = null;
    }
    pendingSpringKey.current = null;
  }, []);

  const scheduleFolderExpand = useCallback(
    (id: string): void => {
      if (expandedIds.has(id)) return;
      if (dragItem.current?.kind === "folder" && dragItem.current.id === id) {
        return;
      }
      if (pendingExpandId.current === id) return;
      if (dragExpandTimer.current) clearTimeout(dragExpandTimer.current);
      pendingExpandId.current = id;
      dragExpandTimer.current = setTimeout(() => {
        pendingExpandId.current = null;
        setExpandedIds((current) => {
          if (current.has(id)) return current;
          const next = new Set(current);
          next.add(id);
          return next;
        });
      }, springLoadDelay);
    },
    [expandedIds, springLoadDelay]
  );

  const scheduleSpringOpen = useCallback(
    (id: string | null): void => {
      if (!dragItem.current) return;
      const currentView =
        springFolderId !== undefined ? springFolderId : folderId;
      if (currentView === id) return;
      if (id !== null && dragItem.current.kind === "folder") {
        if (dragItem.current.id === id) return;
        const dragged = getNodeById(nodes, dragItem.current.id);
        if (dragged && folderContainsId(dragged, id)) return;
      }
      const key = id === null ? "root" : `folder-${id}`;
      if (pendingSpringKey.current === key) return;
      if (springTimer.current) clearTimeout(springTimer.current);
      pendingSpringKey.current = key;
      springTimer.current = setTimeout(() => {
        pendingSpringKey.current = null;
        setSpringFolderId(id);
        setDropTargetId(null);
      }, springLoadDelay);
    },
    [folderId, nodes, springFolderId, springLoadDelay]
  );

  const onDragStart = useCallback(
    (item: FileManagerItem, event: DragEvent): void => {
      if (!canManage) return;
      suppressClickRef.current = true;
      dropDidHappen.current = false;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData(
        DRAG_MIME,
        JSON.stringify({ id: item.id, kind: item.kind })
      );
      event.dataTransfer.setData("text/plain", `${item.kind}:${item.id}`);
      dragItem.current = { id: item.id, kind: item.kind };
      if (!selectedIdsRef.current.includes(item.id)) {
        setSelectedIds([item.id]);
        setSelectedNode(item);
      }
    },
    [canManage, setSelectedIds]
  );

  const onDropOnFolder = useCallback(
    async (event: DragEvent, targetFolderId: string | null): Promise<void> => {
      event.preventDefault();
      event.stopPropagation();
      dropDidHappen.current = true;
      setDropTargetId(null);
      clearHoverTimers();
      setSpringFolderId(undefined);
      setFolderId(targetFolderId);
      if (targetFolderId && storageKey) {
        setRecentIds(pushRecentFolderId(storageKey, targetFolderId));
      }

      if (event.dataTransfer.files.length) {
        await onUpload?.(Array.from(event.dataTransfer.files), targetFolderId);
        return;
      }

      const dragged = dragItem.current;
      dragItem.current = null;
      if (!dragged || !canManage) return;

      const currentSelected = selectedIdsRef.current;
      const ids =
        currentSelected.length > 1 && currentSelected.includes(dragged.id)
          ? currentSelected
          : [dragged.id];

      await onMove?.(ids, targetFolderId);
      setSelectedIds([]);
      setSelectedNode(null);
      setPreview(null);
    },
    [
      canManage,
      clearHoverTimers,
      onMove,
      onUpload,
      setFolderId,
      setSelectedIds,
      storageKey
    ]
  );

  const onInternalDragEnd = useCallback((): void => {
    clearHoverTimers();
    setDropTargetId(null);
    if (!dropDidHappen.current) {
      setSpringFolderId(undefined);
    }
    dropDidHappen.current = false;
    dragItem.current = null;
  }, [clearHoverTimers]);

  const folderDropHandlers = useCallback(
    (targetId: string | "root") => {
      const id = targetId === "root" ? null : targetId;
      const folder = targetId === "root" ? null : getNodeById(nodes, targetId);
      return folderDropTargetHandlers({
        canManage,
        targetId,
        setDropTargetId,
        onDropOnFolder,
        onHoverExpand: () => {
          if (folder && folderHasChildFolders(folder)) {
            scheduleFolderExpand(targetId);
          }
          scheduleSpringOpen(id);
        },
        clearExpandTimer: clearHoverTimers
      });
    },
    [
      canManage,
      clearHoverTimers,
      nodes,
      onDropOnFolder,
      scheduleFolderExpand,
      scheduleSpringOpen
    ]
  );

  const toggleExpanded = useCallback((event: MouseEvent, id: string): void => {
    event.stopPropagation();
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const collapseAll = useCallback((): void => {
    setExpandedIds(new Set());
  }, []);

  const selectItem = useCallback(
    (item: FileManagerItem, event?: MouseEvent): void => {
      if (suppressClickRef.current) {
        suppressClickRef.current = false;
        return;
      }

      const index = items.findIndex((entry) => entry.id === item.id);

      if (event?.shiftKey && index >= 0) {
        const rangeIds = idsInRange(items, selectionAnchorIndex.current, index);
        setFocusedIndex(index);
        setSelectedIds(rangeIds);
        setSelectedNode(item);
        setPreview(null);
        return;
      }

      if (event?.metaKey || event?.ctrlKey) {
        if (index >= 0) {
          setFocusedIndex(index);
          selectionAnchorIndex.current = index;
        }
        setSelectedIds(
          selectedIdsRef.current.includes(item.id)
            ? selectedIdsRef.current.filter((id) => id !== item.id)
            : [...selectedIdsRef.current, item.id]
        );
        setSelectedNode(item);
        setPreview(null);
        return;
      }

      if (index >= 0) {
        setFocusedIndex(index);
        selectionAnchorIndex.current = index;
      }
      setSelectedIds([item.id]);
      setSelectedNode(item);
      void loadPreview(item);
    },
    [items, loadPreview, setSelectedIds]
  );

  const activateItem = useCallback(
    (item: FileManagerItem): void => {
      if (item.kind === "folder") openFolder(item.id);
      else onOpenFile?.(item.id);
    },
    [onOpenFile, openFolder]
  );

  const openContextMenu = useCallback(
    (item: FileManagerItem, event: MouseEvent): void => {
      event.preventDefault();
      event.stopPropagation();
      setContextMenu({ x: event.clientX, y: event.clientY, node: item });
      setSelectedNode(item);
      if (!selectedIdsRef.current.includes(item.id)) {
        setSelectedIds([item.id]);
      }
    },
    [setSelectedIds]
  );

  const resolveItemActions = useCallback(
    (node: FileManagerItem): FileManagerAction[] => {
      if (getItemActions) return getItemActions(node);
      const actions: FileManagerAction[] = [];
      if (node.kind === "file") {
        if (onOpenFile) {
          actions.push({
            id: "open",
            label: "Open",
            onClick: () => onOpenFile(node.id)
          });
        }
        if (onDownloadFile) {
          actions.push({
            id: "download",
            label: "Download",
            onClick: () => onDownloadFile(node.id)
          });
        }
      } else if (onDownloadFolder) {
        actions.push({
          id: "download-folder",
          label: "Download",
          onClick: () => onDownloadFolder(node.id)
        });
      }
      if (canManage && onRename) {
        actions.push({
          id: "rename",
          label: "Rename",
          onClick: () => {
            const name = window.prompt("Rename", node.name);
            if (name?.trim()) void onRename(node.id, name.trim());
          }
        });
      }
      if (canManage && onDelete) {
        actions.push({
          id: "delete",
          label: "Delete",
          danger: true,
          onClick: () => onDelete([node.id])
        });
      }
      return actions;
    },
    [
      canManage,
      getItemActions,
      onDelete,
      onDownloadFile,
      onDownloadFolder,
      onOpenFile,
      onRename
    ]
  );

  const bulkActions = useMemo((): FileManagerAction[] => {
    if (getBulkActions) return getBulkActions(selectedIds);
    const actions: FileManagerAction[] = [];
    if (onOpenFile) {
      actions.push({
        id: "open",
        label: "Open",
        onClick: () => {
          for (const id of selectedIds) onOpenFile(id);
        }
      });
    }
    if (canManage && onDelete) {
      actions.push({
        id: "delete",
        label: "Delete",
        danger: true,
        onClick: () => onDelete(selectedIds)
      });
    }
    return actions;
  }, [canManage, getBulkActions, onDelete, onOpenFile, selectedIds]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>): void => {
      const targetEl = event.target as HTMLElement;
      if (
        targetEl.tagName === "INPUT" ||
        targetEl.tagName === "TEXTAREA" ||
        targetEl.isContentEditable
      ) {
        if (event.key === "Escape") clearSearch();
        return;
      }

      const list = springFolderId !== undefined ? viewItems : items;

      if (!list.length) {
        if (event.key === "Escape" && searchQuery) clearSearch();
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const delta = event.key === "ArrowDown" ? 1 : -1;
        const current = focusedIndex < 0 ? (delta > 0 ? -1 : 0) : focusedIndex;
        const next = Math.min(Math.max(current + delta, 0), list.length - 1);
        setFocusedIndex(next);
        if (!event.shiftKey) selectionAnchorIndex.current = next;
        const focused = list[next];
        if (!focused) return;
        if (event.shiftKey) {
          setSelectedIds(idsInRange(list, selectionAnchorIndex.current, next));
        } else {
          setSelectedIds([focused.id]);
          void loadPreview(focused);
        }
        setSelectedNode(focused);
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        const item = list[focusedIndex];
        if (item) activateItem(item);
        return;
      }

      if (event.key === " ") {
        event.preventDefault();
        const item = list[focusedIndex];
        if (item) selectItem(item);
        return;
      }

      if (event.key === "Escape") {
        if (searchQuery) {
          clearSearch();
          return;
        }
        setSelectedNode(null);
        setSelectedIds([]);
        setPreview(null);
        setContextMenu(null);
        return;
      }

      if ((event.key === "Delete" || event.key === "Backspace") && canManage) {
        const ids =
          selectedIds.length > 0
            ? selectedIds
            : list[focusedIndex]
              ? [list[focusedIndex].id]
              : [];
        if (!ids.length) return;
        event.preventDefault();
        onDelete?.(ids);
      }
    },
    [
      activateItem,
      canManage,
      clearSearch,
      focusedIndex,
      items,
      loadPreview,
      onDelete,
      searchQuery,
      selectItem,
      selectedIds,
      setSelectedIds,
      springFolderId,
      viewItems
    ]
  );

  return {
    nodes,
    folderId,
    viewFolderId,
    expandedIds,
    dropTargetId,
    selectedIds,
    selectedNode,
    focusedIndex,
    view,
    searchQuery,
    canManage,
    rootLabel,
    isBusy,
    items,
    viewItems,
    breadcrumbs,
    showDetails,
    fileInputRef,
    folderDropHandlers,
    openFolder,
    toggleExpanded,
    collapseAll,
    selectItem,
    activateItem,
    onDragStart,
    onInternalDragEnd,
    onDropOnFolder,
    setView,
    setSearchQuery,
    handleKeyDown,
    renderIcon,
    renderPreview,
    renderActions,
    onCreateFolder,
    onCreateFile,
    onUpload,
    onOpenFile,
    onDownloadFile,
    onDownloadFolder,
    onRename,
    onDelete,
    storageKey,
    favoriteIds,
    recentIds,
    pinnedFolders,
    toggleFavorite,
    preview,
    isPreviewLoading,
    previewEnabled,
    resolveItemActions,
    bulkActions,
    contextMenu,
    openContextMenu,
    closeContextMenu: () => setContextMenu(null)
  };
}

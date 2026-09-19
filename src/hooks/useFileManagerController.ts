import { createElement, useCallback, useDeferredValue, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { DragEvent, KeyboardEvent, MouseEvent, PointerEvent } from "react";

import type { FileManagerContextValue } from "../context";
import { FILE_MANAGER_DRAG_MIME, isInternalFileManagerDrag, planExternalDrop, readDataTransferItems } from "../core/droppedItems";
import { DND_IDLE, dndReducer, isDndActive } from "../core/dndMachine";
import { folderDropTargetHandlers } from "../adapters/dropTarget";
import { folderIdFromDropTarget, html5DragEnabled, POINTER_DRAG_THRESHOLD, resolvePointerDropTarget, shouldUsePointerDrag } from "../adapters/pointerDnd";
import { StarIcon, StarSolidIcon } from "../icons";
import { getFavoriteFolderIds, getRecentFolderIds, MAX_RECENT_FOLDERS, pushRecentFolderId, toggleFavoriteFolderId } from "../adapters/pins";
import { buildFilePreview } from "../adapters/preview";
import { idsInRange } from "../core/selection";
import { folderHasChildFolders, getExtension, listFolder, searchNodes } from "../core/tree";
import { breadcrumbsFromIndex, buildTreeIndex, folderContainsIdInIndex, getIndexedNode } from "../core/treeIndex";
import type { DropTargetId, FileManagerAction, FileManagerItem, FileManagerProps, FileManagerView, FilePreviewResult } from "../types";
import { resolveLabels } from "../labels";

function useControllableState<T>(controlled: T | undefined, defaultValue: T, onChange?: (value: T) => void): [T, (value: T) => void] {
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const isControlled = controlled !== undefined;
  const value = isControlled ? controlled : uncontrolled;

  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) setUncontrolled(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  return [value, setValue];
}

export function useFileManagerController(props: FileManagerProps): FileManagerContextValue {
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
    onImport,
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
    renderActions,
    onError,
  } = props;

  const labels = useMemo(() => resolveLabels(props.labels), [props.labels]);

  const previewEnabled = enablePreview !== undefined ? enablePreview : Boolean(onGetPreviewUrl);

  const [folderId, setFolderId] = useControllableState(props.folderId, props.defaultFolderId ?? null, props.onFolderChange);
  const [selectedIds, setSelectedIds] = useControllableState(props.selectedIds, props.defaultSelectedIds ?? [], props.onSelectionChange);
  const [view, setView] = useControllableState<FileManagerView>(props.view, props.defaultView ?? "list", props.onViewChange);
  const [searchQuery, setSearchQuery] = useControllableState(props.searchQuery, props.defaultSearchQuery ?? "", props.onSearchChange);

  const deferredSearch = useDeferredValue(searchQuery);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [selectedNode, setSelectedNode] = useState<FileManagerItem | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [dropTargetId, setDropTargetId] = useState<DropTargetId>(null);
  const [springFolderId, setSpringFolderId] = useState<string | null | undefined>(undefined);
  const [favoriteIds, setFavoriteIds] = useControllableState(
    props.favoriteIds,
    props.defaultFavoriteIds ?? (storageKey ? getFavoriteFolderIds(storageKey) : []),
    props.onFavoritesChange,
  );
  const [recentIds, setRecentIds] = useState<string[]>(() => (storageKey ? getRecentFolderIds(storageKey) : []));
  const [preview, setPreview] = useState<FilePreviewResult | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: FileManagerItem;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [dnd, dispatchDnd] = useReducer(dndReducer, DND_IDLE);
  const dndRef = useRef(dnd);
  const selectedIdsRef = useRef<string[]>([]);
  const suppressClickRef = useRef(false);
  const selectionAnchorIndex = useRef(0);
  const dragExpandTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingExpandId = useRef<string | null>(null);
  const springTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSpringKey = useRef<string | null>(null);
  const dropDidHappen = useRef(false);
  const previewRequest = useRef(0);
  const [pendingOperation, setPendingOperation] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const labelsRef = useRef(labels);
  labelsRef.current = labels;

  selectedIdsRef.current = selectedIds;
  dndRef.current = dnd;
  const treeIndex = useMemo(() => buildTreeIndex(nodes), [nodes]);
  const viewFolderId = springFolderId !== undefined ? springFolderId : folderId;

  const items = useMemo(() => {
    if (deferredSearch.trim() && springFolderId === undefined) {
      return searchNodes(nodes, deferredSearch, rootLabel);
    }
    return listFolder(nodes, folderId, {
      sortBy: props.sortBy,
      sortDirection: props.sortDirection,
      sortComparator: props.sortComparator,
    });
  }, [deferredSearch, folderId, nodes, props.sortBy, props.sortComparator, props.sortDirection, rootLabel, springFolderId]);

  const viewItems = useMemo(() => {
    if (springFolderId === undefined) return items;
    return listFolder(nodes, springFolderId, {
      sortBy: props.sortBy,
      sortDirection: props.sortDirection,
      sortComparator: props.sortComparator,
    });
  }, [items, nodes, props.sortBy, props.sortComparator, props.sortDirection, springFolderId]);

  const breadcrumbs = useMemo(() => breadcrumbsFromIndex(treeIndex, viewFolderId), [treeIndex, viewFolderId]);

  const pinnedFolders = useMemo(() => {
    if (!storageKey && props.favoriteIds === undefined) return [];
    const seen = new Set<string>();
    const pinned: FileManagerItem[] = [];
    const recents: FileManagerItem[] = [];

    for (const id of favoriteIds) {
      if (seen.has(id)) continue;
      const folder = getIndexedNode(treeIndex, id);
      if (!folder || folder.kind !== "folder") continue;
      seen.add(id);
      pinned.push(folder);
    }

    for (const id of recentIds) {
      if (recents.length >= MAX_RECENT_FOLDERS) break;
      if (seen.has(id)) continue;
      const folder = getIndexedNode(treeIndex, id);
      if (!folder || folder.kind !== "folder") continue;
      seen.add(id);
      recents.push(folder);
    }

    return [...pinned, ...recents];
  }, [favoriteIds, recentIds, storageKey, treeIndex]);

  useEffect(() => {
    if (!storageKey || props.favoriteIds !== undefined) return;
    setFavoriteIds(getFavoriteFolderIds(storageKey));
    setRecentIds(getRecentFolderIds(storageKey));
  }, [props.favoriteIds, setFavoriteIds, storageKey]);

  useEffect(() => {
    const nextIds = selectedIds.filter((id) => treeIndex.byId.has(id));
    if (nextIds.length !== selectedIds.length) setSelectedIds(nextIds);
    setSelectedNode((current) => {
      if (!current) return null;
      const next = treeIndex.byId.get(current.id);
      return next ? (next as FileManagerItem) : null;
    });
  }, [selectedIds, setSelectedIds, treeIndex]);

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
        const result = await buildFilePreview(url, extension, {
          pdfWorkerSrc: props.pdfWorkerSrc,
          fetchInit: props.previewFetchInit,
        });
        if (requestId === previewRequest.current) setPreview(result);
      } catch {
        if (requestId === previewRequest.current) setPreview({ kind: "icon" });
      } finally {
        if (requestId === previewRequest.current) setIsPreviewLoading(false);
      }
    },
    [onGetPreviewUrl, previewEnabled, props.pdfWorkerSrc, props.previewFetchInit],
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
    [clearSearch, onOpenFolder, setFolderId, setSelectedIds, storageKey],
  );

  const toggleFavorite = useCallback(
    (event: MouseEvent | null, id: string): void => {
      event?.stopPropagation();
      if (storageKey) {
        setFavoriteIds(toggleFavoriteFolderId(storageKey, id));
        return;
      }
      setFavoriteIds(favoriteIds.includes(id) ? favoriteIds.filter((entry) => entry !== id) : [id, ...favoriteIds]);
    },
    [favoriteIds, setFavoriteIds, storageKey]
  );

  const pinFolder = useCallback(
    (id: string): void => {
      if (storageKey) {
        setFavoriteIds(toggleFavoriteFolderId(storageKey, id));
        return;
      }
      setFavoriteIds(favoriteIds.includes(id) ? favoriteIds.filter((entry) => entry !== id) : [id, ...favoriteIds]);
    },
    [favoriteIds, setFavoriteIds, storageKey]
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

  const announce = useCallback((message: string) => {
    setLiveMessage(message);
  }, []);

  useEffect(() => {
    const query = deferredSearch.trim();
    if (query) announce(labels.searchResults(query));
  }, [announce, deferredSearch, labels]);

  const runHostOperation = useCallback(
    async (operation: string, task?: () => void | Promise<void>, successMessage?: string): Promise<boolean> => {
      if (!task) return true;
      setPendingOperation(operation);
      try {
        await task();
        if (successMessage) announce(successMessage);
        return true;
      } catch (error) {
        onError?.(error, { operation });
        announce(labelsRef.current.operationFailed(operation));
        return false;
      } finally {
        setPendingOperation(null);
      }
    },
    [announce, onError],
  );

  const handleUpload = useCallback(
    (files: File[], folderId: string | null) => {
      void runHostOperation("upload", onUpload ? () => onUpload(files, folderId) : undefined, labels.uploaded(files.length));
    },
    [labels, onUpload, runHostOperation],
  );

  const handleDelete = useCallback(
    (ids: string[]) => {
      void runHostOperation("delete", onDelete ? () => onDelete(ids) : undefined, labels.deleted(ids.length));
    },
    [labels, onDelete, runHostOperation],
  );

  const handleRename = useCallback(
    (id: string, name: string) => {
      void runHostOperation("rename", onRename ? () => onRename(id, name) : undefined, labels.renamed(name));
    },
    [labels, onRename, runHostOperation],
  );

  const startRename = useCallback((id: string) => {
    setEditingId(id);
  }, []);

  const cancelRename = useCallback(() => {
    setEditingId(null);
  }, []);

  const commitRename = useCallback(
    (id: string, name: string) => {
      setEditingId(null);
      const trimmed = name.trim();
      if (!trimmed) return;
      handleRename(id, trimmed);
    },
    [handleRename],
  );

  const handleDownloadFile = useCallback(
    (id: string) => {
      void runHostOperation("downloadFile", onDownloadFile ? () => onDownloadFile(id) : undefined);
    },
    [onDownloadFile, runHostOperation],
  );

  const handleDownloadFolder = useCallback(
    (id: string) => {
      void runHostOperation("downloadFolder", onDownloadFolder ? () => onDownloadFolder(id) : undefined);
    },
    [onDownloadFolder, runHostOperation],
  );

  const scheduleFolderExpand = useCallback(
    (id: string): void => {
      if (expandedIds.has(id)) return;
      const drag = dndRef.current;
      if (drag.status === "dragging" || drag.status === "hovering" || drag.status === "springOpen") {
        if (drag.kind === "folder" && drag.primaryId === id) {
          return;
        }
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
    [expandedIds, springLoadDelay],
  );

  const scheduleSpringOpen = useCallback(
    (id: string | null): void => {
      const session = dndRef.current;
      if (session.status === "idle" || session.status === "cancelled" || session.status === "dropped") return;
      const currentView = springFolderId !== undefined ? springFolderId : folderId;
      if (currentView === id) return;
      if (id !== null && session.kind === "folder") {
        if (session.primaryId === id) return;
        const dragged = getIndexedNode(treeIndex, session.primaryId);
        if (dragged && folderContainsIdInIndex(treeIndex, dragged.id, id)) return;
      }
      dispatchDnd({ type: "HOVER", targetId: id });
      const key = id === null ? "root" : `folder-${id}`;
      if (pendingSpringKey.current === key) return;
      if (springTimer.current) clearTimeout(springTimer.current);
      pendingSpringKey.current = key;
      springTimer.current = setTimeout(() => {
        pendingSpringKey.current = null;
        dispatchDnd({ type: "SPRING_OPEN" });
        setSpringFolderId(id);
        setDropTargetId(null);
      }, springLoadDelay);
    },
    [folderId, springFolderId, springLoadDelay, treeIndex],
  );

  const onDragStart = useCallback(
    (item: FileManagerItem, event: DragEvent): void => {
      if (!canManage) return;
      suppressClickRef.current = true;
      dropDidHappen.current = false;
      dispatchDnd({ type: "START", id: item.id, kind: item.kind, selectedIds: selectedIdsRef.current });
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData(FILE_MANAGER_DRAG_MIME, JSON.stringify({ id: item.id, kind: item.kind }));
      event.dataTransfer.setData("text/plain", `${item.kind}:${item.id}`);
      if (!selectedIdsRef.current.includes(item.id)) {
        setSelectedIds([item.id]);
        setSelectedNode(item);
      }
    },
    [canManage, setSelectedIds],
  );

  const commitInternalMove = useCallback(
    async (targetFolderId: string | null): Promise<void> => {
      dropDidHappen.current = true;
      setDropTargetId(null);
      clearHoverTimers();

      const commitDrop = (): void => {
        setSpringFolderId(undefined);
        setFolderId(targetFolderId);
        if (targetFolderId && storageKey) {
          setRecentIds(pushRecentFolderId(storageKey, targetFolderId));
        }
      };

      const rollbackSpring = (): void => {
        setSpringFolderId(undefined);
        dispatchDnd({ type: "RESET" });
      };

      const session = dndRef.current;
      const dragged =
        session.status === "dragging" || session.status === "hovering" || session.status === "springOpen"
          ? session
          : null;
      dispatchDnd({ type: "DROP", targetId: targetFolderId });
      if (!dragged || !canManage) {
        rollbackSpring();
        return;
      }

      const ids = dragged.ids;
      const ok = await runHostOperation("move", onMove ? () => onMove(ids, targetFolderId) : undefined, labels.moved(ids.length));
      if (!ok) {
        rollbackSpring();
        return;
      }
      commitDrop();
      setSelectedIds([]);
      setSelectedNode(null);
      setPreview(null);
      dispatchDnd({ type: "RESET" });
    },
    [canManage, clearHoverTimers, labels, onMove, runHostOperation, setFolderId, setSelectedIds, storageKey],
  );

  const onDropOnFolder = useCallback(
    async (event: DragEvent, targetFolderId: string | null): Promise<void> => {
      event.preventDefault();
      event.stopPropagation();

      const isInternal = isDndActive(dndRef.current) || dndRef.current.status === "dropped" || isInternalFileManagerDrag(event.dataTransfer);
      if (!isInternal) {
        dropDidHappen.current = true;
        setDropTargetId(null);
        clearHoverTimers();
        const commitDrop = (): void => {
          setSpringFolderId(undefined);
          setFolderId(targetFolderId);
          if (targetFolderId && storageKey) {
            setRecentIds(pushRecentFolderId(storageKey, targetFolderId));
          }
        };
        const rollbackSpring = (): void => {
          setSpringFolderId(undefined);
          dispatchDnd({ type: "RESET" });
        };
        if (!canManage) {
          rollbackSpring();
          return;
        }
        const dropped = await readDataTransferItems(event.dataTransfer);
        const plan = planExternalDrop(dropped, Boolean(onImport));
        let ok = true;
        if (plan.action === "import") {
          ok = await runHostOperation("import", () => onImport?.(plan.items, targetFolderId), labels.imported(plan.items.length));
        } else if (plan.action === "upload") {
          ok = await runHostOperation("upload", () => onUpload?.(plan.files, targetFolderId), labels.uploaded(plan.files.length));
        }
        if (ok) {
          commitDrop();
          dispatchDnd({ type: "RESET" });
        } else rollbackSpring();
        return;
      }

      await commitInternalMove(targetFolderId);
    },
    [canManage, clearHoverTimers, commitInternalMove, labels, onImport, onUpload, runHostOperation, setFolderId, storageKey],
  );

  const onInternalDragEnd = useCallback((): void => {
    clearHoverTimers();
    setDropTargetId(null);
    const ended = dndReducer(dndRef.current, { type: "END" });
    dispatchDnd({ type: "END" });
    if (ended.status !== "dropped" && dndRef.current.status !== "dropped") {
      setSpringFolderId(undefined);
      dispatchDnd({ type: "RESET" });
    }
    dropDidHappen.current = false;
  }, [clearHoverTimers]);

  const onPointerDragDown = useCallback(
    (item: FileManagerItem, event: PointerEvent<HTMLElement>): void => {
      if (!canManage || !shouldUsePointerDrag(event.pointerType) || event.button !== 0) return;
      const pointerId = event.pointerId;
      const startX = event.clientX;
      const startY = event.clientY;
      const targetEl = event.currentTarget;
      let dragging = false;
      try {
        targetEl.setPointerCapture(pointerId);
      } catch {
        /* jsdom */
      }

      const cleanup = () => {
        targetEl.removeEventListener("pointermove", onMove);
        targetEl.removeEventListener("pointerup", onUp);
        targetEl.removeEventListener("pointercancel", onCancel);
        try {
          targetEl.releasePointerCapture(pointerId);
        } catch {
          /* jsdom */
        }
      };

      const hoverTarget = (clientX: number, clientY: number) => {
        const resolved = resolvePointerDropTarget(clientX, clientY);
        if (resolved === null) {
          setDropTargetId(null);
          return;
        }
        setDropTargetId(resolved);
        const folderId = folderIdFromDropTarget(resolved);
        if (resolved !== "root") {
          const folder = getIndexedNode(treeIndex, resolved);
          if (folder && folderHasChildFolders(folder)) scheduleFolderExpand(resolved);
        }
        if (folderId !== undefined) scheduleSpringOpen(folderId);
      };

      const onMove = (native: globalThis.PointerEvent) => {
        if (native.pointerId !== pointerId) return;
        if (!dragging) {
          if (Math.hypot(native.clientX - startX, native.clientY - startY) < POINTER_DRAG_THRESHOLD) return;
          dragging = true;
          suppressClickRef.current = true;
          dropDidHappen.current = false;
          dispatchDnd({ type: "START", id: item.id, kind: item.kind, selectedIds: selectedIdsRef.current });
          if (!selectedIdsRef.current.includes(item.id)) {
            setSelectedIds([item.id]);
            setSelectedNode(item);
          }
        }
        native.preventDefault();
        hoverTarget(native.clientX, native.clientY);
      };

      const onUp = (native: globalThis.PointerEvent) => {
        if (native.pointerId !== pointerId) return;
        cleanup();
        if (!dragging) return;
        const folderId = folderIdFromDropTarget(resolvePointerDropTarget(native.clientX, native.clientY));
        if (folderId === undefined) {
          onInternalDragEnd();
          return;
        }
        void commitInternalMove(folderId);
      };

      const onCancel = (native: globalThis.PointerEvent) => {
        if (native.pointerId !== pointerId) return;
        cleanup();
        if (dragging) onInternalDragEnd();
      };

      targetEl.addEventListener("pointermove", onMove);
      targetEl.addEventListener("pointerup", onUp);
      targetEl.addEventListener("pointercancel", onCancel);
    },
    [canManage, commitInternalMove, onInternalDragEnd, scheduleFolderExpand, scheduleSpringOpen, setSelectedIds, treeIndex],
  );

  const folderDropHandlers = useCallback(
    (targetId: string | "root") => {
      const id = targetId === "root" ? null : targetId;
      const folder = targetId === "root" ? null : getIndexedNode(treeIndex, targetId);
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
        clearExpandTimer: clearHoverTimers,
      });
    },
    [canManage, clearHoverTimers, onDropOnFolder, scheduleFolderExpand, scheduleSpringOpen, treeIndex],
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
        setSelectedIds(selectedIdsRef.current.includes(item.id) ? selectedIdsRef.current.filter((id) => id !== item.id) : [...selectedIdsRef.current, item.id]);
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
    [items, loadPreview, setSelectedIds],
  );

  const activateItem = useCallback(
    (item: FileManagerItem): void => {
      if (item.kind === "folder") openFolder(item.id);
      else onOpenFile?.(item.id);
    },
    [onOpenFile, openFolder],
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
    [setSelectedIds],
  );

  const resolveItemActions = useCallback(
    (node: FileManagerItem): FileManagerAction[] => {
      const hostActions = getItemActions
        ? getItemActions(node)
        : (() => {
            const actions: FileManagerAction[] = [];
            if (node.kind === "file") {
              if (onOpenFile) {
                actions.push({
                  id: "open",
                  label: labels.open,
                  onClick: () => onOpenFile(node.id)
                });
              }
              if (onDownloadFile) {
                actions.push({
                  id: "download",
                  label: labels.download,
                  onClick: () => handleDownloadFile(node.id)
                });
              }
            } else if (onDownloadFolder) {
              actions.push({
                id: "download-folder",
                label: labels.download,
                onClick: () => handleDownloadFolder(node.id)
              });
            }
            if (canManage && onRename) {
              actions.push({
                id: "rename",
                label: labels.rename,
                onClick: () => startRename(node.id)
              });
            }
            if (canManage && onDelete) {
              actions.push({
                id: "delete",
                label: labels.delete,
                danger: true,
                onClick: () => handleDelete([node.id])
              });
            }
            return actions;
          })();

      if (storageKey && node.kind === "folder") {
        const isFavorite = favoriteIds.includes(node.id);
        const withoutPin = hostActions.filter((action) => action.id !== "pin");
        return [
          {
            id: "pin",
            label: isFavorite ? labels.unpinFolder : labels.pinFolder,
            icon: isFavorite
              ? createElement(StarSolidIcon, { className: "rfm-star", size: 14 })
              : createElement(StarIcon, { size: 14 }),
            onClick: () => pinFolder(node.id)
          },
          ...withoutPin
        ];
      }

      return hostActions;
    },
    [
      canManage,
      favoriteIds,
      getItemActions,
      handleDelete,
      handleDownloadFile,
      handleDownloadFolder,
      handleRename,
      labels,
      onOpenFile,
      onRename,
      pinFolder,
      startRename,
      storageKey
    ]
  );

  const bulkActions = useMemo((): FileManagerAction[] => {
    if (getBulkActions) return getBulkActions(selectedIds);
    const actions: FileManagerAction[] = [];
    if (onOpenFile) {
      actions.push({
        id: "open",
        label: labels.open,
        onClick: () => {
          for (const id of selectedIds) onOpenFile(id);
        },
      });
    }
    if (canManage && onDelete) {
      actions.push({
        id: "delete",
        label: labels.delete,
        danger: true,
        onClick: () => handleDelete(selectedIds),
      });
    }
    return actions;
  }, [canManage, getBulkActions, handleDelete, labels, onDelete, onOpenFile, selectedIds]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>): void => {
      const targetEl = event.target as HTMLElement;
      if (targetEl.tagName === "INPUT" || targetEl.tagName === "TEXTAREA" || targetEl.isContentEditable) {
        if (event.key === "Escape" && editingId) {
          event.preventDefault();
          cancelRename();
          return;
        }
        if (event.key === "Escape") clearSearch();
        return;
      }

      if (editingId) {
        if (event.key === "Escape") {
          event.preventDefault();
          cancelRename();
        }
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

      if (event.key === "F2" && canManage && onRename) {
        const id = selectedIds[0] ?? list[focusedIndex]?.id;
        if (id) {
          event.preventDefault();
          startRename(id);
        }
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
        const ids = selectedIds.length > 0 ? selectedIds : list[focusedIndex] ? [list[focusedIndex].id] : [];
        if (!ids.length) return;
        event.preventDefault();
        handleDelete(ids);
      }
    },
    [activateItem, canManage, cancelRename, clearSearch, editingId, focusedIndex, handleDelete, items, loadPreview, onRename, searchQuery, selectItem, selectedIds, setSelectedIds, springFolderId, startRename, viewItems],
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
    isBusy: isBusy || pendingOperation !== null,
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
    onPointerDragDown,
    html5Draggable: html5DragEnabled(),
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
    onUpload: handleUpload,
    onOpenFile,
    onDownloadFile: handleDownloadFile,
    onDownloadFolder: handleDownloadFolder,
    onRename: handleRename,
    onDelete: handleDelete,
    storageKey,
    favoriteIds,
    recentIds,
    pinnedFolders,
    toggleFavorite,
    pinFolder,
    preview,
    isPreviewLoading,
    previewEnabled,
    resolveItemActions,
    bulkActions,
    contextMenu,
    openContextMenu,
    closeContextMenu: () => setContextMenu(null),
    classNames: props.classNames,
    rootRef,
    labels,
    liveMessage,
    editingId,
    startRename,
    commitRename,
    cancelRename,
    components: props.components,
  };
}

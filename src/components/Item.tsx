import { memo, useEffect, useMemo, useRef } from "react";

import { BulkActionBar, ContextMenuLayer, MoreMenuButton } from "./ActionMenu";
import { ItemErrorBoundary } from "./ItemErrorBoundary";
import { defaultNodeIcon, IconFrame } from "../fileIcons";
import { StarSolidIcon } from "../icons";
import { useFileManagerContext } from "../context";
import { cn } from "../styles";
import { compareFolderEntries, folderHasChildren, getExtension } from "../core/tree";
import { formatBytes } from "../formatBytes";
import type { FileManagerItem, FileManagerNode } from "../types";

export const Item = memo(function Item({ item, index }: { item: FileManagerItem; index: number }) {
  const {
    view,
    selectedIds,
    focusedIndex,
    dropTargetId,
    canManage,
    selectItem,
    activateItem,
    onDragStart,
    onPointerDragDown,
    html5Draggable,
    folderDropHandlers,
    renderIcon,
    renderActions,
    resolveItemActions,
    openContextMenu,
    classNames,
    labels,
    editingId,
    commitRename,
    cancelRename,
  } = useFileManagerContext();

  const isSelected = selectedIds.includes(item.id);
  const isFocused = focusedIndex === index;
  const isFolder = item.kind === "folder";
  const isDropTarget = dropTargetId === item.id && isFolder;
  const isEditing = editingId === item.id;
  const childCount = isFolder ? (item.children?.length ?? 0) : null;
  const extension = getExtension(item);
  const actions = resolveItemActions(item);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isEditing]);

  return (
    <ItemErrorBoundary itemId={item.id} fallback={<div className="rfm-row" role="option" aria-label={item.name} />}>
      <div className="rfm-row">
        <div
          draggable={canManage && !isEditing && html5Draggable}
          role="option"
          aria-selected={isSelected}
          aria-label={item.name}
          data-view={view}
          data-kind={item.kind}
          data-drop-id={isFolder ? item.id : undefined}
          data-focused={isFocused || undefined}
          data-drop-target={isDropTarget || undefined}
          data-editing={isEditing || undefined}
          className={cn("rfm-item", classNames?.item)}
          onDragStart={(event) => onDragStart(item, event)}
          onPointerDown={(event) => onPointerDragDown(item, event)}
          {...(isFolder ? folderDropHandlers(item.id) : {})}
          onClick={(event) => {
            if (isEditing) return;
            selectItem(item, event);
          }}
          onDoubleClick={() => {
            if (isEditing) return;
            activateItem(item);
          }}
          onContextMenu={(event) => openContextMenu(item, event)}>
          <IconFrame size={view === "cards" ? 28 : 16}>
            {renderIcon?.(item, view === "cards" ? 28 : 16) ?? defaultNodeIcon(item, view === "cards" ? 28 : 16)}
          </IconFrame>
          <span className="rfm-item-name">
            {isEditing ? (
              <input
                ref={inputRef}
                className="rfm-rename-input"
                aria-label={labels.renameInput}
                defaultValue={item.name}
                data-editing=""
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => {
                  event.stopPropagation();
                  if (event.key === "Enter") {
                    event.preventDefault();
                    commitRename(item.id, event.currentTarget.value);
                  }
                  if (event.key === "Escape") {
                    event.preventDefault();
                    cancelRename();
                  }
                }}
                onBlur={(event) => commitRename(item.id, event.currentTarget.value)}
              />
            ) : (
              <>
                <span className="rfm-item-label" data-view={view}>
                  {item.name}
                </span>
                {item.path && <span className="rfm-item-path">{item.path}</span>}
              </>
            )}
          </span>
          {view === "list" && !isEditing && (
            <span className="rfm-item-meta">
              {isFolder ? labels.itemsCount(childCount ?? 0) : formatBytes(item.size) || (extension || labels.file).toUpperCase()}
            </span>
          )}
          {renderActions ? (
            <span className="rfm-more" data-view={view}>
              {renderActions(item)}
            </span>
          ) : (
            <span className="rfm-more" data-view={view}>
              <MoreMenuButton actions={actions} label={labels.manageItem(item.name)} />
            </span>
          )}
        </div>
      </div>
    </ItemErrorBoundary>
  );
});

function sortTreeChildren(children: FileManagerNode[]): FileManagerNode[] {
  return [...children].sort((a, b) => compareFolderEntries(a, b, "name", "asc"));
}

export function FolderTree({ folders, depth = 0 }: { folders: FileManagerItem[]; depth?: number }) {
  const {
    viewFolderId,
    dropTargetId,
    expandedIds,
    favoriteIds,
    selectedIds,
    toggleExpanded,
    folderDropHandlers,
    renderIcon,
    renderActions,
    resolveItemActions,
    openContextMenu,
    classNames,
    labels,
    showFilesInTree,
    selectTreeNode,
    activateItem,
    onDragStart,
    onPointerDragDown,
    html5Draggable,
    canManage,
  } = useFileManagerContext();

  const entries = useMemo(() => {
    const list = showFilesInTree ? folders : folders.filter((node) => node.kind === "folder");
    return sortTreeChildren(list);
  }, [folders, showFilesInTree]);

  return (
    <>
      {entries.map((node) => {
        const isFolder = node.kind === "folder";
        const hasChildren = isFolder && folderHasChildren(node);
        const isExpanded = expandedIds.has(node.id);
        const isActive = isFolder ? viewFolderId === node.id : selectedIds.includes(node.id);
        const isDrop = isFolder && dropTargetId === node.id;
        const isFavorite = isFolder && favoriteIds.includes(node.id);
        const actions = resolveItemActions(node);
        const childEntries = isFolder && hasChildren && isExpanded ? (node.children ?? []) : [];

        return (
          <div key={node.id}>
            <div
              role="treeitem"
              aria-selected={isActive}
              aria-label={node.name}
              tabIndex={0}
              data-kind={node.kind}
              data-drop-id={isFolder ? node.id : undefined}
              data-drop-target={isDrop || undefined}
              draggable={canManage && html5Draggable}
              className={cn("rfm-tree-row", classNames?.treeRow)}
              style={{ paddingInlineStart: 6 + depth * 12 }}
              onDragStart={(event) => onDragStart(node, event)}
              onPointerDown={(event) => onPointerDragDown(node, event)}
              onClick={() => selectTreeNode(node)}
              onDoubleClick={() => {
                if (!isFolder) activateItem(node);
              }}
              onContextMenu={(event) => openContextMenu(node, event)}
              {...(isFolder ? folderDropHandlers(node.id) : {})}>
              {isFolder ? (
                <button
                  type="button"
                  className="rfm-tree-chevron"
                  aria-label={isExpanded ? labels.collapseFolder : labels.expandFolder}
                  aria-expanded={hasChildren ? isExpanded : undefined}
                  disabled={!hasChildren}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (!hasChildren) return;
                    toggleExpanded(event, node.id);
                  }}>
                  <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                </button>
              ) : (
                <span className="rfm-tree-chevron" aria-hidden style={{ visibility: "hidden" }} />
              )}
              <IconFrame size={16}>
                {renderIcon?.(node, 16) ?? defaultNodeIcon(node, 16)}
              </IconFrame>
              <span className="rfm-item-name" title={node.name}>
                {node.name}
              </span>
              {isFavorite && <StarSolidIcon className="rfm-star" size={14} />}
              {renderActions ? <span className="rfm-more">{renderActions(node)}</span> : <MoreMenuButton actions={actions} label={labels.manageItem(node.name)} />}
            </div>
            {hasChildren && isExpanded && (
              <div>
                <FolderTree folders={childEntries} depth={depth + 1} />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

export function FileManagerContextMenu() {
  const { contextMenu, closeContextMenu, resolveItemActions } = useFileManagerContext();
  if (!contextMenu) return null;
  return <ContextMenuLayer actions={resolveItemActions(contextMenu.node)} position={{ x: contextMenu.x, y: contextMenu.y }} onClose={closeContextMenu} />;
}

export function FileManagerBulkBar() {
  const { selectedIds, bulkActions } = useFileManagerContext();
  return <BulkActionBar count={selectedIds.length} actions={bulkActions} />;
}

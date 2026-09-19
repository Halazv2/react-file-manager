import { memo } from "react";

import { BulkActionBar, ContextMenuLayer, MoreMenuButton } from "./ActionMenu";
import { defaultNodeIcon } from "../fileIcons";
import { StarSolidIcon } from "../icons";
import { useFileManagerContext } from "../context";
import { cn } from "../styles";
import { folderHasChildFolders, getExtension } from "../tree";
import { formatBytes } from "../formatBytes";
import type { FileManagerItem } from "../types";

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
    folderDropHandlers,
    renderIcon,
    renderActions,
    resolveItemActions,
    openContextMenu,
    classNames,
  } = useFileManagerContext();

  const isSelected = selectedIds.includes(item.id);
  const isFocused = focusedIndex === index;
  const isFolder = item.kind === "folder";
  const isDropTarget = dropTargetId === item.id && isFolder;
  const childCount = isFolder ? (item.children?.length ?? 0) : null;
  const extension = getExtension(item);
  const actions = resolveItemActions(item);

  return (
    <div className="rfm-row">
      <div
        draggable={canManage}
        role="option"
        aria-selected={isSelected}
        aria-label={item.name}
        data-view={view}
        data-kind={item.kind}
        data-focused={isFocused || undefined}
        data-drop-target={isDropTarget || undefined}
        className={cn("rfm-item", classNames?.item)}
        onDragStart={(event) => onDragStart(item, event)}
        {...(isFolder ? folderDropHandlers(item.id) : {})}
        onClick={(event) => selectItem(item, event)}
        onDoubleClick={() => activateItem(item)}
        onContextMenu={(event) => openContextMenu(item, event)}>
        {renderIcon?.(item, view === "cards" ? 36 : 18) ?? defaultNodeIcon(item, view === "cards" ? 36 : 18)}
        <span className="rfm-item-name">
          <span className="rfm-item-label" data-view={view}>{item.name}</span>
          {item.path && <span className="rfm-item-path">{item.path}</span>}
        </span>
        {view === "list" && (
          <span className="rfm-item-meta">
            {isFolder ? `${childCount} item${childCount === 1 ? "" : "s"}` : formatBytes(item.size) || (extension || "file").toUpperCase()}
          </span>
        )}
        {renderActions ? (
          <span className="rfm-more" data-view={view}>{renderActions(item)}</span>
        ) : (
          <span className="rfm-more" data-view={view}>
            <MoreMenuButton actions={actions} label={`Manage ${item.name}`} />
          </span>
        )}
      </div>
    </div>
  );
});

export function FolderTree({ folders, depth = 0 }: { folders: FileManagerItem[]; depth?: number }) {
  const { viewFolderId, dropTargetId, expandedIds, favoriteIds, openFolder, toggleExpanded, folderDropHandlers, renderIcon, renderActions, resolveItemActions, openContextMenu, classNames } =
    useFileManagerContext();

  return (
    <>
      {folders
        .filter((folder) => folder.kind === "folder")
        .map((folder) => {
          const hasChildren = folderHasChildFolders(folder);
          const isExpanded = expandedIds.has(folder.id);
          const isActive = viewFolderId === folder.id;
          const isDrop = dropTargetId === folder.id;
          const isFavorite = favoriteIds.includes(folder.id);
          const actions = resolveItemActions(folder);

          return (
            <div key={folder.id}>
              <div
                role="treeitem"
                aria-selected={isActive}
                aria-label={folder.name}
                tabIndex={0}
                data-kind="folder"
                data-drop-target={isDrop || undefined}
                className={cn("rfm-tree-row", classNames?.treeRow)}
                style={{ paddingInlineStart: 6 + depth * 12 }}
                onClick={() => openFolder(folder.id)}
                onContextMenu={(event) => openContextMenu(folder, event)}
                {...folderDropHandlers(folder.id)}>
                <button
                  type="button"
                  className="rfm-tree-chevron"
                  aria-label={isExpanded ? "Collapse folder" : "Expand folder"}
                  aria-expanded={hasChildren ? isExpanded : undefined}
                  disabled={!hasChildren}
                  onClick={(event) => {
                    if (!hasChildren) return;
                    toggleExpanded(event, folder.id);
                  }}>
                  <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                </button>
                {renderIcon?.(folder, 16) ?? defaultNodeIcon(folder, 16)}
                <span className="rfm-item-name" title={folder.name}>
                  {folder.name}
                </span>
                {isFavorite && <StarSolidIcon className="rfm-star" size={14} />}
                {renderActions ? <span className="rfm-more">{renderActions(folder)}</span> : <MoreMenuButton actions={actions} label={`Manage ${folder.name}`} />}
              </div>
              {hasChildren && isExpanded && (
                <div>
                  <FolderTree folders={folder.children ?? []} depth={depth + 1} />
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

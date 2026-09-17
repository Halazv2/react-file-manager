import { BulkActionBar, ContextMenuLayer, MoreMenuButton } from "./ActionMenu";
import { defaultNodeIcon } from "../fileIcons";
import { StarSolidIcon } from "../icons";
import { useFileManagerContext } from "../context";
import { cn, DROP_TARGET_CLASS, FOCUS_RING, ROW_TRANSITION } from "../styles";
import { folderHasChildFolders, getExtension } from "../tree";
import type { FileManagerItem } from "../types";

export function Item({
  item,
  index
}: {
  item: FileManagerItem;
  index: number;
}) {
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
    openContextMenu
  } = useFileManagerContext();

  const isSelected = selectedIds.includes(item.id);
  const isFocused = focusedIndex === index;
  const isFolder = item.kind === "folder";
  const isDropTarget = dropTargetId === item.id && isFolder;
  const childCount = isFolder ? (item.children?.length ?? 0) : null;
  const extension = getExtension(item);
  const actions = resolveItemActions(item);

  return (
    <div className="rfm-row min-w-0">
      <div
        draggable={canManage}
        role="option"
        aria-selected={isSelected}
        aria-label={item.name}
        className={cn(
          "cursor-pointer",
          view === "cards"
            ? "group/card relative flex min-h-[116px] flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-gray-200 p-3 text-center shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition duration-150 hover:-translate-y-px hover:border-gray-300 hover:shadow-[0_4px_12px_rgba(16,24,40,0.08)]"
            : cn(
                "group/row grid grid-cols-[22px_minmax(0,1fr)_auto_auto] items-center gap-2 rounded-lg px-2.5 py-2",
                ROW_TRANSITION
              ),
          isSelected
            ? "bg-rfm-hover"
            : view === "list"
              ? "hover:bg-gray-100"
              : "bg-white",
          isFocused && view === "list"
            ? "outline outline-1 outline-rfm-primary"
            : "",
          isDropTarget ? DROP_TARGET_CLASS : ""
        )}
        onDragStart={(event) => onDragStart(item, event)}
        {...(isFolder ? folderDropHandlers(item.id) : {})}
        onClick={(event) => selectItem(item, event)}
        onDoubleClick={() => activateItem(item)}
        onContextMenu={(event) => openContextMenu(item, event)}
      >
        {renderIcon?.(item) ?? defaultNodeIcon(item, view === "cards" ? 36 : 18)}
        <span className="flex min-w-0 flex-col gap-px">
          <span
            className={cn(
              "min-w-0 text-[13px] text-gray-900",
              view === "cards"
                ? "line-clamp-2 w-full break-words text-center"
                : "truncate"
            )}
          >
            {item.name}
          </span>
          {item.path && (
            <span className="min-w-0 truncate text-[11px] text-gray-500">
              {item.path}
            </span>
          )}
        </span>
        {view === "list" && (
          <span className="text-[11px] text-gray-500">
            {isFolder
              ? `${childCount} item${childCount === 1 ? "" : "s"}`
              : (extension || "file").toUpperCase()}
          </span>
        )}
        {renderActions ? (
          <span
            className={cn(
              "rfm-more",
              FOCUS_RING,
              isSelected || isFocused ? "opacity-100" : "",
              view === "cards" ? "absolute top-1.5 right-1.5" : ""
            )}
          >
            {renderActions(item)}
          </span>
        ) : (
          <span
            className={cn(
              view === "cards" ? "absolute top-1.5 right-1.5" : "",
              isSelected || isFocused ? "opacity-100" : ""
            )}
          >
            <MoreMenuButton actions={actions} label={`Manage ${item.name}`} />
          </span>
        )}
      </div>
    </div>
  );
}

export function FolderTree({
  folders,
  depth = 0
}: {
  folders: FileManagerItem[];
  depth?: number;
}) {
  const {
    viewFolderId,
    dropTargetId,
    expandedIds,
    favoriteIds,
    openFolder,
    toggleExpanded,
    folderDropHandlers,
    renderIcon,
    renderActions,
    resolveItemActions,
    openContextMenu
  } = useFileManagerContext();

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
            <div key={folder.id} className="min-w-0">
              <div
                role="treeitem"
                aria-selected={isActive}
                aria-label={folder.name}
                tabIndex={0}
                className={cn(
                  "rfm-tree-row group/tree mb-0.5 flex w-full cursor-pointer items-center gap-1 rounded-md py-1 pr-1 text-left text-[13px]",
                  isActive
                    ? "bg-rfm-hover font-semibold text-rfm-primary"
                    : "text-gray-900 hover:bg-black/[0.04]",
                  isDrop ? DROP_TARGET_CLASS : "",
                  ROW_TRANSITION,
                  FOCUS_RING
                )}
                style={{ paddingLeft: 6 + depth * 12 }}
                onClick={() => openFolder(folder.id)}
                onContextMenu={(event) => openContextMenu(folder, event)}
                {...folderDropHandlers(folder.id)}
              >
                <button
                  type="button"
                  className={cn(
                    "inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border-0 bg-transparent p-0 text-gray-500",
                    isExpanded ? "rotate-90" : "",
                    hasChildren
                      ? "cursor-pointer hover:bg-black/[0.06] hover:text-gray-900"
                      : "pointer-events-none invisible",
                    ROW_TRANSITION,
                    FOCUS_RING
                  )}
                  aria-label={isExpanded ? "Collapse folder" : "Expand folder"}
                  disabled={!hasChildren}
                  onClick={(event) => {
                    if (!hasChildren) return;
                    toggleExpanded(event, folder.id);
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width={14}
                    height={14}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden
                  >
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                </button>
                {renderIcon?.(folder) ?? defaultNodeIcon(folder, 16)}
                <span className="min-w-0 flex-1 truncate" title={folder.name}>
                  {folder.name}
                </span>
                {isFavorite && (
                  <StarSolidIcon className="shrink-0 text-amber-500" size={14} />
                )}
                {renderActions ? (
                  <span className="rfm-more">{renderActions(folder)}</span>
                ) : (
                  <MoreMenuButton
                    actions={actions}
                    label={`Manage ${folder.name}`}
                  />
                )}
              </div>
              {hasChildren && isExpanded && (
                <div className="min-w-0">
                  <FolderTree
                    folders={folder.children ?? []}
                    depth={depth + 1}
                  />
                </div>
              )}
            </div>
          );
        })}
    </>
  );
}

export function FileManagerContextMenu() {
  const { contextMenu, closeContextMenu, resolveItemActions } =
    useFileManagerContext();
  if (!contextMenu) return null;
  return (
    <ContextMenuLayer
      actions={resolveItemActions(contextMenu.node)}
      position={{ x: contextMenu.x, y: contextMenu.y }}
      onClose={closeContextMenu}
    />
  );
}

export function FileManagerBulkBar() {
  const { selectedIds, bulkActions } = useFileManagerContext();
  return <BulkActionBar count={selectedIds.length} actions={bulkActions} />;
}

import type { MouseEvent } from "react";

import { FolderTree } from "./Item";
import { defaultNodeIcon } from "../fileIcons";
import { CollapseIcon, HomeIcon, StarIcon, StarSolidIcon } from "../icons";
import { useFileManagerContext } from "../context";
import { cn, DROP_TARGET_CLASS, FOCUS_RING, ROW_TRANSITION } from "../styles";

export function Sidebar() {
  const {
    nodes,
    viewFolderId,
    dropTargetId,
    canManage,
    rootLabel,
    openFolder,
    collapseAll,
    folderDropHandlers,
    onCreateFolder,
    onCreateFile,
    pinnedFolders,
    favoriteIds,
    toggleFavorite,
    storageKey
  } = useFileManagerContext();

  return (
    <aside className="flex min-h-0 flex-col gap-2 overflow-hidden border-r border-black/[0.06] bg-gray-100/80 p-3">
      {canManage && (onCreateFolder || onCreateFile) && (
        <div className="flex shrink-0 flex-col gap-1.5">
          {onCreateFolder && (
            <button
              type="button"
              className={cn(
                "flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border-0 bg-rfm-primary text-sm font-semibold text-white hover:brightness-95",
                FOCUS_RING
              )}
              onClick={() => onCreateFolder(viewFolderId)}
            >
              New folder
            </button>
          )}
          {onCreateFile && (
            <button
              type="button"
              className={cn(
                "flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50",
                FOCUS_RING
              )}
              onClick={() => onCreateFile(viewFolderId)}
            >
              New file
            </button>
          )}
        </div>
      )}

      <div className="flex shrink-0 justify-end">
        <button
          type="button"
          className={cn(
            "inline-flex cursor-pointer items-center gap-1 rounded-md border-0 bg-transparent px-1.5 py-1 text-[11px] font-semibold text-gray-500 hover:bg-black/5 hover:text-gray-900",
            ROW_TRANSITION,
            FOCUS_RING
          )}
          onClick={collapseAll}
        >
          <CollapseIcon size={14} />
          Collapse all
        </button>
      </div>

      {storageKey && pinnedFolders.length > 0 && (
        <div className="mb-1 flex shrink-0 flex-col gap-0.5 border-b border-black/[0.06] pb-2">
          <div className="px-1.5 pb-1 text-[11px] font-semibold tracking-[0.04em] text-gray-500 uppercase">
            Pinned & recent
          </div>
          {pinnedFolders.map((folder) => {
            const isFavorite = favoriteIds.includes(folder.id);
            return (
              <button
                key={`pin-${folder.id}`}
                type="button"
                className={cn(
                  "flex w-full cursor-pointer items-center gap-1.5 rounded-md border-0 bg-transparent px-1.5 py-[5px] text-left text-xs",
                  viewFolderId === folder.id
                    ? "bg-rfm-hover text-rfm-primary"
                    : "text-gray-900 hover:bg-rfm-hover hover:text-rfm-primary",
                  dropTargetId === folder.id ? DROP_TARGET_CLASS : "",
                  ROW_TRANSITION,
                  FOCUS_RING
                )}
                onClick={() => openFolder(folder.id)}
                {...folderDropHandlers(folder.id)}
              >
                {isFavorite ? (
                  <StarSolidIcon className="shrink-0 text-amber-500" size={14} />
                ) : (
                  defaultNodeIcon(folder, 14)
                )}
                <span className="truncate">{folder.name}</span>
                <span
                  role="button"
                  tabIndex={0}
                  className="ml-auto inline-flex text-gray-400 hover:text-amber-500"
                  aria-label={isFavorite ? "Unpin" : "Pin"}
                  onClick={(event) => toggleFavorite(event, folder.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      toggleFavorite(event as unknown as MouseEvent, folder.id);
                    }
                  }}
                >
                  {isFavorite ? (
                    <StarSolidIcon className="text-amber-500" size={14} />
                  ) : (
                    <StarIcon size={14} />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <button
          type="button"
          className={cn(
            "flex w-full cursor-pointer items-center gap-1 rounded-md border-0 bg-transparent py-1 text-left text-[13px]",
            viewFolderId === null
              ? "bg-rfm-hover font-semibold text-rfm-primary"
              : "text-gray-900 hover:bg-black/[0.04]",
            dropTargetId === "root" ? DROP_TARGET_CLASS : "",
            ROW_TRANSITION,
            FOCUS_RING
          )}
          style={{ paddingLeft: 8 }}
          onClick={() => openFolder(null)}
          {...folderDropHandlers("root")}
        >
          <span className="invisible inline-block h-[18px] w-[18px] shrink-0" />
          <HomeIcon className="h-4 w-4 shrink-0" size={16} />
          <span className="min-w-0 flex-1 truncate">{rootLabel}</span>
        </button>
        <div role="tree">
          <FolderTree folders={nodes} />
        </div>
      </div>
    </aside>
  );
}

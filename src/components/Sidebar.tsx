import { FolderTree } from "./Item";
import { CollapseIcon, HomeIcon } from "../icons";
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
    onCreateFolder
  } = useFileManagerContext();

  return (
    <aside className="flex min-h-0 flex-col gap-2 overflow-hidden border-r border-black/[0.06] bg-gray-100/80 p-3">
      {canManage && onCreateFolder && (
        <button
          type="button"
          className={cn(
            "flex h-9 w-full shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border-0 bg-rfm-primary text-sm font-semibold text-white hover:brightness-95",
            FOCUS_RING
          )}
          onClick={() => onCreateFolder(viewFolderId)}
        >
          New folder
        </button>
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

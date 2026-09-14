import { FileIcon, FolderIcon } from "../icons";
import { useFileManagerContext } from "../context";
import { cn, FOCUS_RING, ROW_TRANSITION } from "../styles";
import { getExtension } from "../tree";

export function DetailsPane() {
  const { selectedNode, renderIcon, renderPreview, renderActions } =
    useFileManagerContext();

  if (renderPreview) {
    return (
      <aside className="flex min-h-0 flex-col overflow-hidden border-l border-black/[0.06] bg-gray-50">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-4">
          {renderPreview(selectedNode)}
        </div>
      </aside>
    );
  }

  if (!selectedNode) {
    return (
      <aside className="flex min-h-0 flex-col overflow-hidden border-l border-black/[0.06] bg-gray-50">
        <div className="flex h-full flex-col items-center justify-center gap-3 px-2 text-center text-[13px] text-gray-500">
          <FolderIcon size={56} />
          <p className="m-0">Select a file or folder to view details</p>
          <p className="m-0 max-w-[180px] text-[11px] leading-snug text-gray-400">
            ↑↓ navigate · Shift range · ⌘/Ctrl toggle · Enter open · Esc clear
          </p>
        </div>
      </aside>
    );
  }

  const isFolder = selectedNode.kind === "folder";
  const extension = getExtension(selectedNode);
  const childCount = selectedNode.children?.length ?? 0;

  return (
    <aside className="flex min-h-0 flex-col overflow-hidden border-l border-black/[0.06] bg-gray-50">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-4">
        <div className="relative flex min-h-[220px] flex-1 flex-col items-center justify-center rounded-lg bg-gray-100/80 px-4 py-5">
          {renderIcon?.(selectedNode) ??
            (isFolder ? (
              <FolderIcon size={64} />
            ) : (
              <FileIcon size={64} />
            ))}
          <span className="mt-2 text-xs text-gray-500">
            {isFolder
              ? `${childCount} item${childCount === 1 ? "" : "s"}`
              : (extension || "file").toUpperCase()}
          </span>
        </div>

        <div className="mt-3">
          <h3 className="m-0 mb-2.5 break-words text-sm font-semibold text-gray-900">
            {selectedNode.name}
          </h3>
          {selectedNode.path && (
            <p className="m-0 -mt-1.5 mb-2.5 break-words text-xs text-gray-500">
              {selectedNode.path}
            </p>
          )}
          <dl className="m-0">
            <div className="flex justify-between gap-3 border-b border-gray-200/70 py-2 text-xs">
              <dt className="text-gray-500">Type</dt>
              <dd className="m-0 font-medium text-gray-900">
                {isFolder ? "Folder" : (extension || "file").toUpperCase()}
              </dd>
            </div>
            {isFolder && (
              <div className="flex justify-between gap-3 py-2 text-xs">
                <dt className="text-gray-500">Items</dt>
                <dd className="m-0 font-medium text-gray-900">{childCount}</dd>
              </div>
            )}
          </dl>
          {renderActions && (
            <div className={cn("mt-3", ROW_TRANSITION, FOCUS_RING)}>
              {renderActions(selectedNode)}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

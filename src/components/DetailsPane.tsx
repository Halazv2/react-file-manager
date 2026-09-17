import { defaultNodeIcon } from "../fileIcons";
import { DownloadIcon, StarIcon, StarSolidIcon } from "../icons";
import { useFileManagerContext } from "../context";
import { cn, FOCUS_RING, ROW_TRANSITION } from "../styles";
import { getExtension } from "../tree";

export function DetailsPane() {
  const {
    selectedNode,
    renderIcon,
    renderPreview,
    renderActions,
    preview,
    isPreviewLoading,
    favoriteIds,
    toggleFavorite,
    storageKey,
    onOpenFile,
    onDownloadFile,
    canManage
  } = useFileManagerContext();

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
          {defaultNodeIcon({ id: "empty", name: "", kind: "folder" }, 56)}
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
  const canShowThumb =
    Boolean(preview?.url) &&
    (preview?.kind === "image" || preview?.kind === "pdf");
  const showTextPreview =
    preview?.kind === "text" && Boolean(preview.text?.trim());

  return (
    <aside className="flex min-h-0 flex-col overflow-hidden border-l border-black/[0.06] bg-gray-50">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-4">
        <div className="relative flex min-h-[220px] flex-1 flex-col items-center justify-center rounded-lg bg-gray-100/80 px-4 py-5">
          {isPreviewLoading ? (
            <span className="text-xs text-gray-500">Loading preview…</span>
          ) : canShowThumb ? (
            <figure className="m-0 flex max-h-full flex-col items-center gap-2.5">
              <div className="relative">
                <img
                  src={preview?.url || ""}
                  alt={selectedNode.name}
                  className="max-h-[400px] max-w-full rounded-sm bg-white object-contain shadow-[0_1px_3px_rgba(16,24,40,0.18),0_14px_32px_rgba(16,24,40,0.24)]"
                />
                {preview?.pages !== undefined && (
                  <span className="absolute -bottom-2 right-2.5 rounded-full bg-gray-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                    {preview.pages} page{preview.pages === 1 ? "" : "s"}
                  </span>
                )}
              </div>
              {preview?.kind === "pdf" && (
                <figcaption className="text-[11px] text-gray-500">
                  First page preview
                </figcaption>
              )}
            </figure>
          ) : showTextPreview ? (
            <pre className="m-0 max-h-[360px] w-full overflow-auto rounded-md border border-gray-200/80 bg-white p-3.5 font-mono text-[11px] leading-[1.5] break-words whitespace-pre-wrap text-gray-700">
              {preview?.text}
            </pre>
          ) : (
            <>
              {renderIcon?.(selectedNode) ??
                defaultNodeIcon(selectedNode, 64)}
              <span className="mt-2 text-xs text-gray-500">
                {isFolder
                  ? `${childCount} item${childCount === 1 ? "" : "s"}`
                  : (extension || "file").toUpperCase()}
              </span>
            </>
          )}
        </div>

        <div className="mt-3">
          <h3 className="m-0 mb-2.5 text-sm font-semibold break-words text-gray-900">
            {selectedNode.name}
          </h3>
          {selectedNode.path && (
            <p className="m-0 -mt-1.5 mb-2.5 text-xs break-words text-gray-500">
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
            {isFolder ? (
              <div className="flex justify-between gap-3 py-2 text-xs">
                <dt className="text-gray-500">Items</dt>
                <dd className="m-0 font-medium text-gray-900">{childCount}</dd>
              </div>
            ) : (
              preview?.pages !== undefined && (
                <div className="flex justify-between gap-3 py-2 text-xs">
                  <dt className="text-gray-500">Pages</dt>
                  <dd className="m-0 font-medium text-gray-900">
                    {preview.pages}
                  </dd>
                </div>
              )
            )}
          </dl>

          {renderActions ? (
            <div className={cn("mt-3", ROW_TRANSITION, FOCUS_RING)}>
              {renderActions(selectedNode)}
            </div>
          ) : isFolder && storageKey ? (
            <button
              type="button"
              className={cn(
                "mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50",
                ROW_TRANSITION,
                FOCUS_RING
              )}
              onClick={(event) => toggleFavorite(event, selectedNode.id)}
            >
              {favoriteIds.includes(selectedNode.id) ? (
                <StarSolidIcon className="text-amber-500" size={16} />
              ) : (
                <StarIcon size={16} />
              )}
              {favoriteIds.includes(selectedNode.id) ? "Pinned" : "Pin"}
            </button>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {onOpenFile && (
                <button
                  type="button"
                  className={cn(
                    "inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border-0 bg-gray-900 px-3 py-2 text-[13px] font-semibold text-white hover:bg-gray-700",
                    ROW_TRANSITION,
                    FOCUS_RING
                  )}
                  onClick={() => onOpenFile(selectedNode.id)}
                >
                  View
                </button>
              )}
              {onDownloadFile && canManage !== false && (
                <button
                  type="button"
                  className={cn(
                    "inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50",
                    ROW_TRANSITION,
                    FOCUS_RING
                  )}
                  onClick={() => void onDownloadFile(selectedNode.id)}
                >
                  <DownloadIcon size={16} />
                  Download
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

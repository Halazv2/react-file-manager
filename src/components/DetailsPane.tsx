import { defaultNodeIcon } from "../fileIcons";
import { formatBytes } from "../formatBytes";
import { DownloadIcon, StarIcon, StarSolidIcon } from "../icons";
import { useFileManagerContext } from "../context";
import { cn } from "../styles";
import { getExtension } from "../core/tree";

export function DetailsPane() {
  const { selectedNode, renderIcon, renderPreview, renderActions, preview, isPreviewLoading, favoriteIds, toggleFavorite, storageKey, onOpenFile, onDownloadFile, canManage, classNames } =
    useFileManagerContext();

  if (renderPreview) {
    return (
      <aside className={cn("rfm-details", classNames?.details)}>
        <div className="rfm-details-body">{renderPreview(selectedNode)}</div>
      </aside>
    );
  }

  if (!selectedNode) {
    return (
      <aside className={cn("rfm-details", classNames?.details)}>
        <div className="rfm-details-empty">
          {renderIcon?.({ id: "empty", name: "", kind: "folder" }, 56) ?? defaultNodeIcon({ id: "empty", name: "", kind: "folder" }, 56)}
          <p>Select a file or folder to view details</p>
          <p className="rfm-details-hint">↑↓ navigate · Shift range · ⌘/Ctrl toggle · Enter open · Esc clear</p>
        </div>
      </aside>
    );
  }

  const isFolder = selectedNode.kind === "folder";
  const extension = getExtension(selectedNode);
  const childCount = selectedNode.children?.length ?? 0;
  const canShowThumb = Boolean(preview?.url) && (preview?.kind === "image" || preview?.kind === "pdf");
  const showTextPreview = preview?.kind === "text" && Boolean(preview.text?.trim());

  return (
    <aside className={cn("rfm-details", classNames?.details)}>
      <div className="rfm-details-body">
        <div className="rfm-preview-stage">
          {isPreviewLoading ? (
            <span className="rfm-item-meta">Loading preview…</span>
          ) : canShowThumb ? (
            <figure>
              <div style={{ position: "relative" }}>
                <img src={preview?.url || ""} alt={selectedNode.name} className="rfm-preview-image" />
                {preview?.pages !== undefined && (
                  <span className="rfm-bulk-bar" style={{ position: "absolute", insetBlockEnd: -8, insetInlineEnd: 8, transform: "none", left: "auto", bottom: "auto" }}>
                    {preview.pages} page{preview.pages === 1 ? "" : "s"}
                  </span>
                )}
              </div>
              {preview?.kind === "pdf" && <figcaption className="rfm-item-meta">First page preview</figcaption>}
            </figure>
          ) : showTextPreview ? (
            <pre className="rfm-preview-text">{preview?.text}</pre>
          ) : (
            <>
              {renderIcon?.(selectedNode, 64) ?? defaultNodeIcon(selectedNode, 64)}
              <span className="rfm-item-meta">{isFolder ? `${childCount} item${childCount === 1 ? "" : "s"}` : (extension || "file").toUpperCase()}</span>
            </>
          )}
        </div>

        <div>
          <h3 className="rfm-details-title">{selectedNode.name}</h3>
          {selectedNode.path && <p className="rfm-item-meta">{selectedNode.path}</p>}
          <dl className="rfm-details-dl">
            <div className="rfm-details-row">
              <dt>Type</dt>
              <dd>{isFolder ? "Folder" : (extension || "file").toUpperCase()}</dd>
            </div>
            {isFolder ? (
              <div className="rfm-details-row">
                <dt>Items</dt>
                <dd>{childCount}</dd>
              </div>
            ) : (
              <>
                {formatBytes(selectedNode.size) ? (
                  <div className="rfm-details-row">
                    <dt>Size</dt>
                    <dd>{formatBytes(selectedNode.size)}</dd>
                  </div>
                ) : null}
                {preview?.pages !== undefined && (
                  <div className="rfm-details-row">
                    <dt>Pages</dt>
                    <dd>{preview.pages}</dd>
                  </div>
                )}
              </>
            )}
          </dl>

          {renderActions ? (
            <div className="rfm-details-actions">{renderActions(selectedNode)}</div>
          ) : isFolder && storageKey ? (
            <button type="button" className="rfm-button rfm-button-secondary" style={{ width: "100%", marginBlockStart: 12 }} onClick={(event) => toggleFavorite(event, selectedNode.id)}>
              {favoriteIds.includes(selectedNode.id) ? <StarSolidIcon className="rfm-star" size={16} /> : <StarIcon size={16} />}
              {favoriteIds.includes(selectedNode.id) ? "Pinned" : "Pin"}
            </button>
          ) : (
            <div className="rfm-details-actions">
              {onOpenFile && (
                <button type="button" className="rfm-button rfm-button-primary" onClick={() => onOpenFile(selectedNode.id)}>
                  View
                </button>
              )}
              {onDownloadFile && canManage !== false && (
                <button type="button" className="rfm-button rfm-button-secondary" onClick={() => void onDownloadFile(selectedNode.id)}>
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

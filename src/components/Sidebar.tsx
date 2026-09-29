import { useEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";

import { FolderTree } from "./Item";
import { focusFirstMenuItem, onMenuKeyDown } from "./ActionMenu";
import { defaultNodeIcon, IconFrame } from "../fileIcons";
import { CollapseIcon, ExpandIcon, FileIcon, FolderIcon, HomeIcon, PlusIcon, StarIcon, StarSolidIcon } from "../icons";
import { useFileManagerContext } from "../context";
import { cn } from "../styles";

export function Sidebar() {
  const {
    nodes,
    viewFolderId,
    dropTargetId,
    canManage,
    rootLabel,
    openFolder,
    collapseAll,
    expandAll,
    expandedIds,
    folderDropHandlers,
    onCreateFolder,
    onCreateFile,
    pinnedFolders,
    favoriteIds,
    toggleFavorite,
    storageKey,
    renderIcon,
    rootRef,
    classNames,
    labels,
  } = useFileManagerContext();

  const [addOpen, setAddOpen] = useState(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const [addPos, setAddPos] = useState({ top: 0, left: 0, width: 0 });

  const canAdd = canManage && (onCreateFolder || onCreateFile);
  const hasExpandedFolders = expandedIds.size > 0;
  const treeToggleLabel = hasExpandedFolders ? labels.collapseAll : labels.expandAll;

  useEffect(() => {
    if (!addOpen || !addButtonRef.current) return;
    const rect = addButtonRef.current.getBoundingClientRect();
    setAddPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
  }, [addOpen]);

  useEffect(() => {
    if (!addOpen) return;
    focusFirstMenuItem(addMenuRef.current);
    const onDoc = (event: globalThis.MouseEvent) => {
      if (addMenuRef.current?.contains(event.target as Node) || addButtonRef.current?.contains(event.target as Node)) {
        return;
      }
      setAddOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
    };
  }, [addOpen]);

  const portalTarget = rootRef.current ?? (typeof document !== "undefined" ? document.body : null);

  return (
    <aside className={cn("rfm-sidebar", classNames?.sidebar)}>
      {canAdd && (
        <div>
          <button
            ref={addButtonRef}
            type="button"
            className="rfm-add-button"
            aria-expanded={addOpen}
            aria-haspopup="menu"
            onClick={() => setAddOpen((open) => !open)}
          >
            <PlusIcon size={16} />
            {labels.addNew}
          </button>
          {addOpen &&
            portalTarget &&
            createPortal(
              <div
                ref={addMenuRef}
                className={cn("rfm-menu", classNames?.menu)}
                role="menu"
                tabIndex={-1}
                onKeyDown={(event) => onMenuKeyDown(event, () => setAddOpen(false))}
                style={{
                  position: "fixed",
                  top: addPos.top,
                  left: addPos.left,
                  width: Math.max(addPos.width, 200),
                  zIndex: 1100,
                }}
              >
                {onCreateFolder && (
                  <button
                    type="button"
                    role="menuitem"
                    className="rfm-menu-item"
                    onClick={() => {
                      onCreateFolder(viewFolderId);
                      setAddOpen(false);
                    }}
                  >
                    <FolderIcon size={16} />
                    {viewFolderId ? labels.createFolderHere : labels.createFolder}
                  </button>
                )}
                {onCreateFile && (
                  <button
                    type="button"
                    role="menuitem"
                    className="rfm-menu-item"
                    onClick={() => {
                      onCreateFile(viewFolderId);
                      setAddOpen(false);
                    }}
                  >
                    <FileIcon size={16} />
                    {labels.uploadDocument}
                  </button>
                )}
              </div>,
              portalTarget
            )}
        </div>
      )}

      <div className="rfm-pins">
        <div className="rfm-pins-header">
          <div className="rfm-pins-label">{labels.pinnedRecent}</div>
          <div className="rfm-sidebar-tree-actions">
            <button
              type="button"
              className="rfm-tree-expand-toggle"
              aria-label={treeToggleLabel}
              title={treeToggleLabel}
              onClick={hasExpandedFolders ? collapseAll : expandAll}
            >
              {hasExpandedFolders ? <CollapseIcon size={16} /> : <ExpandIcon size={16} />}
            </button>
          </div>
        </div>
        {storageKey && pinnedFolders.length > 0 && (
          <div className="rfm-pins-list">
            {pinnedFolders.map((folder) => {
              const isFavorite = favoriteIds.includes(folder.id);
              const isCurrent = viewFolderId === folder.id;
              const isDrop = dropTargetId === folder.id;
              return (
                <button
                  key={`pin-${folder.id}`}
                  type="button"
                  className="rfm-pin-row"
                  aria-current={isCurrent || undefined}
                  data-drop-id={folder.id}
                  data-drop-target={isDrop || undefined}
                  onClick={() => openFolder(folder.id)}
                  {...folderDropHandlers(folder.id)}
                >
                  <IconFrame size={16}>{renderIcon?.(folder, 16) ?? defaultNodeIcon(folder, 16)}</IconFrame>
                  <span className="rfm-item-name">{folder.name}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    className="rfm-pin-toggle"
                    aria-label={isFavorite ? labels.unpin : labels.pin}
                    onClick={(event) => toggleFavorite(event, folder.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        toggleFavorite(event as unknown as MouseEvent, folder.id);
                      }
                    }}
                  >
                    {isFavorite ? <StarSolidIcon className="rfm-star" size={14} /> : <StarIcon size={14} />}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="rfm-sidebar-scroll">
        <button
          type="button"
          className="rfm-home-row"
          aria-current={viewFolderId === null || undefined}
          data-drop-id="root"
          data-drop-target={dropTargetId === "root" || undefined}
          onClick={() => openFolder(null)}
          {...folderDropHandlers("root")}
        >
          <span className="rfm-tree-chevron" style={{ visibility: "hidden" }} />
          <HomeIcon size={16} />
          <span className="rfm-item-name">{rootLabel}</span>
        </button>
        <div role="tree">
          <FolderTree folders={nodes} />
        </div>
      </div>
    </aside>
  );
}

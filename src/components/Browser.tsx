import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import { Breadcrumbs } from "./Breadcrumbs";
import { FileManagerBulkBar, Item } from "./Item";
import { isExternalFileDrag } from "../core/droppedItems";
import { CardsIcon, FolderIcon, ListIcon, SearchIcon, UploadIcon } from "../icons";
import { useFileManagerContext } from "../context";
import { cn } from "../styles";
import type { FileManagerItem } from "../types";

const LIST_ROW_HEIGHT = 40;
const CARD_ROW_HEIGHT = 140;
const CARD_MIN_WIDTH = 170;
const VIRTUALIZE_AFTER = 40;

export function Browser() {
  const { view, searchQuery, canManage, isBusy, items, viewItems, viewFolderId, folderId, setView, setSearchQuery, onDropOnFolder, onUpload, fileInputRef, classNames, labels } =
    useFileManagerContext();

  const showingSpring = viewItems !== items;
  const visible = showingSpring ? viewItems : items;

  return (
    <section
      className={cn("rfm-browser", classNames?.browser)}
      onDragOver={(event) => {
        if (!canManage) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = isExternalFileDrag(event.dataTransfer) ? "copy" : "move";
      }}
      onDrop={(event) => {
        if (!canManage) return;
        void onDropOnFolder(event, viewFolderId);
      }}>
      <div className={cn("rfm-toolbar", classNames?.toolbar)}>
        <Breadcrumbs />
        <div className="rfm-toolbar-actions">
          <label className={cn("rfm-search", classNames?.search)}>
            <SearchIcon className="rfm-search-icon" size={14} />
            <input
              type="search"
              value={searchQuery}
              placeholder={labels.search}
              aria-label={labels.searchAria}
              className="rfm-search-field"
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>
          <div>
            <ViewToggle label={labels.listView} pressed={view === "list"} onClick={() => setView("list")}>
              <ListIcon size={16} />
            </ViewToggle>
            <ViewToggle label={labels.cardView} pressed={view === "cards"} onClick={() => setView("cards")}>
              <CardsIcon size={16} />
            </ViewToggle>
          </div>
        </div>
      </div>

      <div className="rfm-browser-body">
        <ItemGrid
          items={visible}
          emptyLabel={searchQuery.trim() && !showingSpring ? labels.noMatchingFiles : labels.emptyFolder}
          showEmptyActions={!searchQuery.trim() || showingSpring}
          folderId={showingSpring ? viewFolderId : folderId}
          isBusy={isBusy}
        />
        <FileManagerBulkBar />
      </div>

      {canManage && onUpload && (
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="rfm-hidden-input"
          aria-label={labels.uploadFiles}
          onChange={(event) => {
            if (event.target.files?.length) {
              void onUpload(Array.from(event.target.files), folderId);
              event.target.value = "";
            }
          }}
        />
      )}
    </section>
  );
}

function ItemGrid({
  items,
  emptyLabel,
  showEmptyActions,
  folderId,
  isBusy,
}: {
  items: FileManagerItem[];
  emptyLabel: string;
  showEmptyActions: boolean;
  folderId: string | null;
  isBusy: boolean;
}) {
  const { view, canManage, onCreateFolder, fileInputRef, labels } = useFileManagerContext();
  const parentRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const cardColumns = Math.max(1, Math.floor(Math.max(viewportWidth - 24, CARD_MIN_WIDTH) / CARD_MIN_WIDTH));
  const useListVirtual = view === "list" && items.length >= VIRTUALIZE_AFTER;
  const useCardVirtual = view === "cards" && items.length >= VIRTUALIZE_AFTER;
  const cardRows = Math.ceil(items.length / cardColumns);

  useEffect(() => {
    const element = parentRef.current;
    if (!element || typeof ResizeObserver === "undefined") {
      if (element) setViewportWidth(element.clientWidth);
      return;
    }
    const update = () => setViewportWidth(element.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [view, items.length]);

  const rowVirtualizer = useVirtualizer({
    count: useListVirtual ? items.length : useCardVirtual ? cardRows : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (view === "cards" ? CARD_ROW_HEIGHT : LIST_ROW_HEIGHT),
    overscan: 10,
  });

  return (
    <div ref={parentRef} className="rfm-item-scroll">
      {isBusy && <div className="rfm-busy" aria-busy="true" />}
      {items.length === 0 ? (
        <div className="rfm-empty">
          <p>{emptyLabel}</p>
          {showEmptyActions && canManage && (
            <div className="rfm-empty-actions">
              <button type="button" className="rfm-button rfm-button-primary" onClick={() => fileInputRef.current?.click()}>
                <UploadIcon size={16} />
                {labels.uploadFiles}
              </button>
              {onCreateFolder && (
                <button type="button" className="rfm-button rfm-button-secondary" onClick={() => onCreateFolder(folderId)}>
                  <FolderIcon size={16} />
                  {labels.createFolder}
                </button>
              )}
            </div>
          )}
        </div>
      ) : useListVirtual ? (
        <div className="rfm-item-virtual" style={{ height: `${rowVirtualizer.getTotalSize()}px` }} role="listbox" aria-label={labels.folderContents}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const item = items[virtualRow.index];
            if (!item) return null;
            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                className="rfm-virtual-row"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}>
                <Item item={item} index={virtualRow.index} />
              </div>
            );
          })}
        </div>
      ) : useCardVirtual ? (
        <div className="rfm-item-virtual" style={{ height: `${rowVirtualizer.getTotalSize()}px` }} role="listbox" aria-label={labels.folderContents}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const start = virtualRow.index * cardColumns;
            const rowItems = items.slice(start, start + cardColumns);
            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                className="rfm-item-grid"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                  gridTemplateColumns: `repeat(${cardColumns}, minmax(0, 1fr))`,
                }}>
                {rowItems.map((item, offset) => (
                  <Item key={item.id} item={item} index={start + offset} />
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <div className={view === "cards" ? "rfm-item-grid" : "rfm-item-list"} role="listbox" aria-label={labels.folderContents}>
          {items.map((item, index) => (
            <Item key={item.id} item={item} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}

function ViewToggle({ label, pressed, onClick, children }: { label: string; pressed: boolean; onClick: () => void; children: ReactNode }) {
  const { classNames } = useFileManagerContext();
  return (
    <button
      type="button"
      className={cn("rfm-view-toggle", classNames?.viewToggle)}
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}>
      {children}
    </button>
  );
}

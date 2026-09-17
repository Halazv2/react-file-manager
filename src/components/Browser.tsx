import type { ReactNode } from "react";
import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import { Breadcrumbs } from "./Breadcrumbs";
import { FileManagerBulkBar, Item } from "./Item";
import { isExternalFileDrag } from "../droppedItems";
import { CardsIcon, FolderIcon, ListIcon, SearchIcon, UploadIcon } from "../icons";
import { useFileManagerContext } from "../context";
import { cn, FOCUS_RING, ROW_TRANSITION } from "../styles";
import type { FileManagerItem } from "../types";

const LIST_ROW_HEIGHT = 40;
const VIRTUALIZE_AFTER = 40;

export function Browser() {
  const { view, searchQuery, canManage, isBusy, items, viewItems, viewFolderId, folderId, setView, setSearchQuery, onDropOnFolder, onUpload, fileInputRef } =
    useFileManagerContext();

  const showingSpring = viewItems !== items;
  const visible = showingSpring ? viewItems : items;

  return (
    <section
      className='relative flex min-h-0 min-w-0 flex-col overflow-hidden bg-white'
      onDragOver={(event) => {
        if (!canManage) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = isExternalFileDrag(event.dataTransfer) ? "copy" : "move";
      }}
      onDrop={(event) => {
        if (!canManage) return;
        void onDropOnFolder(event, viewFolderId);
      }}>
      <div className='flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-black/[0.06] px-3 py-2.5'>
        <Breadcrumbs />
        <div className='ml-auto flex items-center gap-2'>
          <label className='relative'>
            <SearchIcon className='pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-gray-400' size={14} />
            <input
              type='search'
              value={searchQuery}
              placeholder='Search'
              aria-label='Search files'
              className={cn(
                "h-7 w-40 rounded-md border border-gray-200 bg-gray-50 pr-2 pl-7 text-[13px] text-gray-900 outline-none placeholder:text-gray-400 focus:border-rfm-primary",
                FOCUS_RING,
              )}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>
          <div className='flex gap-1'>
            <ViewToggle label='List view' pressed={view === "list"} onClick={() => setView("list")}>
              <ListIcon size={16} />
            </ViewToggle>
            <ViewToggle label='Card view' pressed={view === "cards"} onClick={() => setView("cards")}>
              <CardsIcon size={16} />
            </ViewToggle>
          </div>
        </div>
      </div>

      <div className='relative min-h-0 flex-1 overflow-hidden'>
        <ItemGrid
          items={visible}
          emptyLabel={searchQuery.trim() && !showingSpring ? "No matching files" : "This folder is empty"}
          showEmptyActions={!searchQuery.trim() || showingSpring}
          folderId={showingSpring ? viewFolderId : folderId}
          isBusy={isBusy}
        />
        <FileManagerBulkBar />
      </div>

      {canManage && onUpload && (
        <input
          ref={fileInputRef}
          type='file'
          multiple
          className='hidden'
          aria-label='Upload files'
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
  const { view, canManage, onCreateFolder, fileInputRef } = useFileManagerContext();
  const parentRef = useRef<HTMLDivElement>(null);
  const useVirtual = view === "list" && items.length >= VIRTUALIZE_AFTER;

  const rowVirtualizer = useVirtualizer({
    count: useVirtual ? items.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => LIST_ROW_HEIGHT,
    overscan: 10,
  });

  return (
    <div ref={parentRef} className='relative h-full overflow-y-auto overscroll-contain'>
      {isBusy && <div className='absolute inset-0 z-20 bg-white/50' aria-busy='true' />}
      {items.length === 0 ? (
        <div className={cn("flex min-h-[240px] flex-col items-center justify-center gap-3 p-6 text-center text-[13px] text-gray-500")}>
          <p className='m-0'>{emptyLabel}</p>
          {showEmptyActions && canManage && (
            <div className='flex flex-wrap justify-center gap-2'>
              <button
                type='button'
                className={cn(
                  "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border-0 bg-gray-900 px-3 py-2 text-[13px] font-semibold text-white hover:bg-gray-700",
                  ROW_TRANSITION,
                  FOCUS_RING,
                )}
                onClick={() => fileInputRef.current?.click()}>
                <UploadIcon size={16} />
                Upload files
              </button>
              {onCreateFolder && (
                <button
                  type='button'
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50",
                    ROW_TRANSITION,
                    FOCUS_RING,
                  )}
                  onClick={() => onCreateFolder(folderId)}>
                  <FolderIcon size={16} />
                  Create folder
                </button>
              )}
            </div>
          )}
        </div>
      ) : useVirtual ? (
        <div className='relative w-full px-2.5 pt-2 pb-4' style={{ height: `${rowVirtualizer.getTotalSize()}px` }} role='listbox' aria-label='Folder contents'>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const item = items[virtualRow.index];
            if (!item) return null;
            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                className='absolute top-0 left-0 w-full px-0'
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                }}>
                <div className='px-0 py-0.5'>
                  <Item item={item} index={virtualRow.index} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className={view === "cards" ? "grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] content-start gap-2.5 p-3" : "flex flex-col gap-0.5 px-2.5 pt-2 pb-4"}
          role='listbox'
          aria-label='Folder contents'>
          {items.map((item, index) => (
            <Item key={item.id} item={item} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}

function ViewToggle({ label, pressed, onClick, children }: { label: string; pressed: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type='button'
      className={cn(
        "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border-0",
        pressed ? "bg-rfm-primary text-white" : "bg-transparent text-gray-500 hover:bg-black/5",
        ROW_TRANSITION,
        FOCUS_RING,
      )}
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}>
      {children}
    </button>
  );
}

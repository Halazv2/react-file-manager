import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, RefObject } from "react";

import { MoreIcon } from "../icons";
import { cn, FOCUS_RING, ICON_BUTTON } from "../styles";
import type { FileManagerAction } from "../types";

export function ActionMenu({ actions, open, onClose, anchorRef }: { actions: FileManagerAction[]; open: boolean; onClose: () => void; anchorRef: RefObject<HTMLElement | null> }) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 4,
      left: Math.min(rect.left, window.innerWidth - 180),
    });
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node) || anchorRef.current?.contains(event.target as Node)) {
        return;
      }
      onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, anchorRef]);

  if (!open || !actions.length) return null;

  return (
    <div ref={menuRef} className='rfm-menu' style={{ position: "fixed", top: pos.top, left: pos.left }} role='menu'>
      {actions.map((action) => (
        <button
          key={action.id}
          type='button'
          role='menuitem'
          disabled={action.disabled}
          className={action.danger ? "rfm-danger" : undefined}
          onClick={() => {
            void action.onClick();
            onClose();
          }}>
          {action.icon}
          {action.label}
        </button>
      ))}
    </div>
  );
}

export function MoreMenuButton({ actions, label }: { actions: FileManagerAction[]; label: string }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  if (!actions.length) return null;

  return (
    <>
      <button
        ref={buttonRef}
        type='button'
        className={cn(ICON_BUTTON, "rfm-more h-[22px] w-[22px]")}
        aria-label={label}
        onClick={(event: ReactMouseEvent) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}>
        <MoreIcon size={14} />
      </button>
      <ActionMenu actions={actions} open={open} onClose={() => setOpen(false)} anchorRef={buttonRef} />
    </>
  );
}

export function ContextMenuLayer({ actions, position, onClose }: { actions: FileManagerAction[]; position: { x: number; y: number } | null; onClose: () => void }) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!position) return;
    const onDoc = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      onClose();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [position, onClose]);

  if (!position || !actions.length) return null;

  return (
    <div ref={menuRef} className='rfm-menu' style={{ position: "fixed", top: position.y, left: position.x }} role='menu'>
      {actions.map((action) => (
        <button
          key={action.id}
          type='button'
          role='menuitem'
          disabled={action.disabled}
          className={action.danger ? "rfm-danger" : undefined}
          onClick={() => {
            void action.onClick();
            onClose();
          }}>
          {action.icon}
          {action.label}
        </button>
      ))}
    </div>
  );
}

export function BulkActionBar({ count, actions }: { count: number; actions: FileManagerAction[] }) {
  if (count < 2) return null;

  return (
    <div className='pointer-events-auto absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-gray-900 py-1.5 pr-1.5 pl-4 text-xs text-white shadow-[0_12px_32px_rgba(15,23,42,0.35)]'>
      <span className='whitespace-nowrap'>{count} selected</span>
      {actions.length > 0 && <span className='h-4 w-px bg-white/20' />}
      {actions.map((action) => (
        <button
          key={action.id}
          type='button'
          disabled={action.disabled}
          className={cn(
            "cursor-pointer rounded-full border-0 bg-transparent px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15 inline-flex items-center gap-1.5",
            FOCUS_RING,
            action.danger ? "hover:bg-red-500/20 hover:text-red-200" : "",
          )}
          onClick={() => void action.onClick()}>
          {action.icon}
          {action.label}
        </button>
      ))}
    </div>
  );
}

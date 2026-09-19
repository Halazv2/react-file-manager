import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, RefObject } from "react";

import { MoreIcon } from "../icons";
import { useFileManagerContext } from "../context";
import { cn } from "../styles";
import type { FileManagerAction } from "../types";

export function ActionMenu({ actions, open, onClose, anchorRef }: { actions: FileManagerAction[]; open: boolean; onClose: () => void; anchorRef: RefObject<HTMLElement | null> }) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const { classNames } = useFileManagerContext();

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
    <div ref={menuRef} className={cn("rfm-menu", classNames?.menu)} style={{ position: "fixed", top: pos.top, left: pos.left }} role="menu">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          role="menuitem"
          disabled={action.disabled}
          className={cn("rfm-menu-item", action.danger && "rfm-danger")}
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
  const { classNames } = useFileManagerContext();

  if (!actions.length) return null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={cn("rfm-icon-button", "rfm-more", classNames?.iconButton, classNames?.more)}
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
  const { classNames } = useFileManagerContext();

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
    <div ref={menuRef} className={cn("rfm-menu", classNames?.menu)} style={{ position: "fixed", top: position.y, left: position.x }} role="menu">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          role="menuitem"
          disabled={action.disabled}
          className={cn("rfm-menu-item", action.danger && "rfm-danger")}
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
  const { classNames } = useFileManagerContext();
  if (count < 2) return null;

  return (
    <div className={cn("rfm-bulk-bar", classNames?.bulkBar)}>
      <span>{count} selected</span>
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          disabled={action.disabled}
          className={cn("rfm-bulk-action", action.danger && "rfm-danger")}
          onClick={() => void action.onClick()}>
          {action.icon}
          {action.label}
        </button>
      ))}
    </div>
  );
}

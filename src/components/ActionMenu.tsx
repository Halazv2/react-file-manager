import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent, RefObject } from "react";

import { MoreIcon } from "../icons";
import { useFileManagerContext } from "../context";
import { cn } from "../styles";
import type { FileManagerAction } from "../types";

function focusableItems(menu: HTMLElement): HTMLButtonElement[] {
  return Array.from(menu.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)'));
}

function moveMenuFocus(menu: HTMLElement, delta: number): void {
  const items = focusableItems(menu);
  if (!items.length) return;
  const current = items.findIndex((item) => item === document.activeElement);
  const next = items[(current + delta + items.length) % items.length];
  next?.focus();
}

export function onMenuKeyDown(event: ReactKeyboardEvent<HTMLDivElement>, onClose: () => void): void {
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    onClose();
    return;
  }
  if (event.key === "ArrowDown") {
    event.preventDefault();
    event.stopPropagation();
    moveMenuFocus(event.currentTarget, 1);
    return;
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    event.stopPropagation();
    moveMenuFocus(event.currentTarget, -1);
    return;
  }
  if (event.key === "Home") {
    event.preventDefault();
    event.stopPropagation();
    focusableItems(event.currentTarget)[0]?.focus();
    return;
  }
  if (event.key === "End") {
    event.preventDefault();
    event.stopPropagation();
    const items = focusableItems(event.currentTarget);
    items[items.length - 1]?.focus();
  }
}

export function focusFirstMenuItem(menu: HTMLElement | null): void {
  if (!menu) return;
  focusableItems(menu)[0]?.focus();
}

export function ActionMenu({ actions, open, onClose, anchorRef }: { actions: FileManagerAction[]; open: boolean; onClose: () => void; anchorRef: RefObject<HTMLElement | null> }) {
  const menuRef = useRef<HTMLDivElement>(null);
  const focusedOnce = useRef(false);
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
    document.addEventListener("mousedown", onDoc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
    };
  }, [open, onClose, anchorRef]);

  if (!open || !actions.length) return null;

  return (
    <div
      ref={(node) => {
        menuRef.current = node;
        if (!node) {
          focusedOnce.current = false;
          return;
        }
        if (!focusedOnce.current) {
          focusedOnce.current = true;
          focusFirstMenuItem(node);
        }
      }}
      className={cn("rfm-menu", classNames?.menu)}
      style={{ position: "fixed", top: pos.top, left: pos.left }}
      role="menu"
      tabIndex={-1}
      onKeyDown={(event) => onMenuKeyDown(event, onClose)}>
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
        aria-haspopup="menu"
        aria-expanded={open}
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
  const focusedOnce = useRef(false);
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
    <div
      ref={(node) => {
        menuRef.current = node;
        if (!node) {
          focusedOnce.current = false;
          return;
        }
        if (!focusedOnce.current) {
          focusedOnce.current = true;
          focusFirstMenuItem(node);
        }
      }}
      className={cn("rfm-menu", classNames?.menu)}
      style={{ position: "fixed", top: position.y, left: position.x }}
      role="menu"
      tabIndex={-1}
      onKeyDown={(event) => onMenuKeyDown(event, onClose)}>
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
  const { classNames, labels } = useFileManagerContext();
  if (count < 2) return null;

  return (
    <div className={cn("rfm-bulk-bar", classNames?.bulkBar)}>
      <span>{labels.selectedCount(count)}</span>
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

import { useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, RefObject } from "react";

import { FloatingMenu } from "./FloatingMenu";
import { MoreIcon } from "../icons";
import { useFileManagerContext } from "../context";
import { cn } from "../styles";
import type { FileManagerAction } from "../types";

export function ActionMenu({ actions, open, onClose, anchorRef }: { actions: FileManagerAction[]; open: boolean; onClose: () => void; anchorRef: RefObject<HTMLElement> }) {
  if (!open || !actions.length) return null;

  return (
    <FloatingMenu anchorRef={anchorRef} onClose={onClose}>
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
    </FloatingMenu>
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
  if (!position || !actions.length) return null;

  return (
    <FloatingMenu position={position} onClose={onClose}>
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
    </FloatingMenu>
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

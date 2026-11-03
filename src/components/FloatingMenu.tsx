import { useEffect, useLayoutEffect, useRef } from "react";
import type { KeyboardEvent, ReactNode, RefObject } from "react";
import { createPortal } from "react-dom";

import { useFileManagerContext } from "../context";
import { insetMenuBounds, positionMenu } from "../core/menuPosition";
import type { MenuRect } from "../core/menuPosition";
import { cn } from "../styles";

const useClientLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function focusableItems(menu: HTMLElement): HTMLButtonElement[] {
  return Array.from(menu.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)'));
}

function onMenuKeyDown(event: KeyboardEvent<HTMLDivElement>, onClose: () => void): void {
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    onClose();
    return;
  }
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  event.stopPropagation();
  const items = focusableItems(event.currentTarget);
  if (!items.length) return;
  if (event.key === "Home") {
    items[0]?.focus();
    return;
  }
  if (event.key === "End") {
    items[items.length - 1]?.focus();
    return;
  }
  const current = items.findIndex((item) => item === event.currentTarget.ownerDocument.activeElement);
  const delta = event.key === "ArrowDown" ? 1 : -1;
  items[(current + delta + items.length) % items.length]?.focus();
}

function intersect(bounds: MenuRect, rect: MenuRect, horizontal: boolean, vertical: boolean): MenuRect {
  const left = horizontal ? Math.max(bounds.left, Math.min(bounds.right, rect.left)) : bounds.left;
  const top = vertical ? Math.max(bounds.top, Math.min(bounds.bottom, rect.top)) : bounds.top;
  return {
    left,
    top,
    right: horizontal ? Math.max(left, Math.min(bounds.right, rect.right)) : bounds.right,
    bottom: vertical ? Math.max(top, Math.min(bounds.bottom, rect.bottom)) : bounds.bottom,
  };
}

function visibleBounds(element: HTMLElement, view: Window): MenuRect {
  let bounds: MenuRect = { left: 0, top: 0, right: view.innerWidth, bottom: view.innerHeight };
  if (element !== element.ownerDocument.body) {
    bounds = intersect(bounds, element.getBoundingClientRect(), true, true);
  }
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    const style = view.getComputedStyle(parent);
    const clips = (overflow: string) => ["auto", "scroll", "hidden", "clip", "overlay"].includes(overflow);
    const horizontal = clips(style.overflowX || style.overflow);
    const vertical = clips(style.overflowY || style.overflow);
    if (horizontal || vertical) {
      bounds = intersect(bounds, parent.getBoundingClientRect(), horizontal, vertical);
    }
  }
  return bounds;
}

export function FloatingMenu({
  anchorRef,
  position,
  onClose,
  children,
  gap = 4,
  matchAnchorWidth = false,
}: {
  anchorRef?: RefObject<HTMLElement>;
  position?: { x: number; y: number };
  onClose: () => void;
  children: ReactNode;
  gap?: number;
  matchAnchorWidth?: boolean;
}) {
  const { rootRef, classNames } = useFileManagerContext();
  const menuRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const target = rootRef.current ?? (typeof document === "undefined" ? null : document.body);
  const pointX = position?.x;
  const pointY = position?.y;

  useClientLayoutEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useClientLayoutEffect(() => {
    const menu = menuRef.current;
    const view = target?.ownerDocument.defaultView;
    if (!target || !menu || !view) return;
    const doc = target.ownerDocument;
    const isBody = target === doc.body;

    const update = () => {
      const anchor = anchorRef?.current;
      let anchorRect: MenuRect;
      if (anchor) {
        anchorRect = anchor.getBoundingClientRect();
      } else if (pointX !== undefined && pointY !== undefined) {
        anchorRect = { left: pointX, right: pointX, top: pointY, bottom: pointY };
      } else {
        return;
      }
      const targetRect = target.getBoundingClientRect();
      const scaleX = !isBody && target.offsetWidth ? targetRect.width / target.offsetWidth : 1;
      const scaleY = !isBody && target.offsetHeight ? targetRect.height / target.offsetHeight : 1;
      const safeScaleX = scaleX > 0 ? scaleX : 1;
      const safeScaleY = scaleY > 0 ? scaleY : 1;
      const bounds = visibleBounds(target, view);
      const area = insetMenuBounds(bounds);
      const maxWidth = Math.max(0, (area.right - area.left) / safeScaleX);
      const maxHeight = Math.max(0, (area.bottom - area.top) / safeScaleY);

      menu.style.setProperty("--rfm-menu-max-width", `${maxWidth}px`);
      menu.style.maxHeight = `${maxHeight}px`;
      if (matchAnchorWidth && anchor) {
        menu.style.width = `${Math.max(200, (anchorRect.right - anchorRect.left) / safeScaleX)}px`;
      }

      const menuRect = menu.getBoundingClientRect();
      const direction = view.getComputedStyle(anchor ?? target).direction;
      const placement = positionMenu(bounds, anchorRect, menuRect, anchor ? gap : 0, direction === "rtl");
      menu.style.maxHeight = `${placement.maxHeight / safeScaleY}px`;
      menu.style.left = `${
        isBody ? placement.left : (placement.left - targetRect.left) / safeScaleX - target.clientLeft + target.scrollLeft
      }px`;
      menu.style.top = `${
        isBody ? placement.top : (placement.top - targetRect.top) / safeScaleY - target.clientTop + target.scrollTop
      }px`;
      menu.style.visibility = "visible";
    };

    update();
    focusableItems(menu)[0]?.focus();
    const onMouseDown = (event: MouseEvent) => {
      if (event.target instanceof Node && (menu.contains(event.target) || anchorRef?.current?.contains(event.target))) {
        return;
      }
      closeRef.current();
    };
    const onScroll = (event: Event) => {
      if (event.target instanceof Node && menu.contains(event.target)) return;
      const anchor = anchorRef?.current;
      if (anchor) {
        const rect = anchor.getBoundingClientRect();
        const visible = visibleBounds(anchor, view);
        if (rect.width > 0 && rect.height > 0 && (visible.right <= visible.left || visible.bottom <= visible.top)) {
          closeRef.current();
          return;
        }
      }
      update();
    };
    doc.addEventListener("mousedown", onMouseDown);
    view.addEventListener("scroll", onScroll, true);
    view.addEventListener("resize", update);

    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    if (observer) {
      observer.observe(menu);
      observer.observe(target);
      if (anchorRef?.current) observer.observe(anchorRef.current);
      for (let parent = target.parentElement; parent; parent = parent.parentElement) observer.observe(parent);
    }
    return () => {
      doc.removeEventListener("mousedown", onMouseDown);
      view.removeEventListener("scroll", onScroll, true);
      view.removeEventListener("resize", update);
      observer?.disconnect();
    };
  }, [anchorRef, gap, matchAnchorWidth, pointX, pointY, target]);

  if (!target) return null;
  return createPortal(
    <div
      ref={menuRef}
      className={cn("rfm-menu", classNames?.menu)}
      style={{ position: target === target.ownerDocument.body ? "fixed" : "absolute", visibility: "hidden" }}
      role="menu"
      tabIndex={-1}
      onKeyDown={(event) => onMenuKeyDown(event, onClose)}
    >
      {children}
    </div>,
    target
  );
}

export const POINTER_DRAG_THRESHOLD = 8;

export function shouldUsePointerDrag(pointerType: string): boolean {
  return pointerType === "touch" || pointerType === "pen";
}

export function html5DragEnabled(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return true;
  return !window.matchMedia("(pointer: coarse)").matches;
}

export function resolvePointerDropTarget(x: number, y: number): string | "root" | null {
  const el = document.elementFromPoint(x, y);
  if (!(el instanceof Element)) return null;
  const explicit = el.closest("[data-drop-id]");
  if (explicit) {
    const id = explicit.getAttribute("data-drop-id");
    if (id === "root") return "root";
    if (id) return id;
  }
  const pane = el.closest("[data-current-folder]");
  if (pane) {
    const id = pane.getAttribute("data-current-folder");
    if (id === "root") return "root";
    if (id) return id;
  }
  return null;
}

export function folderIdFromDropTarget(target: string | "root" | null): string | null | undefined {
  if (target === null) return undefined;
  if (target === "root") return null;
  return target;
}

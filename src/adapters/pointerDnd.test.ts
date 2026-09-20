import { describe, expect, it } from "vitest";

import { folderIdFromDropTarget, html5DragEnabled, resolvePointerDropTarget, shouldUsePointerDrag } from "./pointerDnd";

describe("pointerDnd adapter", () => {
  it("uses pointer drag for touch and pen, not mouse", () => {
    expect(shouldUsePointerDrag("touch")).toBe(true);
    expect(shouldUsePointerDrag("pen")).toBe(true);
    expect(shouldUsePointerDrag("mouse")).toBe(false);
  });

  it("keeps HTML5 drag enabled when matchMedia is missing", () => {
    expect(html5DragEnabled()).toBe(true);
  });

  it("reads data-drop-id from the element under the point", () => {
    const folder = document.createElement("div");
    folder.setAttribute("data-drop-id", "photos");
    folder.getBoundingClientRect = () => ({ left: 0, top: 0, right: 40, bottom: 40, width: 40, height: 40, x: 0, y: 0, toJSON() {} });
    document.body.append(folder);
    const original = document.elementFromPoint;
    document.elementFromPoint = () => folder;

    expect(resolvePointerDropTarget(10, 10)).toBe("photos");
    expect(folderIdFromDropTarget("photos")).toBe("photos");
    expect(folderIdFromDropTarget("root")).toBeNull();
    expect(folderIdFromDropTarget(null)).toBeUndefined();

    document.elementFromPoint = original;
    folder.remove();
  });
});

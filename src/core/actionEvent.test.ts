import { describe, expect, it, vi } from "vitest";

import { buildDeleteAction, buildMoveAction, buildRenameAction } from "./actionEvent";
import { buildTreeIndex } from "./treeIndex";
import type { FileManagerNode } from "../types";

const nodes: FileManagerNode[] = [
  {
    id: "docs",
    name: "Documents",
    kind: "folder",
    children: [{ id: "notes", name: "notes.txt", kind: "file" }],
  },
  { id: "readme", name: "README.md", kind: "file" },
  { id: "photos", name: "Photos", kind: "folder", children: [] },
];

const index = buildTreeIndex(nodes);

describe("action events", () => {
  it("describes a move and undoes each previous parent", async () => {
    const move = vi.fn().mockResolvedValue(undefined);
    const event = buildMoveAction(index, ["notes", "readme"], "photos", "Drive", move);

    expect(event).toMatchObject({
      type: "move",
      item: { id: "notes", name: "notes.txt", kind: "file", parentId: "docs" },
      items: [
        { id: "notes", name: "notes.txt", kind: "file", parentId: "docs" },
        { id: "readme", name: "README.md", kind: "file", parentId: null },
      ],
      destination: { id: "photos", name: "Photos" },
      current: { parentId: "photos" },
    });
    expect(event?.previous).toBeUndefined();

    await event?.undo?.();

    expect(move).toHaveBeenNthCalledWith(1, ["notes"], "docs");
    expect(move).toHaveBeenNthCalledWith(2, ["readme"], null);
  });

  it("records one previous parent when every item started together", () => {
    const event = buildMoveAction(index, ["docs", "readme"], "photos", "Drive");

    expect(event).toMatchObject({
      previous: { parentId: null },
      current: { parentId: "photos" },
      destination: { id: "photos", name: "Photos" },
    });
    expect(event?.undo).toBeUndefined();
  });

  it("describes a rename with the name from before the edit", () => {
    const rename = vi.fn();
    const event = buildRenameAction(index, "readme", "hello.md", rename);

    expect(event).toMatchObject({
      type: "rename",
      item: { id: "readme", name: "README.md", kind: "file", parentId: null },
      previous: { name: "README.md" },
      current: { name: "hello.md" },
    });

    event?.undo?.();
    expect(rename).toHaveBeenCalledWith("readme", "README.md");
  });

  it("returns null when none of the ids are in the tree", () => {
    expect(buildMoveAction(index, ["missing"], null, "Drive")).toBeNull();
    expect(buildDeleteAction(index, ["missing"])).toBeNull();
    expect(buildRenameAction(index, "missing", "next")).toBeNull();
  });
});

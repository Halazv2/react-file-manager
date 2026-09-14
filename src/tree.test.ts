import { describe, expect, it } from "vitest";

import {
  folderContainsId,
  getBreadcrumbs,
  getNodeById,
  listFolder,
  moveNodes,
  searchNodes
} from "./tree";
import type { FileManagerNode } from "./types";

const tree: FileManagerNode[] = [
  {
    id: "docs",
    name: "Documents",
    kind: "folder",
    children: [
      {
        id: "contracts",
        name: "Contracts",
        kind: "folder",
        children: [{ id: "nda", name: "nda.pdf", kind: "file" }]
      },
      { id: "notes", name: "notes.txt", kind: "file" }
    ]
  },
  { id: "photos", name: "Photos", kind: "folder", children: [] },
  { id: "readme", name: "README.md", kind: "file" }
];

describe("tree helpers", () => {
  it("finds nested nodes", () => {
    expect(getNodeById(tree, "nda")?.name).toBe("nda.pdf");
  });

  it("lists folders before files", () => {
    expect(listFolder(tree, null).map((node) => node.id)).toEqual([
      "docs",
      "photos",
      "readme"
    ]);
  });

  it("builds breadcrumbs", () => {
    expect(getBreadcrumbs(tree, "contracts").map((node) => node.id)).toEqual([
      "docs",
      "contracts"
    ]);
  });

  it("detects descendants", () => {
    const docs = getNodeById(tree, "docs");
    expect(docs && folderContainsId(docs, "nda")).toBe(true);
    expect(docs && folderContainsId(docs, "photos")).toBe(false);
  });

  it("searches by name and records path", () => {
    const hits = searchNodes(tree, "nda");
    expect(hits).toHaveLength(1);
    expect(hits[0]?.path).toBe("My files / Documents / Contracts");
  });

  it("moves a file into a folder", () => {
    const next = moveNodes(tree, ["readme"], "photos");
    expect(listFolder(next, null).map((node) => node.id)).toEqual([
      "docs",
      "photos"
    ]);
    expect(getNodeById(next, "photos")?.children?.map((node) => node.id)).toEqual(
      ["readme"]
    );
  });

  it("refuses to move a folder into itself", () => {
    expect(moveNodes(tree, ["docs"], "contracts")).toBe(tree);
  });
});

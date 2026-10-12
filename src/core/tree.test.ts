import { describe, expect, it } from "vitest";

import {
  folderContainsId,
  getBreadcrumbs,
  getNodeById,
  listFolder,
  moveNodes,
  searchNodes
} from "./tree";
import type { FileManagerNode } from "../types";

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

  it("preserves host order when sorting is omitted or explicitly cleared", () => {
    const mixed = [tree[2], tree[0], tree[1]];
    expect(listFolder(mixed, null).map((node) => node.id)).toEqual(["readme", "docs", "photos"]);
    expect(listFolder(mixed, null, { sortBy: null, sortDirection: "desc" }).map((node) => node.id))
      .toEqual(["readme", "docs", "photos"]);
  });

  it("sorts files by size when requested", () => {
    const sized: FileManagerNode[] = [
      { id: "big", name: "big.bin", kind: "file", size: 200 },
      { id: "small", name: "small.bin", kind: "file", size: 10 },
      { id: "folder", name: "Zed", kind: "folder", children: [] }
    ];
    expect(listFolder(sized, null, { sortBy: "size" }).map((node) => node.id)).toEqual([
      "folder",
      "small",
      "big"
    ]);
  });

  it("builds breadcrumbs", () => {
    expect(getBreadcrumbs(tree, "contracts").map((node) => node.id)).toEqual([
      "docs",
      "contracts"
    ]);
  });

  it("sorts file kinds by extension, including explicit extensions", () => {
    const files: FileManagerNode[] = [
      { id: "txt", name: "a.txt", kind: "file" },
      { id: "pdf", name: "z", kind: "file", extension: ".PDF" },
      { id: "folder", name: "Folder", kind: "folder" },
    ];
    expect(listFolder(files, null, { sortBy: "kind" }).map((node) => node.id)).toEqual(["folder", "pdf", "txt"]);
    expect(listFolder(files, null, { sortBy: "kind", sortDirection: "desc" }).map((node) => node.id)).toEqual(["txt", "pdf", "folder"]);
  });

  it("sorts ISO and millisecond dates and puts missing or invalid dates last", () => {
    const files: FileManagerNode[] = [
      { id: "missing", name: "missing.txt", kind: "file" },
      { id: "late", name: "late.txt", kind: "file", modifiedAt: "2026-01-02T00:00:00Z" },
      { id: "invalid", name: "invalid.txt", kind: "file", modifiedAt: "not-a-date" },
      { id: "early", name: "early.txt", kind: "file", modifiedAt: Date.parse("2026-01-01T00:00:00Z") },
    ];
    expect(listFolder(files, null, { sortBy: "modifiedAt" }).map((node) => node.id))
      .toEqual(["early", "late", "invalid", "missing"]);
    expect(listFolder(files, null, { sortBy: "modifiedAt", sortDirection: "desc" }).map((node) => node.id))
      .toEqual(["late", "early", "missing", "invalid"]);
  });

  it("sorts files and folders together by name, size, and dates without mutating host data", () => {
    const mixed: FileManagerNode[] = [
      {
        id: "folder", name: "middle", kind: "folder", size: 50,
        modifiedAt: "2026-01-02T00:00:00Z", addedAt: "2026-01-02T00:00:00Z",
      },
      {
        id: "late", name: "z-late.txt", kind: "file", size: 100,
        modifiedAt: "2026-01-03T00:00:00Z", addedAt: "2026-01-03T00:00:00Z",
      },
      {
        id: "early", name: "a-early.txt", kind: "file", size: 10,
        modifiedAt: "2026-01-01T00:00:00Z", addedAt: "2026-01-01T00:00:00Z",
      },
    ];
    for (const sortBy of ["name", "size", "modifiedAt", "addedAt"] as const) {
      expect(listFolder(mixed, null, { sortBy }).map((node) => node.id)).toEqual(["early", "folder", "late"]);
      expect(listFolder(mixed, null, { sortBy, sortDirection: "desc" }).map((node) => node.id))
        .toEqual(["late", "folder", "early"]);
    }
    expect(mixed.map((node) => node.id)).toEqual(["folder", "late", "early"]);
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

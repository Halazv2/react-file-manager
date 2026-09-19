import { describe, expect, it } from "vitest";

import { breadcrumbsFromIndex, buildTreeIndex, folderContainsIdInIndex, getIndexedNode } from "./treeIndex";
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
      }
    ]
  },
  { id: "photos", name: "Photos", kind: "folder", children: [] }
];

describe("tree index", () => {
  const index = buildTreeIndex(tree);

  it("indexes by id, parent, and children", () => {
    expect(getIndexedNode(index, "nda")?.name).toBe("nda.pdf");
    expect(index.parentOf.get("nda")).toBe("contracts");
    expect(index.childrenOf.get("docs")?.map((node) => node.id)).toEqual(["contracts"]);
  });

  it("detects descendants via parent chain", () => {
    expect(folderContainsIdInIndex(index, "docs", "nda")).toBe(true);
    expect(folderContainsIdInIndex(index, "docs", "photos")).toBe(false);
  });

  it("builds breadcrumbs from parent pointers", () => {
    expect(breadcrumbsFromIndex(index, "contracts").map((node) => node.id)).toEqual(["docs", "contracts"]);
  });
});

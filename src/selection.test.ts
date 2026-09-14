import { describe, expect, it } from "vitest";

import { idsInRange } from "./selection";
import type { FileManagerItem } from "./types";

const items: FileManagerItem[] = [
  { id: "a", name: "A", kind: "folder" },
  { id: "b", name: "B", kind: "file" },
  { id: "c", name: "C", kind: "file" }
];

describe("idsInRange", () => {
  it("returns inclusive ids between two indexes", () => {
    expect(idsInRange(items, 0, 2)).toEqual(["a", "b", "c"]);
    expect(idsInRange(items, 2, 1)).toEqual(["b", "c"]);
  });
});

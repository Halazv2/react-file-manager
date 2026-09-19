// @vitest-environment node
import { describe, expect, it } from "vitest";

import { getFavoriteFolderIds, getRecentFolderIds, pushRecentFolderId, toggleFavoriteFolderId } from "./pins";

describe("pin persistence during SSR", () => {
  it("returns empty state and ignores writes without window", () => {
    expect(getFavoriteFolderIds("files")).toEqual([]);
    expect(getRecentFolderIds("files")).toEqual([]);
    expect(toggleFavoriteFolderId("files", "folder-1")).toEqual(["folder-1"]);
    expect(pushRecentFolderId("files", "folder-1")).toEqual(["folder-1"]);
  });
});

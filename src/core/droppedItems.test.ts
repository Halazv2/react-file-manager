import { describe, expect, it } from "vitest";

import {
  planExternalDrop,
  readFileSystemEntries,
  type FileManagerDropItem
} from "./droppedItems";

type MockEntry = {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  file?: (
    successCallback: (file: File) => void,
    errorCallback?: (error: DOMException) => void
  ) => void;
  createReader?: () => {
    readEntries: (
      successCallback: (entries: MockEntry[]) => void,
      errorCallback?: (error: DOMException) => void
    ) => void;
  };
};

function fileEntry(file: File): MockEntry {
  return {
    isFile: true,
    isDirectory: false,
    name: file.name,
    file: (success) => success(file)
  };
}

function folderEntry(name: string, children: MockEntry[], batchSize = 100): MockEntry {
  return {
    isFile: false,
    isDirectory: true,
    name,
    createReader: () => {
      let offset = 0;
      return {
        readEntries: (success) => {
          const batch = children.slice(offset, offset + batchSize);
          offset += batch.length;
          success(batch);
        }
      };
    }
  };
}

describe("readFileSystemEntries", () => {
  it("reads a dropped file", async () => {
    const file = new File(["hello"], "notes.txt", { type: "text/plain" });
    const items = await readFileSystemEntries([fileEntry(file)]);

    expect(items).toEqual([
      { kind: "file", name: "notes.txt", file }
    ]);
  });

  it("reads a dropped folder as a folder tree, not a file", async () => {
    const nested = new File(["nda"], "nda.pdf", { type: "application/pdf" });
    const items = await readFileSystemEntries([
      folderEntry("Contracts", [fileEntry(nested)])
    ]);

    expect(items).toEqual([
      {
        kind: "folder",
        name: "Contracts",
        children: [{ kind: "file", name: "nda.pdf", file: nested }]
      }
    ]);
  });

  it("keeps empty folders", async () => {
    const items = await readFileSystemEntries([folderEntry("Empty", [])]);
    expect(items).toEqual([{ kind: "folder", name: "Empty", children: [] }]);
  });

  it("reads directory batches until empty", async () => {
    const files = Array.from({ length: 3 }, (_, index) =>
      fileEntry(new File([`${index}`], `file-${index}.txt`))
    );
    const items = await readFileSystemEntries([
      folderEntry("Batch", files, 2)
    ]);

    expect(items[0]?.kind).toBe("folder");
    if (items[0]?.kind !== "folder") return;
    expect(items[0].children.map((child) => child.name)).toEqual([
      "file-0.txt",
      "file-1.txt",
      "file-2.txt"
    ]);
  });
});

describe("planExternalDrop", () => {
  const fileItem: FileManagerDropItem = {
    kind: "file",
    name: "notes.txt",
    file: new File(["hi"], "notes.txt")
  };
  const folderItem: FileManagerDropItem = {
    kind: "folder",
    name: "Docs",
    children: [fileItem]
  };

  it("imports when a folder is present and onImport exists", () => {
    expect(planExternalDrop([folderItem, fileItem], true)).toEqual({
      action: "import",
      items: [folderItem, fileItem]
    });
  });

  it("flattens folder contents onto onUpload with webkitRelativePath when onImport is missing", () => {
    const plan = planExternalDrop([folderItem], false);
    expect(plan.action).toBe("upload");
    if (plan.action !== "upload") return;
    expect(plan.files).toHaveLength(1);
    expect(plan.files[0]?.name).toBe("notes.txt");
    expect(plan.files[0]?.webkitRelativePath).toBe("Docs/notes.txt");
  });

  it("does not upload an empty folder as a document", () => {
    expect(
      planExternalDrop([{ kind: "folder", name: "Empty", children: [] }], false)
    ).toEqual({ action: "none" });
  });

  it("uploads top-level files when no folder is present", () => {
    expect(planExternalDrop([fileItem], false)).toEqual({
      action: "upload",
      files: [fileItem.file]
    });
  });

  it("uploads nested folder files plus top-level files when onImport is missing", () => {
    const plan = planExternalDrop([folderItem, fileItem], false);
    expect(plan.action).toBe("upload");
    if (plan.action !== "upload") return;
    expect(plan.files.map((file) => file.webkitRelativePath || file.name)).toEqual([
      "Docs/notes.txt",
      "notes.txt"
    ]);
  });
});

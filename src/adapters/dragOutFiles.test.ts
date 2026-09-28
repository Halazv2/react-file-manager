import { afterEach, describe, expect, it, vi } from "vitest";

import { attachDragFiles, clearDragFileCache, primeDragFile, readCachedDragFile } from "./dragOutFiles";

afterEach(() => {
  clearDragFileCache();
  vi.unstubAllGlobals();
});

describe("primeDragFile", () => {
  it("fetches the url once and reuses the file", async () => {
    const blob = new Blob(["hello"], { type: "text/plain" });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, blob: async () => blob });
    vi.stubGlobal("fetch", fetchMock);

    const first = await primeDragFile("doc-1", "https://cdn.example/a.xlsm", "Intake.xlsm", "application/octet-stream");
    const second = await primeDragFile("doc-1", "https://cdn.example/a.xlsm", "Intake.xlsm", "application/octet-stream");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first?.name).toBe("Intake.xlsm");
    expect(second).toBe(first);
    expect(readCachedDragFile("doc-1", "https://cdn.example/a.xlsm")).toBe(first);
  });

  it("returns null when the file cannot be read", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, blob: async () => new Blob() }));
    await expect(primeDragFile("doc-1", "https://cdn.example/missing.pdf", "missing.pdf", "application/pdf")).resolves.toBeNull();
  });
});

describe("attachDragFiles", () => {
  it("adds each file after other drag data", () => {
    const added: File[] = [];
    const dataTransfer = {
      effectAllowed: "move",
      items: { add: (file: File) => added.push(file) },
    } as unknown as DataTransfer;
    const file = new File(["a"], "NDA.pdf", { type: "application/pdf" });

    attachDragFiles(dataTransfer, [file]);

    expect(added).toEqual([file]);
    expect(dataTransfer.effectAllowed).toBe("copyMove");
  });
});

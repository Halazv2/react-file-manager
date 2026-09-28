import { describe, expect, it } from "vitest";

import { buildDownloadUrlEntries, downloadFileName, formatDownloadUrl, guessMimeType } from "./downloadUrl";
import type { FileManagerItem } from "../types";

describe("guessMimeType", () => {
  it("maps known extensions", () => {
    expect(guessMimeType("pdf")).toBe("application/pdf");
    expect(guessMimeType("PNG")).toBe("image/png");
  });

  it("falls back to octet-stream for unknown extensions", () => {
    expect(guessMimeType("xyz")).toBe("application/octet-stream");
    expect(guessMimeType()).toBe("application/octet-stream");
  });
});

describe("downloadFileName", () => {
  it("appends the extension when the display name omits it", () => {
    expect(downloadFileName({ id: "a", name: "NDA", kind: "file", extension: "pdf" })).toBe("NDA.pdf");
  });

  it("leaves a name that already includes the extension", () => {
    expect(downloadFileName({ id: "a", name: "beach.jpg", kind: "file", extension: "jpg" })).toBe("beach.jpg");
  });
});

describe("buildDownloadUrlEntries", () => {
  const files: FileManagerItem[] = [
    { id: "a", name: "NDA", kind: "file", extension: "pdf" },
    { id: "b", name: "beach.jpg", kind: "file", extension: "jpg" },
    { id: "c", name: "no-url.txt", kind: "file", extension: "txt" },
  ];

  it("builds one entry per resolvable file and skips unresolved ones", () => {
    const entries = buildDownloadUrlEntries(files, (item) =>
      item.id === "c" ? null : `https://example.com/${item.id}`
    );
    expect(entries).toEqual([
      { mimeType: "application/pdf", filename: "NDA.pdf", url: "https://example.com/a" },
      { mimeType: "image/jpeg", filename: "beach.jpg", url: "https://example.com/b" },
    ]);
  });

  it("formats a single DownloadURL and sanitizes colons and newlines in file names", () => {
    const [entry] = buildDownloadUrlEntries(
      [{ id: "a", name: "weird:name\nhere", kind: "file", extension: "txt" }],
      () => "https://example.com/a"
    );
    expect(formatDownloadUrl(entry)).toBe("text/plain:weird_name_here.txt:https://example.com/a");
  });
});

import type { FileManagerItem } from "../types";

/** Chromium drag type for a single virtual file the OS can download on drop. */
export const DOWNLOAD_URL_MIME = "DownloadURL";

/**
 * Chromium drag type for multiple virtual files.
 * Payload is a JSON array of `{ mimeType, filename, url }`.
 * @see https://github.com/MicrosoftEdge/MSEdgeExplainers/blob/main/DownloadURL-list/explainer.md
 */
export const DOWNLOAD_URL_LIST_MIME = "DownloadURL-list";

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  txt: "text/plain",
  csv: "text/csv",
  md: "text/markdown",
  json: "application/json",
  xml: "application/xml",
  html: "text/html",
  zip: "application/zip",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  mov: "video/quicktime",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xlsm: "application/vnd.ms-excel.sheet.macroEnabled.12",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

export interface DownloadUrlEntry {
  mimeType: string;
  filename: string;
  url: string;
}

export function guessMimeType(extension?: string): string {
  return MIME_BY_EXTENSION[(extension || "").replace(/^\./, "").toLowerCase()] || "application/octet-stream";
}

/** OS filename. Appends `extension` when the display name doesn't already include it. */
export function downloadFileName(file: FileManagerItem): string {
  const base = file.name.replace(/[\r\n:]/g, "_");
  const ext = (file.extension || "").replace(/^\./, "").replace(/[\r\n:]/g, "");
  if (!ext) return base;
  if (base.toLowerCase().endsWith(`.${ext.toLowerCase()}`)) return base;
  return `${base}.${ext}`;
}

export function buildDownloadUrlEntries(
  files: FileManagerItem[],
  resolveUrl: (item: FileManagerItem) => string | null | undefined
): DownloadUrlEntry[] {
  const entries: DownloadUrlEntry[] = [];
  for (const file of files) {
    const url = resolveUrl(file);
    if (!url) continue;
    entries.push({
      mimeType: guessMimeType(file.extension),
      filename: downloadFileName(file),
      url,
    });
  }
  return entries;
}

/** `mime:filename:url` for the classic single-file `DownloadURL` type. */
export function formatDownloadUrl(entry: DownloadUrlEntry): string {
  return `${entry.mimeType}:${entry.filename}:${entry.url}`;
}

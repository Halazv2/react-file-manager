import type { FilePreviewResult } from "../types";

const IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "bmp",
  "avif"
]);

const TEXT_EXTENSIONS = new Set([
  "txt",
  "csv",
  "json",
  "md",
  "log",
  "xml",
  "yml",
  "yaml"
]);

export function isImageExtension(extension?: string): boolean {
  return IMAGE_EXTENSIONS.has((extension || "").toLowerCase());
}

export function isPdfExtension(extension?: string): boolean {
  return (extension || "").toLowerCase() === "pdf";
}

export function isTextExtension(extension?: string): boolean {
  return TEXT_EXTENSIONS.has((extension || "").toLowerCase());
}

export type PreviewBuildOptions = {
  pdfWorkerSrc?: string;
  fetchInit?: RequestInit;
};

async function loadTextPreview(url: string, fetchInit?: RequestInit): Promise<string> {
  const response = await fetch(url, fetchInit);
  if (!response.ok) throw new Error("Failed to load text preview");
  const text = await response.text();
  return text.slice(0, 4000);
}

async function renderPdfFirstPage(
  url: string,
  pdfWorkerSrc?: string,
  fetchInit?: RequestInit
): Promise<{ thumbnail: string; pages: number }> {
  // Optional peer: pdfjs-dist. If missing, fall back to icon preview.
  // @ts-expect-error optional peer may be absent at compile time
  const pdfjs = await import("pdfjs-dist");
  if (pdfWorkerSrc && "GlobalWorkerOptions" in pdfjs) {
    (
      pdfjs as {
        GlobalWorkerOptions: { workerSrc: string };
      }
    ).GlobalWorkerOptions.workerSrc = pdfWorkerSrc;
  }

  const loadingTask = (
    pdfjs as {
      getDocument: (opts: object) => { promise: Promise<{
        numPages: number;
        getPage: (n: number) => Promise<{
          getViewport: (opts: { scale: number }) => {
            width: number;
            height: number;
          };
          render: (opts: object) => { promise: Promise<void> };
        }>;
      }> };
    }
  ).getDocument({
    url,
    withCredentials: Boolean(fetchInit?.credentials && fetchInit.credentials !== "omit"),
    disableRange: true,
    disableStream: true
  });

  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");
  await page.render({ canvasContext: context, viewport }).promise;
  return {
    thumbnail: canvas.toDataURL("image/jpeg", 0.88),
    pages: pdf.numPages
  };
}

export async function buildFilePreview(
  url: string,
  extension?: string,
  options?: PreviewBuildOptions
): Promise<FilePreviewResult> {
  const ext = (extension || "").toLowerCase();

  if (isImageExtension(ext)) {
    return { kind: "image", url };
  }

  if (isPdfExtension(ext)) {
    try {
      const { thumbnail, pages } = await renderPdfFirstPage(url, options?.pdfWorkerSrc, options?.fetchInit);
      return { kind: "pdf", url: thumbnail, pages };
    } catch {
      return { kind: "icon" };
    }
  }

  if (isTextExtension(ext)) {
    try {
      const text = await loadTextPreview(url, options?.fetchInit);
      return { kind: "text", text };
    } catch {
      return { kind: "icon" };
    }
  }

  return { kind: "icon", url };
}

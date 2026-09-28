const cache = new Map<string, File>();
const inflight = new Map<string, Promise<File | null>>();
const MAX_CACHED_FILES = 12;

function cacheKey(id: string, url: string): string {
  return `${id}\0${url}`;
}

export function clearDragFileCache(): void {
  cache.clear();
  inflight.clear();
}

export function readCachedDragFile(id: string, url: string): File | undefined {
  return cache.get(cacheKey(id, url));
}

/** Fetch a remote file into a `File` the OS can receive from a drag. Cached by id + url. */
export function primeDragFile(id: string, url: string, filename: string, mimeType: string): Promise<File | null> {
  const key = cacheKey(id, url);
  const cached = cache.get(key);
  if (cached) return Promise.resolve(cached);
  const pending = inflight.get(key);
  if (pending) return pending;

  const task = fetchDragFile(url, filename, mimeType)
    .then((file) => {
      cache.set(key, file);
      while (cache.size > MAX_CACHED_FILES) {
        const oldest = cache.keys().next().value;
        if (oldest === undefined) break;
        cache.delete(oldest);
      }
      return file;
    })
    .catch(() => null)
    .finally(() => {
      inflight.delete(key);
    });
  inflight.set(key, task);
  return task;
}

export async function fetchDragFile(url: string, filename: string, mimeType: string): Promise<File> {
  const resolved = new URL(url, window.location.href);
  const sameOrigin = resolved.origin === window.location.origin;
  const response = await fetch(resolved.href, {
    credentials: sameOrigin ? "include" : "omit",
    mode: "cors",
  });
  if (!response.ok) throw new Error(`Could not read ${filename}`);
  const blob = await response.blob();
  return new File([blob], filename, { type: mimeType || blob.type || "application/octet-stream" });
}

/** Put real file bytes on the drag. Call this after `setData`, or Firefox drops the files. */
export function attachDragFiles(dataTransfer: DataTransfer, files: File[]): void {
  if (!files.length || typeof dataTransfer.items?.add !== "function") return;
  dataTransfer.effectAllowed = "copyMove";
  for (const file of files) dataTransfer.items.add(file);
}

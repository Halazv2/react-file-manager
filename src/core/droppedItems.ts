export const FILE_MANAGER_DRAG_MIME = "application/x-file-manager-item";

export type FileManagerDropItem =
  | { kind: "file"; name: string; file: File }
  | { kind: "folder"; name: string; children: FileManagerDropItem[] };

interface DirectoryReaderLike {
  readEntries(
    successCallback: (entries: DroppedEntryLike[]) => void,
    errorCallback?: (error: DOMException) => void
  ): void;
}

interface DroppedEntryLike {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  file?(
    successCallback: (file: File) => void,
    errorCallback?: (error: DOMException) => void
  ): void;
  createReader?(): DirectoryReaderLike;
}

export function isInternalFileManagerDrag(dataTransfer: DataTransfer): boolean {
  return Array.from(dataTransfer.types).includes(FILE_MANAGER_DRAG_MIME);
}

export function isExternalFileDrag(dataTransfer: DataTransfer): boolean {
  return (
    Array.from(dataTransfer.types).includes("Files") &&
    !isInternalFileManagerDrag(dataTransfer)
  );
}

export function planExternalDrop(
  items: FileManagerDropItem[],
  hasImport: boolean
):
  | { action: "import"; items: FileManagerDropItem[] }
  | { action: "upload"; files: File[] }
  | { action: "none" } {
  if (!items.length) return { action: "none" };

  const hasFolder = items.some((item) => item.kind === "folder");
  if (hasFolder && hasImport) return { action: "import", items };

  const files = hasFolder
    ? filesFromDroppedItems(items)
    : items.flatMap((item) => (item.kind === "file" ? [item.file] : []));
  if (files.length) return { action: "upload", files };
  return { action: "none" };
}

/** Flatten a drop tree into files, setting `webkitRelativePath` so hosts can recreate folders. */
export function filesFromDroppedItems(
  items: FileManagerDropItem[],
  parentPath = ""
): File[] {
  const files: File[] = [];
  for (const item of items) {
    const path = parentPath ? `${parentPath}/${item.name}` : item.name;
    if (item.kind === "file") {
      files.push(parentPath ? withRelativePath(item.file, path) : item.file);
    } else {
      files.push(...filesFromDroppedItems(item.children, path));
    }
  }
  return files;
}

function withRelativePath(file: File, relativePath: string): File {
  const next = new File([file], file.name, {
    type: file.type,
    lastModified: file.lastModified
  });
  Object.defineProperty(next, "webkitRelativePath", {
    configurable: true,
    enumerable: true,
    value: relativePath
  });
  return next;
}

export async function readDataTransferItems(
  dataTransfer: DataTransfer
): Promise<FileManagerDropItem[]> {
  const entries = getDataTransferEntries(dataTransfer);
  if (entries.length) return readFileSystemEntries(entries);

  return Array.from(dataTransfer.files).map((file) => ({
    kind: "file",
    name: file.name,
    file
  }));
}

export function getDataTransferEntries(
  dataTransfer: DataTransfer
): DroppedEntryLike[] {
  const entries: DroppedEntryLike[] = [];
  for (const item of Array.from(dataTransfer.items ?? [])) {
    if (item.kind !== "file") continue;
    const entry = item.webkitGetAsEntry?.() ?? null;
    if (entry) entries.push(entry);
  }
  return entries;
}

export async function readFileSystemEntries(
  entries: Array<DroppedEntryLike | null | undefined>
): Promise<FileManagerDropItem[]> {
  const items = await Promise.all(
    entries
      .filter((entry): entry is DroppedEntryLike => Boolean(entry))
      .map((entry) => readEntry(entry))
  );
  return items.filter((item): item is FileManagerDropItem => item !== null);
}

async function readEntry(
  entry: DroppedEntryLike
): Promise<FileManagerDropItem | null> {
  if (entry.isFile) return readFileEntry(entry);
  if (entry.isDirectory) return readDirectoryEntry(entry);
  return null;
}

function readFileEntry(
  entry: DroppedEntryLike
): Promise<FileManagerDropItem | null> {
  if (!entry.file) return Promise.resolve(null);

  return new Promise((resolve) => {
    entry.file?.(
      (file) => resolve({ kind: "file", name: file.name, file }),
      () => resolve(null)
    );
  });
}

async function readDirectoryEntry(
  entry: DroppedEntryLike
): Promise<FileManagerDropItem> {
  const children = entry.createReader
    ? await readFileSystemEntries(await readAllDirectoryEntries(entry.createReader()))
    : [];

  return { kind: "folder", name: entry.name, children };
}

function readAllDirectoryEntries(
  reader: DirectoryReaderLike
): Promise<DroppedEntryLike[]> {
  return new Promise((resolve, reject) => {
    const entries: DroppedEntryLike[] = [];

    const readBatch = (): void => {
      reader.readEntries(
        (batch) => {
          if (!batch.length) {
            resolve(entries);
            return;
          }
          entries.push(...batch);
          readBatch();
        },
        reject
      );
    };

    readBatch();
  });
}

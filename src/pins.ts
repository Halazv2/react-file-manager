export const MAX_RECENT_FOLDERS = 3;

function favoritesKey(storageKey: string): string {
  return `${storageKey}:favorites`;
}

function recentKey(storageKey: string): string {
  return `${storageKey}:recent`;
}

function readIds(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(String).filter(Boolean);
  } catch {
    return [];
  }
}

function writeIds(key: string, ids: string[]): void {
  localStorage.setItem(key, JSON.stringify(ids.slice(0, 12)));
}

export function getFavoriteFolderIds(storageKey: string): string[] {
  return readIds(favoritesKey(storageKey));
}

export function toggleFavoriteFolderId(
  storageKey: string,
  folderId: string
): string[] {
  const current = getFavoriteFolderIds(storageKey);
  const next = current.includes(folderId)
    ? current.filter((id) => id !== folderId)
    : [folderId, ...current];
  writeIds(favoritesKey(storageKey), next);
  return next;
}

export function getRecentFolderIds(storageKey: string): string[] {
  return readIds(recentKey(storageKey)).slice(0, MAX_RECENT_FOLDERS);
}

export function pushRecentFolderId(
  storageKey: string,
  folderId: string
): string[] {
  const current = getRecentFolderIds(storageKey).filter((id) => id !== folderId);
  const next = [folderId, ...current].slice(0, MAX_RECENT_FOLDERS);
  writeIds(recentKey(storageKey), next);
  return next;
}

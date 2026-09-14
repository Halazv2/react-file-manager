import type { FileManagerItem } from "./types";

export function idsInRange(
  items: FileManagerItem[],
  startIndex: number,
  endIndex: number
): string[] {
  const start = Math.min(startIndex, endIndex);
  const end = Math.max(startIndex, endIndex);
  return items.slice(start, end + 1).map((item) => item.id);
}

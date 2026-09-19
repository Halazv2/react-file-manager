import { breadcrumbsFromIndex, buildTreeIndex, folderContainsIdInIndex, getIndexedNode } from "./treeIndex";
import type { FileManagerItem, FileManagerNode, FileManagerSortBy } from "./types";

export function getNodeById(
  nodes: FileManagerNode[],
  id: string
): FileManagerNode | null {
  return getIndexedNode(buildTreeIndex(nodes), id);
}

export function folderContainsId(folder: FileManagerNode, id: string): boolean {
  return folderContainsIdInIndex(buildTreeIndex([folder]), folder.id, id);
}

export function folderHasChildFolders(folder: FileManagerNode): boolean {
  return (folder.children ?? []).some((child) => child.kind === "folder");
}

export function getFolderContents(
  nodes: FileManagerNode[],
  folderId: string | null
): FileManagerNode[] {
  if (!folderId) return nodes;
  return getNodeById(nodes, folderId)?.children ?? [];
}

export function compareFolderEntries(
  a: FileManagerNode,
  b: FileManagerNode,
  sortBy: FileManagerSortBy = "name",
  sortDirection: "asc" | "desc" = "asc"
): number {
  const direction = sortDirection === "desc" ? -1 : 1;
  if (sortBy === "kind") {
    if (a.kind !== b.kind) return a.kind === "folder" ? -1 * direction : 1 * direction;
    return a.name.localeCompare(b.name) * direction;
  }
  if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1;
  if (sortBy === "size") {
    return ((a.size ?? 0) - (b.size ?? 0)) * direction;
  }
  return a.name.localeCompare(b.name) * direction;
}

export function listFolder(
  nodes: FileManagerNode[],
  folderId: string | null,
  options?: {
    sortBy?: FileManagerSortBy;
    sortDirection?: "asc" | "desc";
    sortComparator?: (a: FileManagerNode, b: FileManagerNode) => number;
  }
): FileManagerNode[] {
  const entries = [...getFolderContents(nodes, folderId)];
  if (options?.sortComparator) {
    return entries.sort(options.sortComparator);
  }
  return entries.sort((a, b) =>
    compareFolderEntries(a, b, options?.sortBy, options?.sortDirection)
  );
}

export function getBreadcrumbs(
  nodes: FileManagerNode[],
  folderId: string | null
): FileManagerNode[] {
  return breadcrumbsFromIndex(buildTreeIndex(nodes), folderId);
}

function formatPath(parts: string[], rootLabel: string): string {
  return [rootLabel, ...parts].join(" / ");
}

export function searchNodes(
  nodes: FileManagerNode[],
  query: string,
  rootLabel = "My files"
): FileManagerItem[] {
  const term = query.trim().toLowerCase();
  if (!term) return [];

  const matches: FileManagerItem[] = [];

  const visit = (list: FileManagerNode[], parts: string[]): void => {
    const path = formatPath(parts, rootLabel);
    for (const node of list) {
      if (node.name.toLowerCase().includes(term)) {
        matches.push({ ...node, path });
      }
      if (node.kind === "folder") {
        visit(node.children ?? [], [...parts, node.name]);
      }
    }
  };

  visit(nodes, []);
  return matches;
}

export function getExtension(node: FileManagerNode): string | undefined {
  if (node.kind === "folder") return undefined;
  if (node.extension) return node.extension.replace(/^\./, "").toLowerCase();
  const match = node.name.match(/\.([^.]+)$/);
  return match?.[1]?.toLowerCase();
}

export function moveNodes(
  nodes: FileManagerNode[],
  ids: string[],
  targetFolderId: string | null
): FileManagerNode[] {
  const idSet = new Set(ids);
  const moving: FileManagerNode[] = [];

  for (const id of ids) {
    const node = getNodeById(nodes, id);
    if (!node) continue;
    if (node.kind === "folder" && targetFolderId) {
      if (folderContainsId(node, targetFolderId)) return nodes;
    }
  }

  const strip = (list: FileManagerNode[]): FileManagerNode[] =>
    list.flatMap((node) => {
      if (idSet.has(node.id)) {
        moving.push(node);
        return [];
      }
      if (node.children) {
        return [{ ...node, children: strip(node.children) }];
      }
      return [node];
    });

  const stripped = strip(nodes);
  if (!moving.length) return nodes;
  if (!targetFolderId) return [...stripped, ...moving];

  const insert = (list: FileManagerNode[]): FileManagerNode[] =>
    list.map((node) => {
      if (node.id === targetFolderId) {
        return { ...node, children: [...(node.children ?? []), ...moving] };
      }
      if (node.children) {
        return { ...node, children: insert(node.children) };
      }
      return node;
    });

  return insert(stripped);
}

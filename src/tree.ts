import type { FileManagerItem, FileManagerNode } from "./types";

export function getNodeById(
  nodes: FileManagerNode[],
  id: string
): FileManagerNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children?.length) {
      const nested = getNodeById(node.children, id);
      if (nested) return nested;
    }
  }
  return null;
}

export function folderContainsId(folder: FileManagerNode, id: string): boolean {
  if (folder.id === id) return true;
  return (folder.children ?? []).some((child) => folderContainsId(child, id));
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

export function listFolder(
  nodes: FileManagerNode[],
  folderId: string | null
): FileManagerNode[] {
  return [...getFolderContents(nodes, folderId)].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export function getBreadcrumbs(
  nodes: FileManagerNode[],
  folderId: string | null
): FileManagerNode[] {
  if (!folderId) return [];

  const path: FileManagerNode[] = [];

  const walk = (folders: FileManagerNode[]): boolean => {
    for (const node of folders) {
      if (node.id === folderId) {
        path.push(node);
        return true;
      }
      if (node.kind === "folder" && walk(node.children ?? [])) {
        path.unshift(node);
        return true;
      }
    }
    return false;
  };

  walk(nodes);
  return path;
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

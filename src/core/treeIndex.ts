import type { FileManagerNode } from "../types";

export interface TreeIndex {
  byId: Map<string, FileManagerNode>;
  parentOf: Map<string, string | null>;
  childrenOf: Map<string | null, FileManagerNode[]>;
  allFolderIds: Set<string>;
}

export function buildTreeIndex(nodes: FileManagerNode[]): TreeIndex {
  const byId = new Map<string, FileManagerNode>();
  const parentOf = new Map<string, string | null>();
  const childrenOf = new Map<string | null, FileManagerNode[]>();

  const walk = (list: FileManagerNode[], parentId: string | null): void => {
    childrenOf.set(parentId, list);
    for (const node of list) {
      byId.set(node.id, node);
      parentOf.set(node.id, parentId);
      walk(node.children ?? [], node.id);
    }
  };

  walk(nodes, null);
  const allFolderIds = new Set<string>();
  for (const [id, node] of byId) {
    if (node.kind === "folder") {
      allFolderIds.add(id);
    }
  }
  return { byId, parentOf, childrenOf, allFolderIds };
}

export function getIndexedNode(index: TreeIndex, id: string | null): FileManagerNode | null {
  if (!id) return null;
  return index.byId.get(id) ?? null;
}

export function folderContainsIdInIndex(index: TreeIndex, folderId: string, id: string): boolean {
  if (folderId === id) return true;
  let current: string | null | undefined = id;
  while (current) {
    if (current === folderId) return true;
    current = index.parentOf.get(current);
    if (current === undefined) return false;
  }
  return false;
}

export function breadcrumbsFromIndex(index: TreeIndex, folderId: string | null): FileManagerNode[] {
  if (!folderId) return [];
  const path: FileManagerNode[] = [];
  let current: string | null | undefined = folderId;
  while (current) {
    const node = index.byId.get(current);
    if (!node) break;
    path.unshift(node);
    current = index.parentOf.get(current);
  }
  return path;
}

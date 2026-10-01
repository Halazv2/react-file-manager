import type { TreeIndex } from "./treeIndex";
import type {
  FileManagerActionDestination,
  FileManagerActionItem,
  FileManagerActionUndo,
  FileManagerCreateAction,
  FileManagerDeleteAction,
  FileManagerImportAction,
  FileManagerKind,
  FileManagerMoveAction,
  FileManagerRenameAction,
  FileManagerUploadAction,
} from "../types";

type MoveHandler = (ids: string[], targetFolderId: string | null) => void | Promise<void>;
type RenameHandler = (id: string, name: string) => void | Promise<void>;

function toActionItem(index: TreeIndex, id: string): FileManagerActionItem | null {
  const node = index.byId.get(id);
  if (!node) return null;
  const parentId = index.parentOf.get(id);
  return {
    id: node.id,
    name: node.name,
    kind: node.kind,
    parentId: parentId === undefined ? null : parentId,
  };
}

function toActionItems(index: TreeIndex, ids: string[]): FileManagerActionItem[] {
  const items: FileManagerActionItem[] = [];
  for (const id of ids) {
    const item = toActionItem(index, id);
    if (item) items.push(item);
  }
  return items;
}

function toDestination(index: TreeIndex, folderId: string | null, rootLabel: string): FileManagerActionDestination {
  if (folderId === null) return { id: null, name: rootLabel };
  return { id: folderId, name: index.byId.get(folderId)?.name ?? folderId };
}

function sharedParentId(items: FileManagerActionItem[]): string | null | undefined {
  const first = items[0];
  if (!first) return undefined;
  return items.every((item) => item.parentId === first.parentId) ? first.parentId : undefined;
}

function undoMove(items: FileManagerActionItem[], move: MoveHandler): FileManagerActionUndo {
  const groups = new Map<string | null, string[]>();
  for (const item of items) {
    const group = groups.get(item.parentId);
    if (group) group.push(item.id);
    else groups.set(item.parentId, [item.id]);
  }
  return async () => {
    for (const [parentId, ids] of groups) {
      await move(ids, parentId);
    }
  };
}

export function buildMoveAction(
  index: TreeIndex,
  ids: string[],
  targetFolderId: string | null,
  rootLabel: string,
  move?: MoveHandler
): FileManagerMoveAction | null {
  const items = toActionItems(index, ids);
  const item = items[0];
  if (!item) return null;
  const destination = toDestination(index, targetFolderId, rootLabel);
  const parentId = sharedParentId(items);
  return {
    type: "move",
    item,
    items,
    destination,
    ...(parentId !== undefined ? { previous: { parentId } } : {}),
    current: { parentId: destination.id },
    ...(move ? { undo: undoMove(items, move) } : {}),
  };
}

export function buildRenameAction(
  index: TreeIndex,
  id: string,
  name: string,
  rename?: RenameHandler
): FileManagerRenameAction | null {
  const item = toActionItem(index, id);
  if (!item) return null;
  return {
    type: "rename",
    item,
    previous: { name: item.name },
    current: { name },
    ...(rename ? { undo: () => rename(id, item.name) } : {}),
  };
}

export function buildDeleteAction(index: TreeIndex, ids: string[]): FileManagerDeleteAction | null {
  const items = toActionItems(index, ids);
  const item = items[0];
  if (!item) return null;
  return { type: "delete", item, items };
}

export function buildCreateAction(
  index: TreeIndex,
  kind: FileManagerKind,
  parentId: string | null,
  rootLabel: string
): FileManagerCreateAction {
  return {
    type: "create",
    kind,
    destination: toDestination(index, parentId, rootLabel),
  };
}

export function buildUploadAction(
  index: TreeIndex,
  names: string[],
  folderId: string | null,
  rootLabel: string
): FileManagerUploadAction {
  return {
    type: "upload",
    count: names.length,
    names,
    destination: toDestination(index, folderId, rootLabel),
  };
}

export function buildImportAction(
  index: TreeIndex,
  items: Array<{ name: string; kind: FileManagerKind }>,
  folderId: string | null,
  rootLabel: string
): FileManagerImportAction {
  return {
    type: "import",
    count: items.length,
    items,
    destination: toDestination(index, folderId, rootLabel),
  };
}

import {
  FileManager,
  moveNodes,
  type FileManagerNode
} from "@halazv2/react-file-manager";
import { useCallback, useState } from "react";

import { initialNodes } from "./mockData";

export default function App() {
  const [nodes, setNodes] = useState<FileManagerNode[]>(initialNodes);
  const [toast, setToast] = useState<string | null>(null);

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 1800);
  }, []);

  const onMove = useCallback(
    (ids: string[], targetFolderId: string | null) => {
      setNodes((current) => moveNodes(current, ids, targetFolderId));
      notify(
        `Moved ${ids.length} item${ids.length === 1 ? "" : "s"}`
      );
    },
    [notify]
  );

  const onCreateFolder = useCallback(
    (parentId: string | null) => {
      const name = window.prompt("Folder name", "Untitled folder");
      if (!name?.trim()) return;
      const folder: FileManagerNode = {
        id: crypto.randomUUID(),
        name: name.trim(),
        kind: "folder",
        children: []
      };
      setNodes((current) => insertNode(current, parentId, folder));
    },
    []
  );

  const onUpload = useCallback(
    (files: File[], folderId: string | null) => {
      const uploaded: FileManagerNode[] = files.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        kind: "file",
        extension: file.name.split(".").pop(),
        size: file.size
      }));
      setNodes((current) =>
        uploaded.reduce(
          (tree, node) => insertNode(tree, folderId, node),
          current
        )
      );
      notify(`Uploaded ${files.length} file${files.length === 1 ? "" : "s"}`);
    },
    [notify]
  );

  const onDelete = useCallback(
    (ids: string[]) => {
      if (!window.confirm(`Delete ${ids.length} item(s)?`)) return;
      setNodes((current) => removeNodes(current, ids));
      notify("Deleted");
    },
    [notify]
  );

  return (
    <div className="flex min-h-full flex-col items-center px-6 py-10">
      <div className="mb-6 w-full max-w-6xl">
        <p className="m-0 text-sm font-semibold tracking-wide text-blue-700">
          @halazv2/react-file-manager
        </p>
        <h1 className="mt-1 mb-2 text-3xl font-semibold tracking-tight text-gray-900">
          Finder-style file browser for React
        </h1>
        <p className="m-0 max-w-2xl text-[15px] leading-relaxed text-gray-600">
          Drag a file onto a folder and hold — the folder spring-loads open,
          just like macOS Finder. Bring your own data and API.
        </p>
      </div>

      <div className="h-[640px] w-full max-w-6xl overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <div className="flex h-10 items-center gap-2 border-b border-black/[0.06] bg-gray-100 px-3">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          <span className="ml-3 text-[13px] font-medium text-gray-500">
            My files
          </span>
        </div>
        <div className="h-[calc(640px-2.5rem)]">
          <FileManager
            nodes={nodes}
            onMove={onMove}
            onCreateFolder={onCreateFolder}
            onUpload={onUpload}
            onDelete={onDelete}
            onOpenFile={(id) => notify(`Open ${id}`)}
          />
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 rounded-full bg-gray-900 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function insertNode(
  nodes: FileManagerNode[],
  parentId: string | null,
  node: FileManagerNode
): FileManagerNode[] {
  if (!parentId) return [...nodes, node];
  return nodes.map((entry) => {
    if (entry.id === parentId) {
      return { ...entry, children: [...(entry.children ?? []), node] };
    }
    if (entry.children) {
      return { ...entry, children: insertNode(entry.children, parentId, node) };
    }
    return entry;
  });
}

function removeNodes(
  nodes: FileManagerNode[],
  ids: string[]
): FileManagerNode[] {
  const idSet = new Set(ids);
  return nodes.flatMap((node) => {
    if (idSet.has(node.id)) return [];
    if (node.children) {
      return [{ ...node, children: removeNodes(node.children, ids) }];
    }
    return [node];
  });
}

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FileManager } from "./FileManager";
import type { FileManagerActionEvent, FileManagerNode } from "./types";

const nodes: FileManagerNode[] = [
  {
    id: "docs",
    name: "Documents",
    kind: "folder",
    children: [
      { id: "nested", name: "Nested", kind: "folder", children: [] },
      { id: "notes", name: "notes.txt", kind: "file" },
    ],
  },
  { id: "photos", name: "Photos", kind: "folder", children: [] },
  { id: "readme", name: "README.md", kind: "file" },
];

function createDataTransfer(): DataTransfer {
  const store = new Map<string, string>();
  const types: string[] = [];
  return {
    dropEffect: "none",
    effectAllowed: "all",
    files: [] as unknown as FileList,
    items: [] as unknown as DataTransferItemList,
    types,
    setData(format: string, data: string) {
      store.set(format, data);
      if (!types.includes(format)) types.push(format);
    },
    getData(format: string) {
      return store.get(format) ?? "";
    },
    clearData() {
      store.clear();
      types.length = 0;
    },
    setDragImage() {},
  } as DataTransfer;
}

function folderContents() {
  return screen.getByRole("listbox", { name: "Folder contents" });
}

function option(name: string) {
  return within(folderContents()).getByRole("option", { name });
}

afterEach(() => {
  cleanup();
});

function cloneNodes(list: FileManagerNode[]): FileManagerNode[] {
  return list.map((node) => ({
    ...node,
    children: node.children ? cloneNodes(node.children) : undefined,
  }));
}

describe("file action events", () => {
  it("emits a move only after the host callback resolves", async () => {
    const user = userEvent.setup();
    let resolveMove: (() => void) | undefined;
    const onMove = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          if (!resolveMove) {
            resolveMove = resolve;
            return;
          }
          resolve();
        })
    );
    const onAction = vi.fn();
    render(<FileManager nodes={nodes} rootLabel="Drive" onMove={onMove} onAction={onAction} />);

    await user.click(screen.getByRole("treeitem", { name: "Documents" }));
    const dataTransfer = createDataTransfer();
    fireEvent.dragStart(option("notes.txt"), { dataTransfer });
    const root = document.querySelector("[data-drop-id='root']");
    if (!root) throw new Error("Missing root drop target");
    fireEvent.drop(root, { dataTransfer });

    await waitFor(() => expect(onMove).toHaveBeenCalledWith(["notes"], null));
    expect(onAction).not.toHaveBeenCalled();

    resolveMove?.();

    await waitFor(() => expect(onAction).toHaveBeenCalledTimes(1));
    const event = onAction.mock.calls[0][0] as FileManagerActionEvent;
    expect(event).toMatchObject({
      type: "move",
      item: { id: "notes", name: "notes.txt", kind: "file", parentId: "docs" },
      items: [{ id: "notes", name: "notes.txt", kind: "file", parentId: "docs" }],
      destination: { id: null, name: "Drive" },
      previous: { parentId: "docs" },
      current: { parentId: null },
    });

    await event.undo?.();
    expect(onMove).toHaveBeenLastCalledWith(["notes"], "docs");
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("does not emit a move when the host callback rejects", async () => {
    const onMove = vi.fn().mockRejectedValue(new Error("nope"));
    const onAction = vi.fn();
    const onError = vi.fn();
    render(<FileManager nodes={nodes} onMove={onMove} onAction={onAction} onError={onError} />);

    const dataTransfer = createDataTransfer();
    fireEvent.dragStart(option("README.md"), { dataTransfer });
    fireEvent.drop(option("Photos"), { dataTransfer });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.any(Error), { operation: "move" });
    });
    expect(onAction).not.toHaveBeenCalled();
  });

  it("emits a rename with the previous name and an undo that does not emit again", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const tree = cloneNodes(nodes);

    function Harness() {
      const [current, setCurrent] = useState(tree);
      return (
        <FileManager
          nodes={current}
          onAction={onAction}
          onRename={(id, name) => {
            const walk = (list: FileManagerNode[]) => {
              for (const node of list) {
                if (node.id === id) node.name = name;
                else if (node.children) walk(node.children);
              }
            };
            walk(current);
            setCurrent(cloneNodes(current));
          }}
        />
      );
    }

    render(<Harness />);
    await user.click(option("README.md"));
    screen.getByLabelText("File manager").focus();
    await user.keyboard("{F2}");
    const input = screen.getByRole("textbox", { name: "Rename item" });
    await user.clear(input);
    await user.type(input, "hello.md{Enter}");

    await waitFor(() => expect(onAction).toHaveBeenCalledTimes(1));
    const event = onAction.mock.calls[0][0] as FileManagerActionEvent;
    expect(event).toMatchObject({
      type: "rename",
      item: { id: "readme", name: "README.md", kind: "file", parentId: null },
      previous: { name: "README.md" },
      current: { name: "hello.md" },
    });
    expect(screen.getByText("Renamed to hello.md")).toBeTruthy();

    await event.undo?.();
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("does not emit a rename when the name is blank or the host rejects it", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    const onAction = vi.fn();
    const { unmount } = render(<FileManager nodes={nodes} onRename={onRename} onAction={onAction} />);

    await user.click(option("README.md"));
    screen.getByLabelText("File manager").focus();
    await user.keyboard("{F2}");
    const input = screen.getByRole("textbox", { name: "Rename item" });
    await user.clear(input);
    await user.type(input, "   {Enter}");

    expect(onRename).not.toHaveBeenCalled();
    expect(onAction).not.toHaveBeenCalled();
    unmount();

    const failingRename = vi.fn().mockRejectedValue(new Error("nope"));
    const onError = vi.fn();
    render(<FileManager nodes={nodes} onRename={failingRename} onAction={onAction} onError={onError} />);
    await user.click(option("README.md"));
    screen.getByLabelText("File manager").focus();
    await user.keyboard("{F2}");
    const next = screen.getByRole("textbox", { name: "Rename item" });
    await user.clear(next);
    await user.type(next, "hello.md{Enter}");

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.any(Error), { operation: "rename" });
    });
    expect(onAction).not.toHaveBeenCalled();
  });

  it("emits delete for the selection and skips it when delete fails", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const onAction = vi.fn();
    const { unmount } = render(<FileManager nodes={nodes} onDelete={onDelete} onAction={onAction} />);

    await user.click(option("Documents"));
    fireEvent.click(option("README.md"), { metaKey: true });
    screen.getByLabelText("File manager").focus();
    await user.keyboard("{Delete}");

    await waitFor(() => expect(onAction).toHaveBeenCalledTimes(1));
    expect(onDelete).toHaveBeenCalledWith(["docs", "readme"]);
    const event = onAction.mock.calls[0][0] as FileManagerActionEvent;
    expect(event).toMatchObject({
      type: "delete",
      item: { id: "docs", name: "Documents", kind: "folder", parentId: null },
      items: [
        { id: "docs", name: "Documents", kind: "folder", parentId: null },
        { id: "readme", name: "README.md", kind: "file", parentId: null },
      ],
    });
    expect(event.undo).toBeUndefined();
    unmount();

    const onError = vi.fn();
    const failingDelete = vi.fn().mockRejectedValue(new Error("nope"));
    render(<FileManager nodes={nodes} onDelete={failingDelete} onAction={onAction} onError={onError} />);
    await user.click(option("README.md"));
    screen.getByLabelText("File manager").focus();
    await user.keyboard("{Delete}");

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.any(Error), { operation: "delete" });
    });
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("emits create for a new folder or file in the current folder", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const onCreateFolder = vi.fn();
    const onCreateFile = vi.fn();
    render(
      <FileManager
        nodes={nodes}
        rootLabel="Drive"
        onAction={onAction}
        onCreateFolder={onCreateFolder}
        onCreateFile={onCreateFile}
      />
    );

    await user.click(screen.getByRole("button", { name: "Add New" }));
    await user.click(screen.getByRole("menuitem", { name: "Create folder" }));

    await waitFor(() => expect(onAction).toHaveBeenCalledTimes(1));
    expect(onCreateFolder).toHaveBeenCalledWith(null);
    expect(onAction).toHaveBeenLastCalledWith({
      type: "create",
      kind: "folder",
      destination: { id: null, name: "Drive" },
    });

    await user.click(screen.getByRole("treeitem", { name: "Documents" }));
    await user.click(screen.getByRole("button", { name: "Add New" }));
    await user.click(screen.getByRole("menuitem", { name: "Upload Document" }));

    await waitFor(() => expect(onAction).toHaveBeenCalledTimes(2));
    expect(onCreateFile).toHaveBeenCalledWith("docs");
    expect(onAction).toHaveBeenLastCalledWith({
      type: "create",
      kind: "file",
      destination: { id: "docs", name: "Documents" },
    });
  });

  it("does not emit create when creating a folder fails", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const onError = vi.fn();
    render(
      <FileManager
        nodes={nodes}
        onAction={onAction}
        onError={onError}
        onCreateFolder={() => Promise.reject(new Error("nope"))}
      />
    );

    await user.click(screen.getByRole("button", { name: "Add New" }));
    await user.click(screen.getByRole("menuitem", { name: "Create folder" }));

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.any(Error), { operation: "create" });
    });
    expect(onAction).not.toHaveBeenCalled();
  });

  it("emits upload with the file names and destination", async () => {
    const user = userEvent.setup();
    const onUpload = vi.fn();
    const onAction = vi.fn();
    render(<FileManager nodes={nodes} onUpload={onUpload} onAction={onAction} />);

    await user.click(screen.getByRole("treeitem", { name: "Documents" }));
    const file = new File(["hello"], "agenda.txt", { type: "text/plain" });
    await user.upload(screen.getByLabelText("Upload files"), file);

    await waitFor(() => expect(onAction).toHaveBeenCalledTimes(1));
    expect(onUpload).toHaveBeenCalledWith([file], "docs");
    expect(onAction).toHaveBeenCalledWith({
      type: "upload",
      count: 1,
      names: ["agenda.txt"],
      destination: { id: "docs", name: "Documents" },
    });
  });

  it("emits import for a dropped folder and skips a failed upload", async () => {
    const onImport = vi.fn();
    const onAction = vi.fn();
    const { unmount } = render(<FileManager nodes={nodes} onImport={onImport} onAction={onAction} />);

    const dataTransfer = createDataTransfer();
    (dataTransfer.types as string[]).push("Files");
    Object.defineProperty(dataTransfer, "items", {
      configurable: true,
      value: [
        {
          kind: "file",
          webkitGetAsEntry: () => ({
            isFile: false,
            isDirectory: true,
            name: "Album",
            createReader: () => ({
              readEntries(success: (batch: never[]) => void) {
                success([]);
              },
            }),
          }),
        },
      ],
    });
    fireEvent.drop(option("Photos"), { dataTransfer });

    await waitFor(() => expect(onAction).toHaveBeenCalledTimes(1));
    expect(onImport).toHaveBeenCalledWith([expect.objectContaining({ kind: "folder", name: "Album" })], "photos");
    expect(onAction).toHaveBeenCalledWith({
      type: "import",
      count: 1,
      items: [{ name: "Album", kind: "folder" }],
      destination: { id: "photos", name: "Photos" },
    });
    unmount();

    const onError = vi.fn();
    const onUpload = vi.fn().mockRejectedValue(new Error("disk"));
    render(<FileManager nodes={nodes} onUpload={onUpload} onAction={onAction} onError={onError} />);
    await userEvent.upload(screen.getByLabelText("Upload files"), new File(["x"], "a.txt"));

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.any(Error), { operation: "upload" });
    });
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("does not emit for download", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const onDownloadFile = vi.fn();
    render(<FileManager nodes={nodes} onAction={onAction} onDownloadFile={onDownloadFile} />);

    await user.click(within(folderContents()).getByRole("button", { name: "Manage README.md" }));
    await user.click(screen.getByRole("menuitem", { name: "Download" }));

    expect(onDownloadFile).toHaveBeenCalledWith("readme");
    expect(onAction).not.toHaveBeenCalled();
  });

  it("reports a throwing listener without failing the mutation", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    const onError = vi.fn();
    const onAction = vi.fn(() => {
      throw new Error("toast failed");
    });
    render(<FileManager nodes={nodes} onRename={onRename} onAction={onAction} onError={onError} />);

    await user.click(option("README.md"));
    screen.getByLabelText("File manager").focus();
    await user.keyboard("{F2}");
    const input = screen.getByRole("textbox", { name: "Rename item" });
    await user.clear(input);
    await user.type(input, "hello.md{Enter}");

    await waitFor(() => expect(onRename).toHaveBeenCalledWith("readme", "hello.md"));
    expect(onError).toHaveBeenCalledWith(expect.any(Error), { operation: "onAction" });
    expect(onError).not.toHaveBeenCalledWith(expect.any(Error), { operation: "rename" });
  });
});

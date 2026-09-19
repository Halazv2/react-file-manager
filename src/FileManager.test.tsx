import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FileManager } from "./FileManager";
import { FILE_MANAGER_DRAG_MIME } from "./core/droppedItems";
import type { FileManagerNode } from "./types";

const nodes: FileManagerNode[] = [
  {
    id: "docs",
    name: "Documents",
    kind: "folder",
    children: [
      { id: "nested", name: "Nested", kind: "folder", children: [] },
      { id: "notes", name: "notes.txt", kind: "file" }
    ]
  },
  { id: "photos", name: "Photos", kind: "folder", children: [] },
  { id: "readme", name: "README.md", kind: "file" }
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
    setDragImage() {}
  } as DataTransfer;
}

function renderManager(props: Partial<ComponentProps<typeof FileManager>> = {}) {
  return render(<FileManager nodes={nodes} {...props} />);
}

function folderContents() {
  return screen.getByRole("listbox", { name: "Folder contents" });
}

function option(name: string) {
  return within(folderContents()).getByRole("option", { name });
}

function selected(name: string) {
  return option(name).getAttribute("aria-selected");
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("FileManager characterization", () => {
  it("selects a single item on click", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    renderManager({ onSelectionChange });

    await user.click(option("README.md"));

    expect(selected("README.md")).toBe("true");
    expect(selected("Documents")).toBe("false");
    expect(onSelectionChange).toHaveBeenCalledWith(["readme"]);
  });

  it("shift-click selects a contiguous range", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    renderManager({ onSelectionChange });

    await user.click(option("Documents"));
    fireEvent.click(option("README.md"), { shiftKey: true });

    expect(selected("Documents")).toBe("true");
    expect(selected("Photos")).toBe("true");
    expect(selected("README.md")).toBe("true");
    expect(onSelectionChange).toHaveBeenLastCalledWith(["docs", "photos", "readme"]);
  });

  it("meta/ctrl-click toggles selection", async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(option("README.md"));
    fireEvent.click(option("Photos"), { metaKey: true });

    expect(selected("README.md")).toBe("true");
    expect(selected("Photos")).toBe("true");
    expect(selected("Documents")).toBe("false");

    fireEvent.click(option("Photos"), { ctrlKey: true });
    expect(selected("Photos")).toBe("false");
    expect(selected("README.md")).toBe("true");
  });

  it("arrow keys move focus and selection", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    renderManager({ onSelectionChange });

    screen.getByLabelText("File manager").focus();
    await user.keyboard("{ArrowDown}");

    expect(selected("Documents")).toBe("true");
    expect(onSelectionChange).toHaveBeenCalledWith(["docs"]);

    await user.keyboard("{ArrowDown}");
    expect(selected("Photos")).toBe("true");
    expect(selected("Documents")).toBe("false");
  });

  it("Enter opens the focused folder", async () => {
    const user = userEvent.setup();
    const onOpenFolder = vi.fn();
    const onFolderChange = vi.fn();
    renderManager({ onOpenFolder, onFolderChange });

    screen.getByLabelText("File manager").focus();
    await user.keyboard("{ArrowDown}{Enter}");

    expect(onOpenFolder).toHaveBeenCalledWith("docs");
    expect(onFolderChange).toHaveBeenCalledWith("docs");
    expect(within(folderContents()).getByRole("option", { name: "notes.txt" })).toBeTruthy();
    expect(within(folderContents()).queryByRole("option", { name: "README.md" })).toBeNull();
  });

  it("Escape clears selection", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    renderManager({ onSelectionChange });

    await user.click(option("README.md"));
    screen.getByLabelText("File manager").focus();
    await user.keyboard("{Escape}");

    expect(selected("README.md")).toBe("false");
    expect(onSelectionChange).toHaveBeenLastCalledWith([]);
  });

  it("Delete invokes onDelete for the selection", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    renderManager({ onDelete });

    await user.click(option("README.md"));
    screen.getByLabelText("File manager").focus();
    await user.keyboard("{Delete}");

    expect(onDelete).toHaveBeenCalledWith(["readme"]);
  });

  it("filters the list by search query", async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    renderManager({ onSearchChange });

    await user.type(screen.getByRole("searchbox", { name: "Search files" }), "notes");

    expect(onSearchChange).toHaveBeenLastCalledWith("notes");
    expect(await within(folderContents()).findByRole("option", { name: "notes.txt" })).toBeTruthy();
    expect(within(folderContents()).queryByRole("option", { name: "README.md" })).toBeNull();
  });

  it("invokes onMove when an item is dropped onto a folder", async () => {
    const onMove = vi.fn();
    renderManager({ onMove });

    const dataTransfer = createDataTransfer();
    fireEvent.dragStart(option("README.md"), { dataTransfer });
    expect(dataTransfer.getData(FILE_MANAGER_DRAG_MIME)).toContain("readme");

    fireEvent.drop(option("Photos"), { dataTransfer });

    await waitFor(() => {
      expect(onMove).toHaveBeenCalledWith(["readme"], "photos");
    });
  });

  it("reports rejected onMove via onError and does not look like success", async () => {
    const onError = vi.fn();
    const onMove = vi.fn().mockRejectedValue(new Error("nope"));
    const onFolderChange = vi.fn();
    renderManager({ onMove, onError, onFolderChange });

    const dataTransfer = createDataTransfer();
    fireEvent.dragStart(option("README.md"), { dataTransfer });
    fireEvent.drop(option("Photos"), { dataTransfer });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.any(Error), { operation: "move" });
    });
    expect(onFolderChange).not.toHaveBeenCalled();
    expect(option("README.md").getAttribute("aria-selected")).toBe("true");
  });

  it("spring-loads a folder after hover delay while dragging", async () => {
    vi.useFakeTimers();
    const onFolderChange = vi.fn();
    renderManager({ springLoadDelay: 500, onFolderChange });

    const dataTransfer = createDataTransfer();
    fireEvent.dragStart(option("README.md"), { dataTransfer });
    fireEvent.dragEnter(option("Documents"), { dataTransfer });

    expect(within(folderContents()).queryByRole("option", { name: "notes.txt" })).toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(within(folderContents()).getByRole("option", { name: "notes.txt" })).toBeTruthy();
    expect(onFolderChange).not.toHaveBeenCalled();
  });

  it("drops selection when selected ids leave the tree", () => {
    const onSelectionChange = vi.fn();
    const { rerender } = render(
      <FileManager nodes={nodes} defaultSelectedIds={["readme"]} onSelectionChange={onSelectionChange} />
    );

    expect(option("README.md").getAttribute("aria-selected")).toBe("true");

    rerender(
      <FileManager
        nodes={nodes.filter((node) => node.id !== "readme")}
        defaultSelectedIds={["readme"]}
        onSelectionChange={onSelectionChange}
      />
    );

    expect(within(folderContents()).queryByRole("option", { name: "README.md" })).toBeNull();
    expect(onSelectionChange).toHaveBeenCalledWith([]);
  });

  it("renames the selected row inline instead of using a prompt", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    const prompt = vi.spyOn(window, "prompt");
    renderManager({ onRename, canManage: true });

    await user.click(option("README.md"));
    screen.getByLabelText("File manager").focus();
    await user.keyboard("{F2}");

    const input = screen.getByRole("textbox", { name: "Rename item" });
    await user.clear(input);
    await user.type(input, "hello.md{Enter}");

    expect(onRename).toHaveBeenCalledWith("readme", "hello.md");
    expect(prompt).not.toHaveBeenCalled();
    prompt.mockRestore();
  });

  it("moves focus among menu items with arrow keys", async () => {
    const user = userEvent.setup();
    renderManager({ onRename: vi.fn(), onDelete: vi.fn(), canManage: true });

    await user.click(screen.getByRole("button", { name: "Manage README.md" }));
    const menu = screen.getByRole("menu");
    const items = within(menu).getAllByRole("menuitem");
    expect(document.activeElement).toBe(items[0]);
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(items[1]);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();
  });
});

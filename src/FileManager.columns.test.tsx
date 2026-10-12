import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FileManager } from "./FileManager";
import type { FileManagerNode } from "./types";

const nodes: FileManagerNode[] = [
  {
    id: "folder",
    name: "Folder",
    kind: "folder",
    modifiedAt: "2026-01-02T12:00:00Z",
    addedAt: "2026-01-02T12:00:00Z",
    children: [{ id: "nested", name: "nested.txt", kind: "file", size: 5 }],
  },
  {
    id: "a",
    name: "a.txt",
    kind: "file",
    size: 100,
    modifiedAt: "2026-01-03T12:00:00Z",
    addedAt: "2026-01-01T12:00:00Z",
  },
  {
    id: "b",
    name: "b.pdf",
    kind: "file",
    size: 10,
    modifiedAt: "2026-01-01T12:00:00Z",
    addedAt: "2026-01-03T12:00:00Z",
  },
  { id: "c", name: "c.txt", kind: "file" },
];

function names() {
  return within(screen.getByRole("listbox", { name: "Folder contents" }))
    .getAllByRole("option")
    .map((option) => option.getAttribute("aria-label"));
}

afterEach(cleanup);

describe("file library columns and sorting", () => {
  it("leaves sorting unset and preserves host order by default", () => {
    render(<FileManager nodes={[nodes[2], nodes[0], nodes[3], nodes[1]]} />);
    expect(names()).toEqual(["b.pdf", "Folder", "c.txt", "a.txt"]);
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.queryByRole("button", { name: "Clear sort" })).toBeNull();
    for (const header of screen.getAllByRole("button", { name: /^(Name|Size|Kind|Date Modified|Date Added)$/ })) {
      expect(header).toHaveAttribute("aria-pressed", "false");
    }
  });

  it("shows separate size, kind, and date cells, with unavailable dates left blank", () => {
    render(<FileManager nodes={nodes} />);
    const file = screen.getByRole("option", { name: "a.txt" });
    expect(within(file).getByLabelText("Size: 100 B")).toBeTruthy();
    expect(within(file).getByLabelText("Kind: TXT")).toBeTruthy();
    const formatted = new Intl.DateTimeFormat(undefined, { dateStyle: "short", timeStyle: "short" }).format(
      Date.parse("2026-01-03T12:00:00Z")
    );
    expect(within(file).getByLabelText(`Date Modified: ${formatted}`)).toBeTruthy();
    expect(within(screen.getByRole("option", { name: "c.txt" })).getByLabelText("Date Added: —")).toBeTruthy();
    expect(within(screen.getByRole("option", { name: "Folder" })).getByLabelText("Size: 1 item")).toBeTruthy();
  });

  it("cycles headers through ascending, descending, and unset while keeping the selection", async () => {
    const user = userEvent.setup();
    render(<FileManager nodes={nodes} />);
    await user.click(screen.getByRole("option", { name: "a.txt" }));
    await user.click(screen.getByRole("button", { name: "Size" }));
    expect(names()).toEqual(["Folder", "c.txt", "b.pdf", "a.txt"]);
    await user.click(screen.getByRole("button", { name: /^Size, Sorted/ }));
    expect(names()).toEqual(["a.txt", "b.pdf", "Folder", "c.txt"]);
    await user.click(screen.getByRole("button", { name: /^Size, Sorted/ }));
    expect(names()).toEqual(["Folder", "a.txt", "b.pdf", "c.txt"]);
    expect(screen.getByRole("button", { name: "Size" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByRole("button", { name: "Clear sort" })).toBeNull();
    expect(screen.getByRole("option", { name: "a.txt" })).toHaveAttribute("aria-selected", "true");
  });

  it("sorts dates across files and folders with missing values last in either direction", async () => {
    const user = userEvent.setup();
    render(<FileManager nodes={nodes} />);
    await user.click(screen.getByRole("button", { name: "Date Modified" }));
    expect(names()).toEqual(["b.pdf", "Folder", "a.txt", "c.txt"]);
    await user.click(screen.getByRole("button", { name: /^Date Modified, Sorted/ }));
    expect(names()).toEqual(["a.txt", "Folder", "b.pdf", "c.txt"]);
    await user.click(screen.getByRole("button", { name: "Date Added" }));
    expect(names()).toEqual(["a.txt", "Folder", "b.pdf", "c.txt"]);
    expect(screen.getByRole("button", { name: /^Date Added, Sorted/ })).toHaveAccessibleName(
      "Date Added, Sorted by Date Added, ascending"
    );
  });

  it("retains header sorting in cards and search and can clear it from cards", async () => {
    const user = userEvent.setup();
    render(<FileManager nodes={nodes} />);
    await user.click(screen.getByRole("button", { name: "Size" }));
    await user.click(screen.getByRole("button", { name: "Card view" }));
    expect(screen.queryByRole("button", { name: "Size" })).toBeNull();
    await user.type(screen.getByRole("searchbox", { name: "Search files" }), ".txt");
    expect(names()).toEqual(["c.txt", "nested.txt", "a.txt"]);
    await user.click(screen.getByRole("button", { name: "Clear sort" }));
    expect(names()).toEqual(["nested.txt", "a.txt", "c.txt"]);
    expect(screen.getByLabelText("File manager")).toHaveFocus();
    await user.clear(screen.getByRole("searchbox", { name: "Search files" }));
    expect(names()).toEqual(["Folder", "a.txt", "b.pdf", "c.txt"]);
    await user.click(screen.getByRole("button", { name: "List view" }));
    expect(screen.getByRole("button", { name: "Size" })).toHaveAttribute("aria-pressed", "false");
  });

  it("adds and removes columns through props without hiding Name or losing settings on view changes", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<FileManager nodes={nodes} visibleColumns={["size", "modifiedAt"]} />);
    expect(screen.getByRole("button", { name: "Name" })).toBeTruthy();
    expect(screen.queryByText("Columns", { selector: "summary" })).toBeNull();
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.queryByRole("slider")).toBeNull();
    expect(screen.queryByRole("button", { name: "Kind" })).toBeNull();
    expect(within(screen.getByRole("option", { name: "a.txt" })).queryByLabelText("Kind: TXT")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Card view" }));
    await user.click(screen.getByRole("button", { name: "List view" }));
    expect(screen.queryByRole("button", { name: "Kind" })).toBeNull();
    rerender(<FileManager nodes={nodes} visibleColumns={["size", "kind"]} />);
    expect(screen.getByRole("button", { name: "Kind" })).toBeTruthy();
    expect(within(screen.getByRole("option", { name: "a.txt" })).getByLabelText("Kind: TXT")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Date Modified" })).toBeNull();
    rerender(<FileManager nodes={nodes} visibleColumns={[]} />);
    expect(screen.getByRole("button", { name: "Name" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Size" })).toBeNull();
  });

  it("resizes with keyboard and pointer dragging, enforcing width limits", () => {
    render(<FileManager nodes={nodes} />);
    const handle = screen.getByRole("separator", { name: "Resize Name column" });
    fireEvent.keyDown(handle, { key: "ArrowRight" });
    expect(handle).toHaveAttribute("aria-valuenow", "250");
    fireEvent.keyDown(handle, { key: "Home" });
    expect(handle).toHaveAttribute("aria-valuenow", "180");
    fireEvent.keyDown(handle, { key: "ArrowLeft" });
    expect(handle).toHaveAttribute("aria-valuenow", "180");
    fireEvent.keyDown(handle, { key: "End" });
    expect(handle).toHaveAttribute("aria-valuenow", "600");
    fireEvent.keyDown(handle, { key: "Home" });
    expect(handle).toHaveAttribute("aria-valuenow", "180");
    const capture = vi.fn();
    const release = vi.fn();
    Object.defineProperties(handle, {
      setPointerCapture: { value: capture },
      releasePointerCapture: { value: release },
    });
    for (const [type, x] of [
      ["pointerdown", 100],
      ["pointermove", 150],
      ["pointerup", 150],
    ] as const) {
      fireEvent(handle, Object.assign(new Event(type, { bubbles: true }), { pointerId: 1, button: 0, clientX: x }));
    }
    expect(capture).toHaveBeenCalledWith(1);
    expect(release).toHaveBeenCalledWith(1);
    expect(handle).toHaveAttribute("aria-valuenow", "230");
    expect(handle.closest(".rfm-list-content")).toHaveStyle("--rfm-list-columns: 230px 90px 120px 165px 165px 28px");
  });

  it("supports controlled sort and width callbacks without overriding host column settings", async () => {
    const user = userEvent.setup();
    const onSortByChange = vi.fn();
    const onVisibleColumnsChange = vi.fn();
    const onColumnWidthsChange = vi.fn();
    render(
      <FileManager
        nodes={nodes}
        sortBy="name"
        visibleColumns={["size"]}
        columnWidths={{ size: 120 }}
        onSortByChange={onSortByChange}
        onVisibleColumnsChange={onVisibleColumnsChange}
        onColumnWidthsChange={onColumnWidthsChange}
      />
    );
    await user.click(screen.getByRole("button", { name: "Size" }));
    expect(onSortByChange).toHaveBeenCalledWith("size");
    expect(names()).toEqual(["a.txt", "b.pdf", "c.txt", "Folder"]);
    expect(screen.getByRole("button", { name: /^Name, Sorted/ })).toBeTruthy();
    const handle = screen.getByRole("separator", { name: "Resize Size column" });
    fireEvent.keyDown(handle, { key: "ArrowRight" });
    expect(onColumnWidthsChange).toHaveBeenCalledWith({ size: 130 });
    expect(handle).toHaveAttribute("aria-valuenow", "120");
    expect(onVisibleColumnsChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Kind" })).toBeNull();
  });

  it("preserves custom comparator precedence without showing misleading built-in controls", () => {
    render(<FileManager nodes={nodes} sortComparator={(a, b) => b.name.localeCompare(a.name)} />);
    expect(names()).toEqual(["Folder", "c.txt", "b.pdf", "a.txt"]);
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.queryByRole("button", { name: "Clear sort" })).toBeNull();
    expect(screen.getByRole("button", { name: "Size" })).toBeDisabled();
  });

  it("honors initial column and sort settings and keeps them after opening folders", async () => {
    const user = userEvent.setup();
    render(
      <FileManager
        nodes={nodes}
        defaultVisibleColumns={["name", "modifiedAt"]}
        defaultColumnWidths={{ name: 320 }}
        defaultSortBy="modifiedAt"
        defaultSortDirection="desc"
      />
    );
    expect(names()).toEqual(["a.txt", "Folder", "b.pdf", "c.txt"]);
    expect(screen.getByRole("separator", { name: "Resize Name column" })).toHaveAttribute("aria-valuenow", "320");
    expect(screen.queryByRole("button", { name: "Size" })).toBeNull();
    await user.dblClick(screen.getByRole("option", { name: "Folder" }));
    expect(names()).toEqual(["nested.txt"]);
    expect(screen.getByRole("button", { name: /^Date Modified, Sorted/ })).toHaveAccessibleName(
      "Date Modified, Sorted by Date Modified, descending"
    );
    expect(screen.getByRole("separator", { name: "Resize Name column" })).toHaveAttribute("aria-valuenow", "320");
  });

  it("supports keyboard header sorting without activating the focused item", async () => {
    const user = userEvent.setup();
    const onOpenFolder = vi.fn();
    render(<FileManager nodes={nodes} onOpenFolder={onOpenFolder} />);
    screen.getByLabelText("File manager").focus();
    await user.keyboard("{ArrowDown}");
    screen.getByRole("button", { name: "Size" }).focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: /^Size, Sorted/ })).toHaveAttribute("aria-pressed", "true");
    expect(onOpenFolder).not.toHaveBeenCalled();
  });

  it("keeps configured headers available in empty folders and localizes their labels", () => {
    render(<FileManager nodes={[]} labels={{ name: "Filename", dateModified: "Changed" }} />);
    expect(screen.getByRole("button", { name: "Filename" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Changed" })).toBeTruthy();
    expect(screen.queryByText("Columns", { selector: "summary" })).toBeNull();
    expect(screen.getByText("This folder is empty")).toBeTruthy();
  });

  it("supports controlled sorting and null clearing through the host props", async () => {
    const user = userEvent.setup();
    const onSortByChange = vi.fn();
    const onSortDirectionChange = vi.fn();
    const { rerender } = render(
      <FileManager
        nodes={nodes}
        sortBy="modifiedAt"
        sortDirection="desc"
        onSortByChange={onSortByChange}
        onSortDirectionChange={onSortDirectionChange}
      />
    );
    expect(names()).toEqual(["a.txt", "Folder", "b.pdf", "c.txt"]);
    await user.click(screen.getByRole("button", { name: "Clear sort" }));
    expect(onSortByChange).toHaveBeenLastCalledWith(null);
    expect(onSortDirectionChange).toHaveBeenLastCalledWith("asc");
    expect(names()).toEqual(["a.txt", "Folder", "b.pdf", "c.txt"]);
    rerender(<FileManager nodes={nodes} sortBy={null} defaultSortBy="name" />);
    expect(names()).toEqual(["Folder", "a.txt", "b.pdf", "c.txt"]);
    expect(screen.queryByRole("button", { name: "Clear sort" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Name" }));
    expect(names()).toEqual(["Folder", "a.txt", "b.pdf", "c.txt"]);
  });

  it("clears a descending sort via its header callback in controlled mode", async () => {
    const user = userEvent.setup();
    const onSortByChange = vi.fn();
    render(<FileManager nodes={nodes} sortBy="modifiedAt" sortDirection="desc" onSortByChange={onSortByChange} />);
    await user.click(screen.getByRole("button", { name: /^Date Modified, Sorted/ }));
    expect(onSortByChange).toHaveBeenLastCalledWith(null);
  });

  it("can clear sorting even when its column is hidden", async () => {
    const user = userEvent.setup();
    render(<FileManager nodes={nodes} defaultSortBy="modifiedAt" defaultVisibleColumns={["name"]} />);
    expect(names()).toEqual(["b.pdf", "Folder", "a.txt", "c.txt"]);
    await user.click(screen.getByRole("button", { name: "Clear sort" }));
    expect(names()).toEqual(["Folder", "a.txt", "b.pdf", "c.txt"]);
  });

  it("uses the active sort when focusing a file selected in the sidebar", async () => {
    const user = userEvent.setup();
    const onOpenFile = vi.fn();
    render(<FileManager nodes={nodes} onOpenFile={onOpenFile} />);
    await user.click(screen.getByRole("button", { name: "Date Modified" }));
    await user.click(screen.getByRole("button", { name: /^Date Modified, Sorted/ }));
    await user.click(screen.getByRole("treeitem", { name: "b.pdf" }));
    expect(screen.getByRole("option", { name: "b.pdf" })).toHaveAttribute("data-focused", "true");
    screen.getByLabelText("File manager").focus();
    await user.keyboard("{Enter}");
    expect(onOpenFile).toHaveBeenCalledWith("b");
  });
});

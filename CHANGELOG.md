# Changelog

## 0.4.6

### Fixed

- Name column fills available list space by default instead of using a fixed width. Explicit host widths and header resizing still set a fixed width; resizing starts from the rendered column width.

## 0.4.5

### Added

- Ctrl+A / Cmd+A selects all items in the active file listing, including search results, without overriding text selection in inputs.
- List columns for Name, Size, Kind, Date Modified, and Date Added, with sticky headers, horizontal scrolling, and pointer/keyboard resizing.
- Prop-driven column visibility via `visibleColumns` / `defaultVisibleColumns` and widths via `columnWidths` / `defaultColumnWidths`. Name is always shown first; there is no built-in column configuration menu.
- Optional `modifiedAt` and `addedAt` node fields accepting ISO 8601 strings or millisecond timestamps. Missing or invalid dates display as unavailable and sort after known dates.
- Header sorting cycles through ascending, descending, and unset, plus a Clear sort action. Sorting supports controlled props and callbacks, applies to list/cards, search results, and spring-loaded folders, and preserves custom comparator precedence.

### Changed

- Sorting is unset by default, preserving host-provided item order. Use `defaultSortBy` for initial sorting or `sortBy` for controlled sorting; `null` clears it.
- Name, Size, and date sorting compare files and folders together instead of forcing folders first. Kind sorting compares file extensions while retaining folder/file grouping; sidebar ordering remains folders-first.

## 0.4.4

### Added

- `onAction` fires after a successful move, rename, delete, create, upload, or import. The event includes an `undo` callback when the change can be reversed.

## 0.4.3

### Added

- Sidebar toggle expands or collapses all folders.

### Fixed

- Long filenames wrap within cards and remain limited to two lines.

## 0.4.2

### Added

- Default bulk Download action for selected files when `onDownloadFile` is provided.
- `getDetailRows` and `renderDetailActions` hooks for host-defined inspector metadata and actions.
- Public `FileManagerDetailRow` type for custom inspector rows.

### Changed

- Refined details-pane icon sizing and presentation.

## 0.4.1

### Added

- Sidebar tree lists files (not only folders). Files are draggable; folders remain drop targets.
- `showFilesInTree` (default `true`) and `treeRevealOnFileSelect` (default `true`), selecting a tree file opens its parent folder and selects the file.
- `folderHasChildren` helper export.

### Fixed

- Visual polish: zinc tokens, denser rows, quieter selection, search field padding/icon, outline buttons, menus, and details metadata.
- Stylesheet is unlayered so host Tailwind utilities cannot wipe library chrome (search, borders, padding).

## 0.4.0

### Breaking

- Library styling is a published stylesheet with semantic tokens (no Tailwind in the package). The previous `@source` path into this package is gone.
- Token names: `--rfm-accent` / `--rfm-selected` / `--rfm-text-muted` replace `--rfm-primary` / `--rfm-hover` / `--rfm-muted`. `--rfm-sidebar` as a color is removed (`--rfm-sidebar-width` remains).

### Added

- `theme`, `style`, and `classNames` slot props.
- State styling via `aria-*` and `data-*` (`data-theme`, `data-focused`, `data-drop-target`, `data-view`, `data-kind`).
- Container-query layout collapse (~900px details, ~600px sidebar).
- Add New menu portals into `.rfm-root` so CSS variables still apply.
- File-type icons use `currentColor` / `--rfm-icon-outline`, contrast-aware chip labels, and chip-only glyphs below 28px.
- `labels` prop, polite `aria-live` status, keyboard-navigable menus, inline rename (`data-editing`), and per-row error boundaries.
- `useFileManager` plus `components` slots (`Row`, `Sidebar`, `Browser`, `DetailsPane`).
- Pointer/touch internal drag adapter (no HTML5 `draggable` on touch) feeding the same DnD reducer.
- File sizes and host-configurable folder sorting through `sortBy`, `sortDirection`, and `sortComparator`.
- `onError` reports failed host callbacks.
- Card-view virtualization for large listings.
- Separate preview entry point and indexed tree lookups with stale-selection cleanup.

### Fixed

- Pin/recent persistence safely handles server-side rendering without accessing browser storage.

### Docs

- README documents every `FileManagerProps` field and the three-layer styling API.

## 0.3.6

### Fixed

- Publishing workflow corrects GitHub Packages authentication and the npm installation step.

## 0.3.5

### Changed

- Version-only patch release; no library behavior changes.

## 0.3.4

### Added

- Publishing workflow also publishes the package to GitHub Packages.

## 0.3.3

### Added

- Expanded extension-aware file icon families with readable, contrast-aware labels.
- Public `FileTypeIconProps` and `FolderTypeIconProps` types for host layouts.

### Changed

- Updated demo files and icon documentation.

## 0.3.2

### Added

- OS folder imports through `onImport`, preserving nested folder structure.
- Dropped-item types and helpers for distinguishing internal moves from external file/folder drops.
- Folder drops flatten into files when only `onUpload` is provided.

## 0.3.1

### Changed

- Refined sidebar, action menus, previews, and shared styling.
- `renderIcon` receives an optional size argument.
- Build scripts publish the theme stylesheet under both supported CSS paths.

## 0.3.0

### Added

- Built-in file/folder icons and theming tokens.
- Persistent folder pins and recent folders through `storageKey`.
- In-pane image, PDF first-page, and text previews, with optional `pdfjs-dist` support.
- Context menus, per-item actions, and bulk actions.
- Rename, download, and create-file hooks.

## 0.2.0

### Added

- Virtualized list view for large folders.
- Spring-loaded folder demo GIF and capture script.

## 0.1.0

### Added

- Initial three-pane file manager with sidebar, list/card browser, and details pane.
- Breadcrumbs, search, multi-selection, and keyboard navigation.
- Drag-and-drop moves with Finder-style spring-loaded folders.
- File-tree helpers, drop-target handlers, and an interactive local demo.

# Changelog

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

### Docs

- README documents every `FileManagerProps` field and the three-layer styling API.

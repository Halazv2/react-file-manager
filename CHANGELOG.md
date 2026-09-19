# Changelog

## 0.4.0

### Breaking

- Library styling is a published `@layer rfm` stylesheet with semantic tokens. Tailwind is demo-only; the previous `@source` path into this package is gone.
- Token names: `--rfm-accent` / `--rfm-selected` / `--rfm-text-muted` replace `--rfm-primary` / `--rfm-hover` / `--rfm-muted`. `--rfm-sidebar` as a color is removed (`--rfm-sidebar-width` remains).

### Added

- `theme`, `style`, and `classNames` slot props.
- State styling via `aria-*` and `data-*` (`data-theme`, `data-focused`, `data-drop-target`, `data-view`, `data-kind`).
- Container-query layout collapse (~900px details, ~600px sidebar).
- Add New menu portals into `.rfm-root` so CSS variables still apply.
- File-type icons use `currentColor` / `--rfm-icon-outline`, contrast-aware chip labels, and chip-only glyphs below 28px.

### Docs

- README documents every `FileManagerProps` field and the three-layer styling API.

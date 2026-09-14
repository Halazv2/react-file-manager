# @halazv2/react-file-manager

Headless-ish React file browser with **Finder-style spring-loaded folders** and drag-and-drop. Bring your own data and API.

Hover a folder while dragging — it expands in the sidebar and opens in the browser after a short delay, just like macOS Finder.

## Install

```bash
npm install @halazv2/react-file-manager
```

Peer dependencies: `react` and `react-dom` ≥ 18.

### Tailwind (default styling)

The UI is built with Tailwind classes. Point Tailwind at the package, or import the prebuilt stylesheet.

**Tailwind v4**

```css
@import "tailwindcss";
@source "../node_modules/@halazv2/react-file-manager/dist";

@theme {
  --color-rfm-primary: #2563eb;
  --color-rfm-hover: color-mix(in srgb, #2563eb 12%, transparent);
}
```

**Prebuilt CSS** (no Tailwind setup required)

```ts
import "@halazv2/react-file-manager/styles.css";
```

Theme with CSS variables on `.rfm-root`, or override the Tailwind theme tokens:

```css
.rfm-root {
  --rfm-primary: #2563eb;
  --rfm-hover: color-mix(in srgb, var(--rfm-primary) 12%, transparent);
}
```

## Quick start

```tsx
import { FileManager, moveNodes, type FileManagerNode } from "@halazv2/react-file-manager";
import { useState } from "react";

const initial: FileManagerNode[] = [
  {
    id: "docs",
    name: "Documents",
    kind: "folder",
    children: [{ id: "notes", name: "notes.txt", kind: "file" }]
  }
];

export function App() {
  const [nodes, setNodes] = useState(initial);

  return (
    <div style={{ height: 560 }}>
      <FileManager
        nodes={nodes}
        onMove={(ids, folderId) =>
          setNodes((current) => moveNodes(current, ids, folderId))
        }
        onOpenFile={(id) => console.log("open", id)}
        onUpload={(files, folderId) => console.log(files, folderId)}
        onCreateFolder={(parentId) => console.log("new folder in", parentId)}
      />
    </div>
  );
}
```

The component fills its parent. Give the parent a height.

## What it includes

- Folder sidebar + list/cards browser
- Breadcrumbs
- Multi-select and keyboard navigation
- Drag-and-drop move with spring-loaded folders
- Controlled or uncontrolled search
- Generic nodes — you own upload, preview, and menus

## What it leaves out

No backend, document preview pipeline, or app-specific menus. Pass `renderActions` / `renderPreview` if you need those.

## Props

| Prop | Type | Notes |
| --- | --- | --- |
| `nodes` | `FileManagerNode[]` | Nested tree. Root is implied. |
| `folderId` / `defaultFolderId` | `string \| null` | Current folder. `null` is root. |
| `onMove` | `(ids, folderId) => void` | Fired on drop. Use `moveNodes` for local state. |
| `onOpenFile` | `(id) => void` | Double-click or Enter on a file. |
| `onUpload` | `(files, folderId) => void` | OS file drop or empty-state upload. |
| `onCreateFolder` | `(parentId) => void` | New folder action. |
| `onDelete` | `(ids) => void` | Delete / Backspace. |
| `canManage` | `boolean` | Disables drag, drop, and mutations. Default `true`. |
| `springLoadDelay` | `number` | Hover delay in ms. Default `500`. |
| `showDetails` | `boolean` | Inspector pane. Default `true`. |
| `renderIcon` | `(node) => ReactNode` | Custom icons. |
| `renderPreview` | `(node) => ReactNode` | Replace the details pane. |
| `renderActions` | `(node) => ReactNode` | Per-item actions. |

`FileManagerNode`:

```ts
type FileManagerNode = {
  id: string;
  name: string;
  kind: "folder" | "file";
  children?: FileManagerNode[];
  extension?: string;
  size?: number;
  meta?: Record<string, unknown>;
};
```

## Local demo

```bash
npm install
npm run dev
```

## License

MIT

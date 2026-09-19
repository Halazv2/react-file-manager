import type { FileManagerNode } from "@halazv2/react-file-manager";

export const initialNodes: FileManagerNode[] = [
  {
    id: "documents",
    name: "Documents",
    kind: "folder",
    children: [
      {
        id: "contracts",
        name: "Contracts",
        kind: "folder",
        children: [
          { id: "nda", name: "NDA.pdf", kind: "file", extension: "pdf" },
          {
            id: "msa",
            name: "Master Service Agreement.pdf",
            kind: "file",
            extension: "pdf",
          },
        ],
      },
      {
        id: "notes",
        name: "Notes",
        kind: "folder",
        children: [
          { id: "todo", name: "todo.md", kind: "file", extension: "md" },
          { id: "ideas", name: "ideas.txt", kind: "file", extension: "txt" },
        ],
      },
      { id: "invoice", name: "invoice-april.xlsx", kind: "file", extension: "xlsx" },
    ],
  },
  {
    id: "photos",
    name: "Photos",
    kind: "folder",
    children: [
      {
        id: "vacation",
        name: "Vacation",
        kind: "folder",
        children: [
          { id: "beach", name: "beach.jpg", kind: "file", extension: "jpg" },
          { id: "hike", name: "hike.png", kind: "file", extension: "png" },
        ],
      },
      { id: "headshot", name: "headshot.jpg", kind: "file", extension: "jpg" },
    ],
  },
  {
    id: "projects",
    name: "Projects",
    kind: "folder",
    children: [
      {
        id: "react-finder",
        name: "react-file-manager",
        kind: "folder",
        children: [
          { id: "readme", name: "README.md", kind: "file", extension: "md" },
          {
            id: "package-json",
            name: "package.json",
            kind: "file",
            extension: "json",
          },
          { id: "source", name: "FileTypeIcon.tsx", kind: "file", extension: "tsx" },
          { id: "release", name: "release-notes.zip", kind: "file", extension: "zip" },
          { id: "walkthrough", name: "walkthrough.mp4", kind: "file", extension: "mp4" },
          { id: "theme", name: "theme-song.mp3", kind: "file", extension: "mp3" },
        ],
      },
    ],
  },
  { id: "desktop-note", name: "Getting started.txt", kind: "file", extension: "txt" },
];

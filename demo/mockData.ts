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
          { id: "nda", name: "NDA.pdf", kind: "file", extension: "pdf", size: 248_832 },
          {
            id: "msa",
            name: "Master Service Agreement.pdf",
            kind: "file",
            extension: "pdf",
            size: 1_048_576,
          },
        ],
      },
      {
        id: "notes",
        name: "Notes",
        kind: "folder",
        children: [
          { id: "todo", name: "todo.md", kind: "file", extension: "md", size: 1024 },
          { id: "ideas", name: "ideas.txt", kind: "file", extension: "txt", size: 4096 },
        ],
      },
      { id: "invoice", name: "invoice-april.xlsx", kind: "file", extension: "xlsx", size: 32_768 },
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
          { id: "beach", name: "beach.jpg", kind: "file", extension: "jpg", size: 2_400_000 },
          { id: "hike", name: "hike.png", kind: "file", extension: "png", size: 890_000 },
        ],
      },
      { id: "headshot", name: "headshot.jpg", kind: "file", extension: "jpg", size: 640_000 },
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
          { id: "readme", name: "README.md", kind: "file", extension: "md", size: 12_288 },
          {
            id: "package-json",
            name: "package.json",
            kind: "file",
            extension: "json",
            size: 2048,
          },
          { id: "source", name: "FileTypeIcon.tsx", kind: "file", extension: "tsx", size: 18_432 },
          { id: "release", name: "release-notes.zip", kind: "file", extension: "zip", size: 4_194_304 },
          { id: "walkthrough", name: "walkthrough.mp4", kind: "file", extension: "mp4", size: 52_428_800 },
          { id: "theme", name: "theme-song.mp3", kind: "file", extension: "mp3", size: 5_242_880 },
        ],
      },
    ],
  },
  { id: "desktop-note", name: "Getting started.txt", kind: "file", extension: "txt", size: 512 },
];

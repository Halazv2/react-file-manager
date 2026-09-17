import type { ReactNode, SVGProps } from "react";

import { getExtension } from "./tree";
import type { FileManagerNode } from "./types";
import { FileIcon, FolderIcon } from "./icons";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const EXT_COLORS: Record<string, string> = {
  pdf: "#dc2626",
  doc: "#2563eb",
  docx: "#2563eb",
  xls: "#16a34a",
  xlsx: "#16a34a",
  csv: "#16a34a",
  ppt: "#ea580c",
  pptx: "#ea580c",
  png: "#7c3aed",
  jpg: "#7c3aed",
  jpeg: "#7c3aed",
  gif: "#7c3aed",
  webp: "#7c3aed",
  svg: "#7c3aed",
  txt: "#64748b",
  md: "#64748b",
  json: "#ca8a04",
  zip: "#a16207",
  rar: "#a16207"
};

export function FolderTypeIcon({ size = 16, className }: IconProps) {
  return <FolderIcon size={size} className={className} />;
}

export function FileTypeIcon({
  extension,
  size = 16,
  className
}: IconProps & { extension?: string }) {
  const ext = (extension || "").replace(/^\./, "").toLowerCase();
  const color = EXT_COLORS[ext] || "currentColor";
  return (
    <FileIcon size={size} className={className} style={{ color }} />
  );
}

export function defaultNodeIcon(
  node: FileManagerNode,
  size = 16
): ReactNode {
  if (node.kind === "folder") return <FolderTypeIcon size={size} />;
  return <FileTypeIcon extension={getExtension(node)} size={size} />;
}

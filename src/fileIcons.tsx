import type { ReactNode, SVGAttributes } from "react";

import { getExtension } from "./tree";
import type { FileManagerNode } from "./types";

interface FileTypeIconProps extends SVGAttributes<SVGSVGElement> {
  extension?: string;
  size?: number;
}

const FILE_FAMILIES: Record<string, { accent: string; label: string }> = {
  // Documents & Text
  pdf: { accent: "#EC1C24", label: "PDF" }, // Adobe Acrobat Red
  doc: { accent: "#185ABD", label: "DOC" }, // MS Word Blue
  docx: { accent: "#185ABD", label: "DOCX" }, // MS Word Blue
  docm: { accent: "#185ABD", label: "DOC" }, // MS Word Blue
  odt: { accent: "#185ABD", label: "ODT" }, // Word/Document Blue
  rtf: { accent: "#4B5563", label: "RTF" }, // Generic Text Dark Gray
  txt: { accent: "#6B7280", label: "TXT" }, // Neutral Gray
  md: { accent: "#087EA4", label: "MD" }, // Markdown Blue
  markdown: { accent: "#087EA4", label: "MD" }, // Markdown Blue
  pages: { accent: "#2396F3", label: "PAGE" }, // Apple Pages Light Blue

  // Spreadsheets
  xls: { accent: "#107C41", label: "XLS" }, // MS Excel Green
  xlsx: { accent: "#107C41", label: "XLSX" }, // MS Excel Green
  xlsm: { accent: "#107C41", label: "XLS" }, // MS Excel Green
  ods: { accent: "#107C41", label: "ODS" }, // Spreadsheet Green
  csv: { accent: "#059669", label: "CSV" }, // Data/Table Teal Green
  numbers: { accent: "#21A15C", label: "NUM" }, // Apple Numbers Green

  // Presentations
  ppt: { accent: "#C43E1C", label: "PPT" }, // MS PowerPoint Orange/Red
  pptx: { accent: "#C43E1C", label: "PPTX" }, // MS PowerPoint Orange/Red
  odp: { accent: "#C43E1C", label: "ODP" }, // Presentation Orange
  key: { accent: "#0A84FF", label: "KEY" }, // Apple Keynote Blue

  // Design & Raster Images
  psd: { accent: "#31A8FF", label: "PSD" }, // Adobe Photoshop Blue
  ai: { accent: "#FF9A00", label: "AI" }, // Adobe Illustrator Orange
  xd: { accent: "#FF61F6", label: "XD" }, // Adobe XD Pink
  fig: { accent: "#F24E1E", label: "FIG" }, // Figma Red-Orange
  sketch: { accent: "#FDB300", label: "SKET" }, // Sketch Gold
  jpg: { accent: "#9333EA", label: "JPG" }, // Media/Raster Image Purple
  jpeg: { accent: "#9333EA", label: "JPG" }, // Media/Raster Image Purple
  jfif: { accent: "#9333EA", label: "JPG" }, // Media/Raster Image Purple
  png: { accent: "#9333EA", label: "PNG" }, // Media/Raster Image Purple
  apng: { accent: "#9333EA", label: "PNG" }, // Media/Raster Image Purple
  gif: { accent: "#9333EA", label: "GIF" }, // Media/Raster Image Purple
  webp: { accent: "#9333EA", label: "WEBP" }, // Media/Raster Image Purple
  bmp: { accent: "#9333EA", label: "BMP" }, // Media/Raster Image Purple
  svg: { accent: "#FF7B00", label: "SVG" }, // Vector / W3C Orange
  svgz: { accent: "#FF7B00", label: "SVG" }, // Vector / W3C Orange
  tif: { accent: "#9333EA", label: "TIFF" }, // Media/Raster Image Purple
  tiff: { accent: "#9333EA", label: "TIFF" }, // Media/Raster Image Purple
  ico: { accent: "#9333EA", label: "ICO" }, // Media/Raster Image Purple
  avif: { accent: "#9333EA", label: "AVIF" }, // Media/Raster Image Purple
  heic: { accent: "#9333EA", label: "HEIC" }, // Media/Raster Image Purple
  heif: { accent: "#9333EA", label: "HEIF" }, // Media/Raster Image Purple
  jp2: { accent: "#9333EA", label: "JP2" }, // Media/Raster Image Purple

  // Programming & Web Development
  js: { accent: "#F7DF1E", label: "JS" }, // JavaScript Yellow
  jsx: { accent: "#61DAFB", label: "JSX" }, // React Cyan
  ts: { accent: "#3178C6", label: "TS" }, // TypeScript Blue
  tsx: { accent: "#61DAFB", label: "TSX" }, // React Cyan
  html: { accent: "#E34F26", label: "HTML" }, // HTML5 Orange
  css: { accent: "#1572B6", label: "CSS" }, // CSS3 Blue
  scss: { accent: "#CC6699", label: "SCSS" }, // Sass Pink
  json: { accent: "#292929", label: "JSON" }, // Dark Gray/Black
  xml: { accent: "#E05D44", label: "XML" }, // XML Orange-Red
  py: { accent: "#3776AB", label: "PY" }, // Python Blue
  php: { accent: "#777BB4", label: "PHP" }, // PHP Purple
  sql: { accent: "#00758F", label: "SQL" }, // MySQL/SQL Teal

  // Archives & Compressed
  zip: { accent: "#D97706", label: "ZIP" }, // Archive Amber
  rar: { accent: "#7B1FA2", label: "RAR" }, // WinRAR Purple
  "7z": { accent: "#4E73DF", label: "7Z" }, // 7-Zip Blue
  tar: { accent: "#D97706", label: "TAR" }, // Archive Amber
  gz: { accent: "#D97706", label: "GZ" }, // Archive Amber

  // Audio
  mp3: { accent: "#1DB954", label: "MP3" }, // Audio/Spotify Green
  wav: { accent: "#1DB954", label: "WAV" }, // Audio Green
  aac: { accent: "#1DB954", label: "AAC" }, // Audio Green
  flac: { accent: "#1DB954", label: "FLAC" }, // Audio Green
  ogg: { accent: "#1DB954", label: "OGG" }, // Audio Green
  m4a: { accent: "#1DB954", label: "M4A" }, // Audio Green
  opus: { accent: "#1DB954", label: "OPUS" }, // Audio Green

  // Video
  mp4: { accent: "#E11D48", label: "MP4" }, // Video Crimson
  mov: { accent: "#000000", label: "MOV" }, // QuickTime Black
  avi: { accent: "#E11D48", label: "AVI" }, // Video Crimson
  mkv: { accent: "#E11D48", label: "MKV" }, // Video Crimson
  webm: { accent: "#E11D48", label: "WEBM" }, // Video Crimson
  mpeg: { accent: "#E11D48", label: "MPEG" }, // Video Crimson
  mpg: { accent: "#E11D48", label: "MPG" }, // Video Crimson
  m4v: { accent: "#E11D48", label: "M4V" }, // Video Crimson
  flv: { accent: "#E11D48", label: "FLV" }, // Video Crimson
  wmv: { accent: "#E11D48", label: "WMV" }, // Video Crimson
  m2ts: { accent: "#E11D48", label: "M2TS" }, // Video Crimson

  // Executables, System & Mobile
  exe: { accent: "#0078D4", label: "EXE" }, // Windows Blue
  dmg: { accent: "#999999", label: "DMG" }, // Apple System Silver
  iso: { accent: "#4B5563", label: "ISO" }, // System Gray
  apk: { accent: "#3DDC84", label: "APK" }, // Android Green
  sh: { accent: "#4E5D6C", label: "SH" }, // Terminal Slate
};
export function FileTypeIcon({ extension, size = 40, ...props }: FileTypeIconProps) {
  const family = FILE_FAMILIES[extension?.toLowerCase() || ""] || {
    accent: "#155EEF",
    label: (extension || "FILE").slice(0, 4).toUpperCase(),
  };
  const fontSize = family.label.length > 3 ? 4.4 : 5.2;

  return (
    <svg width={size} height={size} fill='none' viewBox='0 0 40 40' aria-hidden='true' {...props}>
      <path
        stroke='#D5D7DA'
        strokeWidth={1.5}
        d='M7.75 4A3.25 3.25 0 0 1 11 .75h16c.121 0 .238.048.323.134l10.793 10.793a.46.46 0 0 1 .134.323v24A3.25 3.25 0 0 1 35 39.25H11A3.25 3.25 0 0 1 7.75 36z'
      />
      <path stroke='#D5D7DA' strokeWidth={1.5} d='M27 .5V8a4 4 0 0 0 4 4h7.5' />
      <rect width={33} height={16} x={1} y={18} fill={family.accent} rx={2} />
      <text x='17.5' y='28.2' fill='#fff' fontFamily='Arial, sans-serif' fontSize={fontSize} fontWeight='700' textAnchor='middle'>
        {family.label}
      </text>
    </svg>
  );
}

export function FolderTypeIcon({ size = 40, ...props }: { size?: number } & SVGAttributes<SVGSVGElement>) {
  return (
    <svg width={size} height={size} fill='none' viewBox='0 0 40 40' aria-hidden='true' {...props}>
      <path fill='#E8B931' d='M4 11.5C4 9.567 5.567 8 7.5 8H16l2.4 2.4c.375.375.883.6 1.414.6H32.5C34.433 11 36 12.567 36 14.5V15H4v-3.5Z' />
      <path fill='#F5C84C' d='M4 15h32v16.5c0 1.933-1.567 3.5-3.5 3.5h-25C5.567 35 4 33.433 4 31.5V15Z' />
    </svg>
  );
}

export function defaultNodeIcon(node: FileManagerNode, size = 16): ReactNode {
  if (node.kind === "folder") return <FolderTypeIcon size={size} />;
  return <FileTypeIcon extension={getExtension(node)} size={size} />;
}

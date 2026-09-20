import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FileTypeIcon } from "./fileIcons";

function renderFileIcon(extension?: string) {
  return renderToStaticMarkup(createElement(FileTypeIcon, { extension }));
}

describe("FileTypeIcon", () => {
  it.each([
    ["pdf", "PDF"],
    ["xlsx", "XLSX"],
    ["zip", "ZIP"],
    ["mp3", "MP3"],
    ["mp4", "MP4"],
    ["tsx", "TSX"],
  ])("renders %s with its readable extension label", (extension, label) => {
    expect(renderFileIcon(extension)).toContain(`>${label}</text>`);
  });

  it("normalizes a leading dot and uses a labeled document fallback", () => {
    expect(renderFileIcon(".png")).toContain(">PNG</text>");
    expect(renderFileIcon("unknownformat")).toContain(">UNKN</text>");
  });

  it("hides the extension label below 28px", () => {
    expect(renderToStaticMarkup(createElement(FileTypeIcon, { extension: "pdf", size: 16 }))).not.toContain("</text>");
    expect(renderToStaticMarkup(createElement(FileTypeIcon, { extension: "js", size: 36 }))).toContain(">JS</text>");
  });

  it("uses dark chip label text on light accents", () => {
    expect(renderFileIcon("js")).toContain('fill="#111827"');
    expect(renderFileIcon("json")).toContain('fill="#fff"');
  });
});

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const framesDir = resolve(root, "docs/.frames");
const outGif = resolve(root, "docs/spring-load.gif");
const demoUrl = process.env.DEMO_URL || "http://localhost:5176/";

mkdirSync(framesDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1280, height: 820 },
  deviceScaleFactor: 1
});

await page.goto(demoUrl, { waitUntil: "networkidle" });
await page.waitForSelector('[aria-label="File manager"]');
await page.reload({ waitUntil: "networkidle" });

const frame = page.locator("[data-demo-window]");
await frame.waitFor();

const listToggle = page.getByRole("button", { name: "List view" });
if (await listToggle.count()) {
  await listToggle.click();
}

const file = page.getByRole("option", { name: "Getting started.txt" });
const photos = page.getByRole("option", { name: "Photos" });
await file.waitFor();
await photos.waitFor();

const fileBox = await file.boundingBox();
const photosBox = await photos.boundingBox();
if (!fileBox || !photosBox) {
  throw new Error("Could not locate drag source/target");
}

const start = {
  x: fileBox.x + fileBox.width / 2,
  y: fileBox.y + Math.min(12, fileBox.height / 2)
};
const end = {
  x: photosBox.x + photosBox.width / 2,
  y: photosBox.y + Math.min(12, photosBox.height / 2)
};

let frameIndex = 0;
const shot = async () => {
  const path = resolve(
    framesDir,
    `frame-${String(frameIndex).padStart(3, "0")}.png`
  );
  await frame.screenshot({ path });
  frameIndex += 1;
};

await shot();
await page.mouse.move(start.x, start.y);
await page.waitForTimeout(200);
await page.mouse.down();
await shot();

const steps = 16;
for (let i = 1; i <= steps; i += 1) {
  const t = i / steps;
  await page.mouse.move(
    start.x + (end.x - start.x) * t,
    start.y + (end.y - start.y) * t
  );
  await shot();
}

// Hold on Photos long enough for spring-load (default 500ms).
for (let i = 0; i < 12; i += 1) {
  await page.waitForTimeout(120);
  await shot();
}

await page.mouse.up();
await page.waitForTimeout(500);
await shot();
await page.waitForTimeout(700);
await shot();

await browser.close();

const ffmpeg = spawnSync(
  "ffmpeg",
  [
    "-y",
    "-framerate",
    "8",
    "-i",
    resolve(framesDir, "frame-%03d.png"),
    "-vf",
    "scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer",
    outGif
  ],
  { encoding: "utf8" }
);

if (ffmpeg.status !== 0) {
  console.error(ffmpeg.stderr);
  process.exit(1);
}

console.log(`Wrote ${outGif}`);

#!/usr/bin/env node
/** Spatial family orbit must show product labels (not hover-only). */
import { chromium } from "playwright";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const port = 9876 + Math.floor(Math.random() * 1000);
const url = `http://127.0.0.1:${port}/cisco-portfolio-navigator.html`;
const WEBGL_ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"];

const server = spawn("python3", ["-m", "http.server", String(port)], {
  cwd: root,
  stdio: ["ignore", "pipe", "pipe"],
});
await new Promise((resolve, reject) => {
  server.on("error", reject);
  setTimeout(resolve, 400);
});

let exitCode = 0;
const browser = await chromium.launch({ args: WEBGL_ARGS });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForFunction(() => typeof window.applyViewLevel === "function", { timeout: 60000 });

  async function orbitLabels(familyId, minLabels) {
    await page.evaluate((id) => window.applyViewLevel("spatial", { focusFamily: id }), familyId);
    await page.waitForFunction(
      (min) => (window.__cpnSpatialVisibleLabels?.()?.visible ?? 0) >= min,
      minLabels,
      { timeout: 15000 }
    );
    return page.evaluate(() => ({
      focus: window.getSpatialFocus?.(),
      nodes: window.__cpnSpatialGraph?.()?.graphData?.()?.nodes?.length ?? 0,
      labels: window.__cpnSpatialVisibleLabels?.() ?? { total: 0, visible: 0 },
    }));
  }

  const aci = await orbitLabels("aci", 7);
  const room = await orbitLabels("room-systems", 10);
  console.log(JSON.stringify({ aci, room }, null, 2));

  const fails = [];
  if (aci.focus !== "aci") fails.push(`aci focus=${aci.focus}`);
  if (aci.nodes < 7) fails.push(`aci nodes=${aci.nodes}`);
  if (aci.labels.visible < 7) fails.push(`aci visibleLabels=${aci.labels.visible}, expected ≥7`);
  if (room.focus !== "room-systems") fails.push(`room focus=${room.focus}`);
  if (room.labels.visible < 10) fails.push(`room visibleLabels=${room.labels.visible}, expected ≥10`);

  if (fails.length) {
    console.error("FAIL:", fails.join("; "));
    exitCode = 1;
  } else {
    console.log("PASS: Spatial family orbit labels always visible");
  }
} finally {
  await browser.close();
  server.kill();
}
process.exit(exitCode);

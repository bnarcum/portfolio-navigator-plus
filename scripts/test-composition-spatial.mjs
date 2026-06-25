#!/usr/bin/env node
/** Composition → Spatial keeps family focus and renders 3D orbit. */
import { chromium } from "playwright";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const port = 9876 + Math.floor(Math.random() * 1000);
const url = `http://127.0.0.1:${port}/cisco-portfolio-navigator.html`;
const FAMILY = "room-systems";

const server = spawn("python3", ["-m", "http.server", String(port)], {
  cwd: root,
  stdio: ["ignore", "pipe", "pipe"],
});
await new Promise((resolve, reject) => {
  server.on("error", reject);
  setTimeout(resolve, 400);
});

const WEBGL_ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"];

let exitCode = 0;
const browser = await chromium.launch({ args: WEBGL_ARGS });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForFunction(() => typeof window.applyViewLevel === "function", { timeout: 60000 });
  await page.evaluate(() => {
    localStorage.removeItem("cpn-view-mode-v2");
    localStorage.removeItem("cpn-view-focus-v2");
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() => typeof window.applyViewLevel === "function", { timeout: 60000 });

  await page.evaluate((id) => window.applyViewLevel("composition", { focusFamily: id }), FAMILY);
  await page.waitForTimeout(400);
  await page.click('#vm-seg button[data-vm="spatial"]');
  await page.waitForTimeout(3500);

  const result = await page.evaluate(() => ({
    viewMode: window.getViewMode?.(),
    spatialFocus: window.getSpatialFocus?.(),
    spatialVisible: document.getElementById("spatial-wrap")?.style.display !== "none",
    svgHidden: document.getElementById("gs")?.style.display === "none",
    canvasCount: document.querySelectorAll("#spatial-graph canvas").length,
    hud: document.getElementById("spatial-hud")?.textContent?.slice(0, 80) || "",
    crumb: document.getElementById("vm-crumb")?.textContent?.slice(0, 80) || "",
    nodeCount: null,
  }));

  const graphNodes = await page.evaluate(() => {
    const g = window.__cpnSpatialGraph?.();
    if (!g) return 0;
    return g.graphData?.()?.nodes?.length ?? 0;
  });

  const visuals = await page.evaluate(() => {
    const g = window.__cpnSpatialGraph?.();
    const scene = g?.scene?.();
    let tileSprites = 0;
    let pedestals = 0;
    let labels = 0;
    scene?.traverse(o => {
      if (o.userData?.role === "tile") tileSprites++;
      if (o.userData?.role === "pedestal") pedestals++;
      if (o.userData?.role === "label" || (o.type === "Sprite" && typeof o.text === "string")) labels++;
    });
    return {
      hasThree: !!window.__cpnTHREE?.__bundled,
      tileSprites,
      pedestals,
      labelSprites: labels,
    };
  });

  console.log(JSON.stringify({ ...result, graphNodes, visuals, errors: errors.slice(0, 4) }, null, 2));

  const fails = [];
  if (result.viewMode !== "spatial") fails.push(`viewMode=${result.viewMode}`);
  if (result.spatialFocus !== FAMILY) fails.push(`spatialFocus=${result.spatialFocus}`);
  if (!result.spatialVisible) fails.push("spatial wrap hidden");
  if (!result.svgHidden) fails.push("2D svg still visible");
  if (result.canvasCount < 1) fails.push("no WebGL canvas");
  if (graphNodes < 9) fails.push(`graph has ${graphNodes} nodes, expected family + products`);
  if (!visuals.hasThree) fails.push("bundled Three.js not captured for spatial orbs");
  if (visuals.pedestals < 10) fails.push(`expected icon tile nodes, got ${visuals.pedestals} pedestals`);
  if (visuals.tileSprites < 8) fails.push(`expected icon tiles, got ${visuals.tileSprites} tile sprites`);
  if (!/Room Systems/i.test(result.hud)) fails.push("HUD missing family name");
  if (errors.length) fails.push(`page errors: ${errors[0]}`);

  if (fails.length) {
    console.error("FAIL:", fails.join("; "));
    exitCode = 1;
  } else {
    console.log("PASS: Composition → Spatial kept focus with 3D orbit");
  }
} finally {
  await browser.close();
  server.kill();
}
process.exit(exitCode);

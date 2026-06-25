#!/usr/bin/env node
/** Spatial orbit shows matrix product photos after filtered breadcrumb drill-in. */
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

async function spatialTileAudit(page) {
  return page.evaluate(() => {
    const stats = window.__cpnSpatialTileStats?.() || {};
    const g = window.__cpnSpatialGraph?.();
    const nodes = g?.graphData?.()?.nodes || [];
    return {
      ...stats,
      productNodes: nodes.filter(n => n.kind === "product").length,
      focus: window.getSpatialFocus?.(),
    };
  });
}

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

  // Filtered breadcrumb path: composition → Collaboration category → composition → spatial
  await page.evaluate((id) => window.applyViewLevel("composition", { focusFamily: id }), FAMILY);
  await page.waitForTimeout(400);
  await page.click('#vm-crumb .vm-cb-step[data-vm-cat="collaboration"]');
  await page.waitForTimeout(400);
  await page.evaluate((id) => window.applyViewLevel("composition", { focusFamily: id }), FAMILY);
  await page.waitForTimeout(400);
  await page.click('#vm-seg button[data-vm="spatial"]');
  await page.waitForTimeout(5000);

  const filtered = await spatialTileAudit(page);

  // Direct path for comparison
  await page.evaluate((id) => {
    localStorage.clear();
    window.applyViewLevel("spatial", { focusFamily: id });
  }, FAMILY);
  await page.waitForTimeout(5000);
  const direct = await spatialTileAudit(page);

  console.log(JSON.stringify({ filtered, direct, errors: errors.slice(0, 4) }, null, 2));

  const fails = [];
  for (const [label, audit] of [["filtered", filtered], ["direct", direct]]) {
    if (audit.focus !== FAMILY) fails.push(`${label}: focus=${audit.focus}`);
    if (audit.productNodes < 10) fails.push(`${label}: only ${audit.productNodes} product nodes`);
    if (audit.withTile < audit.groups) fails.push(`${label}: ${audit.withTile}/${audit.groups} groups have tiles`);
    if (audit.cacheMatrix < 8) fails.push(`${label}: expected matrix tile cache entries, got ${audit.cacheMatrix}`);
    if (audit.cacheReady < 10) fails.push(`${label}: only ${audit.cacheReady} tiles ready in cache`);
  }
  if (errors.length) fails.push(`page errors: ${errors[0]}`);

  if (fails.length) {
    console.error("FAIL:", fails.join("; "));
    exitCode = 1;
  } else {
    console.log("PASS: Spatial filtered breadcrumb path shows matrix product photos");
  }
} finally {
  await browser.close();
  server.kill();
}
process.exit(exitCode);

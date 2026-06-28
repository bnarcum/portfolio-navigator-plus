#!/usr/bin/env node
/** Walk — semantic placement + adaptive venues (room + network). */
import { chromium } from "playwright";

const URL = "http://127.0.0.1:8765/cisco-portfolio-navigator.html";
const errors = [];

function near(a, b, eps = 1.2) {
  return Math.abs(a - b) <= eps;
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on("pageerror", e => errors.push(`pageerror: ${e.message}`));

  await page.goto(URL, { waitUntil: "load", timeout: 60000 });
  await page.click("#design-studio-btn");
  await page.waitForSelector("#design-studio.open", { timeout: 8000 });

  // Auditorium: stage + seats, no ceiling lattice.
  await page.evaluate(() => {
    const s = window.DesignStudio.instance;
    s.design = { account: "test", rooms: [], nodes: [], links: [], bomOverrides: [], snapshots: [] };
    s.addRoomTemplate("auditorium");
    s.setTab("room");
  });
  await page.click("#ds-walk-corridor");
  await page.waitForFunction(() => window.__DS_WALK?.isOpen?.(), { timeout: 60000 });
  await page.waitForTimeout(900);
  const aud = await page.evaluate(() => window.__DS_WALK?.debugStats?.() || {});
  const audTags = aud.environmentTags || {};
  if (!audTags["room-stage"]) errors.push("auditorium walk missing room-stage environment");
  if (!audTags["room-seat-row"] || audTags["room-seat-row"] < 3) errors.push(`auditorium expected >=3 seat rows, got ${audTags["room-seat-row"] || 0}`);
  if (audTags["room-ceiling-grid"]) errors.push("auditorium should not render ceiling lattice");
  await page.evaluate(() => window.__DS_WALK?.close?.(true));

  // Conference: display + camera on front wall; touch on table height.
  await page.evaluate(() => {
    const s = window.DesignStudio.instance;
    s.design = { account: "test", rooms: [], nodes: [], links: [], bomOverrides: [], snapshots: [] };
    s.addRoomTemplate("conference");
    s.setTab("room");
  });
  await page.waitForTimeout(300);
  await page.click("#ds-walk-corridor");
  await page.waitForFunction(() => window.__DS_WALK?.isOpen?.(), { timeout: 60000 });
  await page.waitForTimeout(1200);
  const conf = await page.evaluate(() => window.__DS_WALK?.debugStats?.() || {});
  const chambers = conf.chambers || [];
  const display = chambers.find(c => c.kind === "display" || /display/i.test(c.label));
  const camera = chambers.find(c => c.kind === "camera" || /quad|cam/i.test(c.label));
  const touch = chambers.find(c => /touch/i.test(c.label));
  if (!display) errors.push("conference walk missing display chamber");
  if (!camera) errors.push("conference walk missing camera chamber");
  if (!touch) errors.push("conference walk missing touch chamber");
  if (display && camera && !near(display.z, camera.z, 0.6)) errors.push(`display/camera should share front wall (z ${display.z} vs ${camera.z})`);
  if (touch && touch.zone !== "table") errors.push(`touch should be table zone, got ${touch.zone}`);
  if (touch && (touch.y > 1.2 || touch.y < 0.6)) errors.push(`touch should be tabletop height (~0.82), got y=${touch.y}`);
  if (conf.environmentTags?.["room-ceiling-grid"]) errors.push("conference should not render ceiling lattice");
  await page.evaluate(() => window.__DS_WALK?.close?.(true));

  // Data center topology: layer-aligned racks + tray.
  await page.evaluate(() => {
    const s = window.DesignStudio.instance;
    s.design = { account: "test", rooms: [], nodes: [], links: [], bomOverrides: [], snapshots: [] };
    window.__DS_TEMPLATES.applyNetworkTemplate(s.design, "dcAciPod", 80, 80, window.__DS_STENCILS);
    s.setTab("network");
  });
  await page.waitForTimeout(300);
  await page.click("#ds-walk-corridor");
  await page.waitForFunction(() => window.__DS_WALK?.isOpen?.(), { timeout: 60000 });
  await page.waitForTimeout(900);
  const networkStats = await page.evaluate(() => window.__DS_WALK?.debugStats?.() || {});
  const netTags = networkStats.environmentTags || {};
  if (!netTags["network-rack-row"] || netTags["network-rack-row"] < 2) errors.push(`network walk expected >=2 rack rows, got ${netTags["network-rack-row"] || 0}`);
  if (!netTags["network-cable-tray"]) errors.push("network walk missing overhead cable tray");
  if (!netTags["network-closet-wall"]) errors.push("network walk missing closet/datacenter wall detail");
  const ap = (networkStats.chambers || []).find(c => /ap/i.test(c.label) || c.kind === "ap");
  const sw = (networkStats.chambers || []).find(c => c.zone === "access" && c.kind === "switch");
  if (ap && sw && ap.y <= sw.y) errors.push(`AP should be elevated above access switches (ap y=${ap.y}, sw y=${sw.y})`);

  if (errors.length) {
    console.error("FAIL test-walk-environments\n" + errors.map(e => `  - ${e}`).join("\n"));
    process.exit(1);
  }
  console.log("OK test-walk-environments");
} finally {
  await browser.close();
}

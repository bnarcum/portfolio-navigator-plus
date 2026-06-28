#!/usr/bin/env node
/** Walk — adaptive venues match room/network context (not generic pads only). */
import { chromium } from "playwright";

const URL = "http://127.0.0.1:8765/cisco-portfolio-navigator.html";
const errors = [];

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on("pageerror", e => errors.push(`pageerror: ${e.message}`));

  await page.goto(URL, { waitUntil: "load", timeout: 60000 });
  await page.click("#design-studio-btn");
  await page.waitForSelector("#design-studio.open", { timeout: 8000 });

  // Auditorium should feel like a real presentation room: rows + stage/front wall.
  await page.evaluate(() => {
    const s = window.DesignStudio.instance;
    s.design = { account: "test", rooms: [], nodes: [], links: [], bomOverrides: [], snapshots: [] };
    s.addRoomTemplate("auditorium");
    s.setTab("room");
  });
  await page.click("#ds-walk-corridor");
  await page.waitForFunction(() => window.__DS_WALK?.isOpen?.(), { timeout: 60000 });
  await page.waitForTimeout(800);
  const roomStats = await page.evaluate(() => window.__DS_WALK?.debugStats?.() || {});
  const roomTags = roomStats.environmentTags || {};
  if (!roomTags["room-stage"]) errors.push("auditorium walk missing room-stage environment");
  if (!roomTags["room-seat-row"] || roomTags["room-seat-row"] < 3) errors.push(`auditorium walk expected >=3 seat rows, got ${roomTags["room-seat-row"] || 0}`);
  if (!roomTags["room-ceiling-grid"]) errors.push("auditorium walk missing ceiling grid");
  await page.evaluate(() => window.__DS_WALK?.close?.(true));

  // Data center topology should look like a data center / closet, not a blank floor.
  await page.evaluate(() => {
    const s = window.DesignStudio.instance;
    s.design = { account: "test", rooms: [], nodes: [], links: [], bomOverrides: [], snapshots: [] };
    window.__DS_TEMPLATES.applyNetworkTemplate(s.design, "dcAciPod", 80, 80, window.__DS_STENCILS);
    s.setTab("network");
  });
  await page.waitForTimeout(300);
  await page.click("#ds-walk-corridor");
  await page.waitForFunction(() => window.__DS_WALK?.isOpen?.(), { timeout: 60000 });
  await page.waitForTimeout(800);
  const networkStats = await page.evaluate(() => window.__DS_WALK?.debugStats?.() || {});
  const netTags = networkStats.environmentTags || {};
  if (!netTags["network-rack-row"] || netTags["network-rack-row"] < 2) errors.push(`network walk expected >=2 rack rows, got ${netTags["network-rack-row"] || 0}`);
  if (!netTags["network-cable-tray"]) errors.push("network walk missing overhead cable tray");
  if (!netTags["network-closet-wall"]) errors.push("network walk missing closet/datacenter wall detail");

  if (errors.length) {
    console.error("FAIL test-walk-environments\n" + errors.map(e => `  - ${e}`).join("\n"));
    process.exit(1);
  }
  console.log("OK test-walk-environments");
} finally {
  await browser.close();
}

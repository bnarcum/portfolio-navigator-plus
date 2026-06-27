#!/usr/bin/env node
/** Design Studio — room diagram paints without click; Walk/Retro overlay opens. */
import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const html = path.join(root, "cisco-portfolio-navigator.html");
const errors = [];

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on("pageerror", e => errors.push(`pageerror: ${e.message}`));
  page.on("console", msg => {
    const t = msg.text();
    if (msg.type() === "error" && !/Failed to load resource|404/.test(t)) errors.push(`console: ${t}`);
  });

  await page.goto("http://127.0.0.1:8765/cisco-portfolio-navigator.html", { waitUntil: "load", timeout: 60000 });
  await page.waitForFunction(() => window.__cpnV2?.APP_VERSION, { timeout: 60000 });
  await page.waitForFunction(() => window.__cpnWalkTHREE || window.__DS_WALK, { timeout: 15000 });

  // Open Design Studio
  await page.click("#design-studio-btn");
  await page.waitForSelector("#design-studio.open", { timeout: 8000 });

  // Generate 18-room portfolio via workplaces pillar + generate
  await page.evaluate(() => {
    document.querySelector("#ds-one-cisco-deck [data-pillar='workplaces']")?.click();
  });
  await page.waitForTimeout(300);
  await page.click("#ds-generate");
  await page.waitForFunction(
    () => window.DesignStudio?.instance?.design?.rooms?.length >= 10,
    { timeout: 30000 }
  );

  // Room tab
  await page.click('#ds-tabs [data-tab="room"]');
  await page.waitForTimeout(400);

  const beforeClick = await page.evaluate(() => {
    const studio = window.DesignStudio?.instance;
    const nodesG = document.getElementById("ds-nodes");
    const nodes = document.querySelectorAll("#ds-nodes .ds-node");
    const links = document.querySelectorAll("#ds-links .ds-link");
    const svg = document.getElementById("ds-svg");
    const rect = svg?.getBoundingClientRect();
    const vp = document.getElementById("ds-viewport");
    const t = vp?.getAttribute("transform") || "";
    const first = nodes[0]?.getBoundingClientRect();
    return {
      tab: studio?.tab,
      nodeCount: nodes.length,
      nodesGChildCount: nodesG?.childElementCount ?? -1,
      nodesGHtmlLen: nodesG?.innerHTML?.length ?? 0,
      linkCount: links.length,
      visibleNodes: studio?.visibleNodes?.()?.length ?? 0,
      svgW: rect?.width ?? 0,
      svgH: rect?.height ?? 0,
      transform: t,
      firstNodeOnScreen: first ? first.width > 0 && first.height > 0 && first.right > 0 && first.bottom > 0 : false,
      pan: studio?.pan,
      stencils: !!window.__DS_STENCILS,
      renderErr: window.__dsLastRenderErr || null
    };
  });

  if (beforeClick.visibleNodes < 3) errors.push(`expected room nodes, visibleNodes=${beforeClick.visibleNodes}`);
  if (beforeClick.nodeCount < 3) errors.push(`expected DOM nodes before click, got ${beforeClick.nodeCount}`);
  if (beforeClick.svgW < 100 || beforeClick.svgH < 100) errors.push(`svg size too small: ${beforeClick.svgW}x${beforeClick.svgH}`);
  if (!beforeClick.firstNodeOnScreen) {
    errors.push(`diagram not on screen before click (transform=${beforeClick.transform}, pan=${JSON.stringify(beforeClick.pan)})`);
  }

  // Walk toolbar
  await page.click("#ds-walk-retro");
  await page.waitForTimeout(800);
  const retro = await page.evaluate(() => {
    const stats = window.__DS_WALK?.debugStats?.() || {};
    return {
      overlayHidden: document.getElementById("ds-walk-overlay")?.hidden,
      walkOpen: window.__DS_WALK?.isOpen?.(),
      status: document.getElementById("ds-walk-status")?.textContent || "",
      canvasW: document.getElementById("ds-walk-canvas")?.width || 0,
      pods: stats.pods || 0,
      minimap: !!document.getElementById("ds-walk-minimap"),
      navChips: document.querySelectorAll(".ds-walk-dev").length
    };
  });
  if (retro.overlayHidden !== false) errors.push("retro overlay still hidden after click");
  if (!retro.walkOpen) errors.push(`retro walk not open; status="${retro.status}"`);
  if (retro.canvasW < 100) errors.push(`retro canvas width ${retro.canvasW}`);
  if (retro.pods < 3) errors.push(`expected device pods in retro, got ${retro.pods}`);
  if (!retro.minimap) errors.push("retro minimap missing");
  if (retro.navChips < 3) errors.push(`expected device nav chips, got ${retro.navChips}`);
  const mission = await page.evaluate(() => ({
    hasMissions: !!window.__DS_MISSIONS,
    briefing: !!document.getElementById("ds-walk-briefing"),
    missionPanel: !!document.getElementById("ds-walk-mission"),
    xpBar: !!document.getElementById("ds-walk-xp-bar"),
    missionActive: window.__DS_WALK?.debugStats?.()?.mission,
    objectiveCount: document.querySelectorAll(".ds-mission-list .ds-mobj, #ds-walk-briefing li").length
  }));
  if (!mission.hasMissions) errors.push("missions module not loaded");
  if (!mission.briefing) errors.push("mission briefing overlay missing");
  if (!mission.missionPanel) errors.push("mission HUD panel missing");
  if (!mission.xpBar) errors.push("mission XP bar missing");
  if (!mission.missionActive) errors.push("mission not started in walk state");
  if (mission.objectiveCount < 2) errors.push(`expected mission objectives, got ${mission.objectiveCount}`);

  await page.evaluate(() => {
    document.getElementById("ds-mission-start")?.click();
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => window.__DS_WALK?.close?.());
  await page.waitForTimeout(200);

  await page.click("#ds-walk-corridor");
  await page.waitForTimeout(1200);
  const corridor = await page.evaluate(() => {
    const stats = window.__DS_WALK?.debugStats?.() || {};
    return {
      walkOpen: window.__DS_WALK?.isOpen?.(),
      status: document.getElementById("ds-walk-status")?.textContent || "",
      hasError: document.getElementById("ds-walk-status")?.classList.contains("ds-walk-error"),
      pods: stats.pods || 0,
      hasRenderer: !!stats.hasRenderer,
      navChips: document.querySelectorAll(".ds-walk-dev").length
    };
  });
  if (!corridor.walkOpen) errors.push(`corridor walk not open; status="${corridor.status}"`);
  if (corridor.hasError) errors.push(`corridor error status: ${corridor.status}`);
  if (corridor.pods < 3) errors.push(`expected device pods in corridor, got ${corridor.pods}`);
  if (!corridor.hasRenderer) errors.push("corridor missing WebGL renderer");
  if (corridor.navChips < 3) errors.push(`corridor nav chips: ${corridor.navChips}`);

  if (errors.length) {
    console.error("FAIL\n" + errors.map(e => `  - ${e}`).join("\n"));
    console.error("beforeClick", JSON.stringify(beforeClick, null, 2));
    process.exit(1);
  }
  console.log("Design Studio room test OK");
  console.log("  nodes on screen without click:", beforeClick.nodeCount);
  console.log("  retro + corridor walk opened");
} finally {
  await browser.close();
}

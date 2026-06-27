#!/usr/bin/env node
/** Real mouse click on Start mission — catches pointer-event / layering bugs. */
import { chromium } from "playwright";

const URL = "http://127.0.0.1:8765/cisco-portfolio-navigator.html";
const errors = [];

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(URL, { waitUntil: "load", timeout: 60000 });
  await page.waitForFunction(() => window.__cpnV2?.APP_VERSION, { timeout: 60000 });

  await page.click("#design-studio-btn");
  await page.waitForSelector("#design-studio.open", { timeout: 8000 });
  await page.evaluate(() => {
    document.querySelector("#ds-one-cisco-deck [data-pillar='workplaces']")?.click();
  });
  await page.waitForTimeout(300);
  await page.click("#ds-generate");
  await page.waitForFunction(
    () => window.DesignStudio?.instance?.design?.rooms?.length >= 10,
    { timeout: 30000 }
  );
  await page.click('#ds-tabs [data-tab="room"]');
  await page.waitForTimeout(400);
  await page.click("#ds-walk-corridor");
  await page.waitForSelector("#ds-mission-start", { timeout: 15000 });
  await page.waitForSelector("#ds-walk-briefing:not([hidden])", { timeout: 5000 });

  const pre = await page.evaluate(() => {
    const btn = document.getElementById("ds-mission-start");
    const r = btn?.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const top = document.elementFromPoint(cx, cy);
    return {
      briefingOpen: !document.getElementById("ds-walk-briefing")?.hidden,
      btnVisible: btn && r.width > 0 && r.height > 0,
      topTag: top?.tagName,
      topId: top?.id,
      topClass: top?.className,
      isButton: top === btn || top?.closest?.("#ds-mission-start"),
      briefingClass: document.getElementById("ds-walk-overlay")?.className || ""
    };
  });

  if (!pre.briefingOpen) errors.push("briefing not open before click");
  if (!pre.btnVisible) errors.push("start button not visible");
  if (!pre.isButton) {
    errors.push(`elementFromPoint not on button: <${pre.topTag} id=${pre.topId} class=${pre.topClass}>`);
  }

  // Real Playwright click (not evaluate .click())
  await page.locator("#ds-mission-start").click({ timeout: 5000 });

  await page.waitForTimeout(300);
  const post = await page.evaluate(() => ({
    briefingHidden: document.getElementById("ds-walk-briefing")?.hidden,
    briefingSeen: window.__DS_WALK?.debugStats?.()?.mission,
    status: document.getElementById("ds-walk-status")?.textContent || "",
    overlayClass: document.getElementById("ds-walk-overlay")?.className || ""
  }));

  if (!post.briefingHidden) errors.push("briefing still visible after click");
  if (post.overlayClass.includes("ds-briefing-open")) errors.push("ds-briefing-open class still set");
  if (!/Mission active|waypoint/i.test(post.status)) {
    errors.push(`unexpected status after start: "${post.status}"`);
  }

  if (errors.length) {
    console.error("FAIL\n" + errors.map(e => `  - ${e}`).join("\n"));
    console.error("pre", pre);
    console.error("post", post);
    process.exit(1);
  }
  console.log("Mission start click test OK");
  console.log("  elementFromPoint hit button:", pre.isButton);
  console.log("  briefing dismissed, status:", post.status);
} finally {
  await browser.close();
}

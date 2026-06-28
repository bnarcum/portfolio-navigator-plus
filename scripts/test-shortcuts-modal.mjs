import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = resolve(__dirname, "../cisco-portfolio-navigator.html");
const errors = [];

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`file://${html}`, { waitUntil: "load", timeout: 60000 });
await page.waitForFunction(() => window.__cpnV2?.APP_VERSION, { timeout: 60000 });

// Dynamic, accurate chrome counts
const famTitle = await page.getAttribute('#vm-seg [data-vm="families"]', "title");
const nodeCount = await page.evaluate(() => (typeof NODES !== "undefined" ? NODES.length : 0));
if (!famTitle?.includes(String(nodeCount))) errors.push(`families title "${famTitle}" missing live count ${nodeCount}`);
const ovTitle = await page.getAttribute('#vm-seg [data-vm="overview"]', "title");
if (!/pillars/.test(ovTitle || "")) errors.push(`overview title "${ovTitle}" not One Cisco aware`);

// Shortcuts modal opens, is accessible, lists keys, closes on Esc
await page.click("#ft-shortcuts");
await page.waitForSelector("#shortcuts-modal.show", { timeout: 5000 });
const dialogRole = await page.getAttribute("#shortcuts-modal .sc-card", "role");
if (dialogRole !== "dialog") errors.push(`expected role=dialog, got ${dialogRole}`);
const kbdCount = await page.evaluate(() => document.querySelectorAll("#shortcuts-modal kbd").length);
if (kbdCount < 8) errors.push(`expected >=8 kbd keys, got ${kbdCount}`);
const closeLabel = await page.getAttribute("#sc-close", "aria-label");
if (!closeLabel) errors.push("close button missing aria-label");

await page.keyboard.press("Escape");
await page.waitForFunction(() => !document.querySelector("#shortcuts-modal.show"), { timeout: 5000 });

await browser.close();

if (errors.length) { console.error("FAIL test-shortcuts-modal\n" + errors.join("\n")); process.exit(1); }
console.log("OK test-shortcuts-modal");

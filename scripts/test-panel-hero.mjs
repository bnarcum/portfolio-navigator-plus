#!/usr/bin/env node
/** Side drawer hero: light fallback bg + visible category-colored icons. */
import { chromium } from "playwright";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const htmlPath = path.join(root, "cisco-portfolio-navigator.html");
const html = readFileSync(htmlPath, "utf8");

function extractIds(constName) {
  const m = html.match(new RegExp(`const ${constName} = \\[([\\s\\S]*?)\\n\\];`));
  if (!m) throw new Error(`Could not parse ${constName}`);
  return [...m[1].matchAll(/\{id:"([^"]+)"/g)].map((x) => x[1]);
}

const PRODUCT_IDS = extractIds("PRODUCTS");
const NODE_IDS = extractIds("NODES");

const BG_LUMINANCE_MIN = 0.82;
const CONTRAST_MIN_ICON_ONLY = 1.5;

function matrixImageIds() {
  const inline = html.match(/let MATRIX_BRIDGE = \{[\s\S]*?products:\s*\{([\s\S]*?)\}\s*\}/);
  const ids = new Set();
  if (inline) {
    for (const m of inline[1].matchAll(/"([^"]+)":\s*\{/g)) ids.add(m[1]);
  }
  try {
    const bridge = JSON.parse(readFileSync(path.join(root, "matrix-bridge.json"), "utf8"));
    for (const id of Object.keys(bridge.products || {})) ids.add(id);
  } catch { /* optional */ }
  return ids;
}

const MATRIX_IMAGE_IDS = matrixImageIds();

async function inspectHero(page, id, kind) {
  if (kind === "product") {
    await page.evaluate((pid) => window.showProductDetail(pid), id);
  } else {
    await page.evaluate((nid) => {
      const pb = document.getElementById("pbody");
      if (pb) {
        pb.dataset.lastId = nid;
        pb.dataset.lastKind = "node";
      }
      window.insertProductHero(nid, "node");
      document.getElementById("panel")?.classList.add("open");
    }, id);
  }
  await page.waitForSelector(".p-hero", { timeout: 5000 });

  return page.evaluate(
    ({ pid, pkind, bgMin, contrastMin }) => {
      function parseRgb(str) {
        const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!m) return null;
        return { r: +m[1], g: +m[2], b: +m[3] };
      }
      function luminance({ r, g, b }) {
        const lin = [r, g, b].map((c) => {
          const v = c / 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
      }
      function contrast(l1, l2) {
        const hi = Math.max(l1, l2);
        const lo = Math.min(l1, l2);
        return (hi + 0.05) / (lo + 0.05);
      }
      function fallbackBgLuminance(el) {
        const cs = getComputedStyle(el);
        const bgImg = cs.backgroundImage || "";
        const rgbMatch = bgImg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (rgbMatch) {
          return luminance({ r: +rgbMatch[1], g: +rgbMatch[2], b: +rgbMatch[3] });
        }
        const bg = parseRgb(cs.backgroundColor);
        return bg ? luminance(bg) : 0;
      }
      function useFillLuminance(useEl) {
        const cs = getComputedStyle(useEl);
        const attrFill = useEl.getAttribute("fill");
        const fill = attrFill || cs.fill || cs.color;
        if (!fill || fill === "none") return null;
        const rgb = parseRgb(fill);
        if (rgb) return luminance(rgb);
        if (fill.startsWith("#")) {
          const hex = fill.slice(1);
          const full = hex.length === 3
            ? hex.split("").map((c) => c + c).join("")
            : hex;
          return luminance({
            r: parseInt(full.slice(0, 2), 16),
            g: parseInt(full.slice(2, 4), 16),
            b: parseInt(full.slice(4, 6), 16),
          });
        }
        return null;
      }

      const hero = document.querySelector(".p-hero");
      const fallback = hero?.querySelector(".p-hero-fallback");
      const badge = fallback?.querySelector(".p-hero-icon-badge");
      const use = fallback?.querySelector("use");
      const img = hero?.querySelector("img.p-hero-matrix-img");
      if (!hero) {
        return { id: pid, kind: pkind, ok: false, reason: "missing hero" };
      }

      const hasMatrixImage = !!(img && (img.getAttribute("src") || "").includes("img-"));
      if (hasMatrixImage) {
        return {
          id: pid,
          kind: pkind,
          ok: true,
          reason: "",
          bgLum: 1,
          fillLum: null,
          fillAttr: "",
          iconOnly: false,
          hasMatrixImage: true,
        };
      }

      if (!fallback || !use) {
        return { id: pid, kind: pkind, ok: false, reason: "missing hero/fallback/use" };
      }

      const bgLum = fallbackBgLuminance(fallback);
      let fillLum = useFillLuminance(use);
      const fillAttr = use.getAttribute("fill") || "";
      const iconOnly = hero.classList.contains("p-hero--icon-only");
      const checkIcon = iconOnly;

      let ok = bgLum >= bgMin;
      let reason = "";

      if (!ok) reason = `fallback bg too dark (lum=${bgLum.toFixed(3)})`;

      if (checkIcon) {
        if (badge) {
          const badgeLum = fallbackBgLuminance(badge);
          const iconLum = 1;
          fillLum = iconLum;
          if (badgeLum == null || badgeLum < 0.08) {
            ok = false;
            reason = reason || "badge background too dark/missing";
          } else if (contrast(iconLum, badgeLum) < contrastMin) {
            ok = false;
            reason = reason || `low badge contrast (${contrast(iconLum, badgeLum).toFixed(2)})`;
          }
        } else if (fillLum == null) {
          ok = false;
          reason = reason || "no measurable icon fill";
        } else if (fillLum < 0.05 && bgLum < 0.2) {
          ok = false;
          reason = reason || "black icon on dark background";
        } else if (fillLum < 0.05) {
          ok = false;
          reason = reason || "icon fill is black";
        } else if (contrast(fillLum, bgLum) < contrastMin) {
          ok = false;
          reason = reason || `low contrast (${contrast(fillLum, bgLum).toFixed(2)})`;
        }
      }

      return {
        id: pid,
        kind: pkind,
        ok,
        reason,
        bgLum: +bgLum.toFixed(3),
        fillLum: fillLum == null ? null : +fillLum.toFixed(3),
        fillAttr,
        iconOnly,
        hasMatrixImage,
      };
    },
    { pid: id, pkind: kind, bgMin: BG_LUMINANCE_MIN, contrastMin: CONTRAST_MIN_ICON_ONLY }
  );
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`file://${htmlPath}`, { waitUntil: "load", timeout: 120000 });
  await page.waitForFunction(() => window.__cpnV2?.APP_VERSION, { timeout: 120000 });

  const failures = [];
  const productResults = [];

  for (const id of PRODUCT_IDS) {
    const r = await inspectHero(page, id, "product");
    productResults.push(r);
    if (!r.ok) failures.push(r);
  }

  const nodeFailures = [];
  for (const id of NODE_IDS) {
    const r = await inspectHero(page, id, "node");
    if (!r.ok) nodeFailures.push(r);
  }

  const withMatrixImage = productResults.filter((r) => r.hasMatrixImage).length;
  const withoutMatrixImage = productResults.filter((r) => !r.hasMatrixImage).length;
  const missingMatrixIds = PRODUCT_IDS.filter((id) => !MATRIX_IMAGE_IDS.has(id));

  const summary = {
    version: await page.evaluate(() => window.__cpnV2?.APP_VERSION),
    products: {
      total: PRODUCT_IDS.length,
      withMatrixImage,
      withoutMatrixImage,
      matrixBridgeEntries: MATRIX_IMAGE_IDS.size,
      iconOnlyHeroes: productResults.filter((r) => r.iconOnly).length,
      failed: failures.length,
    },
    nodes: { total: NODE_IDS.length, failed: nodeFailures.length },
    failures: failures.slice(0, 20),
    nodeFailureSample: nodeFailures.slice(0, 10),
    withoutMatrixSample: missingMatrixIds.slice(0, 15),
  };

  console.log(JSON.stringify(summary, null, 2));

  if (failures.length || nodeFailures.length) {
    console.error(
      `FAIL: ${failures.length} product heroes, ${nodeFailures.length} node heroes`
    );
    process.exit(1);
  }
  console.log("PASS: panel hero fallbacks light + icons visible");
} finally {
  await browser.close();
}

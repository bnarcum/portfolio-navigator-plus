#!/usr/bin/env node
/**
 * Design Studio static validator — run before commit.
 * Usage: node scripts/validate-design-studio.js
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
globalThis.window = globalThis;

for (const f of ["design-studio-stencils.js", "design-studio-templates.js", "design-studio-rules.js"]) {
  // eslint-disable-next-line no-eval
  eval(fs.readFileSync(path.join(root, f), "utf8"));
}

const STN = globalThis.__DS_STENCILS;
const TPL = globalThis.__DS_TEMPLATES;
const RULES = globalThis.__DS_RULES;

const issues = [];

function checkPorts(stencilId, mode, fromPort, toPort, label, ctx) {
  if (fromPort && !STN.portExists(stencilId, mode, fromPort))
    issues.push(`${ctx} ${label}: bad fromPort ${fromPort} on ${stencilId}`);
}

for (const [key, tpl] of Object.entries(TPL.NETWORK_TEMPLATES)) {
  const n = tpl.nodes.length;
  tpl.links.forEach((l, i) => {
    if (l.fi >= n || l.ti >= n || l.fi < 0 || l.ti < 0)
      issues.push(`NETWORK ${key} link ${i}: index out of range fi=${l.fi} ti=${l.ti} nodes=${n}`);
    const from = tpl.nodes[l.fi], to = tpl.nodes[l.ti];
    if (!from || !to) return;
    if (!STN.getDef(from.stencilId, "network"))
      issues.push(`NETWORK ${key}: unknown stencil ${from.stencilId}`);
    if (!STN.getDef(to.stencilId, "network"))
      issues.push(`NETWORK ${key}: unknown stencil ${to.stencilId}`);
    checkPorts(from.stencilId, "network", l.fromPort, null, l.label || `link-${i}`, key);
    if (l.toPort && !STN.portExists(to.stencilId, "network", l.toPort))
      issues.push(`${key} ${l.label}: bad toPort ${l.toPort} on ${to.stencilId}`);
  });
}

for (const [key, tpl] of Object.entries(TPL.ROOM_TEMPLATES)) {
  const n = tpl.items.length;
  tpl.links.forEach((l, i) => {
    if (l.fi >= n || l.ti >= n)
      issues.push(`ROOM ${key} link ${i}: index out of range`);
    const from = tpl.items[l.fi], to = tpl.items[l.ti];
    if (!from || !to) return;
    if (!STN.getDef(from.stencilId, "room"))
      issues.push(`ROOM ${key}: unknown stencil ${from.stencilId}`);
    if (!STN.getDef(to.stencilId, "room"))
      issues.push(`ROOM ${key}: unknown stencil ${to.stencilId}`);
    checkPorts(from.stencilId, "room", l.fromPort, null, l.label || `link-${i}`, key);
    if (l.toPort && !STN.portExists(to.stencilId, "room", l.toPort))
      issues.push(`${key} ${l.label}: bad toPort ${l.toPort} on ${to.stencilId}`);
  });
}

// Apply every network template and verify runtime validation passes
for (const key of Object.keys(TPL.NETWORK_TEMPLATES)) {
  const design = { nodes: [], links: [], rooms: [], bomOverrides: [], account: "test" };
  TPL.applyNetworkTemplate(design, key, 0, 0, STN);
  const portIssues = RULES.validateLinkPorts(design);
  portIssues.forEach(p => issues.push(`RUNTIME ${key}: ${p.msg}`));
}

for (const key of Object.keys(TPL.ROOM_TEMPLATES)) {
  const design = { nodes: [], links: [], rooms: [], bomOverrides: [], account: "test" };
  TPL.applyRoomTemplate(design, key, "r1", "Room1", 0, 0, design.nodes, design.links, STN);
  const portIssues = RULES.validateLinkPorts(design);
  portIssues.forEach(p => issues.push(`RUNTIME room ${key}: ${p.msg}`));
}

// PoE sanity: conference room should have 1 switch not 5
const conf = { nodes: [], links: [], rooms: [], bomOverrides: [] };
TPL.applyRoomTemplate(conf, "conference", "r1", "R1", 0, 0, conf.nodes, conf.links, STN);
const poe = RULES.computePoeBudget(conf);
if (poe.switches !== 1)
  issues.push(`PoE: conference expected 1 switch, got ${poe.switches}`);

// No fabricated product IDs in orderable stencils
const allDevices = { ...STN.NETWORK_DEVICES, ...STN.ROOM_DEVICES };
for (const [id, def] of Object.entries(allDevices)) {
  if (def.decorative || def.ccwEligible === false || def.bomEligible === false) continue;
  const pid = def.pid || "";
  if (!pid || pid.startsWith("N/A")) continue;
  if (!STN.isCcwEligible(def, pid))
    issues.push(`Stencil ${id}: PID ${pid} is not CCW-eligible (fabricated or placeholder)`);
}
if (STN.ROOM_DEVICES["amp-280"])
  issues.push("Fabricated amp-280 stencil must not exist");

if (issues.length) {
  console.error("Design Studio validation FAILED (" + issues.length + " issues):\n");
  issues.forEach(i => console.error("  -", i));
  process.exit(1);
}

console.log("Design Studio validation OK");
console.log("  Network templates:", Object.keys(TPL.NETWORK_TEMPLATES).length);
console.log("  Room templates:", Object.keys(TPL.ROOM_TEMPLATES).length);
console.log("  Stencils:", STN.buildCatalogStencils().length, "network,", STN.buildRoomStencils().length, "room");

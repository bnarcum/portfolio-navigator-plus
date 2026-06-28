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

for (const f of ["design-studio-stencils.js", "design-studio-templates.js", "design-studio-rules.js", "design-studio-intent.js", "design-studio-photos.js"]) {
  // eslint-disable-next-line no-eval
  eval(fs.readFileSync(path.join(root, f), "utf8"));
}

const STN = globalThis.__DS_STENCILS;
const TPL = globalThis.__DS_TEMPLATES;
const RULES = globalThis.__DS_RULES;
const INT = globalThis.__DS_INTENT;
const PHOTOS = globalThis.__DS_PHOTOS;

const issues = [];

function isCiscoDomain(url) {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return h === "cisco.com" || h.endsWith(".cisco.com") || h === "webex.com" || h.endsWith(".webex.com");
  } catch { return false; }
}

for (const [key, tpl] of Object.entries(TPL.NETWORK_TEMPLATES)) {
  if (!tpl.cvdUrl || !isCiscoDomain(tpl.cvdUrl))
    issues.push(`NETWORK ${key}: missing cisco.com cvdUrl citation`);
}

for (const [key, tpl] of Object.entries(TPL.ROOM_TEMPLATES)) {
  const url = tpl.ctUrl || tpl.cvdUrl;
  if (!url || !isCiscoDomain(url))
    issues.push(`ROOM ${key}: missing cisco.com/webex.com ctUrl citation`);
}

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

// Photo accuracy — no wrong product substituted for stencil
if (PHOTOS?.STENCIL_MATRIX) {
  const mustSkipPhoto = ["display-75", "display-86", "ise-psn", "ise-pan", "apic", "users-vlan", "internet", "mpls"];
  mustSkipPhoto.forEach(id => {
    const def = STN.ROOM_DEVICES[id] || STN.NETWORK_DEVICES[id];
    if (def && PHOTOS.resolveUrl(id, def))
      issues.push(`Photo: ${id} must not use a product photo (got ${PHOTOS.resolveUrl(id, def)})`);
  });
  const mustHavePhoto = {
    "touch-10": { bridgeKey: "touch-10", hash: "4b0fa15cf0" },
    "ceiling-mic": { bridgeKey: "ceiling-mic-pro" },
    "quad-cam": { bridgeKey: "quad-camera" }
  };
  globalThis.MATRIX_BRIDGE = JSON.parse(fs.readFileSync(path.join(root, "matrix-bridge.json"), "utf8"));
  Object.entries(mustHavePhoto).forEach(([stencil, spec]) => {
    const mapped = PHOTOS.STENCIL_MATRIX[stencil];
    if (mapped !== spec.bridgeKey)
      issues.push(`Photo map: ${stencil} should map to bridge key ${spec.bridgeKey}, got ${mapped || "none"}`);
    const def = STN.ROOM_DEVICES[stencil];
    const url = PHOTOS.resolveUrl(stencil, def);
    const hash = spec.hash || globalThis.MATRIX_BRIDGE.products?.[spec.bridgeKey]?.hash;
    if (!url || (hash && !url.includes(hash)))
      issues.push(`Photo: ${stencil} missing expected matrix image for ${spec.bridgeKey}`);
  });
  if (PHOTOS.STENCIL_MATRIX["display-75"] || PHOTOS.STENCIL_MATRIX["display-86"])
    issues.push("Photo: display stencils must not map to Board Pro or any product photo");
}

// Golden intent briefs (deterministic engine, no AI)
if (INT?.generateFromIntent) {
  const intentUid = () => "ds-t-" + Math.random().toString(36).slice(2, 8);
  const intentDeps = {
    templates: TPL,
    stencils: STN,
    rules: RULES,
    uid: intentUid,
    autoLayoutRoom: () => {},
    ROOM_LAYOUT_OX: 96,
    ROOM_LAYOUT_OY: 72
  };

  const golden = [
    { brief: "SNRA secure campus with Catalyst Center and 12 conference rooms", net: "snraCampus", rooms: [{ key: "conference", count: 12 }] },
    { brief: "AI-ready data center spine-leaf GPU training cluster Nexus", net: "dcAiMlFabric", rooms: [] },
    { brief: "SD-WAN HQ with 8 branches vManage multi-site", net: "sdwanFull", rooms: [] },
    { brief: "Healthcare hospital clinical campus ISE", net: "healthcareCampus", rooms: [] },
    { brief: "Retail Meraki 40 stores", net: "retailMeraki", rooms: [] },
    { brief: "Future-proofed hybrid campus 18 Webex rooms Board Pro Room Kit EQ conference Room Bar huddles Catalyst Center", net: "snraCampus", rooms: [{ key: "boardroom", count: 5 }, { key: "conference", count: 7 }, { key: "huddle", count: 6 }] },
    { brief: "Zero trust SASE Umbrella SD-WAN", net: "zeroTrustEdge", rooms: [] }
  ];

  golden.forEach(g => {
    const design = { nodes: [], links: [], rooms: [], requirements: {}, account: "test" };
    const { plan } = INT.generateFromIntent(g.brief, design, intentDeps);
    if (g.net && plan.netKey !== g.net)
      issues.push(`INTENT net: "${g.brief.slice(0, 36)}…" expected ${g.net}, got ${plan.netKey}`);
    if (!g.net && plan.netKey && !/room|webex|huddle|boardroom/i.test(g.brief))
      issues.push(`INTENT net: unexpected network for brief`);
    g.rooms.forEach(er => {
      const got = plan.roomPlan.find(r => r.key === er.key);
      if (!got || got.count !== er.count)
        issues.push(`INTENT rooms: "${g.brief.slice(0, 36)}…" expected ${er.count}×${er.key}, got ${got?.count || 0}`);
    });
    (plan.citations || []).forEach(c => {
      if (!isCiscoDomain(c.url)) issues.push(`INTENT citation not on cisco.com: ${c.url}`);
    });
  });
}

// Workspace Designer archetypes must be present (webex.com/workspaces parity)
const WS_ROOMS = ["smallRoom", "largeRoom", "auditorium", "focusRoom", "openDesk",
  "deskEssentials", "deskVoice", "deskHybrid", "deskAllInOne", "huddleByod", "largeRoomConfidence"];
for (const key of WS_ROOMS) {
  if (!TPL.ROOM_TEMPLATES[key])
    issues.push(`Missing Workspace Designer room template: ${key}`);
}

if (issues.length) {
  console.error("Design Studio validation FAILED (" + issues.length + " issues):\n");
  issues.forEach(i => console.error("  -", i));
  process.exit(1);
}

console.log("Design Studio validation OK");
console.log("  Network templates:", Object.keys(TPL.NETWORK_TEMPLATES).length);
console.log("  Room templates:", Object.keys(TPL.ROOM_TEMPLATES).length);
console.log("  Stencils:", STN.buildCatalogStencils().length, "network,", STN.buildRoomStencils().length, "room");

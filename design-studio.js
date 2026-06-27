/**
 * Portfolio Navigator Plus — Design Studio v3
 * Netformx-style: SVG stencils, port links, template gallery, rules engine
 */
(function DesignStudioModule() {
  "use strict";

  const STORAGE_KEY = "cpn-design-studio-v3";
  const MAX_HISTORY = 50;
  const uid = () => "ds-" + Math.random().toString(36).slice(2, 10);

  const STN = () => window.__DS_STENCILS;
  const TPL = () => window.__DS_TEMPLATES;
  const RULES = () => window.__DS_RULES;

  const LAYERS = ["wan", "security", "core", "distribution", "dc", "access", "mgmt", "collab"];
  const LAYER_LABELS = {
    wan: "WAN / SD-WAN", core: "Core", distribution: "Distribution", access: "Access",
    security: "Security", mgmt: "Management", collab: "Collaboration", dc: "Data Center"
  };
  /** Left-to-right professional topology columns */
  const LAYER_X = { wan: 40, security: 188, core: 336, distribution: 484, dc: 632, access: 780, mgmt: 928, collab: 1076 };
  const LAYER_COL_W = 132;
  const LAYER_START_Y = 100;
  const LAYER_ROW_H = 104;
  const ROOM_LAYOUT_OX = 96;
  const ROOM_LAYOUT_OY = 72;
  const ROOM_ZONE_GAP = 52;
  const ROOM_ZONE_MIN_H = 96;
  const ROOM_ZONE_PAD = 24;
  const ROOM_ITEM_GAP = 32;
  const ROOM_ROW_GAP = 28;
  /** @deprecated kept for minimap compat */
  const LAYER_Y = { wan: 40, security: 120, core: 200, distribution: 300, access: 400, mgmt: 500, collab: 580, dc: 260 };

  const LINK_MEDIA_STYLE = {
    "fiber-sm": { stroke: "#5a9fd4", w: 2.5 },
    "fiber-mm": { stroke: "#5a9fd4", w: 2.5 },
    "fiber-40g": { stroke: "#7090ff", w: 3 },
    dac: { stroke: "#7090ff", w: 2 },
    hdmi: { stroke: "#44cc88", w: 2.5, dash: "7 4" },
    "usb-c": { stroke: "#44cc88", w: 2, dash: "5 3" },
    speaker: { stroke: "#aa88cc", w: 1.5, dash: "4 3" },
    control: { stroke: "#aa88cc", w: 1.5, dash: "4 3" },
    wireless: { stroke: "#6688aa", w: 1.5, dash: "2 4" },
    cat6a: { stroke: "#d4a060", w: 2 },
    cat6: { stroke: "#c49050", w: 2 }
  };

  /** One Cisco strategy — Design Studio Intent hero (self-contained; mirrors main app deck) */
  const ONE_CISCO_STORY = {
    eyebrow: "One Cisco",
    headline: "Design validated solutions across all three pillars",
    subhead:
      "Cisco powers how people and technology work together across the physical and digital worlds — pick a pillar to prefill your brief, or describe your own opportunity below.",
    connectivityLabel: "Secure global connectivity",
    aiLabel: "Accelerated by Cisco AI",
    pillars: [
      {
        id: "ai-dc",
        label: "AI-Ready Data Centers",
        shortLabel: "AI-Ready DC",
        promise: "Transform data centers to power AI workloads anywhere",
        color: "#0A60FF",
        icon: "chip",
        intent:
          "AI-ready data center spine-leaf fabric: Nexus 9000 spine and leaf with VXLAN EVPN, 400G uplinks, UCS X-Series GPU compute clusters for LLM training, NDFC automation, HyperFlex storage, east-west microsegmentation with Nexus Dashboard. Include OOB management and observability for GPU workloads."
      },
      {
        id: "workplaces",
        label: "Future-Proofed Workplaces",
        shortLabel: "Workplaces",
        promise: "Modernize everywhere people and technology work",
        color: "#2dce5c",
        icon: "telepresence",
        intent:
          "Future-proofed hybrid campus and collaboration: Catalyst 9300/9500 access and distribution, Catalyst wireless, Catalyst Center automation, 18 Webex rooms — Board Pro 75 and Room Kit EQ in conference rooms, Room Bar in huddles, ceiling mics, Room Navigator. Umbrella DNS security for remote workers."
      },
      {
        id: "resilience",
        label: "Digital Resilience",
        shortLabel: "Resilience",
        promise: "Securely up and running through any disruption",
        color: "#FF9000",
        icon: "shield-network",
        intent:
          "Digital resilience and zero trust: Catalyst SD-WAN with dual uplinks and application-aware routing, Secure Firewall HA at HQ and branches, ISE policy for wired and wireless, Duo MFA, Umbrella SIG, encrypted site-to-site VPN fallback. Catalyst Center visibility and ThousandEyes monitoring."
      }
    ]
  };

  const MEDIA_TYPES = [
    { id: "cat6", label: "Cat6 UTP", maxMbps: 1000 },
    { id: "cat6a", label: "Cat6A", maxMbps: 10000 },
    { id: "fiber-sm", label: "SM Fiber 10G", cablePid: "SFP-10G-LR-S", maxMbps: 10000 },
    { id: "fiber-mm", label: "MM Fiber 10G", cablePid: "SFP-10G-SR-S", maxMbps: 10000 },
    { id: "fiber-40g", label: "SM Fiber 40G", cablePid: "QSFP-40G-LR4-S", maxMbps: 40000 },
    { id: "dac", label: "DAC 10G", cablePid: "SFP-H10GB-CU3M", maxMbps: 10000 },
    { id: "hdmi", label: "HDMI 2.1", maxMbps: 48000 },
    { id: "usb-c", label: "USB-C", maxMbps: 40000 },
    { id: "speaker", label: "Speaker wire", maxMbps: 0 },
    { id: "control", label: "Control RS232", maxMbps: 0 },
    { id: "wireless", label: "Wireless RF", maxMbps: 0 }
  ];

  function buildNetworkStencils() { return STN()?.buildCatalogStencils?.() || []; }
  function buildRoomStencils() { return STN()?.buildRoomStencils?.() || []; }

  let NETWORK_STENCILS = buildNetworkStencils();
  let ROOM_STENCILS = buildRoomStencils();

  function emptyDesign(account) {
    return {
      version: 3, account: account || "Untitled Design", updated: new Date().toISOString(),
      requirements: { notes: "", vertical: "", sites: 1, users: 0, budget: "" },
      sites: [{ id: "site-1", name: "Main Campus", type: "campus" }],
      rooms: [], nodes: [], links: [], bomOverrides: [], snapshots: [],
      mode: "network", floorPlan: null, showLayerBands: true, snapGrid: true
    };
  }

  function loadDesign() {
    try {
      for (const k of [STORAGE_KEY, "cpn-design-studio-v2", "cpn-design-studio-v1"]) {
        const raw = localStorage.getItem(k);
        if (raw) { const d = JSON.parse(raw); return { ...emptyDesign(), ...d, version: 3 }; }
      }
    } catch (e) { /* ignore */ }
    return emptyDesign(document.querySelector("#acct-name")?.value?.trim() || "Untitled Design");
  }

  function saveDesign(d) { d.updated = new Date().toISOString(); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch (e) { /* ignore */ } }

  function stencilFor(id, mode) {
    if (mode === "room") return ROOM_STENCILS.find(s => s.id === id) || STN()?.getDef?.(id, "room");
    NETWORK_STENCILS = buildNetworkStencils();
    return NETWORK_STENCILS.find(s => s.id === id) || STN()?.getDef?.(id, "network");
  }

  function computeBom(design) {
    const lines = new Map();
    const add = (pid, desc, qty, type, unit) => {
      if (!pid || pid.startsWith("N/A")) return;
      const k = pid + "|" + type;
      const prev = lines.get(k) || { pid, desc, qty: 0, type, unit: unit || "EA" };
      prev.qty += qty; lines.set(k, prev);
    };
    design.nodes.forEach(n => {
      const qty = n.qty || 1;
      const mode = n.canvas === "room" ? "room" : "network";
      const def = STN()?.getDef?.(n.stencilId, mode);
      const st = stencilFor(n.stencilId, mode);
      const pid = n.pid || def?.pid || st?.pid;
      if (!STN()?.isCcwEligible?.(def, pid)) return;
      add(pid, n.label || def?.label || st?.label, qty, "hardware");
    });
    design.links.forEach(l => {
      const m = MEDIA_TYPES.find(x => x.id === l.media) || MEDIA_TYPES[0];
      if (m.cablePid && STN()?.isCcwEligible?.({ pid: m.cablePid }, m.cablePid))
        add(m.cablePid, `${m.label} — ${l.label || "link"}`, 1, "optic");
    });
    (design.bomOverrides || []).forEach(o => add(o.pid, o.desc, o.qty || 1, o.type || "manual"));
    return [...lines.values()].sort((a, b) => a.type.localeCompare(b.type));
  }

  function computeCables(design) {
    return design.links.map((l, i) => {
      const from = design.nodes.find(n => n.id === l.from);
      const to = design.nodes.find(n => n.id === l.to);
      const media = MEDIA_TYPES.find(m => m.id === l.media) || MEDIA_TYPES[0];
      return { id: l.id, from: from?.label || l.from, to: to?.label || l.to, fromPort: l.fromPort || "—", toPort: l.toPort || "—",
        media: media.label, cablePid: media.cablePid || "—", length: l.length || "3m", label: l.label || `LINK-${String(i + 1).padStart(3, "0")}` };
    });
  }

  function validateDesign(d) { return RULES()?.validateDesign?.(d) || { warnings: [], tips: [], ok: true }; }
  function computeScore(d) { return RULES()?.computeScore?.(d) ?? 0; }
  function getSuggestions(d) { return RULES()?.getSuggestions?.(d) || []; }

  function snap(v, grid = 24) { return Math.round(v / grid) * grid; }

  function linkMediaStyle(mediaId) {
    return LINK_MEDIA_STYLE[mediaId] || LINK_MEDIA_STYLE.cat6;
  }

  function oneCiscoPillarCard(p, wide) {
    const cls = wide ? "ds-oc-pillar ds-oc-pillar-wide ds-oc-pillar-resilience" : "ds-oc-pillar";
    return `<button type="button" class="${cls}" data-pillar="${escapeAttr(p.id)}"
      style="--pillar-color:${escapeAttr(p.color)}"
      title="${escapeAttr(p.promise)} — click to prefill brief">
      <svg class="ds-oc-icon" aria-hidden="true"><use href="#icon-${escapeAttr(p.icon)}"/></svg>
      <span class="ds-oc-pillar-text">
        <strong class="ds-oc-pillar-label">${escapeHtml(p.label)}</strong>
        <span class="ds-oc-pillar-promise">${escapeHtml(p.promise)}</span>
      </span>
    </button>`;
  }

  function buildOneCiscoHeroHtml() {
    const S = ONE_CISCO_STORY;
    const top = S.pillars.filter(p => p.id !== "resilience");
    const res = S.pillars.find(p => p.id === "resilience");
    return `
      <section class="ds-one-cisco" aria-labelledby="ds-oc-title">
        <p class="ds-oc-eyebrow">${escapeHtml(S.eyebrow)}</p>
        <h2 class="ds-oc-headline" id="ds-oc-title">${escapeHtml(S.headline)}</h2>
        <p class="ds-oc-sub">${escapeHtml(S.subhead)}</p>
        <div class="ds-oc-deck" id="ds-one-cisco-deck">
          <div class="ds-oc-row ds-oc-top">
            ${top.map(p => oneCiscoPillarCard(p, false)).join("")}
          </div>
          <div class="ds-oc-spine" aria-hidden="true">
            <span class="ds-oc-spine-line ds-oc-spine-line-l"></span>
            <span class="ds-oc-spine-label">${escapeHtml(S.connectivityLabel)}</span>
            <span class="ds-oc-spine-line ds-oc-spine-line-r"></span>
          </div>
          ${res ? oneCiscoPillarCard(res, true) : ""}
          <div class="ds-oc-ai" aria-hidden="true">
            <span class="ds-oc-chevron ds-oc-chevron-l">‹ ‹ ‹</span>
            <span class="ds-oc-ai-label">${escapeHtml(S.aiLabel)}</span>
            <span class="ds-oc-chevron ds-oc-chevron-r">› › ›</span>
          </div>
        </div>
      </section>`;
  }

  function linkDisplayLabel(links, l) {
    const base = (l.label || "Link").slice(0, 20);
    const peers = links.filter(x => (x.label || "Link") === (l.label || "Link"));
    if (peers.length > 1 && peers[0].id !== l.id) return "";
    if (peers.length > 1) return `${base} ×${peers.length}`;
    return base;
  }

  function intentDeps() {
    return {
      templates: TPL(),
      stencils: STN(),
      rules: RULES(),
      uid,
      autoLayoutRoom,
      ROOM_LAYOUT_OX,
      ROOM_LAYOUT_OY
    };
  }

    if (!label) return "";
    return String(label).replace(/^Room \d+\s+/, "");
  }

  function linkRoute(ax, ay, bx, by, offset) {
    const dx = bx - ax, dy = by - ay;
    if (Math.abs(dx) >= Math.abs(dy)) {
      const mx = (ax + bx) / 2 + offset;
      return `M ${ax} ${ay} L ${mx} ${ay} L ${mx} ${by} L ${bx} ${by}`;
    }
    const my = (ay + by) / 2 + offset;
    return `M ${ax} ${ay} L ${ax} ${my} L ${bx} ${my} L ${bx} ${by}`;
  }

  function linkLabelPos(a, b, offset, roomMode) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const px = -dy / len, py = dx / len;
    const lift = roomMode ? 24 : 16;
    const midx = (a.x + b.x) / 2, midy = (a.y + b.y) / 2;
    if (Math.abs(dx) >= Math.abs(dy)) return { x: midx + offset, y: midy - lift };
    return { x: midx + px * lift, y: midy + offset + py * lift - 8 };
  }

  function layerTitleSvg(layer, cx, y) {
    const raw = LAYER_LABELS[layer] || layer;
    const parts = String(raw).split(/\s*\/\s*/);
    if (parts.length === 1) {
      return `<text class="ds-layer-title" x="${cx}" y="${y}" text-anchor="middle">${escapeHtml(parts[0])}</text>`;
    }
    const tspans = parts.map((p, i) =>
      `<tspan x="${cx}" dy="${i ? 11 : 0}">${escapeHtml(p.trim())}</tspan>`
    ).join("");
    return `<text class="ds-layer-title" x="${cx}" y="${y - 6}" text-anchor="middle">${tspans}</text>`;
  }

  function computeLinkOffsets(links) {
    const offsets = new Map();
    const byFrom = {};
    links.forEach(l => { (byFrom[l.from] ||= []).push(l); });
    Object.values(byFrom).forEach(bucket => {
      bucket.forEach((l, i) => offsets.set(l.id, (i - (bucket.length - 1) / 2) * 32));
    });
    return offsets;
  }

  function layoutZoneEntries(zone, entries, baseX, baseY, snapGrid) {
    const pad = ROOM_ZONE_PAD;
    const gap = ROOM_ITEM_GAP;
    const rowGap = ROOM_ROW_GAP;
    const labelHead = 18;
    if (!entries.length) return;
    const sized = entries.map(e => {
      const def = STN()?.getDef?.(e.n.stencilId, "room");
      return { ...e, nw: e.n.w || def?.w || 76, nh: e.n.h || def?.h || 46 };
    });
    const rowMap = new Map();
    sized.forEach(e => {
      const band = Math.round(e.item.relY * 5);
      if (!rowMap.has(band)) rowMap.set(band, []);
      rowMap.get(band).push(e);
    });
    const rowKeys = [...rowMap.keys()].sort((a, b) => a - b);
    let yCursor = zone.y + pad + labelHead;
    const innerW = Math.max(zone.w - pad * 2, 48);
    rowKeys.forEach(band => {
      const row = rowMap.get(band);
      row.sort((a, b) => a.item.relX - b.item.relX);
      const rowH = Math.max(...row.map(e => e.nh));
      const totalW = row.reduce((s, e) => s + e.nw, 0) + gap * Math.max(0, row.length - 1);
      const spreadRelX = row.length > 1 && new Set(row.map(e => Math.round(e.item.relX * 8))).size > 1;
      if (spreadRelX) {
        row.forEach(e => {
          const centerX = zone.x + pad + e.item.relX * innerW;
          let x = centerX - e.nw / 2;
          x = Math.max(zone.x + pad, Math.min(x, zone.x + zone.w - pad - e.nw));
          e.n.x = snapGrid ? snap(baseX + x) : baseX + x;
          e.n.y = snapGrid ? snap(baseY + yCursor) : baseY + yCursor;
        });
      } else if (row.length === 1) {
        const e = row[0];
        const centerX = zone.x + pad + e.item.relX * innerW;
        let x = centerX - e.nw / 2;
        x = Math.max(zone.x + pad, Math.min(x, zone.x + zone.w - pad - e.nw));
        e.n.x = snapGrid ? snap(baseX + x) : baseX + x;
        e.n.y = snapGrid ? snap(baseY + yCursor) : baseY + yCursor;
      } else {
        let xCursor = zone.x + pad + Math.max(0, (innerW - totalW) / 2);
        row.forEach(e => {
          e.n.x = snapGrid ? snap(baseX + xCursor) : baseX + xCursor;
          e.n.y = snapGrid ? snap(baseY + yCursor) : baseY + yCursor;
          xCursor += e.nw + gap;
        });
      }
      yCursor += rowH + rowGap;
    });
  }

  function autoLayoutRoom(design, roomId) {
    const room = design.rooms.find(r => r.id === roomId);
    const tpl = room ? TPL()?.ROOM_TEMPLATES?.[room.template] : null;
    if (!tpl?.zones) return;
    const baseX = ROOM_LAYOUT_OX;
    const baseY = ROOM_LAYOUT_OY;
    const nodes = design.nodes.filter(n => n.roomId === roomId);
    const claimed = new Set();
    const byZone = {};
    nodes.forEach(n => {
      let item = tpl.items.find(it => it.label === n.label);
      if (!item) {
        item = tpl.items.find(it => it.stencilId === n.stencilId && !claimed.has(it.label));
      }
      if (!item) return;
      claimed.add(item.label);
      (byZone[item.zone] ||= []).push({ n, item });
    });
    const zoneNames = Object.keys(tpl.zones).sort((a, b) => tpl.zones[a].y - tpl.zones[b].y);
    let yShift = 0;
    let prevZoneBottom = 0;
    const computedZones = {};
    zoneNames.forEach(zoneName => {
      const tz = tpl.zones[zoneName];
      const entries = byZone[zoneName];
      let zoneY = tz.y + yShift;
      if (prevZoneBottom > 0 && zoneY < prevZoneBottom + ROOM_ZONE_GAP) {
        yShift += prevZoneBottom + ROOM_ZONE_GAP - zoneY;
        zoneY = tz.y + yShift;
      }
      const zone = { x: tz.x, y: zoneY, w: tz.w, h: Math.max(tz.h, ROOM_ZONE_MIN_H) };
      if (entries?.length) {
        layoutZoneEntries(zone, entries, baseX, baseY, false);
        const bottoms = entries.map(e => {
          const def = STN()?.getDef?.(e.n.stencilId, "room");
          return e.n.y + (e.n.h || def?.h || 46);
        });
        const rights = entries.map(e => {
          const def = STN()?.getDef?.(e.n.stencilId, "room");
          return e.n.x + (e.n.w || def?.w || 76);
        });
        const lefts = entries.map(e => e.n.x);
        const contentBottom = Math.max(...bottoms);
        const bottomPad = ROOM_ZONE_PAD;
        const zoneScreenBottom = baseY + zoneY + zone.h;
        const overflow = contentBottom + bottomPad - zoneScreenBottom;
        if (overflow > 0) yShift += overflow;
        const contentH = contentBottom - (baseY + zoneY) + bottomPad;
        const contentW = Math.max(...rights) - Math.min(...lefts) + ROOM_ZONE_PAD * 2;
        const finalH = Math.max(tz.h, ROOM_ZONE_MIN_H, contentH);
        const finalW = Math.max(tz.w, contentW);
        computedZones[zoneName] = { x: tz.x, y: zoneY, w: finalW, h: finalH };
        prevZoneBottom = zoneY + finalH;
      } else {
        computedZones[zoneName] = { x: tz.x, y: zoneY, w: tz.w, h: Math.max(tz.h, ROOM_ZONE_MIN_H) };
        prevZoneBottom = zoneY + computedZones[zoneName].h;
      }
    });
    room.layoutOrigin = { x: baseX, y: baseY };
    room.computedZones = computedZones;
  }

  function applyRoomTemplateToDesign(design, tplKey, roomId, roomName, ox, oy, nodesArr, linksArr) {
    TPL()?.applyRoomTemplate?.(design, tplKey, roomId, roomName, ox, oy, nodesArr, linksArr, STN());
  }

  function autoLayoutNetwork(design) {
    const nodes = design.nodes.filter(n => n.canvas !== "room");
    const byLayer = {};
    nodes.forEach(n => { (byLayer[n.layer || "access"] ||= []).push(n); });
    LAYERS.forEach(layer => {
      const group = byLayer[layer];
      if (!group) return;
      const x = LAYER_X[layer] || 400;
      group.sort((a, b) => String(a.label).localeCompare(String(b.label)));
      group.forEach((n, i) => {
        const def = STN()?.getDef?.(n.stencilId, "network");
        const nh = n.h || def?.h || 48;
        n.x = x;
        n.y = LAYER_START_Y + i * Math.max(LAYER_ROW_H, nh + 28);
        if (design.snapGrid !== false) { n.x = snap(n.x); n.y = snap(n.y); }
      });
    });
  }

  class History {
    constructor(studio) { this.studio = studio; this.stack = []; this.ptr = -1; }
    snapshot() {
      const json = JSON.stringify(this.studio.design);
      if (this.ptr >= 0 && this.stack[this.ptr] === json) return;
      this.stack = this.stack.slice(0, this.ptr + 1);
      this.stack.push(json);
      if (this.stack.length > MAX_HISTORY) this.stack.shift(); else this.ptr++;
    }
    undo() { if (this.ptr <= 0) return; this.ptr--; this.studio.design = JSON.parse(this.stack[this.ptr]); this.studio.render(); }
    redo() { if (this.ptr >= this.stack.length - 1) return; this.ptr++; this.studio.design = JSON.parse(this.stack[this.ptr]); this.studio.render(); }
  }

  class DesignStudio {
    constructor() {
      this.design = loadDesign();
      this.tab = "network"; this.panelTab = "bom";
      this.selectedNode = null; this.selectedLink = null;
      this.linkFrom = null; this.linkFromPort = null; this.linkMode = false;
      this.drag = null; this.pan = { x: 40, y: 40, zoom: 1 };
      this.layerFilter = "all"; this.paletteFilter = "";
      this.presentation = false; this.showPorts = false; this.showMinimap = true;
      this.activeRoomId = null;
      this.history = new History(this); this.el = null;
    }

    pushHistory() { saveDesign(this.design); this.history.snapshot(); }

    mount() {
      if (document.getElementById("design-studio")) return;
      const root = document.createElement("div");
      root.id = "design-studio";
      root.innerHTML = `
        <header id="ds-header">
          <span class="ds-logo">⬡ Design Studio</span>
          <div id="ds-score-badge" title="Design completeness score">—</div>
          <div id="ds-tabs">
            <button type="button" data-tab="intent">Intent</button>
            <button type="button" data-tab="network" class="active">Network</button>
            <button type="button" data-tab="room">Room</button>
          </div>
          <span class="ds-spacer"></span>
          <button type="button" class="ds-btn" id="ds-gallery" title="Template gallery">Gallery</button>
          <button type="button" class="ds-btn" id="ds-present" title="Presentation mode">Present</button>
          <button type="button" class="ds-btn" id="ds-snapshot" title="Save snapshot">Snapshot</button>
          <button type="button" class="ds-btn" id="ds-undo">↶</button>
          <button type="button" class="ds-btn" id="ds-redo">↷</button>
          <button type="button" class="ds-btn" id="ds-start-over" title="Clear canvas, rooms, and BOM">Start Over</button>
          <button type="button" class="ds-btn" id="ds-import-stack">Import Stack</button>
          <button type="button" class="ds-btn" id="ds-export-svg">SVG</button>
          <button type="button" class="ds-btn" id="ds-export-pack" title="CCW BOM + cable schedule + summary JSON">Full Pack</button>
          <button type="button" class="ds-btn ds-export-ccw" id="ds-export-ccw">Export to CCW</button>
          <button type="button" class="ds-btn" id="ds-ai-design">Ask AI</button>
          <button type="button" class="ds-btn primary" id="ds-close">Close</button>
        </header>
        <div id="ds-body">
          <div id="ds-main">
            <div id="ds-intent" hidden>
              ${buildOneCiscoHeroHtml()}
              <label class="ds-intent-label" for="ds-intent-text">Opportunity brief</label>
              <div id="ds-intent-chips"></div>
              <textarea id="ds-intent-text" placeholder="e.g. SNRA campus + 12 conference rooms and 6 huddles — or AI-ready DC spine-leaf with GPU compute…"></textarea>
              <div id="ds-intent-rationale" hidden></div>
              <div class="ds-intent-section">
                <div class="ds-intent-section-head"><strong>Quick start</strong><span>Click to fill the brief</span></div>
                <div class="ds-templates" id="ds-templates"></div>
              </div>
              <div class="ds-intent-section">
                <div class="ds-intent-section-head"><strong>Reference architectures</strong><span>Or open <em>Gallery</em> for full library</span></div>
                <div class="ds-arch-row" id="ds-arch-presets"></div>
              </div>
              <div class="ds-intent-actions">
                <button type="button" class="ds-btn primary" id="ds-generate">Generate Draft</button>
                <button type="button" class="ds-btn" id="ds-clear">Start Over</button>
              </div>
            </div>
            <div id="ds-canvas-wrap" class="network-mode">
              <div id="ds-floorplan"></div>
              <div id="ds-toolbar"></div>
              <div id="ds-minimap"><svg id="ds-minimap-svg"></svg></div>
              <div id="ds-legend" hidden></div>
              <svg id="ds-svg" xmlns="http://www.w3.org/2000/svg">
                <g id="ds-viewport">
                  <g id="ds-room-zones"></g>
                  <g id="ds-layer-bands"></g>
                  <g id="ds-links"></g>
                  <g id="ds-nodes"></g>
                </g>
              </svg>
            </div>
          </div>
          <aside id="ds-sidebar">
            <div id="ds-palette-head"><input id="ds-palette-search" type="search" placeholder="Search stencils…"/></div>
            <div id="ds-palette"><div class="ds-stencil-grid" id="ds-stencil-grid"></div></div>
            <div id="ds-inspector"></div>
            <div id="ds-panel-tabs">
              <button type="button" data-panel="bom" class="active">BOM</button>
              <button type="button" data-panel="cables">Cables</button>
              <button type="button" data-panel="suggest">Suggest</button>
              <button type="button" data-panel="validate">Validate</button>
              <button type="button" data-panel="sites">Sites</button>
            </div>
            <div id="ds-panel-body"></div>
            <div id="ds-status"><span id="ds-status-left"></span><span id="ds-status-right"></span></div>
          </aside>
        </div>
        <div id="ds-gallery-modal" hidden>
          <div class="ds-gallery-backdrop"></div>
          <div class="ds-gallery-panel">
            <header><h3>Template Gallery</h3><button type="button" id="ds-gallery-close">✕</button></header>
            <div class="ds-gallery-tabs">
              <button type="button" data-gtab="network" class="active">Network</button>
              <button type="button" data-gtab="room">Rooms</button>
            </div>
            <div id="ds-gallery-grid"></div>
          </div>
        </div>`;
      document.body.appendChild(root);
      this.el = root;
      this.buildToolbar();
      this.ensureSymbolDefs();
      this.wireEvents();
      this.wireOneCiscoPillars();
      this.populateTemplates();
      this.populateArchPresets();
      this.buildGallery();
      this.previewIntent();
    }

    buildToolbar() {
      const tb = document.getElementById("ds-toolbar");
      tb.innerHTML = `
        <select id="ds-room-picker" hidden title="Active room"></select>
        <select id="ds-layer-filter"><option value="all">All layers</option></select>
        <select id="ds-link-media"></select>
        <select id="ds-room-template"><option value="">+ Room template…</option></select>
        <button type="button" id="ds-link-mode">Link: off</button>
        <button type="button" id="ds-ports">Ports: off</button>
        <button type="button" id="ds-snap" class="active">Snap: on</button>
        <button type="button" id="ds-layers-band" class="active">Layers: on</button>
        <button type="button" id="ds-auto-layout">Auto layout</button>
        <button type="button" id="ds-auto-wire">Auto-wire</button>
        <button type="button" id="ds-dup">Duplicate</button>
        <button type="button" id="ds-delete-sel">Delete</button>
        <button type="button" id="ds-floor-upload">Floor plan</button>
        <button type="button" id="ds-fit">Fit</button>
        <input type="file" id="ds-floor-input" accept="image/*" hidden/>`;
      LAYERS.forEach(l => { const o = document.createElement("option"); o.value = l; o.textContent = LAYER_LABELS[l]; document.getElementById("ds-layer-filter").appendChild(o); });
      MEDIA_TYPES.forEach(m => { const o = document.createElement("option"); o.value = m.id; o.textContent = m.label; document.getElementById("ds-link-media").appendChild(o); });
      Object.entries(TPL()?.ROOM_TEMPLATES || {}).forEach(([k, v]) => {
        const o = document.createElement("option"); o.value = k; o.textContent = v.name;
        document.getElementById("ds-room-template").appendChild(o);
      });
    }

    wireEvents() {
      const $ = id => document.getElementById(id);
      $("ds-close").onclick = () => this.close();
      $("ds-tabs").onclick = e => { const b = e.target.closest("[data-tab]"); if (b) this.setTab(b.dataset.tab); };
      $("ds-panel-tabs").onclick = e => {
        const b = e.target.closest("[data-panel]");
        if (!b) return;
        this.panelTab = b.dataset.panel;
        $$("#ds-panel-tabs button").forEach(x => x.classList.toggle("active", x.dataset.panel === this.panelTab));
        this.renderPanel();
      };
      $("ds-generate").onclick = () => this.runGenerate();
      let intentPreviewTimer;
      $("ds-intent-text")?.addEventListener("input", () => {
        clearTimeout(intentPreviewTimer);
        intentPreviewTimer = setTimeout(() => this.previewIntent(), 180);
      });
      $("ds-clear").onclick = () => this.startOver();
      $("ds-start-over").onclick = () => this.startOver();
      $("ds-import-stack").onclick = () => this.importStack();
      $("ds-export-ccw").onclick = () => this.exportCcw();
      $("ds-export-pack").onclick = () => this.exportPack();
      $("ds-export-svg").onclick = () => this.exportSvg();
      $("ds-ai-design").onclick = () => this.askAi();
      $("ds-undo").onclick = () => this.history.undo();
      $("ds-redo").onclick = () => this.history.redo();
      $("ds-room-picker").onchange = e => {
        this.activeRoomId = e.target.value || null;
        this.design.activeRoomId = this.activeRoomId;
        this.fitView(); this.renderCanvas();
      };
      $("ds-link-mode").onclick = () => this.toggleLinkMode();
      $("ds-ports").onclick = () => { this.showPorts = !this.showPorts; $("ds-ports").classList.toggle("active", this.showPorts); $("ds-ports").textContent = "Ports: " + (this.showPorts ? "on" : "off"); this.renderCanvas(); };
      $("ds-delete-sel").onclick = () => this.deleteSelected();
      $("ds-dup").onclick = () => this.duplicateSelected();
      $("ds-fit").onclick = () => this.fitView();
      $("ds-auto-layout").onclick = () => {
        if (this.tab === "room" && this.activeRoomId) autoLayoutRoom(this.design, this.activeRoomId);
        else autoLayoutNetwork(this.design);
        this.pushHistory(); this.render(); this.fitView();
      };
      $("ds-auto-wire").onclick = () => { RULES()?.autoWireLayerBased?.(this.design, uid, STN()); this.pushHistory(); this.render(); this.toast("Auto-wired by layer"); };
      $("ds-snap").onclick = () => { this.design.snapGrid = !this.design.snapGrid; $("ds-snap").classList.toggle("active", this.design.snapGrid); $("ds-snap").textContent = "Snap: " + (this.design.snapGrid ? "on" : "off"); };
      $("ds-layers-band").onclick = () => { this.design.showLayerBands = !this.design.showLayerBands; $("ds-layers-band").classList.toggle("active", this.design.showLayerBands); $("ds-layers-band").textContent = "Layers: " + (this.design.showLayerBands ? "on" : "off"); this.renderCanvas(); };
      $("ds-layer-filter").onchange = e => { this.layerFilter = e.target.value; this.renderCanvas(); };
      $("ds-palette-search").oninput = e => { this.paletteFilter = e.target.value.toLowerCase(); this.renderPalette(); };
      $("ds-room-template").onchange = e => { if (e.target.value) { this.addRoomTemplate(e.target.value); e.target.value = ""; } };
      $("ds-floor-upload").onclick = () => $("ds-floor-input").click();
      $("ds-floor-input").onchange = e => this.uploadFloorPlan(e.target.files[0]);
      $("ds-gallery").onclick = () => this.openGallery();
      $("ds-gallery-close").onclick = () => this.closeGallery();
      document.querySelector(".ds-gallery-backdrop")?.addEventListener("click", () => this.closeGallery());
      document.querySelector(".ds-gallery-tabs")?.addEventListener("click", e => {
        const b = e.target.closest("[data-gtab]");
        if (!b) return;
        $$(".ds-gallery-tabs button").forEach(x => x.classList.toggle("active", x.dataset.gtab === b.dataset.gtab));
        this.renderGalleryGrid(b.dataset.gtab);
      });
      $("ds-present").onclick = () => this.togglePresentation();
      $("ds-snapshot").onclick = () => this.saveSnapshot();

      const svg = $("ds-svg");
      svg.onmousedown = e => this.onSvgDown(e);
      svg.onmousemove = e => this.onSvgMove(e);
      svg.onmouseup = () => this.onSvgUp();
      svg.onwheel = e => this.onWheel(e);
      svg.onclick = e => {
        if (e.target === svg || e.target.id === "ds-viewport" || e.target.classList?.contains("ds-layer-band")) {
          this.selectedNode = null; this.selectedLink = null; this.linkFrom = null; this.linkFromPort = null;
          this.renderInspector(); this.renderCanvas();
        }
      };

      document.addEventListener("keydown", e => {
        if (!this.el?.classList.contains("open")) return;
        const tag = (e.target.tagName || "").toLowerCase();
        if (tag === "input" || tag === "textarea" || tag === "select") return;
        if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); this.deleteSelected(); }
        if (e.key === "d" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); this.duplicateSelected(); }
        if (e.key === "z" && (e.metaKey || e.ctrlKey) && !e.shiftKey) { e.preventDefault(); this.history.undo(); }
        if ((e.key === "z" && e.shiftKey && (e.metaKey || e.ctrlKey)) || (e.key === "y" && e.ctrlKey)) { e.preventDefault(); this.history.redo(); }
        if (e.key === "l") this.toggleLinkMode();
        if (e.key === "f" && !(e.metaKey || e.ctrlKey)) this.fitView();
        if (e.key === "p" && !(e.metaKey || e.ctrlKey)) this.togglePresentation();
        if (e.key === "[" && this.tab === "room") this.cycleRoom(-1);
        if (e.key === "]" && this.tab === "room") this.cycleRoom(1);
        if (e.key === "/") { e.preventDefault(); $("ds-palette-search")?.focus(); }
        if (e.key === "Escape") { if (document.getElementById("ds-gallery-modal")?.hidden === false) this.closeGallery(); else this.close(); }
      });
    }

    wireOneCiscoPillars() {
      const deck = document.getElementById("ds-one-cisco-deck");
      if (!deck) return;
      const byId = Object.fromEntries(ONE_CISCO_STORY.pillars.map(p => [p.id, p]));
      deck.querySelectorAll("[data-pillar]").forEach(btn => {
        btn.onclick = () => {
          const pillar = byId[btn.dataset.pillar];
          if (!pillar?.intent) return;
          const ta = document.getElementById("ds-intent-text");
          if (ta) {
            ta.value = pillar.intent;
            ta.focus();
          }
          this.toast(`Brief loaded — ${pillar.shortLabel || pillar.label}`);
          this.previewIntent();
        };
      });
    }

    populateTemplates() {
      const groups = [
        { title: "Cisco Validated (CVD)", items: [
          "SNRA secure campus with Catalyst Center, ISE, Umbrella",
          "Unified Branch medium — dual WAN HA routers, PoE Wi-Fi",
          "University campus CVP — residence and academic segmentation",
          "Manufacturing plant IT/OT segmentation with industrial access",
          "SD-Access fabric campus with border nodes and macro segmentation",
          "DC AI/ML spine-leaf fabric for GPU compute"
        ]},
        { title: "Campus & WAN", items: [
          "200-bed hospital, redundant core, ISE, 12 conference rooms Room Kit EQ",
          "SD-WAN HQ + 8 branches with Secure Firewall and Catalyst Center",
          "DC spine-leaf VXLAN, UCS compute, border firewall",
          "K-12 district hub, 9179F in gymnasiums, Umbrella",
          "Retail 50 stores Meraki MX SD-WAN MR57",
          "Zero trust SASE with Umbrella and Duo"
        ]},
        { title: "Collaboration (CT)", items: [
          "CT small collaboration room — Room Bar, table mic, Room Navigator",
          "CT medium dual-display video-centric boardroom with ceiling mics",
          "Training classroom Board Pro 75, ceiling mics, PoE collab switch",
          "Boardroom 14 seats Board Pro 75, aux display, Quad Camera, ceiling mics",
          "24 huddle rooms Room Bar, PoE switch per room",
          "Conference room Room Kit EQ, 75in display, ceiling mics"
        ]}
      ];
      const box = document.getElementById("ds-templates");
      box.innerHTML = groups.map(g => `
        <div class="ds-tpl-group">
          <div class="ds-tpl-group-title">${escapeHtml(g.title)}</div>
          <div class="ds-tpl-group-grid">${g.items.map(t =>
            `<button type="button" class="ds-tpl" data-tpl="${escapeAttr(t)}">${escapeHtml(t)}</button>`
          ).join("")}</div>
        </div>`).join("");
      box.querySelectorAll(".ds-tpl").forEach(b => {
        b.onclick = () => { document.getElementById("ds-intent-text").value = b.dataset.tpl; this.previewIntent(); };
      });
    }

    populateArchPresets() {
      const box = document.getElementById("ds-arch-presets");
      if (!box) return;
      box.innerHTML = "";
      const nets = TPL()?.NETWORK_TEMPLATES || {};
      const featured = ["snraCampus", "unifiedBranchMed", "campus3tierRedundant", "sdwanFull", "healthcareCampus", "dcAiMlFabric"];
      const keys = [...new Set([...featured, ...Object.keys(nets)])].filter(k => nets[k]);
      keys.slice(0, 10).forEach(key => {
        const preset = nets[key];
        const b = document.createElement("button");
        b.type = "button";
        b.className = "ds-tpl";
        b.textContent = "+ " + preset.label;
        b.title = preset.cvd ? `${preset.cvd}${preset.cvdUrl ? " — " + preset.cvdUrl : ""}` : "";
        b.onclick = () => this.applyRefArch(key);
        box.appendChild(b);
      });
    }

    buildGallery() {
      this.renderGalleryGrid("network");
    }

    renderGalleryGrid(gtab) {
      const grid = document.getElementById("ds-gallery-grid");
      if (!grid) return;
      if (gtab === "room") {
        grid.innerHTML = Object.entries(TPL()?.ROOM_TEMPLATES || {}).map(([key, t]) => `
          <div class="ds-gallery-card" data-room="${key}">
            <div class="ds-gallery-thumb room">${t.category || "Room"}</div>
            <strong>${escapeHtml(t.name)}</strong>
            <span>${t.items?.length || 0} devices · ${t.links?.length || 0} links</span>
            ${t.ct ? `<small class="ds-cvd-ref" title="${escapeAttr(t.ctUrl || "")}">CT: ${escapeHtml(t.ct)}</small>` : ""}
          </div>`).join("");
        grid.querySelectorAll("[data-room]").forEach(el => {
          el.onclick = () => { this.addRoomTemplate(el.dataset.room); this.closeGallery(); };
        });
      } else {
        grid.innerHTML = Object.entries(TPL()?.NETWORK_TEMPLATES || {}).map(([key, t]) => `
          <div class="ds-gallery-card" data-net="${key}">
            <div class="ds-gallery-thumb">${escapeHtml(t.category || "Network")}</div>
            <strong>${escapeHtml(t.label)}</strong>
            <span>${t.nodes?.length || 0} nodes · ${t.links?.length || 0} links</span>
            <small>${escapeHtml((t.tags || []).join(", "))}</small>
            ${t.cvd ? `<small class="ds-cvd-ref" title="${escapeAttr(t.cvdUrl || "")}">CVD: ${escapeHtml(t.cvd)}</small>` : ""}
          </div>`).join("");
        grid.querySelectorAll("[data-net]").forEach(el => {
          el.onclick = () => { this.applyRefArch(el.dataset.net); this.closeGallery(); };
        });
      }
    }

    openGallery() { document.getElementById("ds-gallery-modal").hidden = false; this.renderGalleryGrid("network"); }
    closeGallery() { document.getElementById("ds-gallery-modal").hidden = true; }

    applyRefArch(key) {
      const ox = 80 + this.design.nodes.filter(n => n.canvas === "network").length * 15;
      const tpl = TPL()?.applyNetworkTemplate?.(this.design, key, ox, 60, STN());
      if (!tpl) return;
      autoLayoutNetwork(this.design);
      this.pushHistory(); this.setTab("network"); this.fitView();
      this.toast("Added " + tpl.label + (tpl.cvd ? " · " + tpl.cvd : ""));
    }

    addRoomTemplate(tplKey) {
      const tpl = TPL()?.ROOM_TEMPLATES?.[tplKey];
      if (!tpl) return;
      const roomId = uid();
      const name = `${tpl.name}${this.design.rooms.length ? " " + (this.design.rooms.length + 1) : ""}`;
      this.design.rooms.push({ id: roomId, name, template: tplKey, width: tpl.w, height: tpl.h });
      applyRoomTemplateToDesign(this.design, tplKey, roomId, name, ROOM_LAYOUT_OX, ROOM_LAYOUT_OY, this.design.nodes, this.design.links);
      autoLayoutRoom(this.design, roomId);
      this.activeRoomId = roomId;
      this.design.activeRoomId = roomId;
      this.pushHistory(); this.setTab("room"); this.fitView(); this.render();
      this.toast("Added " + tpl.name);
    }

    cycleRoom(dir) {
      const rooms = this.design.rooms;
      if (!rooms.length) return;
      const idx = Math.max(0, rooms.findIndex(r => r.id === this.activeRoomId));
      const next = rooms[(idx + dir + rooms.length) % rooms.length];
      this.activeRoomId = next.id;
      this.design.activeRoomId = next.id;
      this.updateRoomPicker();
      this.fitView();
      this.render();
    }

    togglePresentation() {
      this.presentation = !this.presentation;
      this.el.classList.toggle("ds-present-mode", this.presentation);
      document.getElementById("ds-present").classList.toggle("active", this.presentation);
      this.renderCanvas();
      if (this.presentation) this.fitView();
    }

    saveSnapshot() {
      const name = prompt("Snapshot name:", "Review " + new Date().toLocaleDateString());
      if (!name) return;
      (this.design.snapshots ||= []).push({ id: uid(), name, at: new Date().toISOString(), data: JSON.parse(JSON.stringify({ nodes: this.design.nodes, links: this.design.links, rooms: this.design.rooms })) });
      this.pushHistory(); this.toast("Snapshot saved: " + name);
    }

    uploadFloorPlan(file) {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        this.design.floorPlan = reader.result;
        document.getElementById("ds-floorplan").style.backgroundImage = `url(${reader.result})`;
        this.pushHistory(); this.toast("Floor plan loaded");
      };
      reader.readAsDataURL(file);
    }

    open() {
      this.mount();
      NETWORK_STENCILS = buildNetworkStencils();
      ROOM_STENCILS = buildRoomStencils();
      this.design = loadDesign();
      const acct = document.querySelector("#acct-name")?.value?.trim();
      if (acct) this.design.account = acct;
      if (this.design.floorPlan) document.getElementById("ds-floorplan").style.backgroundImage = `url(${this.design.floorPlan})`;
      this.activeRoomId = this.design.activeRoomId || this.design.rooms?.[0]?.id || null;
      if (this.design.nodes.length) {
        if (this.design.nodes.some(n => n.canvas !== "room")) autoLayoutNetwork(this.design);
        this.design.rooms.forEach(r => autoLayoutRoom(this.design, r.id));
        saveDesign(this.design);
      }
      ["ds-snap", "ds-layers-band"].forEach(id => document.getElementById(id)?.classList.add("active"));
      document.getElementById("ds-ports")?.classList.remove("active");
      this.history.snapshot();
      this.el.classList.add("open");
      document.body.classList.add("design-studio-open");
      this.setTab(this.design.mode === "room" ? "room" : "network");
      this.render();
    }

    close() { saveDesign(this.design); this.el?.classList.remove("open"); this.el?.classList.remove("ds-present-mode"); document.body.classList.remove("design-studio-open"); }

    setTab(tab) {
      this.tab = tab;
      if (tab === "network" || tab === "room") this.design.mode = tab;
      if (tab === "room" && !this.activeRoomId && this.design.rooms.length)
        this.activeRoomId = this.design.rooms[0].id;
      $$("#ds-tabs button").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
      document.getElementById("ds-intent").hidden = tab !== "intent";
      document.getElementById("ds-canvas-wrap").hidden = tab === "intent";
      const wrap = document.getElementById("ds-canvas-wrap");
      wrap.classList.toggle("room-mode", tab === "room");
      wrap.classList.toggle("network-mode", tab === "network");
      this.updateRoomPicker();
      if (tab !== "intent") { this.renderPalette(); this.renderCanvas(); if (tab === "room") this.fitView(); }
      this.renderPanel();
    }

    updateRoomPicker() {
      const sel = document.getElementById("ds-room-picker");
      if (!sel) return;
      const show = this.tab === "room" && this.design.rooms.length > 0;
      sel.hidden = !show;
      if (!show) return;
      sel.innerHTML = this.design.rooms.map(r =>
        `<option value="${r.id}"${r.id === this.activeRoomId ? " selected" : ""}>${escapeHtml(r.name)}</option>`
      ).join("");
      if (!this.activeRoomId && this.design.rooms.length) this.activeRoomId = this.design.rooms[0].id;
    }

    previewIntent() {
      const INT = window.__DS_INTENT;
      const chips = document.getElementById("ds-intent-chips");
      if (!INT || !chips) return;
      const text = document.getElementById("ds-intent-text")?.value?.trim() || "";
      const parsed = INT.parseIntent(text);
      chips.innerHTML = INT.renderChipsHtml(parsed.signals);
    }

    runGenerate() {
      const INT = window.__DS_INTENT;
      const text = document.getElementById("ds-intent-text").value.trim();
      if (!text) { this.toast("Enter a description"); return; }
      if (!INT?.generateFromIntent) { this.toast("Intent engine not loaded"); return; }
      const { plan, score, fixes } = INT.generateFromIntent(text, this.design, intentDeps());
      if (this.design.nodes.some(n => n.canvas !== "room")) autoLayoutNetwork(this.design);
      this.design.rooms.forEach(r => autoLayoutRoom(this.design, r.id));
      this.activeRoomId = this.design.activeRoomId || this.design.rooms[0]?.id || null;
      this.pushHistory();
      const rat = document.getElementById("ds-intent-rationale");
      if (rat) {
        rat.hidden = false;
        rat.innerHTML = INT.renderRationaleHtml(plan, score, fixes);
      }
      this.previewIntent();
      const citeCount = plan.citations?.length || 0;
      this.toast(`Draft generated · Score ${score}/100 · ${citeCount} cited reference${citeCount === 1 ? "" : "s"}`);
      const roomOnly = this.design.rooms.length > 0 && !this.design.nodes.some(n => n.canvas !== "room");
      this.setTab(roomOnly ? "room" : "network");
      this.fitView();
    }

    importStack() {
      const v2 = window.__cpnV2;
      if (!v2?.phases?.readState) { this.toast("Planner not ready"); return; }
      const stack = v2.phases.readState().stack || [];
      let x = 100, y = 180, added = 0;
      stack.forEach(it => {
        const id = typeof it === "string" ? it : it?.id;
        if (!id) return;
        const name = v2.helpers?.nameOf?.(id) || id;
        const mapped = STN()?.FAMILY_TO_STENCIL?.[id] || id;
        const def = STN()?.getDef?.(mapped, "network");
        this.design.nodes.push({
          id: uid(), stencilId: mapped, label: name.slice(0, 32), pid: def?.pid,
          layer: def?.layer || "access", x, y, canvas: "network", qty: 1, w: def?.w, h: def?.h
        });
        x += 130; if (x > 900) { x = 100; y += 100; }
        added++;
      });
      this.pushHistory(); this.render();
      this.toast(`Imported ${added} stack items`);
    }

    askAi() {
      const text = document.getElementById("ds-intent-text")?.value?.trim() || "Design a complete Cisco solution";
      const stencils = buildNetworkStencils().slice(0, 40).map(s => s.id).join(", ");
      const nets = Object.keys(TPL()?.NETWORK_TEMPLATES || {}).join(", ");
      const rooms = Object.keys(TPL()?.ROOM_TEMPLATES || {}).join(", ");
      const prompt = `Cisco SE: output ONLY valid JSON (no markdown):
{"nodes":[{"stencilId":"c9300-access","label":"Access-1","layer":"access","x":200,"y":200,"canvas":"network","pid":"C9300-48P"}],"links":[{"fromLabel":"Access-1","toLabel":"Core-A","media":"fiber-sm","label":"Uplink","fromPort":"Te1/1/1","toPort":"Te1/1/1"}]}
network stencils: ${stencils}
room stencils: ${buildRoomStencils().map(s => s.id).join(", ")}
templates: ${nets} / ${rooms}
media: ${MEDIA_TYPES.map(m => m.id).join(", ")}
Request: ${text}
Account: ${this.design.account}`;
      if (window.__cpnV2?.phases?.openAiWithPrompt) {
        window.__cpnV2.phases.openAiWithPrompt(prompt, { send: true });
        this.toast("AI prompt sent");
        this.setTab("intent");
      } else this.toast("Configure AI assistant first");
    }

    startOver() {
      const name = this.design.account;
      if (!confirm("Start over? This clears the canvas, rooms, links, and BOM. Your account name is kept.")) return;
      this.design = emptyDesign(name);
      this.activeRoomId = null;
      this.selectedNode = null;
      this.selectedLink = null;
      this.linkFrom = null;
      this.linkFromPort = null;
      const ta = document.getElementById("ds-intent-text");
      if (ta) ta.value = "";
      const rat = document.getElementById("ds-intent-rationale");
      if (rat) { rat.hidden = true; rat.innerHTML = ""; }
      const chips = document.getElementById("ds-intent-chips");
      if (chips) chips.innerHTML = window.__DS_INTENT?.renderChipsHtml([]) || "";
      this.pushHistory();
      this.setTab("intent");
      this.render();
      this.toast("Design cleared — describe a new opportunity or open Gallery");
    }

    exportCcw() {
      const bom = computeBom(this.design);
      const dl = window.__cpnV2?.helpers?.downloadBlob;
      if (!dl) { this.toast("Export unavailable"); return; }
      if (!bom.length) { this.toast("Nothing to export — add devices or open Gallery"); return; }
      const slug = (this.design.account || "design").replace(/[^\w-]+/g, "-");
      const bomRows = [["Item Type", "Part Number", "Description", "Qty", "Unit"]];
      bom.forEach(b => bomRows.push([b.type, b.pid, b.desc, b.qty, b.unit || "EA"]));
      dl(`CCW_Prep_${slug}.csv`, "text/csv;charset=utf-8", bomRows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n"));
      this.toast(`CCW BOM exported · ${bom.length} line${bom.length === 1 ? "" : "s"}`);
    }

    exportPack() {
      const bom = computeBom(this.design);
      const cables = computeCables(this.design);
      const dl = window.__cpnV2?.helpers?.downloadBlob;
      if (!dl) { this.toast("Export unavailable"); return; }
      const slug = (this.design.account || "design").replace(/[^\w-]+/g, "-");
      const score = computeScore(this.design);
      const bomRows = [["Item Type", "Part Number", "Description", "Qty", "Unit"]];
      bom.forEach(b => bomRows.push([b.type, b.pid, b.desc, b.qty, b.unit || "EA"]));
      dl(`CCW_Prep_${slug}.csv`, "text/csv;charset=utf-8", bomRows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n"));
      const cabRows = [["Label", "From Device", "From Port", "To Device", "To Port", "Media", "Cable PID", "Length"]];
      cables.forEach(c => cabRows.push([c.label, c.from, c.fromPort, c.to, c.toPort, c.media, c.cablePid, c.length]));
      dl(`Cable_Schedule_${slug}.csv`, "text/csv;charset=utf-8", cabRows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n"));
      const narrative = RULES()?.generateCustomerNarrative?.(this.design) || "";
      dl(`Design_Summary_${slug}.md`, "text/markdown", narrative);
      const val = validateDesign(this.design);
      const summary = `# Design Export — ${this.design.account}\nScore: ${score}/100\nDevices: ${this.design.nodes.length}\nLinks: ${this.design.links.length}\n\n## Validation\n${val.warnings.map(w => "- ⚠ " + (w.msg || w)).join("\n")}\n${val.tips.map(t => "- 💡 " + (t.msg || t)).join("\n")}\n`;
      dl(`Design_Export_${slug}.md`, "text/markdown", summary);
      dl(`Design_${slug}.json`, "application/json", JSON.stringify(this.design, null, 2));
      this.toast("Exported CCW, cables, narrative, JSON");
    }

    exportSvg() {
      const vp = document.getElementById("ds-viewport");
      if (!vp) return;
      const clone = vp.cloneNode(true);
      clone.querySelectorAll(".ds-ports, .ds-port, .ds-layer-band, .ds-layer-title").forEach(el => el.remove());
      const bbox = vp.getBBox?.() || { x: 0, y: 0, width: 1200, height: 800 };
      const symDefs = window.CPN_CISCO_SYMBOLS ? `<defs>${window.CPN_CISCO_SYMBOLS}</defs>` : "";
      const svg = `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="${bbox.x - 24} ${bbox.y - 24} ${bbox.width + 48} ${bbox.height + 48}" style="background:#0a1628;font-family:system-ui,sans-serif">${symDefs}${clone.innerHTML}</svg>`;
      window.__cpnV2?.helpers?.downloadBlob?.(`Topology_${(this.design.account || "design").replace(/[^\w-]+/g, "-")}.svg`, "image/svg+xml", svg);
      this.toast("SVG exported");
    }

    toggleLinkMode() {
      this.linkMode = !this.linkMode;
      this.linkFrom = null; this.linkFromPort = null;
      const btn = document.getElementById("ds-link-mode");
      btn.textContent = "Link: " + (this.linkMode ? "on" : "off");
      btn.classList.toggle("active", this.linkMode);
      document.getElementById("ds-svg").classList.toggle("linking", this.linkMode);
      if (this.linkMode) this.toast("Click source port, then target port");
      this.renderCanvas();
    }

    showPortsOnNode(n) {
      return !this.presentation && this.showPorts && (this.linkMode || this.selectedNode === n.id);
    }

    createLink(fromId, fromPort, toId, toPort) {
      const from = this.design.nodes.find(n => n.id === fromId);
      const to = this.design.nodes.find(n => n.id === toId);
      const media = STN()?.suggestMedia?.(from, to, fromPort, toPort) || document.getElementById("ds-link-media").value;
      this.design.links.push({
        id: uid(), from: fromId, to: toId, media, label: `${from?.label || "A"}-${to?.label || "B"}`,
        length: "5m", fromPort: fromPort || "", toPort: toPort || ""
      });
      this.linkFrom = null; this.linkFromPort = null;
      this.pushHistory(); this.render();
    }

    duplicateSelected() {
      const n = this.design.nodes.find(x => x.id === this.selectedNode);
      if (!n) return;
      const copy = { ...n, id: uid(), x: n.x + 40, y: n.y + 40, label: n.label + " copy" };
      this.design.nodes.push(copy);
      this.selectedNode = copy.id;
      this.pushHistory(); this.render();
    }

    deleteSelected() {
      if (this.selectedLink) {
        this.design.links = this.design.links.filter(l => l.id !== this.selectedLink);
        this.selectedLink = null;
      } else if (this.selectedNode) {
        this.design.links = this.design.links.filter(l => l.from !== this.selectedNode && l.to !== this.selectedNode);
        this.design.nodes = this.design.nodes.filter(n => n.id !== this.selectedNode);
        this.selectedNode = null;
      } else return;
      this.pushHistory(); this.render();
    }

    visibleNodes() {
      const mode = this.tab === "room" ? "room" : "network";
      return this.design.nodes.filter(n => {
        if ((n.canvas || "network") !== mode) return false;
        if (mode === "room" && this.activeRoomId && n.roomId !== this.activeRoomId) return false;
        if (this.layerFilter !== "all" && n.layer !== this.layerFilter) return false;
        return true;
      });
    }

    visibleLinks(nodeIds) {
      return this.design.links.filter(l => nodeIds.has(l.from) && nodeIds.has(l.to));
    }

    shouldShowLinkLabel(links, linkId) {
      if (this.selectedLink === linkId || this.linkMode) return true;
      if (this.tab === "room") return links.length <= 4;
      return links.length <= 8;
    }

    render() {
      this.updateRoomPicker();
      this.renderPalette();
      this.renderCanvas();
      this.renderInspector();
      this.renderPanel();
      this.renderMinimap();
      const bom = computeBom(this.design);
      const score = computeScore(this.design);
      const badge = document.getElementById("ds-score-badge");
      if (badge) {
        badge.textContent = score + "/100";
        badge.className = score >= 80 ? "ds-score good" : score >= 50 ? "ds-score ok" : "ds-score low";
      }
      document.getElementById("ds-status-left").textContent =
        `${this.design.nodes.length} devices · ${this.design.links.length} links · ${bom.length} BOM · Score ${score}`;
      const room = this.design.rooms.find(r => r.id === this.activeRoomId);
      const roomHint = this.tab === "room" && room ? ` · ${room.name}` : "";
      document.getElementById("ds-status-right").textContent = `v3${roomHint} · ${this.design.account}`;
    }

    renderPalette() {
      const grid = document.getElementById("ds-stencil-grid");
      NETWORK_STENCILS = buildNetworkStencils();
      ROOM_STENCILS = buildRoomStencils();
      let stencils = this.tab === "room" ? ROOM_STENCILS : NETWORK_STENCILS;
      if (this.paletteFilter) stencils = stencils.filter(s => (s.label + s.id + (s.pid || "")).toLowerCase().includes(this.paletteFilter));
      grid.innerHTML = stencils.slice(0, 72).map(s => {
        const def = STN()?.getDef?.(s.id, this.tab === "room" ? "room" : "network");
        const symbolId = s.symbolId || STN()?.resolveSymbolId?.(def, s.id) || "switch";
        const accent = s.accent || STN()?.resolveAccent?.(def) || "#02C8FF";
        const icon = STN()?.renderSymbolPreview?.(symbolId, accent, 22) || "▣";
        return `<div class="ds-stencil" draggable="true" data-stencil="${s.id}" title="${escapeHtml(s.label)} · ${escapeHtml(s.pid || "")}">
          <span class="ds-st-icon">${icon}</span>${escapeHtml(s.label.slice(0, 14))}</div>`;
      }).join("") || `<div class="ds-empty">No stencils match</div>`;
      grid.querySelectorAll(".ds-stencil").forEach(el => {
        el.ondragstart = e => e.dataTransfer.setData("text/stencil", el.dataset.stencil);
        el.onclick = () => this.addStencil(el.dataset.stencil);
      });
      const wrap = document.getElementById("ds-canvas-wrap");
      wrap.ondragover = e => e.preventDefault();
      wrap.ondrop = e => {
        e.preventDefault();
        const id = e.dataTransfer.getData("text/stencil");
        if (id) { const pt = this.clientToSvg(e.clientX, e.clientY); this.addStencil(id, pt.x, pt.y); }
      };
    }

    addStencil(stencilId, x, y) {
      const mode = this.tab === "room" ? "room" : "network";
      const def = STN()?.getDef?.(stencilId, mode);
      const st = stencilFor(stencilId, mode);
      if (!def && !st) return;
      let cx = x ?? (120 + Math.random() * 300);
      let cy = y ?? (120 + Math.random() * 200);
      if (this.design.snapGrid !== false) { cx = snap(cx); cy = snap(cy); }
      const roomId = mode === "room" && this.design.rooms.length ? this.design.rooms[this.design.rooms.length - 1].id : undefined;
      const node = {
        id: uid(), stencilId, label: def?.label || st?.label || stencilId, pid: def?.pid || st?.pid,
        layer: def?.layer || st?.layer || "collab", x: cx, y: cy, canvas: mode,
        w: def?.w || st?.w || 76, h: def?.h || st?.h || 46, qty: 1, roomId
      };
      this.design.nodes.push(node);
      this.pushHistory();
      this.render();
      this.offerSuggestionsForNode(node);
    }

    offerSuggestionsForNode(node) {
      const sug = getSuggestions(this.design).filter(s => s.action === "addLink" && (s.payload?.to === node.id || s.payload?.from === node.id));
      if (sug.length) this.toast(`Tip: ${sug[0].label} — see Suggest panel`);
    }

    renderRoomZones() {
      const zoneLayer = document.getElementById("ds-room-zones");
      if (!zoneLayer || this.tab !== "room") { if (zoneLayer) zoneLayer.innerHTML = ""; return; }
      const rooms = this.activeRoomId
        ? this.design.rooms.filter(r => r.id === this.activeRoomId)
        : this.design.rooms;
      let html = "";
      rooms.forEach(room => {
        const tpl = TPL()?.ROOM_TEMPLATES?.[room.template];
        if (!tpl?.zones) return;
        const roomNodes = this.design.nodes.filter(n => n.roomId === room.id);
        if (!roomNodes.length) return;
        const ox = room.layoutOrigin?.x ?? ROOM_LAYOUT_OX;
        const oy = room.layoutOrigin?.y ?? ROOM_LAYOUT_OY;
        const titleX = ox + (tpl.zones.display?.x ?? tpl.zones.table?.x ?? 24) - 8;
        html += `<text class="ds-room-title" data-room="${room.id}" x="${titleX}" y="${oy - 12}">${escapeHtml(room.name)}</text>`;
        const zones = room.computedZones || tpl.zones;
        Object.entries(zones).forEach(([name, z]) => {
          const label = String(name).replace(/^\w/, c => c.toUpperCase());
          html += `<g class="ds-zone" data-room="${room.id}" data-zone="${escapeAttr(name)}" transform="translate(${ox + z.x},${oy + z.y})">
            <rect class="ds-zone-rect" width="${z.w}" height="${z.h}" rx="8"/>
            <rect class="ds-zone-label-bg" x="6" y="4" width="${Math.min(label.length * 7 + 12, z.w - 8)}" height="16" rx="4"/>
            <text class="ds-zone-label-text" x="12" y="15">${escapeHtml(label)}</text>
          </g>`;
        });
      });
      zoneLayer.innerHTML = html;
    }

    updateRoomZonesForRoom(roomId) {
      if (this.tab !== "room") return;
      const room = this.design.rooms.find(r => r.id === roomId);
      const tpl = room ? TPL()?.ROOM_TEMPLATES?.[room.template] : null;
      if (!tpl?.zones) return;
      const ox = room.layoutOrigin?.x ?? ROOM_LAYOUT_OX;
      const oy = room.layoutOrigin?.y ?? ROOM_LAYOUT_OY;
      const zones = room.computedZones || tpl.zones;
      document.querySelectorAll(`#ds-room-zones .ds-zone[data-room="${roomId}"]`).forEach(el => {
        const name = el.dataset.zone;
        const z = zones[name];
        if (z) el.setAttribute("transform", `translate(${ox + z.x},${oy + z.y})`);
      });
      const title = document.querySelector(`#ds-room-zones .ds-room-title[data-room="${roomId}"]`);
      if (title && room) {
        const titleX = ox + (tpl.zones.display?.x ?? tpl.zones.table?.x ?? 24) - 8;
        title.setAttribute("x", titleX);
        title.setAttribute("y", oy - 12);
      }
    }

    ensureSymbolDefs() {
      const sym = window.CPN_CISCO_SYMBOLS;
      if (!sym) return;
      if (!document.getElementById("ds-symbol-sprite")) {
        const sprite = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        sprite.id = "ds-symbol-sprite";
        sprite.setAttribute("aria-hidden", "true");
        sprite.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";
        sprite.innerHTML = `<defs>${sym}</defs>`;
        document.body.appendChild(sprite);
      }
      const svg = document.getElementById("ds-svg");
      if (!svg) return;
      let defs = svg.querySelector("defs#ds-visual-def");
      if (!defs) {
        defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        defs.id = "ds-visual-def";
        svg.insertBefore(defs, svg.firstChild);
      }
      if (!defs.dataset.symbols) {
        defs.insertAdjacentHTML("afterbegin", sym);
        defs.dataset.symbols = "1";
      }
      if (!defs.querySelector("#ds-glow")) {
        defs.insertAdjacentHTML("beforeend", `
          <filter id="ds-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>`);
      }
    }

    ensureLinkMarkers() {
      let defs = document.getElementById("ds-arrow-def");
      const svg = document.getElementById("ds-svg");
      if (!svg) return;
      if (!defs) {
        defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        defs.id = "ds-arrow-def";
        svg.prepend(defs);
      }
      const ids = [...new Set([...MEDIA_TYPES.map(m => m.id), "cat6"])];
      ids.forEach(id => {
        const mid = `ds-arrow-${id}`;
        if (defs.querySelector(`#${mid}`)) return;
        const ms = linkMediaStyle(id);
        const m = document.createElementNS("http://www.w3.org/2000/svg", "marker");
        m.setAttribute("id", mid);
        m.setAttribute("markerWidth", "8");
        m.setAttribute("markerHeight", "8");
        m.setAttribute("refX", "7");
        m.setAttribute("refY", "3");
        m.setAttribute("orient", "auto");
        m.innerHTML = `<path d="M0,0 L8,3 L0,6 Z" fill="${ms.stroke}"/>`;
        defs.appendChild(m);
      });
    }

    linkEndpoints(l) {
      const portXY = (nodeId, portId) => {
        const n = this.design.nodes.find(x => x.id === nodeId);
        return n ? STN()?.portXY?.(n, portId) : { x: 0, y: 0 };
      };
      const a = l.fromPort ? portXY(l.from, l.fromPort) : (() => {
        const n = this.design.nodes.find(x => x.id === l.from);
        return { x: n.x + (n.w || 76) / 2, y: n.y + (n.h || 46) / 2 };
      })();
      const b = l.toPort ? portXY(l.to, l.toPort) : (() => {
        const n = this.design.nodes.find(x => x.id === l.to);
        return { x: n.x + (n.w || 76) / 2, y: n.y + (n.h || 46) / 2 };
      })();
      return { a, b };
    }

    updateLinksForNode(nodeId) {
      const linksG = document.getElementById("ds-links");
      if (!linksG) return;
      this.design.links.forEach(l => {
        if (l.from !== nodeId && l.to !== nodeId) return;
        const g = linksG.querySelector(`.ds-link[data-link="${l.id}"]`);
        if (!g) return;
        const { a, b } = this.linkEndpoints(l);
        const off = (this._linkOffsets && this._linkOffsets.get(l.id)) || 0;
        const path = linkRoute(a.x, a.y, b.x, b.y, off);
        const lp = linkLabelPos(a, b, off, this.tab === "room");
        g.querySelector(".ds-link-path")?.setAttribute("d", path);
        const grp = g.querySelector(".ds-link-label-group");
        if (grp) grp.setAttribute("transform", `translate(${lp.x},${lp.y})`);
      });
    }

    updateNodeDragPosition(node) {
      const el = document.querySelector(`#ds-nodes .ds-node[data-node="${node.id}"]`);
      if (el) el.setAttribute("transform", `translate(${node.x},${node.y})`);
      this.updateLinksForNode(node.id);
      if (node.roomId) this.updateRoomZonesForRoom(node.roomId);
      this.renderMinimap();
    }

    renderCanvas() {
      if (this.tab === "intent") return;
      this.ensureSymbolDefs();
      this.renderRoomZones();
      const nodes = this.visibleNodes();
      const nodeIds = new Set(nodes.map(n => n.id));
      const links = this.visibleLinks(nodeIds);
      this._linkOffsets = computeLinkOffsets(links);

      const bandsG = document.getElementById("ds-layer-bands");
      if (this.tab === "network" && this.design.showLayerBands !== false && !this.presentation) {
        const activeLayers = [...new Set(nodes.map(n => n.layer).filter(Boolean))];
        bandsG.innerHTML = LAYERS.filter(l => activeLayers.includes(l)).map(layer => {
          const x = (LAYER_X[layer] || 400) - 12;
          const layerNodes = nodes.filter(n => n.layer === layer);
          const maxY = layerNodes.length ? Math.max(...layerNodes.map(n => n.y + (n.h || 46))) + 32 : 520;
          const title = LAYER_LABELS[layer] || layer;
          return `<rect class="ds-layer-band" x="${x}" y="80" width="${LAYER_COL_W}" height="${Math.max(420, maxY - 68)}"/>
            ${layerTitleSvg(layer, x + LAYER_COL_W / 2, 74)}`;
        }).join("");
      } else bandsG.innerHTML = "";

      const selNode = this.selectedNode;
      const linksG = document.getElementById("ds-links");
      const showBands = this.tab === "network" && this.design.showLayerBands !== false;
      linksG.innerHTML = links.map(l => {
        const { a, b } = this.linkEndpoints(l);
        const off = this._linkOffsets.get(l.id) || 0;
        const sel = this.selectedLink === l.id ? " selected" : "";
        const hl = selNode && (l.from === selNode || l.to === selNode) ? " highlighted" : "";
        const dim = selNode && !hl && !sel ? " dimmed" : "";
        const path = linkRoute(a.x, a.y, b.x, b.y, off);
        const lp = linkLabelPos(a, b, off, this.tab === "room");
        const lbl = linkDisplayLabel(links, l);
        const showLbl = lbl && !this.presentation && this.shouldShowLinkLabel(links, l.id);
        const portDetail = sel && l.fromPort && l.toPort ? `${l.fromPort} → ${l.toPort}` : "";
        const lw = Math.max(36, lbl.length * 6.5 + 14);
        const lh = portDetail ? 24 : 14;
        const ms = linkMediaStyle(l.media);
        const dash = ms.dash ? ` stroke-dasharray="${ms.dash}"` : "";
        return `<g class="ds-link${sel}${hl}${dim}" data-link="${l.id}" data-media="${escapeAttr(l.media || "cat6")}">
          <path class="ds-link-path${sel}" d="${path}" marker-end="url(#ds-arrow-${l.media || "cat6"})" style="stroke:${ms.stroke};stroke-width:${hl ? ms.w + 1 : ms.w}${dash ? ";stroke-dasharray:" + ms.dash : ""}"/>
          ${showLbl ? `<g class="ds-link-label-group" transform="translate(${lp.x},${lp.y})">
            <rect class="ds-link-label-bg" x="${-lw / 2}" y="-11" width="${lw}" height="${lh}" rx="3"/>
            <text class="ds-link-label" text-anchor="middle" y="0">${escapeHtml(lbl)}</text>
            ${portDetail ? `<text class="ds-link-label-detail" text-anchor="middle" y="10">${escapeHtml(portDetail)}</text>` : ""}
          </g>` : ""}
        </g>`;
      }).join("");

      this.ensureLinkMarkers();

      const legend = document.getElementById("ds-legend");
      if (legend) {
        const showLeg = !this.presentation && this.tab !== "intent" && links.length > 0;
        legend.hidden = !showLeg;
        if (showLeg) {
          const types = [...new Set(links.map(l => l.media || "cat6"))].slice(0, 5);
          legend.innerHTML = types.map(id => {
            const ms = linkMediaStyle(id);
            const lbl = MEDIA_TYPES.find(m => m.id === id)?.label?.split(" ")[0] || id;
            return `<span class="ds-leg-item"><i style="background:${ms.stroke}"></i>${escapeHtml(lbl)}</span>`;
          }).join("");
        }
      }

      const nodesG = document.getElementById("ds-nodes");
      const mode = this.tab === "room" ? "room" : "network";
      nodesG.innerHTML = nodes.map(n => {
        const sel = this.selectedNode === n.id ? " selected" : "";
        const def = STN()?.getDef?.(n.stencilId, mode);
        const w = n.w || def?.w || 76, h = n.h || def?.h || 46;
        const qty = n.qty > 1 ? ` ×${n.qty}` : "";
        const dispLabel = displayNodeLabel(n.label);
        const title = [n.label, n.pid || def?.pid].filter(Boolean).join(" · ");
        const svgInner = STN()?.renderDeviceSvg?.(def, w, h, sel, n.stencilId) || `<rect class="ds-node-box" width="${w}" height="${h}" rx="6"/>`;
        const ports = this.showPortsOnNode(n) ? STN()?.renderPorts?.(n, mode, this.linkFrom === n.id ? this.linkFromPort : null) || "" : "";
        const showLayer = n.layer && this.tab === "network" && !showBands;
        const isHub = mode === "room" && /switch|9200|9300|collab/i.test(n.stencilId || "");
        const isDeco = def?.decorative;
        return `<g class="ds-node${sel}${isHub ? " ds-hub" : ""}${isDeco ? " ds-deco" : ""}" data-node="${n.id}" transform="translate(${n.x},${n.y})">
          <title>${escapeHtml(title)}</title>
          ${isHub ? `<rect class="ds-node-hub-ring" x="-4" y="-4" width="${w + 8}" height="${h + 8}" rx="10"/>` : ""}
          ${svgInner}
          <rect class="ds-node-hit" width="${w}" height="${h}" rx="6" fill="transparent"/>
          <rect class="ds-node-label-bg" x="2" y="${h - 18}" width="${w - 4}" height="14" rx="3"/>
          <text class="ds-node-label" x="${w / 2}" y="${h - 7}" text-anchor="middle">${escapeHtml((dispLabel || "").slice(0, 22) + qty)}</text>
          ${showLayer ? `<text class="ds-node-layer" x="4" y="11">${escapeHtml(LAYER_LABELS[n.layer]?.slice(0, 12) || n.layer)}</text>` : ""}
          <g class="ds-ports">${ports}</g>
        </g>`;
      }).join("");

      linksG.querySelectorAll(".ds-link").forEach(el => {
        el.onmouseenter = () => { el.classList.add("hover"); };
        el.onmouseleave = () => { el.classList.remove("hover"); };
        el.onclick = e => { e.stopPropagation(); this.selectedLink = el.dataset.link; this.selectedNode = null; this.renderInspector(); this.renderCanvas(); };
      });

      nodesG.querySelectorAll(".ds-node").forEach(el => {
        el.onmousedown = e => {
          if (e.target.classList?.contains("ds-port")) return;
          e.stopPropagation();
          const id = el.dataset.node;
          const prev = this.selectedNode;
          this.selectedNode = id; this.selectedLink = null;
          this.drag = { node: this.design.nodes.find(n => n.id === id) };
          this.renderInspector();
          this.renderCanvas();
        };
      });

      nodesG.querySelectorAll(".ds-port").forEach(el => {
        el.onmousedown = e => {
          e.stopPropagation();
          const nodeG = e.target.closest(".ds-node");
          const nodeId = nodeG?.dataset?.node;
          const portId = e.target.dataset.port;
          if (!nodeId || !portId) return;
          if (this.linkMode) {
            if (!this.linkFrom) {
              this.linkFrom = nodeId; this.linkFromPort = portId;
              this.toast("Select target port");
              this.renderCanvas();
            } else if (this.linkFrom !== nodeId) {
              this.createLink(this.linkFrom, this.linkFromPort, nodeId, portId);
            }
          }
        };
      });

      this.applyTransform();
    }

    renderMinimap() {
      if (!this.showMinimap) return;
      const svg = document.getElementById("ds-minimap-svg");
      const nodes = this.visibleNodes();
      if (!svg || !nodes.length) return;
      const xs = nodes.flatMap(n => [n.x, n.x + (n.w || 76)]);
      const ys = nodes.flatMap(n => [n.y, n.y + (n.h || 46)]);
      const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
      const scale = Math.min(120 / (maxX - minX + 1), 80 / (maxY - minY + 1), 0.15);
      svg.innerHTML = nodes.map(n => `<rect x="${(n.x - minX) * scale}" y="${(n.y - minY) * scale}" width="${(n.w||76)*scale}" height="${(n.h||46)*scale}" fill="rgba(2,200,255,.5)"/>`).join("");
    }

    renderInspector() {
      const box = document.getElementById("ds-inspector");
      const node = this.design.nodes.find(n => n.id === this.selectedNode);
      const link = this.design.links.find(l => l.id === this.selectedLink);
      if (node) {
        const mode = node.canvas === "room" ? "room" : "network";
        const ports = STN()?.getPorts?.(node.stencilId, mode) || [];
        box.innerHTML = `<h4>Device</h4>
          <label>Label<input id="ds-insp-label" value="${escapeAttr(node.label || "")}"/></label>
          <div class="ds-row2">
            <label>PID<input id="ds-insp-pid" value="${escapeAttr(node.pid || "")}"/></label>
            <label>Qty<input id="ds-insp-qty" type="number" min="1" value="${node.qty || 1}"/></label>
          </div>
          <div class="ds-row2">
            <label>Layer<select id="ds-insp-layer">${LAYERS.map(l => `<option value="${l}" ${node.layer === l ? "selected" : ""}>${LAYER_LABELS[l]}</option>`).join("")}</select></label>
            <label>Site<select id="ds-insp-site">${this.design.sites.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join("")}</select></label>
          </div>
          ${ports.length ? `<div class="ds-port-list">${ports.map(p => `<span class="ds-port-chip">${escapeHtml(p.id)}${p.poe ? " PoE" : ""}</span>`).join("")}</div>` : ""}`;
        const bind = (id, key, parse) => {
          document.getElementById(id).onchange = e => {
            node[key] = parse ? parse(e.target.value) : e.target.value;
            if (key === "label" || key === "pid") this.pushHistory(); else saveDesign(this.design);
            this.render();
          };
        };
        bind("ds-insp-label", "label"); bind("ds-insp-pid", "pid");
        bind("ds-insp-qty", "qty", v => Math.max(1, parseInt(v, 10) || 1));
        bind("ds-insp-layer", "layer");
        return;
      }
      if (link) {
        const mediaOpts = MEDIA_TYPES.map(m => `<option value="${m.id}" ${link.media === m.id ? "selected" : ""}>${m.label}</option>`).join("");
        box.innerHTML = `<h4>Link / Cable</h4>
          <label>Label<input id="ds-insp-llabel" value="${escapeAttr(link.label || "")}"/></label>
          <div class="ds-row2">
            <label>Media<select id="ds-insp-media">${mediaOpts}</select></label>
            <label>Length<input id="ds-insp-len" value="${escapeAttr(link.length || "5m")}"/></label>
          </div>
          <div class="ds-row2">
            <label>From port<input id="ds-insp-fp" value="${escapeAttr(link.fromPort || "")}"/></label>
            <label>To port<input id="ds-insp-tp" value="${escapeAttr(link.toPort || "")}"/></label>
          </div>`;
        [["ds-insp-llabel", "label"], ["ds-insp-media", "media"], ["ds-insp-len", "length"], ["ds-insp-fp", "fromPort"], ["ds-insp-tp", "toPort"]].forEach(([elid, key]) => {
          document.getElementById(elid).onchange = e => { link[key] = e.target.value; saveDesign(this.design); this.render(); };
        });
        return;
      }
      box.innerHTML = `<div class="ds-empty">Select device or link · L link · F fit · P present${this.tab === "room" ? " · [ ] switch rooms" : ""}</div>`;
    }

    renderPanel() {
      const body = document.getElementById("ds-panel-body");
      if (this.panelTab === "bom") {
        const bom = computeBom(this.design);
        const deco = this.design.nodes.filter(n => {
          const def = STN()?.getDef?.(n.stencilId, n.canvas === "room" ? "room" : "network");
          const pid = n.pid || def?.pid;
          return def?.decorative || !STN()?.isCcwEligible?.(def, pid);
        });
        body.innerHTML = `
          <div class="ds-bom-actions">
            <button type="button" class="ds-btn ds-export-ccw ds-export-ccw-block" id="ds-export-ccw-panel"${bom.length ? "" : " disabled"}>Export to CCW</button>
            <span class="ds-bom-actions-hint">CCW_Prep CSV · hardware PIDs from canvas</span>
          </div>
          ${bom.length ? `
          <table class="ds-table"><thead><tr><th>Item</th><th>PID</th><th>Qty</th></tr></thead>
          <tbody>${bom.map(b => `<tr><td title="${escapeAttr(b.pid)}">${escapeHtml((b.desc || b.pid).slice(0, 42))}</td><td class="ds-pid-cell">${escapeHtml(b.pid)}</td><td>${b.qty}</td></tr>`).join("")}</tbody></table>
          <div class="ds-bom-total">${bom.length} CCW lines · ${bom.reduce((s, b) => s + b.qty, 0)} qty</div>
          ${deco.length ? `<div class="ds-bom-deco">${deco.length} layout-only item(s) on canvas (tables, generic displays, credenza) — not in CCW export.</div>` : ""}
          <div class="ds-bom-deco">Licenses, Smart Net, copper/AV cabling, and services — quote in CCW or use Manual BOM.</div>
          <div style="padding:8px 12px"><button type="button" class="ds-btn" id="ds-add-bom">+ Manual BOM</button></div>` : `<div class="ds-empty">Generate from Intent or Gallery, then export to CCW</div>`}`;
        document.getElementById("ds-export-ccw-panel")?.addEventListener("click", () => this.exportCcw());
        document.getElementById("ds-add-bom")?.addEventListener("click", () => {
          const pid = prompt("PID:"); if (!pid) return;
          (this.design.bomOverrides ||= []).push({ pid, desc: prompt("Desc:", pid) || pid, qty: parseInt(prompt("Qty:", "1") || "1", 10), type: "manual" });
          this.pushHistory(); this.renderPanel();
        });
      } else if (this.panelTab === "cables") {
        const nodeIds = this.tab === "room" && this.activeRoomId
          ? new Set(this.design.nodes.filter(n => n.roomId === this.activeRoomId).map(n => n.id))
          : null;
        const cables = computeCables(this.design).filter(c => {
          if (!nodeIds) return true;
          const link = this.design.links.find(l => l.id === c.id);
          return link && nodeIds.has(link.from) && nodeIds.has(link.to);
        });
        body.innerHTML = cables.length ? `
          <table class="ds-table"><thead><tr><th>Label</th><th>From</th><th>Port</th><th>To</th><th>Media</th></tr></thead>
          <tbody>${cables.map(c => `<tr><td>${escapeHtml(c.label)}</td><td>${escapeHtml(c.from.slice(0, 10))}</td><td>${escapeHtml(c.fromPort)}</td><td>${escapeHtml(c.to.slice(0, 10))}</td><td>${escapeHtml(c.media)}</td></tr>`).join("")}</tbody></table>` : `<div class="ds-empty">Link mode (L) — click ports to connect</div>`;
      } else if (this.panelTab === "suggest") {
        const suggestions = getSuggestions(this.design);
        const poe = validateDesign(this.design).poe;
        body.innerHTML = `
          ${poe ? `<div class="ds-poe-bar">PoE: ${poe.load}W / ${poe.budget}W (${poe.headroom}W headroom)</div>` : ""}
          <div class="ds-suggest-list">${suggestions.length ? suggestions.map(s => `
            <button type="button" class="ds-suggest-btn" data-sid="${s.id}">${escapeHtml(s.label)}</button>`).join("") : `<div class="ds-empty">Design looks complete ✓</div>`}
          </div>
          <div style="padding:8px"><button type="button" class="ds-btn primary" id="ds-apply-all-sug">Apply all suggestions</button></div>`;
        body.querySelectorAll(".ds-suggest-btn").forEach(btn => {
          btn.onclick = () => {
            const s = suggestions.find(x => x.id === btn.dataset.sid);
            if (RULES()?.applyFix?.(this.design, s, uid, STN())) { this.pushHistory(); this.render(); this.toast("Applied"); }
          };
        });
        document.getElementById("ds-apply-all-sug")?.addEventListener("click", () => {
          let n = 0;
          getSuggestions(this.design).forEach(s => { if (RULES()?.applyFix?.(this.design, s, uid, STN())) n++; });
          if (n) { this.pushHistory(); this.render(); this.toast(`Applied ${n} suggestions`); }
        });
      } else if (this.panelTab === "sites") {
        body.innerHTML = `<div style="padding:12px;font-size:11px">
          ${this.design.sites.map(s => `<div style="margin-bottom:8px"><strong>${escapeHtml(s.name)}</strong> (${s.type})</div>`).join("")}
          <button type="button" class="ds-btn" id="ds-add-site">+ Add site</button></div>`;
        document.getElementById("ds-add-site")?.addEventListener("click", () => {
          const name = prompt("Site name:"); if (!name) return;
          this.design.sites.push({ id: uid(), name, type: "branch" });
          this.pushHistory(); this.renderPanel();
        });
      } else {
        const val = validateDesign(this.design);
        const score = computeScore(this.design);
        body.innerHTML = `
          <div class="ds-score-panel">Design score: <strong>${score}/100</strong></div>
          ${val.warnings.length ? `<ul class="ds-val-list error">${val.warnings.map(w => `<li>${escapeHtml(w.msg || w)}</li>`).join("")}</ul>` : `<div class="ds-empty" style="color:var(--accent)">✓ No blocking issues</div>`}
          ${val.tips.length ? `<ul class="ds-val-list tip">${val.tips.map(t => `<li>${escapeHtml(t.msg || t)}</li>`).join("")}</ul>` : ""}`;
      }
    }

    applyTransform() {
      document.getElementById("ds-viewport")?.setAttribute("transform", `translate(${this.pan.x},${this.pan.y}) scale(${this.pan.zoom})`);
    }

    clientToSvg(cx, cy) {
      const rect = document.getElementById("ds-svg").getBoundingClientRect();
      return { x: (cx - rect.left - this.pan.x) / this.pan.zoom, y: (cy - rect.top - this.pan.y) / this.pan.zoom };
    }

    onSvgDown(e) { if (!e.target.closest(".ds-node") && !e.target.closest(".ds-link-path") && !e.target.closest(".ds-port")) this.panDrag = { ox: e.clientX, oy: e.clientY, px: this.pan.x, py: this.pan.y }; }

    onSvgMove(e) {
      if (this.drag?.node) {
        const pt = this.clientToSvg(e.clientX, e.clientY);
        let nx = pt.x - (this.drag.node.w || 76) / 2, ny = pt.y - (this.drag.node.h || 46) / 2;
        if (this.design.snapGrid !== false) { nx = snap(nx); ny = snap(ny); }
        this.drag.node.x = nx; this.drag.node.y = ny;
        this.updateNodeDragPosition(this.drag.node);
        return;
      }
      if (this.panDrag) {
        this.pan.x = this.panDrag.px + (e.clientX - this.panDrag.ox);
        this.pan.y = this.panDrag.py + (e.clientY - this.panDrag.oy);
        this.applyTransform();
      }
    }

    onSvgUp() { if (this.drag) this.pushHistory(); this.drag = null; this.panDrag = null; }

    onWheel(e) {
      e.preventDefault();
      this.pan.zoom = Math.max(0.2, Math.min(3, this.pan.zoom * (e.deltaY > 0 ? 0.92 : 1.08)));
      this.applyTransform();
    }

    fitView() {
      const nodes = this.visibleNodes();
      if (!nodes.length) { this.pan = { x: 40, y: 40, zoom: 1 }; this.applyTransform(); return; }
      const xs = nodes.flatMap(n => [n.x, n.x + (n.w || 76)]);
      const ys = nodes.flatMap(n => [n.y, n.y + (n.h || 46)]);
      const rect = document.getElementById("ds-svg").getBoundingClientRect();
      const pad = this.tab === "room" ? 120 : 80, w = Math.max(...xs) - Math.min(...xs) + pad * 2, h = Math.max(...ys) - Math.min(...ys) + pad * 2;
      const maxZoom = this.tab === "room" ? 1.25 : 1.1;
      this.pan.zoom = Math.max(0.25, Math.min(rect.width / w, rect.height / h, maxZoom));
      this.pan.x = pad - Math.min(...xs) * this.pan.zoom;
      this.pan.y = pad - Math.min(...ys) * this.pan.zoom;
      this.applyTransform();
    }

    toast(msg) { if (typeof showToast === "function") showToast(msg); else console.log("[Design Studio]", msg); }
  }

  function escapeHtml(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); }
  function escapeAttr(s) { return escapeHtml(s).replace(/'/g, "&#39;"); }
  function $$(sel, root) { return [...(root || document).querySelectorAll(sel)]; }

  const studio = new DesignStudio();
  function initDesignStudio() {
    studio.mount();
    const btn = document.getElementById("design-studio-btn");
    if (btn && !btn.dataset.wired) { btn.dataset.wired = "1"; btn.addEventListener("click", () => studio.open()); }
  }

  window.DesignStudio = { open: () => studio.open(), close: () => studio.close(), instance: studio };
  window.initDesignStudio = initDesignStudio;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initDesignStudio);
  else initDesignStudio();
})();

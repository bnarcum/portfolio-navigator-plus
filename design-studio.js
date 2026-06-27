/**
 * Portfolio Navigator Plus — Design Studio v3
 * Netformx-style: SVG stencils, port links, template gallery, rules engine
 */
(function DesignStudioModule() {
  "use strict";

  const STORAGE_KEY = "cpn-design-studio-v4";
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
  const ROOM_LAYOUT_OX = 100;
  const ROOM_LAYOUT_OY = 132;
  const ROOM_ZONE_GAP = 18;
  const ROOM_ZONE_MIN_H = 78;
  const ROOM_ZONE_PAD = 16;
  const ROOM_ITEM_GAP = 28;
  const ROOM_ROW_GAP = 22;
  const ROOM_ZONE_TYPE = { display: "video", ceiling: "audio", table: "furniture", rack: "network" };
  /** @deprecated kept for minimap compat */
  const LAYER_Y = { wan: 40, security: 120, core: 200, distribution: 300, access: 400, mgmt: 500, collab: 580, dc: 260 };

  const LINK_MEDIA_STYLE = {
    "fiber-sm": { stroke: "#6eb8ff", w: 2.25 },
    "fiber-mm": { stroke: "#6eb8ff", w: 2.25 },
    "fiber-40g": { stroke: "#88a8ff", w: 2.5 },
    dac: { stroke: "#88a8ff", w: 2.25 },
    hdmi: { stroke: "#5ce0a8", w: 2.5, dash: "8 5" },
    "usb-c": { stroke: "#5ce0a8", w: 2, dash: "5 3" },
    speaker: { stroke: "#c8a0e8", w: 2, dash: "4 3" },
    control: { stroke: "#c8a0e8", w: 2, dash: "4 3" },
    wireless: { stroke: "#88aacc", w: 2, dash: "3 4" },
    cat6a: { stroke: "#e8b870", w: 2.25 },
    cat6: { stroke: "#d4a060", w: 2.25 }
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
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) { const d = JSON.parse(raw); return { ...emptyDesign(), ...d, version: 4 }; }
      const legacy = localStorage.getItem("cpn-design-studio-v3");
      if (legacy) {
        const d = JSON.parse(legacy);
        const fresh = emptyDesign(d.account || document.querySelector("#acct-name")?.value?.trim() || "Untitled Design");
        fresh.requirements.notes = d.requirements?.notes || "";
        return fresh;
      }
      for (const k of ["cpn-design-studio-v2", "cpn-design-studio-v1"]) {
        const old = localStorage.getItem(k);
        if (old) { const d = JSON.parse(old); return { ...emptyDesign(), ...d, version: 4 }; }
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

  function displayNodeLabel(label) {
    if (!label) return "";
    return String(label).replace(/^Room \d+\s+/, "");
  }

  function roomPillLabel(room, idx) {
    const tpl = TPL()?.ROOM_TEMPLATES?.[room.template];
    const typeMap = {
      huddle: "Huddle", conference: "Conf", boardroom: "Board", training: "Train",
      executive: "Exec", teamsRoom: "Teams", zoomRoom: "Zoom", ctMediumDualDisplay: "Dual",
      ctSmallCollab: "Small", divisible: "Div"
    };
    const short = typeMap[room.template] || (tpl?.category || "Room").slice(0, 5);
    return `${idx} ${short}`;
  }

  function roundedOrthoPath(pts, r) {
    if (!pts || pts.length < 2) return "";
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[i + 1] || [x1, y1];
      if (i === pts.length - 1) {
        d += ` L ${x1} ${y1}`;
        continue;
      }
      const dx1 = x1 - x0, dy1 = y1 - y0;
      const dx2 = x2 - x1, dy2 = y2 - y1;
      const l1 = Math.hypot(dx1, dy1) || 1;
      const l2 = Math.hypot(dx2, dy2) || 1;
      const cr = Math.min(r, l1 / 2, l2 / 2);
      const ex = x1 - (dx1 / l1) * cr;
      const ey = y1 - (dy1 / l1) * cr;
      const nx = x1 + (dx2 / l2) * cr;
      const ny = y1 + (dy2 / l2) * cr;
      d += ` L ${ex} ${ey} Q ${x1} ${y1} ${nx} ${ny}`;
    }
    return d;
  }

  function getActiveRoomBounds(studio, nodes) {
    const roomId = studio.activeRoomId || nodes.find(n => n.roomId)?.roomId;
    if (!roomId) return null;
    const room = studio.design.rooms.find(r => r.id === roomId);
    if (!room) return null;
    const tpl = TPL()?.ROOM_TEMPLATES?.[room.template];
    const zones = room.computedZones || tpl?.zones;
    if (!zones) return null;
    const ox = room.layoutOrigin?.x ?? ROOM_LAYOUT_OX;
    const oy = room.layoutOrigin?.y ?? ROOM_LAYOUT_OY;
    let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
    Object.values(zones).forEach(z => {
      left = Math.min(left, ox + z.x);
      right = Math.max(right, ox + z.x + z.w);
      top = Math.min(top, oy + z.y);
      bottom = Math.max(bottom, oy + z.y + z.h);
    });
    return { left, right, top, bottom, ox, oy };
  }

  function roomLinkRoute(ax, ay, bx, by, offset, media, bounds) {
    const isAV = ["hdmi", "usb", "speaker", "control"].includes(media);
    const margin = 18;
    const laneX = isAV ? bounds.right + margin + offset : bounds.left - margin + offset;
    return roundedOrthoPath([[ax, ay], [laneX, ay], [laneX, by], [bx, by]], 10);
  }

  function linkPathFor(ax, ay, bx, by, offset, media, ctx) {
    if (ctx?.room && ctx.bounds) return roomLinkRoute(ax, ay, bx, by, offset, media || "cat6", ctx.bounds);
    return linkRoute(ax, ay, bx, by, offset);
  }

  function linkRoute(ax, ay, bx, by, offset) {
    const dx = bx - ax, dy = by - ay;
    const adx = Math.abs(dx), ady = Math.abs(dy);
    const dist = Math.hypot(dx, dy);
    if (dist < 14) {
      if (dist < 2.5) return `M ${ax} ${ay} L ${bx} ${by}`;
      const mx = (ax + bx) / 2, my = (ay + by) / 2;
      if (adx >= ady) return `M ${ax} ${ay} Q ${mx + offset * 0.45} ${my} ${bx} ${by}`;
      return `M ${ax} ${ay} Q ${mx} ${my + offset * 0.45} ${bx} ${by}`;
    }
    const r = Math.min(20, Math.max(5, Math.min(adx, ady) * 0.28));
    if (adx >= ady) {
      const mx = (ax + bx) / 2 + offset;
      if (ady < r * 2.5) {
        const t = Math.min(adx * 0.42, 64);
        return `M ${ax} ${ay} C ${ax + t} ${ay}, ${bx - t} ${by}, ${bx} ${by}`;
      }
      const sy = dy >= 0 ? 1 : -1;
      const hx1 = mx - r, hx2 = mx + r;
      return `M ${ax} ${ay} H ${hx1} C ${mx} ${ay} ${mx} ${ay} ${mx} ${ay + r * sy} V ${by - r * sy} C ${mx} ${by} ${mx} ${by} ${hx2} ${by} H ${bx}`;
    }
    const my = (ay + by) / 2 + offset;
    if (adx < r * 2.5) {
      const t = Math.min(ady * 0.42, 64);
      return `M ${ax} ${ay} C ${ax} ${ay + t}, ${bx} ${by - t}, ${bx} ${by}`;
    }
    const sx = dx >= 0 ? 1 : -1;
    const vy1 = my - r, vy2 = my + r;
    return `M ${ax} ${ay} V ${vy1} C ${ax} ${my} ${ax} ${my} ${ax + r * sx} ${my} H ${bx - r * sx} C ${bx} ${my} ${bx} ${my} ${bx} ${vy2} V ${by}`;
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

  const LAYER_BAND_STYLE = {
    wan: { accent: "#02C8FF", fill: "0.06", stroke: "0.22" },
    security: { accent: "#FF007F", fill: "0.05", stroke: "0.18" },
    core: { accent: "#0A60FF", fill: "0.07", stroke: "0.24" },
    distribution: { accent: "#3070E5", fill: "0.05", stroke: "0.18" },
    dc: { accent: "#6080FF", fill: "0.05", stroke: "0.18" },
    access: { accent: "#02C8FF", fill: "0.05", stroke: "0.2" },
    mgmt: { accent: "#B4B9C0", fill: "0.04", stroke: "0.14" },
    collab: { accent: "#44CC88", fill: "0.05", stroke: "0.18" }
  };

  function layerBandSvg(layer, x, bandH) {
    const st = LAYER_BAND_STYLE[layer] || LAYER_BAND_STYLE.access;
    const w = LAYER_COL_W;
    const title = LAYER_LABELS[layer] || layer;
    const parts = String(title).split(/\s*\/\s*/);
    const titleY = parts.length > 1 ? 66 : 70;
    const titleSvg = parts.length === 1
      ? `<text class="ds-layer-title" x="${x + w / 2}" y="${titleY}" text-anchor="middle">${escapeHtml(parts[0])}</text>`
      : `<text class="ds-layer-title" x="${x + w / 2}" y="${titleY - 5}" text-anchor="middle">${parts.map((p, i) =>
        `<tspan x="${x + w / 2}" dy="${i ? 11 : 0}">${escapeHtml(p.trim())}</tspan>`).join("")}</text>`;
    return `<g class="ds-layer-col ds-layer-col-${layer}">
      <defs>
        <linearGradient id="ds-band-${layer}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${st.accent}" stop-opacity="${st.fill}"/>
          <stop offset="55%" stop-color="${st.accent}" stop-opacity="0.02"/>
          <stop offset="100%" stop-color="${st.accent}" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect class="ds-layer-band" x="${x}" y="76" width="${w}" height="${bandH}" rx="14"
        fill="url(#ds-band-${layer})" stroke="${st.accent}" stroke-opacity="${st.stroke}" stroke-width="1"/>
      <rect class="ds-layer-pill" x="${x + 10}" y="52" width="${w - 20}" height="24" rx="12"
        fill="rgba(4,16,31,0.88)" stroke="${st.accent}" stroke-opacity="0.35" stroke-width="1"/>
      ${titleSvg}
    </g>`;
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

  function computeLinkOffsets(links, roomMode) {
    const offsets = new Map();
    const byPair = {};
    const byFrom = {};
    links.forEach(l => {
      const key = [l.from, l.to].sort().join("|");
      (byPair[key] ||= []).push(l);
      (byFrom[l.from] ||= []).push(l);
    });
    Object.values(byPair).forEach(bucket => {
      bucket.forEach((l, i) => {
        offsets.set(l.id, (offsets.get(l.id) || 0) + (i - (bucket.length - 1) / 2) * 14);
      });
    });
    if (roomMode) {
      Object.values(byFrom).forEach(bucket => {
        bucket.sort((a, b) => String(a.id).localeCompare(String(b.id)));
        bucket.forEach((l, i) => {
          const lane = ["hdmi", "usb", "speaker", "control"].includes(l.media) ? 1 : 0;
          const fan = (i - (bucket.length - 1) / 2) * 11;
          offsets.set(l.id, (offsets.get(l.id) || 0) + fan + lane * 4);
        });
      });
    }
    return offsets;
  }

  const ROOM_LABEL_BELOW = 34;

  function roomNodeVisualH(n, def) {
    const nh = n.h || def?.h || 46;
    const pid = n.pid || def?.pid;
    const hasPid = pid && !/^N\/A/i.test(pid) && !def?.decorative && def?.shape !== "table";
    return nh + (hasPid ? ROOM_LABEL_BELOW : 20);
  }

  function layoutZoneEntries(zone, entries, baseX, baseY, snapGrid) {
    const pad = ROOM_ZONE_PAD;
    const labelHead = 24;
    if (!entries.length) return;
    const innerW = Math.max(zone.w - pad * 2, 96);
    const innerH = Math.max(zone.h - pad * 2 - labelHead, 64);
    entries.sort((a, b) => a.item.relX - b.item.relX);
    entries.forEach(e => {
      const def = STN()?.getDef?.(e.n.stencilId, "room");
      const nw = e.n.w || def?.w || 76;
      const visualH = roomNodeVisualH(e.n, def);
      const cx = zone.x + pad + e.item.relX * innerW;
      const cy = zone.y + pad + labelHead + e.item.relY * innerH;
      let x = cx - nw / 2;
      let y = cy - visualH / 2;
      x = Math.max(zone.x + pad, Math.min(x, zone.x + zone.w - pad - nw));
      y = Math.max(zone.y + pad + labelHead, Math.min(y, zone.y + zone.h - pad - visualH));
      e.n.x = snapGrid ? snap(baseX + x) : baseX + x;
      e.n.y = snapGrid ? snap(baseY + y) : baseY + y;
    });
    for (let i = 1; i < entries.length; i++) {
      const prev = entries[i - 1];
      const cur = entries[i];
      const pdef = STN()?.getDef?.(prev.n.stencilId, "room");
      const cdef = STN()?.getDef?.(cur.n.stencilId, "room");
      const gap = 12;
      const prevRight = prev.n.x + (prev.n.w || pdef?.w || 76) + gap;
      const curW = cur.n.w || cdef?.w || 76;
      if (cur.n.x < prevRight) {
        cur.n.x = Math.min(prevRight, zone.x + zone.w - pad - curW);
      }
    }
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
          return e.n.y + roomNodeVisualH(e.n, def);
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
        n.y = LAYER_START_Y + i * Math.max(LAYER_ROW_H, nh + (window.__DS_PHOTOS?.resolveUrl?.(n.stencilId, def) ? 44 : 36));
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
      this.tab = "intent"; this.panelTab = "bom";
      this.selectedNode = null; this.selectedLink = null;
      this.linkFrom = null; this.linkFromPort = null; this.linkMode = false;
      this.drag = null; this.pan = { x: 40, y: 40, zoom: 1 };
      this.layerFilter = "all"; this.paletteFilter = "";
      this.presentation = false; this.showPorts = false; this.showMinimap = true;
      this.activeRoomId = null;
      this.lastPillarId = null;
      this.customRoomMix = null;
      this.roomView = "diagram";
      this.storyMode = false;
      this.storyChapter = 0;
      this.highlightPid = null;
      this.staleBannerDismissed = null;
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
          <span id="ds-version" class="ds-version" title="Design Studio build"></span>
          <div id="ds-score-badge" title="Design completeness score">—</div>
          <div id="ds-tabs">
            <button type="button" data-tab="intent" class="active">Intent</button>
            <button type="button" data-tab="network">Network</button>
            <button type="button" data-tab="room">Room</button>
          </div>
          <span class="ds-spacer"></span>
          <button type="button" class="ds-btn" id="ds-gallery" title="Template gallery">Gallery</button>
          <button type="button" class="ds-btn" id="ds-present" title="Story walkthrough — use Next step or arrow keys">Story</button>
          <button type="button" class="ds-btn" id="ds-tour" title="Start guided tour (optional)">Tour</button>
          <button type="button" class="ds-btn" id="ds-share-design" title="Shareable .cpn-design bundle">Share</button>
          <button type="button" class="ds-btn" id="ds-customer-export" title="Customer-safe SVG export">Customer SVG</button>
          <input type="file" id="ds-import-design" accept=".json,.cpn-design.json,application/json" hidden/>
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
              <div id="ds-room-mix-editor" hidden></div>
              <div id="ds-stale-hint" class="ds-stale-hint" hidden></div>
              <textarea id="ds-intent-text" placeholder="e.g. SNRA campus + 12 conference rooms and 6 huddles — or AI-ready DC spine-leaf with GPU compute…"></textarea>
              <div id="ds-intent-rationale" hidden></div>
              <div id="ds-explore-intent"></div>
              <div class="ds-intent-section">
                <div class="ds-intent-section-head"><strong>Quick start</strong><span>Click to fill the brief</span></div>
                <div class="ds-templates" id="ds-templates"></div>
              </div>
              <div class="ds-intent-section">
                <div class="ds-intent-section-head"><strong>Reference architectures</strong><span>Or open <em>Gallery</em> for full library</span></div>
                <div class="ds-arch-row" id="ds-arch-presets"></div>
              </div>
              <div id="ds-compare" class="ds-compare-wrap"></div>
              <div class="ds-intent-actions">
                <button type="button" class="ds-btn primary" id="ds-generate">Generate Draft</button>
                <button type="button" class="ds-btn" id="ds-clear">Start Over</button>
              </div>
            </div>
            <div id="ds-canvas-wrap" class="network-mode">
              <div id="ds-walk-overlay" hidden aria-hidden="true"></div>
              <div id="ds-canvas-vignette" aria-hidden="true"></div>
              <div id="ds-canvas-ambient" aria-hidden="true"></div>
              <div id="ds-stale-banner" class="ds-stale-banner" hidden></div>
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
              <button type="button" data-panel="engineer">Engineer</button>
              <button type="button" data-panel="cables">Cables</button>
              <button type="button" data-panel="suggest">Suggest</button>
              <button type="button" data-panel="validate">Validate</button>
              <button type="button" data-panel="sites">Sites</button>
            </div>
            <div id="ds-panel-body"></div>
            <div id="ds-explore-dock" hidden></div>
            <div id="ds-status">
              <div id="ds-stale-status" class="ds-stale-status" hidden></div>
              <div class="ds-status-row"><span id="ds-status-left"></span><span id="ds-status-right"></span></div>
            </div>
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
            <p class="ds-gallery-explore-hint">Each template links to validated guides and dCloud labs — click a card to add it, or use the links to learn first.</p>
          </div>
        </div>`;
      document.body.appendChild(root);
      this.el = root;
      this.buildToolbar();
      this.ensureSymbolDefs();
      this.wireEvents();
      this.wireOneCiscoPillars();
      this.observeCanvasResize();
      this.populateTemplates();
      this.populateArchPresets();
      this.buildGallery();
      this.previewIntent();
      window.__DS_PREMIUM?.renderCompare?.(this);
      const ver = document.getElementById("ds-version");
      if (ver) ver.textContent = "v" + (window.__cpnV2?.APP_VERSION || window.__DS_ASSET_V || "?");
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
        <button type="button" id="ds-walk-corridor" class="ds-walk-toolbar" hidden title="3D path walkthrough (WASD)">Walk</button>
        <button type="button" id="ds-walk-retro" class="ds-walk-toolbar" hidden title="Retro network dungeon">Retro</button>
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
        this.switchToRoom(e.target.value || null);
      };
      $("ds-link-mode").onclick = () => this.toggleLinkMode();
      $("ds-ports").onclick = () => { this.showPorts = !this.showPorts; $("ds-ports").classList.toggle("active", this.showPorts); $("ds-ports").textContent = "Ports: " + (this.showPorts ? "on" : "off"); this.renderCanvas(); };
      $("ds-delete-sel").onclick = () => this.deleteSelected();
      $("ds-dup").onclick = () => this.duplicateSelected();
      $("ds-fit").onclick = () => this.fitView();
      $("ds-walk-corridor")?.addEventListener("click", () => window.__DS_WALK?.open?.(this, "corridor"));
      $("ds-walk-retro")?.addEventListener("click", () => window.__DS_WALK?.open?.(this, "retro"));
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
      $("ds-present").onclick = () => {
        if (window.__DS_PREMIUM?.toggleStory) window.__DS_PREMIUM.toggleStory(this);
        else this.togglePresentation();
      };
      $("ds-tour")?.addEventListener("click", () => window.__DS_PREMIUM?.runTour?.(this, 0));
      $("ds-share-design")?.addEventListener("click", () => window.__DS_PREMIUM?.exportDesignBundle?.(this));
      $("ds-customer-export")?.addEventListener("click", () => window.__DS_PREMIUM?.exportCustomerSvg?.(this));
      const importInp = $("ds-import-design");
      if (importInp && !importInp.dataset.wired) {
        importInp.dataset.wired = "1";
        importInp.addEventListener("change", e => {
          window.__DS_PREMIUM?.importDesignBundle?.(this, e.target.files?.[0]);
          e.target.value = "";
        });
      }
      $("ds-share-design")?.addEventListener("contextmenu", e => {
        e.preventDefault();
        importInp?.click();
      });
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
        if (e.key === "p" && !(e.metaKey || e.ctrlKey)) {
          if (window.__DS_PREMIUM?.toggleStory) window.__DS_PREMIUM.toggleStory(this);
          else this.togglePresentation();
        }
        if (this.storyMode && e.key === "ArrowLeft") { e.preventDefault(); window.__DS_PREMIUM?.goStoryChapter?.(this, this.storyChapter - 1); }
        if (this.storyMode && e.key === "ArrowRight") { e.preventDefault(); window.__DS_PREMIUM?.goStoryChapter?.(this, this.storyChapter + 1); }
        if (e.key === "[" && this.tab === "room") this.cycleRoom(-1);
        if (e.key === "]" && this.tab === "room") this.cycleRoom(1);
        if (e.key === "/") { e.preventDefault(); $("ds-palette-search")?.focus(); }
        if (e.key === "Escape") { if (document.getElementById("ds-gallery-modal")?.hidden === false) this.closeGallery(); else this.close(); }
      });
    }

    refreshExplore() {
      window.__DS_EXPLORE?.refresh?.(this);
    }

    wireOneCiscoPillars() {
      const deck = document.getElementById("ds-one-cisco-deck");
      if (!deck) return;
      const byId = Object.fromEntries(ONE_CISCO_STORY.pillars.map(p => [p.id, p]));
      deck.querySelectorAll("[data-pillar]").forEach(btn => {
        btn.onclick = () => {
          const pillar = byId[btn.dataset.pillar];
          if (!pillar?.intent) return;
          this.lastPillarId = pillar.id;
          const ta = document.getElementById("ds-intent-text");
          if (ta) {
            ta.value = pillar.intent;
            ta.focus();
          }
          this.toast(`Brief loaded — click Generate Draft for ${pillar.shortLabel || pillar.label}`);
          const gen = document.getElementById("ds-generate");
          gen?.classList.add("ds-pulse-cta");
          setTimeout(() => gen?.classList.remove("ds-pulse-cta"), 2400);
          this.previewIntent();
          this.refreshExplore();
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
      const explore = window.__DS_EXPLORE;
      if (!grid) return;
      if (gtab === "room") {
        grid.innerHTML = Object.entries(TPL()?.ROOM_TEMPLATES || {}).map(([key, t]) => `
          <div class="ds-gallery-card" data-room="${key}">
            <div class="ds-gallery-thumb room">${t.category || "Room"}</div>
            <strong>${escapeHtml(t.name)}</strong>
            <span>${t.items?.length || 0} devices · ${t.links?.length || 0} links</span>
            ${t.ct ? `<small class="ds-cvd-ref" title="${escapeAttr(t.ctUrl || "")}">CT: ${escapeHtml(t.ct)}</small>` : ""}
            ${explore?.cardFooter ? explore.cardFooter("room", key) : ""}
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
            ${explore?.cardFooter ? explore.cardFooter("network", key) : ""}
          </div>`).join("");
        grid.querySelectorAll("[data-net]").forEach(el => {
          el.onclick = () => { this.applyRefArch(el.dataset.net); this.closeGallery(); };
        });
      }
      explore?.refresh?.(this);
      grid.querySelectorAll("[data-stop-card]").forEach(el => el.addEventListener("click", e => e.stopPropagation()));
      grid.querySelectorAll("[data-browse-query]").forEach(btn => {
        btn.addEventListener("click", e => {
          e.stopPropagation();
          const q = btn.getAttribute("data-browse-query") || "";
          if (typeof window.openDcloudBrowser === "function") window.openDcloudBrowser({ query: q });
        });
      });
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

    switchToRoom(roomId) {
      if (!roomId || roomId === this.activeRoomId) return;
      window.__DS_WALK?.close?.();
      this.roomView = "diagram";
      this.activeRoomId = roomId;
      this.design.activeRoomId = roomId;
      this.updateRoomPicker();
      this.renderRoomGuide();
      this.renderCanvas();
      requestAnimationFrame(() => this.fitView());
      this.renderInspector();
    }

    cycleRoom(dir) {
      const rooms = this.design.rooms;
      if (!rooms.length) return;
      const idx = Math.max(0, rooms.findIndex(r => r.id === this.activeRoomId));
      const next = rooms[(idx + dir + rooms.length) % rooms.length];
      this.switchToRoom(next.id);
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
      const ta = document.getElementById("ds-intent-text");
      if (ta) ta.value = this.design.requirements?.notes || "";
      this.previewIntent();
      this.setTab("intent");
      this.render();
      setTimeout(() => this.refreshExplore(), 500);
    }

    close() {
      saveDesign(this.design);
      window.__DS_PREMIUM?.plannerSyncHint?.(this);
      if (this.storyMode) window.__DS_PREMIUM?.exitStory?.(this);
      this.el?.classList.remove("open");
      this.el?.classList.remove("ds-present-mode");
      document.body.classList.remove("design-studio-open");
    }

    setTab(tab) {
      this.tab = tab;
      if (tab !== "room" && tab !== "network") window.__DS_WALK?.close?.();
      if (tab === "network" || tab === "room") this.design.mode = tab;
      if (tab === "room" && !this.activeRoomId && this.design.rooms.length)
        this.activeRoomId = this.design.rooms[0].id;
      $$("#ds-tabs button").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
      document.getElementById("ds-intent").hidden = tab !== "intent";
      document.getElementById("ds-canvas-wrap").hidden = tab === "intent";
      const wrap = document.getElementById("ds-canvas-wrap");
      wrap.classList.toggle("room-mode", tab === "room");
      wrap.classList.toggle("network-mode", tab === "network");
      const showWalk = tab === "room" || tab === "network";
      document.getElementById("ds-walk-corridor")?.toggleAttribute("hidden", !showWalk);
      document.getElementById("ds-walk-retro")?.toggleAttribute("hidden", !showWalk);
      this.updateRoomPicker();
      this.renderRoomGuide();
      if (tab !== "intent") {
        this.renderPalette();
        this.renderCanvas();
        this.scheduleFitView();
      }
      this.renderPanel();
      this.refreshExplore();
      window.__DS_PREMIUM?.refresh?.(this);
    }

    renderRoomGuide() {
      let bar = document.getElementById("ds-room-guide");
      if (!bar) {
        bar = document.createElement("div");
        bar.id = "ds-room-guide";
        document.getElementById("ds-canvas-wrap")?.prepend(bar);
      }
      if (this.tab !== "room" || !this.activeRoomId) { bar.hidden = true; return; }
      const room = this.design.rooms.find(r => r.id === this.activeRoomId);
      const tpl = room ? TPL()?.ROOM_TEMPLATES?.[room.template] : null;
      if (!tpl) { bar.hidden = true; return; }
      const cite = tpl.ctUrl || "";
      const citeLabel = tpl.ct || "Cisco hybrid work design guide";
      const idx = this.design.rooms.findIndex(r => r.id === this.activeRoomId) + 1;
      const total = this.design.rooms.length;
      const multi = total > 1;
      const pills = this.design.rooms.map((r, i) => {
        const active = r.id === this.activeRoomId ? " active" : "";
        return `<button type="button" class="ds-room-pill${active}" data-room-id="${r.id}" title="${escapeAttr(r.name)}">${escapeHtml(roomPillLabel(r, i + 1))}</button>`;
      }).join("");
      bar.hidden = false;
      bar.innerHTML = `<div class="ds-room-guide-head">
          <span class="ds-room-badge" aria-live="polite">Room ${idx} of ${total}</span>
          <span class="ds-room-guide-title">${escapeHtml(room.name)}</span>
          <span class="ds-room-guide-meta">${escapeHtml(tpl.category || "Room")} · PoE switch feeds endpoints per CT</span>
          ${cite ? `<a class="ds-room-guide-link" href="${escapeAttr(cite)}" target="_blank" rel="noopener">${escapeHtml(citeLabel)} ↗</a>` : ""}
        </div>
        ${multi ? `<div id="ds-room-nav" class="ds-room-nav" role="navigation" aria-label="Room navigator">
          <button type="button" class="ds-room-nav-btn ds-room-nav-prev" title="Previous room">‹</button>
          <div class="ds-room-nav-strip">${pills}</div>
          <button type="button" class="ds-room-nav-btn ds-room-nav-next" title="Next room">›</button>
        </div>` : ""}`;
      bar.querySelector(".ds-room-nav-prev")?.addEventListener("click", () => this.cycleRoom(-1));
      bar.querySelector(".ds-room-nav-next")?.addEventListener("click", () => this.cycleRoom(1));
      bar.querySelectorAll(".ds-room-pill").forEach(btn => {
        btn.addEventListener("click", () => this.switchToRoom(btn.dataset.roomId));
      });
      window.__DS_PREMIUM?.renderRoomViewToggle?.(this);
    }

    updateRoomPicker() {
      const sel = document.getElementById("ds-room-picker");
      if (!sel) return;
      const show = this.tab === "room" && this.design.rooms.length === 1;
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
      const hint = document.getElementById("ds-stale-hint");
      if (hint) {
        const planned = parsed.roomMix.reduce((s, r) => s + r.count, 0);
        const existing = this.design.rooms.length;
        const needsRegen = planned > 0 && (existing === 0 || existing !== planned || !this.design.intentPlan);
        if (needsRegen && text) {
          hint.hidden = false;
          hint.innerHTML = planned > 1
            ? `<strong>Ready to build ${planned} rooms</strong> — click <em>Generate Draft</em> to replace the canvas with your cited portfolio (network + ${planned} collaboration spaces).`
            : `<strong>Brief parsed</strong> — click <em>Generate Draft</em> to apply it to the canvas.`;
        } else hint.hidden = true;
      }
      window.__DS_PREMIUM?.renderRoomMixEditor?.(this, parsed);
      this.refreshExplore();
    }

    runGenerate() {
      const INT = window.__DS_INTENT;
      const text = document.getElementById("ds-intent-text").value.trim();
      if (!text) { this.toast("Enter a description"); return; }
      if (!INT?.generateFromIntent) { this.toast("Intent engine not loaded — hard-refresh (⌘⇧R) to load v2.47+"); return; }
      const opts = this.customRoomMix?.length ? { roomMix: this.customRoomMix } : undefined;
      const { plan, score, fixes } = INT.generateFromIntent(text, this.design, intentDeps(), opts);
      if (this.design.nodes.some(n => n.canvas !== "room")) autoLayoutNetwork(this.design);
      this.design.rooms.forEach(r => autoLayoutRoom(this.design, r.id));
      this.activeRoomId = this.design.activeRoomId || this.design.rooms[0]?.id || null;
      this.pushHistory();
      this.customRoomMix = null;
      this.staleBannerDismissed = null;
      const rat = document.getElementById("ds-intent-rationale");
      if (rat) {
        rat.hidden = false;
        rat.innerHTML = INT.renderRationaleHtml(plan, score, fixes);
      }
      this.previewIntent();
      const roomTotal = plan.roomPlan.reduce((s, r) => s + r.count, 0);
      this.toast(roomTotal
        ? `Built ${roomTotal} rooms + ${plan.netKey ? "network" : "collab only"} · Score ${score}/100`
        : `Draft generated · Score ${score}/100`);
      const hasNet = this.design.nodes.some(n => n.canvas !== "room");
      if (roomTotal > 0) {
        this.activeRoomId = this.design.activeRoomId;
        this.setTab("room");
      } else if (hasNet) {
        this.setTab("network");
      }
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
      this.customRoomMix = null;
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
      if (this.presentation && this.tab === "room") {
        const l = this.design.links.find(x => x.id === linkId);
        if (l && (l.media === "hdmi" || l.media === "usb" || /hdmi|usb|video|camera|display|codec|touch|mic/i.test(l.label || ""))) return true;
        return links.length <= 6;
      }
      if (this.selectedLink === linkId || this.linkMode) return true;
      if (this.tab === "room") return links.length <= 5;
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
      const scoreUi = window.__DS_PREMIUM?.scoreState?.(this.design, score) || { label: `${score}/100`, cls: "ds-score", title: "" };
      if (badge) {
        badge.textContent = scoreUi.label;
        badge.className = scoreUi.cls;
        badge.title = scoreUi.title || "";
      }
      const ccwBtn = document.getElementById("ds-export-ccw");
      if (ccwBtn) {
        const val = validateDesign(this.design);
        const ready = score >= 70 && !val.warnings.some(w => w.severity === "error");
        ccwBtn.classList.toggle("ds-ccw-ready", ready && bom.length > 0);
        ccwBtn.title = ready ? "Validation passed — export to CCW" : "Export hardware PIDs to CCW";
      }
      document.getElementById("ds-status-left").textContent =
        `${this.design.nodes.length} devices · ${this.design.links.length} links · ${bom.length} BOM · ${scoreUi.label === "—" ? "Not scored" : "Score " + scoreUi.label}`;
      const room = this.design.rooms.find(r => r.id === this.activeRoomId);
      const roomHint = this.tab === "room" && room ? ` · ${room.name}` : "";
      document.getElementById("ds-status-right").textContent = `v${window.__cpnV2?.APP_VERSION || "?"}${roomHint} · ${this.design.account}`;
      window.__DS_PREMIUM?.refresh?.(this);
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
        const icon = STN()?.renderSymbolPreview?.(symbolId, accent, 22, s.id, def) || "▣";
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
      const ROOM_LABELS = { boardroom: "Boardroom", conference: "Conference", huddle: "Huddle", training: "Training", executive: "Executive", teamsRoom: "Teams", zoomRoom: "Zoom", ctMediumDualDisplay: "Dual display", ctSmallCollab: "Small collab", divisible: "Divisible" };
      rooms.forEach(room => {
        const tpl = TPL()?.ROOM_TEMPLATES?.[room.template];
        if (!tpl?.zones) return;
        const roomNodes = this.design.nodes.filter(n => n.roomId === room.id);
        if (!roomNodes.length) return;
        const ox = room.layoutOrigin?.x ?? ROOM_LAYOUT_OX;
        const oy = room.layoutOrigin?.y ?? ROOM_LAYOUT_OY;
        const zones = room.computedZones || tpl.zones;
        Object.entries(zones).forEach(([name, z]) => {
          const label = String(name).replace(/^\w/, c => c.toUpperCase());
          const ztype = ROOM_ZONE_TYPE[name] || "default";
          html += `<g class="ds-zone ds-zone-${ztype}" data-room="${room.id}" data-zone="${escapeAttr(name)}" transform="translate(${ox + z.x},${oy + z.y})">
            <text class="ds-zone-label-text" x="8" y="-6">${escapeHtml(label)}</text>
            <rect class="ds-zone-rect" width="${z.w}" height="${z.h}" rx="8"/>
          </g>`;
        });
        const typeLbl = ROOM_LABELS[room.template] || room.name;
        const ctRef = tpl.ct ? String(tpl.ct).replace(/Design Guide$/i, "").trim().slice(0, 36) : "";
        const badgeW = Math.min((tpl.w || 340) + 80, 440);
        html += `<g class="ds-room-story" data-room="${room.id}" transform="translate(${ox},${oy - 32})">
          <rect class="ds-room-story-bg" width="${badgeW}" height="16" rx="4"/>
          <text class="ds-room-story-text" x="8" y="12">Cisco Tested · ${escapeHtml(typeLbl)}</text>
          ${ctRef ? `<text class="ds-room-story-ct" x="${badgeW - 8}" y="12" text-anchor="end">${escapeHtml(ctRef)}</text>` : ""}
        </g>`;
        if (this.design.rooms.length > 1 && room.id === this.activeRoomId) {
          html += `<g class="ds-room-portfolio-badge" transform="translate(${ox + badgeW + 8},${oy - 32})">
            <rect width="72" height="16" rx="4" class="ds-room-portfolio-bg"/>
            <text x="36" y="12" text-anchor="middle" class="ds-room-portfolio-text">${this.design.rooms.length} rooms</text>
          </g>`;
        }
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
      if (title) title.remove();
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
        m.setAttribute("markerUnits", "userSpaceOnUse");
        m.setAttribute("markerWidth", "6");
        m.setAttribute("markerHeight", "6");
        m.setAttribute("refX", "5.2");
        m.setAttribute("refY", "3");
        m.setAttribute("orient", "auto");
        m.innerHTML = `<path d="M0.6,0.8 L5.2,3 L0.6,5.2" fill="none" stroke="${ms.stroke}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`;
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
        const path = linkPathFor(a.x, a.y, b.x, b.y, off, l.media, this._linkCtx);
        const lp = linkLabelPos(a, b, off, this.tab === "room");
        g.querySelector(".ds-link-under")?.setAttribute("d", path);
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
      const roomMode = this.tab === "room";
      this._linkCtx = roomMode ? { room: true, bounds: getActiveRoomBounds(this, nodes) } : null;
      this._linkOffsets = computeLinkOffsets(links, roomMode);

      const bandsG = document.getElementById("ds-layer-bands");
      if (this.tab === "network" && this.design.showLayerBands !== false && !this.presentation) {
        const activeLayers = [...new Set(nodes.map(n => n.layer).filter(Boolean))];
        bandsG.innerHTML = LAYERS.filter(l => activeLayers.includes(l)).map(layer => {
          const x = (LAYER_X[layer] || 400) - 12;
          const layerNodes = nodes.filter(n => n.layer === layer);
          const maxY = layerNodes.length ? Math.max(...layerNodes.map(n => n.y + (n.h || 46))) + 48 : 520;
          const bandH = Math.max(420, maxY - 60);
          return layerBandSvg(layer, x, bandH);
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
        const isAv = this.tab === "room" && (l.media === "hdmi" || l.media === "usb" || /camera|display|codec|hdmi|usb/i.test(l.label || ""));
        const avHl = this.presentation && isAv ? " av-chain" : "";
        const dim = selNode && !hl && !sel && !avHl ? " dimmed" : "";
        const path = linkPathFor(a.x, a.y, b.x, b.y, off, l.media, this._linkCtx);
        const lp = linkLabelPos(a, b, off, this.tab === "room");
        const lbl = linkDisplayLabel(links, l);
        const showLbl = lbl && this.shouldShowLinkLabel(links, l.id) && (!this.presentation || this.tab === "room");
        const portDetail = sel && l.fromPort && l.toPort ? `${l.fromPort} → ${l.toPort}` : "";
        const lw = Math.max(36, lbl.length * 6.5 + 14);
        const lh = portDetail ? 24 : 14;
        const ms = linkMediaStyle(l.media);
        const dash = ms.dash ? ` stroke-dasharray="${ms.dash}"` : "";
        const sw = hl ? ms.w + 0.75 : ms.w;
        const underW = sw + 3.5;
        return `<g class="ds-link${sel}${hl}${dim}${avHl}" data-link="${l.id}" data-media="${escapeAttr(l.media || "cat6")}">
          <path class="ds-link-under" d="${path}" style="stroke-width:${underW}"/>
          <path class="ds-link-path${sel}" d="${path}" marker-end="url(#ds-arrow-${l.media || "cat6"})" style="stroke:${ms.stroke};stroke-width:${sw}${dash ? ";stroke-dasharray:" + ms.dash : ""}"/>
          ${showLbl ? `<g class="ds-link-label-group" transform="translate(${lp.x},${lp.y})">
            <rect class="ds-link-label-bg" x="${-lw / 2}" y="-11" width="${lw}" height="${lh}" rx="6"/>
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
        const hasPhoto = !!(window.__DS_PHOTOS?.resolveUrl?.(n.stencilId, def));
        const ports = this.showPortsOnNode(n) ? STN()?.renderPorts?.(n, mode, this.linkFrom === n.id ? this.linkFromPort : null) || "" : "";
        const showLayer = n.layer && this.tab === "network" && !showBands;
        const isHub = mode === "room" && /switch|9200|9300|collab/i.test(n.stencilId || "");
        const isDeco = def?.decorative;
        const isRoom = mode === "room";
        const belowLabel = isRoom || hasPhoto;
        const pid = n.pid || def?.pid;
        const showPid = belowLabel && !isDeco && pid && !/^N\/A/i.test(pid) && def?.shape !== "display" && def?.shape !== "table";
        const lblText = (dispLabel || "").slice(0, 22) + qty;
        const lblW = Math.min(Math.max(w, lblText.length * 5.8 + 10), w + 28);
        const lblX = (w - lblW) / 2;
        const pidY = h + 26;
        const roomLbl = belowLabel
          ? `<rect class="ds-node-label-bg ds-node-label-bg-below" x="${lblX}" y="${h + 4}" width="${lblW}" height="14" rx="4"/>
             <text class="ds-node-label ds-node-label-below" x="${w / 2}" y="${h + 14}" text-anchor="middle">${escapeHtml(lblText)}</text>
             ${showPid ? `<text class="ds-node-pid" x="${w / 2}" y="${pidY}" text-anchor="middle">${escapeHtml(String(pid).slice(0, 16))}</text>` : ""}`
          : `<rect class="ds-node-label-bg" x="2" y="${h - 18}" width="${w - 4}" height="14" rx="3"/>
             <text class="ds-node-label" x="${w / 2}" y="${h - 7}" text-anchor="middle">${escapeHtml(lblText)}</text>`;
        return `<g class="ds-node${sel}${isHub ? " ds-hub" : ""}${isDeco ? " ds-deco" : ""}${isRoom ? " ds-room-node" : ""}${hasPhoto ? " ds-photo-node" : ""}" data-node="${n.id}" transform="translate(${n.x},${n.y})">
          <title>${escapeHtml(title)}</title>
          ${isHub ? `<rect class="ds-node-hub-ring" x="-4" y="-4" width="${w + 8}" height="${h + 8}" rx="10"/>` : ""}
          ${svgInner}
          <rect class="ds-node-hit" width="${w}" height="${h}" rx="6" fill="transparent"/>
          ${roomLbl}
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
          ${ports.length ? `<div class="ds-port-list">${ports.map(p => `<span class="ds-port-chip">${escapeHtml(p.id)}${p.poe ? " PoE" : ""}${p.speed ? " " + p.speed : ""}</span>`).join("")}</div>` : ""}
          ${window.__DS_EXPERT?.inspectorExtras?.(node) || ""}`;
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
        window.__DS_EXPERT?.wireInspectorActions?.(node, this);
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
      if (this.panelTab === "engineer") {
        window.__DS_EXPERT?.renderExpertPanel?.(this);
        return;
      }
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
            <span class="ds-bom-actions-hint">CCW_Prep CSV · click a row to highlight on canvas</span>
          </div>
          ${bom.length ? `
          <table class="ds-table ds-bom-table"><thead><tr><th>Item</th><th>PID</th><th>Qty</th><th></th></tr></thead>
          <tbody>${bom.map(b => `<tr class="ds-bom-row" data-pid="${escapeAttr(b.pid)}"><td title="${escapeAttr(b.pid)}">${escapeHtml((b.desc || b.pid).slice(0, 42))}</td><td class="ds-pid-cell">${escapeHtml(b.pid)}</td><td>${b.qty}</td><td>${window.__DS_EXPERT?.bomRowActions?.() || ""}</td></tr>`).join("")}</tbody></table>
          <div class="ds-bom-total">${bom.length} CCW lines · ${bom.reduce((s, b) => s + b.qty, 0)} qty</div>
          ${deco.length ? `<div class="ds-bom-deco">${deco.length} layout-only item(s) on canvas (tables, generic displays, credenza) — not in CCW export.</div>` : ""}
          <div class="ds-bom-deco">Licenses, Smart Net, copper/AV cabling, and services — quote in CCW or use Manual BOM.</div>
          <div style="padding:8px 12px"><button type="button" class="ds-btn" id="ds-add-bom">+ Manual BOM</button></div>` : `<div class="ds-empty">Generate from Intent or Gallery, then export to CCW</div>`}`;
        document.getElementById("ds-export-ccw-panel")?.addEventListener("click", () => this.exportCcw());
        body.querySelectorAll(".ds-bom-row").forEach(row => {
          row.addEventListener("click", () => window.__DS_PREMIUM?.highlightBomPid?.(this, row.dataset.pid));
        });
        window.__DS_EXPERT?.wireBomCopy?.(body, this);
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
        const extras = window.__DS_PREMIUM?.validationPanelExtras?.(this.design, val, score) || {};
        const scoreLabel = window.__DS_PREMIUM?.scoreState?.(this.design, score)?.label || `${score}/100`;
        body.innerHTML = `
          <div class="ds-score-panel">Design score: <strong>${scoreLabel}</strong></div>
          ${extras.badgeHtml || ""}
          ${extras.poeBar || ""}
          ${val.warnings.length ? `<ul class="ds-val-list error">${val.warnings.map(w => `<li>${escapeHtml(w.msg || w)}</li>`).join("")}</ul>` : `<div class="ds-empty" style="color:var(--accent)">✓ No blocking issues</div>`}
          ${val.tips.length ? `<ul class="ds-val-list tip">${val.tips.map(t => `<li>${escapeHtml(t.msg || t)}</li>`).join("")}</ul>` : ""}
          ${extras.ccwReady ? `<p class="ds-ccw-ready-note">✓ CCW-ready — export hardware PIDs from BOM tab.</p>` : ""}`;
      }
    }

    applyTransform() {
      document.getElementById("ds-viewport")?.setAttribute("transform", `translate(${this.pan.x},${this.pan.y}) scale(${this.pan.zoom})`);
    }

    clientToSvg(cx, cy) {
      const rect = document.getElementById("ds-svg").getBoundingClientRect();
      return { x: (cx - rect.left - this.pan.x) / this.pan.zoom, y: (cy - rect.top - this.pan.y) / this.pan.zoom };
    }

    onSvgDown(e) { if (!e.target.closest(".ds-node") && !e.target.closest(".ds-link-path") && !e.target.closest(".ds-link-under") && !e.target.closest(".ds-port")) this.panDrag = { ox: e.clientX, oy: e.clientY, px: this.pan.x, py: this.pan.y }; }

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

    roomChromeTop() {
      if (this.tab !== "room") return 0;
      const guide = document.getElementById("ds-room-guide");
      if (!guide || guide.hidden) return 52;
      const wrap = document.getElementById("ds-canvas-wrap");
      const guideBottom = guide.offsetTop + guide.offsetHeight;
      return Math.max(guideBottom + 10, wrap?.classList.contains("room-mode") ? 118 : 52);
    }

    observeCanvasResize() {
      if (this._fitObs) return;
      const wrap = document.getElementById("ds-canvas-wrap");
      if (!wrap || typeof ResizeObserver === "undefined") return;
      this._fitObs = new ResizeObserver(() => {
        if (this.tab === "network" || this.tab === "room") {
          clearTimeout(this._fitTimer);
          this._fitTimer = setTimeout(() => this.scheduleFitView(), 100);
        }
      });
      this._fitObs.observe(wrap);
    }

    scheduleFitView() {
      const run = () => {
        const rect = document.getElementById("ds-svg")?.getBoundingClientRect();
        if (rect && rect.width > 8 && rect.height > 8) {
          this.fitView();
          return true;
        }
        return false;
      };
      requestAnimationFrame(() => {
        if (!run()) requestAnimationFrame(() => { if (!run()) setTimeout(run, 60); });
      });
    }

    fitView() {
      const nodes = this.visibleNodes();
      const rect = document.getElementById("ds-svg")?.getBoundingClientRect();
      if (!nodes.length || !rect?.width) { this.pan = { x: 40, y: 40, zoom: 1 }; this.applyTransform(); return; }
      const labelPad = this.tab === "room" ? ROOM_LABEL_BELOW : 0;
      let xs = nodes.flatMap(n => [n.x, n.x + (n.w || 76)]);
      let ys = nodes.flatMap(n => [n.y, n.y + (n.h || 46) + labelPad]);
      if (this.tab === "room" && this.activeRoomId) {
        const room = this.design.rooms.find(r => r.id === this.activeRoomId);
        const ox = room?.layoutOrigin?.x ?? ROOM_LAYOUT_OX;
        const oy = room?.layoutOrigin?.y ?? ROOM_LAYOUT_OY;
        const zones = room?.computedZones || TPL()?.ROOM_TEMPLATES?.[room?.template]?.zones;
        if (zones) {
          Object.values(zones).forEach(z => {
            xs.push(ox + z.x, ox + z.x + z.w);
            ys.push(oy + z.y, oy + z.y + z.h);
          });
        }
      }
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);
      const pad = this.tab === "room" ? 48 : 80;
      const contentW = maxX - minX + pad * 2;
      const contentH = maxY - minY + pad * 2;
      const chromeTop = this.roomChromeTop();
      const availH = Math.max(120, rect.height - chromeTop);
      const maxZoom = this.tab === "room" ? 1.12 : 1.1;
      this.pan.zoom = Math.max(0.35, Math.min(rect.width / contentW, availH / contentH, maxZoom));
      this.pan.x = (rect.width - (maxX - minX) * this.pan.zoom) / 2 - minX * this.pan.zoom;
      this.pan.y = chromeTop + (availH - (maxY - minY) * this.pan.zoom) / 2 - minY * this.pan.zoom;
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

/**
 * Portfolio Navigator Plus — Design Studio v2
 * Intent + Network Canvas + Room Canvas + Inspector + Undo + Exports
 */
(function DesignStudioModule() {
  "use strict";

  const STORAGE_KEY = "cpn-design-studio-v2";
  const MAX_HISTORY = 40;
  const uid = () => "ds-" + Math.random().toString(36).slice(2, 10);

  const LAYERS = ["wan", "core", "distribution", "access", "security", "mgmt", "collab", "dc"];
  const LAYER_LABELS = {
    wan: "WAN / SD-WAN", core: "Core", distribution: "Distribution", access: "Access",
    security: "Security", mgmt: "Management", collab: "Collaboration", dc: "Data Center"
  };
  const LAYER_Y = { wan: 40, security: 120, core: 200, distribution: 300, access: 400, mgmt: 500, collab: 580, dc: 260 };

  const FAMILY_LAYER = {
    "catalyst-center": "mgmt", "sdwan": "wan", "meraki-mx": "wan", "isr-routers": "wan",
    "secure-routers": "wan", "wan-routers": "wan", "catalyst-core": "core", "nexus": "dc",
    "nexus-one": "dc", "aci": "dc", "catalyst-access": "distribution", "meraki-switches": "access",
    "catalyst-wireless": "access", "meraki-wireless": "access", "sf-enterprise": "security",
    "sf-branch": "security", "ise": "security", "duo": "security", "umbrella": "security",
    "secure-access": "security", "hypershield": "security", "ucs": "dc", "hyperflex": "dc",
    "room-systems": "collab", "desk-devices": "collab", "conf-phones": "collab", "webex-calling": "collab"
  };

  const FAMILY_PID = {
    "catalyst-center": "DN3-HW-APL", "catalyst-core": "C9500-48Y4C", "catalyst-access": "C9300-48P",
    "catalyst-wireless": "CW9179F", "meraki-mx": "MX85-HW", "meraki-switches": "MS250-48FP-HW",
    "meraki-wireless": "MR57-HW", "sdwan": "C8000V-SDWAN", "secure-routers": "C8200-1N-4T",
    "isr-routers": "ISR4331/K9", "sf-enterprise": "FPR-2130", "sf-branch": "FPR-1120",
    "ise": "ISE-VM-K9", "nexus": "N9K-C93180YC-FX3", "nexus-one": "N9K-C9332D-GX2B",
    "aci": "APIC-L3", "ucs": "UCSX-210C-M7SN", "hyperflex": "HX240C-M8SN", "room-systems": "CS-KIT-EQ-K9",
    "desk-devices": "CS-DESKPRO-K9", "umbrella": "UMB-DNS-SEC-ADD", "duo": "DUO-ADV"
  };

  const FAMILY_ICON = {
    networking: "▣", security: "🛡", collaboration: "📹", computing: "🖥", observability: "👁"
  };

  const MEDIA_TYPES = [
    { id: "cat6", label: "Cat6 UTP", cablePid: "CAB-CAT6-3M", maxMbps: 1000 },
    { id: "cat6a", label: "Cat6A", cablePid: "CAB-CAT6A-5M", maxMbps: 10000 },
    { id: "fiber-sm", label: "SM Fiber 10G", cablePid: "SFP-10G-LR-S", maxMbps: 10000 },
    { id: "fiber-mm", label: "MM Fiber 10G", cablePid: "SFP-10G-SR-S", maxMbps: 10000 },
    { id: "fiber-40g", label: "SM Fiber 40G", cablePid: "QSFP-40G-LR4-S", maxMbps: 40000 },
    { id: "dac", label: "DAC 10G", cablePid: "SFP-H10GB-CU3M", maxMbps: 10000 },
    { id: "hdmi", label: "HDMI 2.1", cablePid: "CAB-HDMI-3M", maxMbps: 48000 },
    { id: "usb-c", label: "USB-C", cablePid: "CAB-USBC-2M", maxMbps: 40000 },
    { id: "speaker", label: "Speaker wire", cablePid: "CAB-SPK-10M", maxMbps: 0 },
    { id: "control", label: "Control RS232", cablePid: "CAB-CON-5M", maxMbps: 0 },
    { id: "wireless", label: "Wireless RF", cablePid: "N/A-RF", maxMbps: 0 }
  ];

  const ROOM_STENCILS = [
    { id: "room-kit-eq", label: "Room Kit EQ", pid: "CS-KIT-EQ-K9", icon: "📹", w: 88, h: 52, ports: ["LAN", "HDMI1", "USB"] },
    { id: "room-kit-pro", label: "Room Kit Pro G2", pid: "CS-KITPRO-K9", icon: "📹", w: 88, h: 52, ports: ["LAN", "HDMI1", "HDMI2"] },
    { id: "room-bar", label: "Room Bar", pid: "CS-BAR-K9", icon: "📹", w: 80, h: 44, ports: ["LAN"] },
    { id: "board-pro", label: "Board Pro 75", pid: "CS-BRD-75-K9", icon: "🖼", w: 100, h: 58, ports: ["LAN", "HDMI"] },
    { id: "desk-pro", label: "Desk Pro", pid: "CS-DESKPRO-K9", icon: "💻", w: 72, h: 46, ports: ["LAN", "USB-C"] },
    { id: "quad-cam", label: "Quad Camera", pid: "CS-QUADCAM", icon: "🎥", w: 52, h: 52, ports: ["HDMI"] },
    { id: "table-mic", label: "Table Mic Pro", pid: "CS-TABLEMIC", icon: "🎤", w: 64, h: 32, ports: ["ETH"] },
    { id: "amp", label: "Room Amp 280", pid: "CS-AMP-280", icon: "🔊", w: 52, h: 40, ports: ["SPK1", "SPK2", "LAN"] },
    { id: "switch-poe", label: "C9200-24P PoE", pid: "C9200-24P", icon: "▢", w: 64, h: 40, ports: ["Gi1/0/1", "Gi1/0/24", "Te1/1/1"] },
    { id: "display", label: "Display 75\"", pid: "DISPLAY-75-4K", icon: "📺", w: 96, h: 54, ports: ["HDMI1", "HDMI2"] },
    { id: "codec-eq", label: "Codec EQ", pid: "CS-CODEC-EQ", icon: "⬛", w: 56, h: 36, ports: ["LAN", "HDMI"] }
  ];

  const ROOM_TEMPLATES = {
    huddle: { name: "Huddle (4–6)", w: 320, h: 240, items: [
      ["room-bar", 40, 80], ["display", 180, 70], ["switch-poe", 40, 170]
    ], links: [[2, 0, "cat6", "PoE"], [0, 1, "hdmi", "Video"]] },
    conference: { name: "Conference (8–12)", w: 480, h: 320, items: [
      ["room-kit-eq", 60, 100], ["quad-cam", 60, 40], ["display", 260, 90],
      ["table-mic", 160, 200], ["amp", 60, 220], ["switch-poe", 60, 280]
    ], links: [[5, 0, "cat6", "PoE"], [0, 2, "hdmi", "Primary"], [0, 1, "hdmi", "Cam"], [4, 3, "speaker", "Audio"]] },
    boardroom: { name: "Boardroom (14–20)", w: 560, h: 380, items: [
      ["room-kit-pro", 80, 120], ["board-pro", 280, 100], ["quad-cam", 80, 40],
      ["table-mic", 200, 280], ["amp", 80, 300], ["switch-poe", 80, 340], ["display", 420, 120]
    ], links: [[5, 0, "cat6", "PoE"], [5, 1, "cat6", "PoE-Board"], [0, 6, "hdmi", "Aux"], [0, 2, "hdmi", "Cam"]] }
  };

  const REF_ARCH_PRESETS = {
    campus3tier: { label: "Campus 3-tier", nodes: [
      ["catalyst-core", "Core", 300, 200], ["catalyst-access", "Dist-1", 500, 200],
      ["catalyst-access", "Access-1", 700, 160], ["catalyst-wireless", "AP Floor 1", 860, 160],
      ["ise", "ISE", 500, 80], ["catalyst-center", "Cat Center", 700, 80]
    ], links: [[0, 1, "fiber-sm"], [1, 2, "fiber-mm"], [2, 3, "cat6"], [4, 1, "cat6"]] },
    branchSdwan: { label: "Branch SD-WAN", nodes: [
      ["sdwan", "vEdge", 200, 200], ["sf-branch", "Branch FW", 360, 200],
      ["catalyst-access", "Access SW", 520, 200], ["catalyst-wireless", "AP", 680, 200]
    ], links: [[0, 1, "fiber-sm"], [1, 2, "cat6"], [2, 3, "cat6"]] },
    dcPod: { label: "DC Pod", nodes: [
      ["nexus", "Leaf-1", 300, 220], ["nexus", "Leaf-2", 300, 320], ["nexus-one", "Spine", 500, 270],
      ["ucs", "UCS X210c", 700, 220], ["sf-enterprise", "DC FW", 500, 120], ["aci", "APIC", 700, 120]
    ], links: [[2, 0, "fiber-40g"], [2, 1, "fiber-40g"], [0, 3, "fiber-sm"], [4, 2, "fiber-sm"]] }
  };

  function getCatalogFamilies() {
    if (window.__cpnDesignCatalog?.families) return window.__cpnDesignCatalog.families();
    return [];
  }

  function buildNetworkStencils() {
    const families = getCatalogFamilies();
    if (!families.length) return fallbackNetworkStencils();
    return families.slice(0, 48).map(f => ({
      id: f.id,
      label: f.name.length > 22 ? f.name.slice(0, 20) + "…" : f.name,
      layer: FAMILY_LAYER[f.id] || (f.category === "security" ? "security" : f.category === "collaboration" ? "collab" : "access"),
      category: f.category,
      pid: FAMILY_PID[f.id] || `PID-${f.id.toUpperCase().slice(0, 12)}`,
      icon: FAMILY_ICON[f.category] || "▣",
      familyId: f.id
    }));
  }

  function fallbackNetworkStencils() {
    return Object.keys(FAMILY_PID).map(id => ({
      id, label: id.replace(/-/g, " "), layer: FAMILY_LAYER[id] || "access",
      pid: FAMILY_PID[id], icon: "▣", familyId: id
    }));
  }

  let NETWORK_STENCILS = buildNetworkStencils();

  function emptyDesign(account) {
    return {
      version: 2,
      account: account || "Untitled Design",
      updated: new Date().toISOString(),
      requirements: { notes: "", vertical: "", sites: 1, users: 0, budget: "" },
      sites: [{ id: "site-1", name: "Main Campus", type: "campus" }],
      rooms: [],
      nodes: [],
      links: [],
      bomOverrides: [],
      mode: "network",
      floorPlan: null,
      showLayerBands: true,
      snapGrid: true
    };
  }

  function loadDesign() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("cpn-design-studio-v1");
      if (raw) {
        const d = JSON.parse(raw);
        if (d.version >= 1) return { ...emptyDesign(), ...d, version: 2 };
      }
    } catch (e) { /* ignore */ }
    const acct = document.querySelector("#acct-name")?.value?.trim();
    return emptyDesign(acct || "Untitled Design");
  }

  function saveDesign(design) {
    design.updated = new Date().toISOString();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(design)); } catch (e) { /* ignore */ }
  }

  function stencilFor(id, mode) {
    if (mode === "room") return ROOM_STENCILS.find(s => s.id === id);
    NETWORK_STENCILS = buildNetworkStencils();
    return NETWORK_STENCILS.find(s => s.id === id);
  }

  function computeBom(design) {
    const lines = new Map();
    const add = (pid, desc, qty, type, unit) => {
      if (!pid || pid.startsWith("N/A")) return;
      const k = pid + "|" + type;
      const prev = lines.get(k) || { pid, desc, qty: 0, type, unit: unit || "EA" };
      prev.qty += qty;
      lines.set(k, prev);
    };

    design.nodes.forEach(n => {
      const qty = n.qty || 1;
      const st = stencilFor(n.stencilId, n.canvas === "room" ? "room" : "network");
      add(n.pid || st?.pid, n.label || st?.label, qty, "hardware");
      const layer = n.layer || st?.layer;
      if (layer === "access" || /9200|9300|9179|meraki|wireless/i.test(n.stencilId || "")) {
        add("DNA-A-48P-3Y", "Cisco DNA Advantage — 48 port (3yr)", qty, "license");
      }
      if (/ise/i.test(n.stencilId || "")) add("ISE-PLR-LIC", "Cisco ISE Premier (500 endpoints)", 1, "license");
      if (/sf-|firewall/i.test(n.stencilId || "")) add("FPR-SUP-2130", "Secure Firewall Threat Defense license", qty, "license");
      if (/room-kit|board|desk|bar/i.test(n.stencilId || "")) add("A-FLEX-ROOM", "Webex Room license", qty, "license");
    });

    design.links.forEach(l => {
      const media = MEDIA_TYPES.find(m => m.id === l.media) || MEDIA_TYPES[0];
      if (media.cablePid && !media.cablePid.startsWith("N/A"))
        add(media.cablePid, `${media.label} — ${l.label || "link"}`, 1, "cable");
    });

    const netCount = design.nodes.filter(n => n.canvas !== "room").length;
    if (netCount >= 2) {
      add("CON-PREM-SVC", "Solution Support (SSPT)", 1, "service");
      add("CON-PS-8HR", "Professional Services — 8hr block", Math.max(1, Math.ceil(netCount / 5)), "service");
    }
    if (netCount >= 8) add("SMARTNET-24X7X4", "Smart Net Total — 24x7x4 (placeholder)", netCount, "service");

    (design.bomOverrides || []).forEach(o => add(o.pid, o.desc, o.qty || 1, o.type || "manual"));

    return [...lines.values()].sort((a, b) => a.type.localeCompare(b.type));
  }

  function computeCables(design) {
    return design.links.map((l, i) => {
      const from = design.nodes.find(n => n.id === l.from);
      const to = design.nodes.find(n => n.id === l.to);
      const media = MEDIA_TYPES.find(m => m.id === l.media) || MEDIA_TYPES[0];
      return {
        id: l.id, from: from?.label || l.from, to: to?.label || l.to,
        fromPort: l.fromPort || "—", toPort: l.toPort || "—",
        media: media.label, cablePid: media.cablePid,
        length: l.length || "3m", label: l.label || `LINK-${String(i + 1).padStart(3, "0")}`
      };
    });
  }

  function validateDesign(design) {
    const w = [], tips = [];
    const nets = design.nodes.filter(n => n.canvas !== "room");
    const rooms = design.nodes.filter(n => n.canvas === "room");

    if (!nets.some(n => /core|c9500|n9k|nexus-one|catalyst-core/i.test(n.stencilId + n.label)))
      w.push("No core/aggregation layer — add Catalyst 9500, Nexus, or core switch.");
    if (!nets.some(n => n.layer === "security" || /sf-|firewall|ise|umbrella/i.test(n.stencilId)))
      w.push("No security control — consider Secure Firewall, ISE, or Umbrella.");
    if (nets.length >= 2 && design.links.length === 0)
      w.push("Network devices are not connected.");
    if (!nets.some(n => /catalyst-center|dnac|meraki/i.test(n.stencilId)))
      tips.push("Consider Catalyst Center or Meraki Dashboard for management.");

    design.links.forEach(l => {
      const media = MEDIA_TYPES.find(m => m.id === l.media);
      const from = design.nodes.find(n => n.id === l.from);
      const to = design.nodes.find(n => n.id === l.to);
      if (from && to && from.canvas !== to.canvas)
        w.push(`Link ${l.label || l.id}: crosses network/room boundary — verify.`);
      if (media?.id === "hdmi" && from && to && !/display|board|kit|codec|cam|bar/i.test((to.stencilId || "") + (from.stencilId || "")))
        tips.push(`HDMI link ${l.label}: verify display endpoint.`);
    });

    rooms.forEach(r => {
      if (/room|kit|bar|board|desk/i.test(r.stencilId || "")) {
        const hasPoe = design.links.some(l => {
          if (l.from !== r.id && l.to !== r.id) return false;
          const other = design.nodes.find(n => n.id === (l.from === r.id ? l.to : l.from));
          return other && /switch|9200|9300|meraki/i.test(other.stencilId || "");
        });
        if (!hasPoe) w.push(`${r.label}: missing PoE/network connection to room switch.`);
      }
    });

    return { warnings: w, tips, ok: w.length === 0 };
  }

  function snap(v, grid = 24) { return Math.round(v / grid) * grid; }

  function orthPath(x1, y1, x2, y2) {
    const mx = (x1 + x2) / 2;
    return `M ${x1} ${y1} L ${mx} ${y1} L ${mx} ${y2} L ${x2} ${y2}`;
  }

  function generateFromIntent(text, design) {
    const t = text.toLowerCase();
    const nodes = [], links = [];
    let bx = 80, by = 80;
    const place = (stencilId, label, layer, dx, dy) => {
      NETWORK_STENCILS = buildNetworkStencils();
      const st = NETWORK_STENCILS.find(s => s.id === stencilId) || { pid: FAMILY_PID[stencilId], layer };
      const id = uid();
      nodes.push({
        id, stencilId, label: label || st?.label || stencilId, pid: st?.pid || FAMILY_PID[stencilId],
        layer: layer || st?.layer || "access", x: bx + dx, y: by + dy, canvas: "network", qty: 1, ports: 4
      });
      return id;
    };
    const link = (from, to, media, label, len = "3m") => {
      links.push({ id: uid(), from, to, media, label, length: len, fromPort: "Te1/1/1", toPort: "Gi1/0/1" });
    };

    const siteCount = parseInt(t.match(/(\d+)\s*(site|building|branch|location)/)?.[1] || "0", 10);
    const roomCount = parseInt(t.match(/(\d+)\s*(room|or |conference|huddle|boardroom)/)?.[1] || "0", 10);
    const hasCampus = /campus|building|hospital|enterprise|hq|headquarters|school|district/.test(t);
    const hasBranch = /branch|site|remote|store|retail/.test(t);
    const hasSdwan = /sd-wan|sdwan|sd wan|vmanage|meraki mx/.test(t);
    const hasSecurity = /firewall|security|ise|segmentation|zero trust|umbrella|duo/.test(t);
    const hasCollab = /room|webex|collab|hybrid|meeting|video|board/.test(t);
    const hasWireless = /wireless|wifi|wi-fi|9179|access point|\bap\b/.test(t);
    const hasDc = /data center|datacenter|nexus|ucs|aci|pod|spine|leaf/.test(t);

    if (hasDc) {
      const spine = place("nexus-one", "Spine", "dc", 0, 0);
      const leaf1 = place("nexus", "Leaf-1", "dc", 180, -60);
      const leaf2 = place("nexus", "Leaf-2", "dc", 180, 60);
      const ucs = place("ucs", "UCS Compute", "dc", 360, 0);
      const fw = place("sf-enterprise", "DC FW", "security", 0, -120);
      link(spine, leaf1, "fiber-40g", "Spine-Leaf1");
      link(spine, leaf2, "fiber-40g", "Spine-Leaf2");
      link(leaf1, ucs, "fiber-sm", "Compute");
      link(fw, spine, "fiber-sm", "Sec-Spine");
      bx += 120; by += 180;
    }

    if (hasSdwan || hasBranch) {
      const sites = Math.max(siteCount, hasBranch ? 1 : 0);
      for (let s = 0; s < Math.min(sites, 6); s++) {
        const ox = s * 220;
        const wan = place("secure-routers", `WAN-${s + 1}`, "wan", ox, 0);
        const fw = place("sf-branch", `FW-${s + 1}`, "security", ox + 140, 0);
        const sw = place("catalyst-access", `Access-${s + 1}`, "access", ox + 280, 0);
        link(wan, fw, "fiber-sm", "WAN-FW");
        link(fw, sw, "cat6a", "LAN");
        if (hasWireless) {
          const ap = place("catalyst-wireless", `AP-${s + 1}`, "access", ox + 420, 0);
          link(sw, ap, "cat6", "PoE");
        }
      }
      by += 160;
    }

    if (hasCampus || (!hasBranch && !hasCollab && !hasDc)) {
      const core = place("catalyst-core", "Core", "core", 0, 0);
      const dist1 = place("catalyst-access", "Dist-MDF", "distribution", 200, 0);
      const dist2 = place("catalyst-access", "Dist-IDF", "distribution", 200, 100);
      const acc1 = place("catalyst-access", "Access-1", "access", 400, 0);
      const acc2 = place("catalyst-access", "Access-2", "access", 400, 100);
      link(core, dist1, "fiber-sm", "Core-Dist1");
      link(core, dist2, "fiber-sm", "Core-Dist2");
      link(dist1, acc1, "fiber-mm", "Dist-Acc1");
      link(dist2, acc2, "fiber-mm", "Dist-Acc2");
      if (hasWireless) {
        [acc1, acc2].forEach((aid, i) => {
          const ap = place("catalyst-wireless", `AP-${i + 1}`, "access", 560, i * 100);
          link(aid, ap, "cat6", "PoE");
        });
      }
      if (hasSecurity || /ise|802\.1x|nac/.test(t)) {
        const ise = place("ise", "ISE", "security", 200, -100);
        link(ise, dist1, "cat6", "Auth");
      }
      if (hasSdwan) {
        const wan = place("sdwan", "SD-WAN Edge", "wan", -160, 0);
        link(wan, core, "fiber-sm", "WAN-Core");
      }
      place("catalyst-center", "Catalyst Center", "mgmt", 400, -100);
      if (/umbrella|sase|dns/.test(t)) place("umbrella", "Umbrella", "security", 400, -160);
      by += 220;
    }

    const rooms = [];
    if (hasCollab || roomCount > 0) {
      const n = roomCount || (hasCollab ? 3 : 0);
      const tpl = /boardroom|executive|large/.test(t) ? "boardroom" : /huddle|small/.test(t) ? "huddle" : "conference";
      for (let i = 0; i < n; i++) {
        const roomId = uid();
        const roomName = `Room ${i + 1}`;
        rooms.push({ id: roomId, name: roomName, template: tpl, width: ROOM_TEMPLATES[tpl].w, height: ROOM_TEMPLATES[tpl].h });
        applyRoomTemplateToDesign(design, tpl, roomId, roomName, 60 + (i % 2) * 520, 60 + Math.floor(i / 2) * 420, nodes, links);
      }
    }

    if (siteCount > 1) design.requirements.sites = siteCount;
    design.nodes = nodes;
    design.links = links;
    design.rooms = rooms;
    design.requirements.notes = text.slice(0, 2000);
    return design;
  }

  function applyRoomTemplateToDesign(design, tplKey, roomId, roomName, ox, oy, nodesArr, linksArr) {
    const tpl = ROOM_TEMPLATES[tplKey];
    if (!tpl) return;
    const idxMap = [];
    tpl.items.forEach(([stencilId, x, y], i) => {
      const st = ROOM_STENCILS.find(s => s.id === stencilId);
      const id = uid();
      idxMap[i] = id;
      nodesArr.push({
        id, stencilId, label: `${roomName} ${st?.label || stencilId}`, pid: st?.pid,
        x: ox + x, y: oy + y, canvas: "room", roomId, w: st?.w || 72, h: st?.h || 44, qty: 1
      });
    });
    tpl.links.forEach(([fi, ti, media, label]) => {
      linksArr.push({
        id: uid(), from: idxMap[fi], to: idxMap[ti], media, label,
        length: "5m", fromPort: "Gi1/0/1", toPort: "LAN"
      });
    });
  }

  function applyJsonDesign(json, design) {
    let data = json;
    if (typeof json === "string") {
      try { data = JSON.parse(json.replace(/^```json?\s*|\s*```$/g, "").trim()); }
      catch (e) { return false; }
    }
    if (!data || !Array.isArray(data.nodes)) return false;
    NETWORK_STENCILS = buildNetworkStencils();
    const labelToId = new Map();
    design.nodes = data.nodes.map(n => {
      const id = n.id || uid();
      labelToId.set(n.label, id);
      const st = stencilFor(n.stencilId, n.canvas === "room" ? "room" : "network");
      return {
        id, stencilId: n.stencilId || st?.id || "catalyst-access",
        label: n.label || st?.label, pid: n.pid || st?.pid,
        layer: n.layer || st?.layer || "access", x: n.x || 100, y: n.y || 100,
        canvas: n.canvas || "network", qty: n.qty || 1, w: n.w, h: n.h, roomId: n.roomId
      };
    });
    design.links = (data.links || []).map(l => {
      const from = design.nodes.find(n => n.label === l.fromLabel)?.id || l.from || labelToId.get(l.fromLabel);
      const to = design.nodes.find(n => n.label === l.toLabel)?.id || l.to || labelToId.get(l.toLabel);
      if (!from || !to) return null;
      return {
        id: l.id || uid(), from, to, media: l.media || "cat6",
        label: l.label || "Link", length: l.length || "3m",
        fromPort: l.fromPort || "", toPort: l.toPort || ""
      };
    }).filter(Boolean);
    if (data.rooms) design.rooms = data.rooms.map(r => ({ ...r, id: r.id || uid() }));
    return true;
  }

  function autoLayoutNetwork(design) {
    const nodes = design.nodes.filter(n => n.canvas !== "room");
    const byLayer = {};
    nodes.forEach(n => {
      const layer = n.layer || "access";
      (byLayer[layer] ||= []).push(n);
    });
    let col = 0;
    LAYERS.forEach(layer => {
      const group = byLayer[layer];
      if (!group) return;
      group.forEach((n, i) => {
        n.x = 80 + col * 200;
        n.y = (LAYER_Y[layer] || 200) + i * 90;
        if (design.snapGrid !== false) { n.x = snap(n.x); n.y = snap(n.y); }
      });
      col++;
    });
  }

  class History {
    constructor(studio) { this.studio = studio; this.stack = []; this.ptr = -1; }
    snapshot() {
      const json = JSON.stringify(this.studio.design);
      if (this.ptr >= 0 && this.stack[this.ptr] === json) return;
      this.stack = this.stack.slice(0, this.ptr + 1);
      this.stack.push(json);
      if (this.stack.length > MAX_HISTORY) this.stack.shift();
      else this.ptr++;
    }
    undo() {
      if (this.ptr <= 0) return;
      this.ptr--;
      this.studio.design = JSON.parse(this.stack[this.ptr]);
      this.studio.render();
    }
    redo() {
      if (this.ptr >= this.stack.length - 1) return;
      this.ptr++;
      this.studio.design = JSON.parse(this.stack[this.ptr]);
      this.studio.render();
    }
  }

  class DesignStudio {
    constructor() {
      this.design = loadDesign();
      this.tab = "network";
      this.panelTab = "bom";
      this.selectedNode = null;
      this.selectedLink = null;
      this.linkFrom = null;
      this.linkMode = false;
      this.drag = null;
      this.pan = { x: 40, y: 40, zoom: 1 };
      this.layerFilter = "all";
      this.paletteFilter = "";
      this.history = new History(this);
      this.el = null;
    }

    pushHistory() { saveDesign(this.design); this.history.snapshot(); }

    mount() {
      if (document.getElementById("design-studio")) return;
      const root = document.createElement("div");
      root.id = "design-studio";
      root.innerHTML = `
        <header id="ds-header">
          <span class="ds-logo">⬡ Design Studio</span>
          <div id="ds-tabs">
            <button type="button" data-tab="intent">Intent</button>
            <button type="button" data-tab="network" class="active">Network</button>
            <button type="button" data-tab="room">Room</button>
          </div>
          <span class="ds-spacer"></span>
          <button type="button" class="ds-btn" id="ds-undo" title="Undo">↶</button>
          <button type="button" class="ds-btn" id="ds-redo" title="Redo">↷</button>
          <button type="button" class="ds-btn" id="ds-import-stack">Import Stack</button>
          <button type="button" class="ds-btn" id="ds-sync-stack">→ Planner</button>
          <button type="button" class="ds-btn" id="ds-export-svg">SVG</button>
          <button type="button" class="ds-btn warn" id="ds-export-pack">Export Pack</button>
          <button type="button" class="ds-btn" id="ds-ai-design">Ask AI</button>
          <button type="button" class="ds-btn primary" id="ds-close">Close</button>
        </header>
        <div id="ds-body">
          <div id="ds-main">
            <div id="ds-intent" hidden>
              <h3 style="margin:0 0 8px;font-size:14px;color:var(--accent)">Describe the opportunity</h3>
              <textarea id="ds-intent-text" placeholder="200-bed hospital, 3 buildings, SD-WAN at 8 branches, 12 hybrid OR rooms with Room Kit EQ…"></textarea>
              <div class="ds-templates" id="ds-templates"></div>
              <div class="ds-arch-row" id="ds-arch-presets"></div>
              <div style="display:flex;gap:8px;margin:12px 0;flex-wrap:wrap">
                <button type="button" class="ds-btn primary" id="ds-generate">Generate Draft</button>
                <button type="button" class="ds-btn" id="ds-import-json">Apply AI JSON</button>
                <button type="button" class="ds-btn" id="ds-clear">Clear</button>
              </div>
              <label style="font-size:11px;color:var(--muted)">Paste AI JSON response (optional)</label>
              <textarea id="ds-json-import" class="ds-json-area" placeholder='{"nodes":[...],"links":[...]}'></textarea>
              <p class="ds-hint">Generate builds topology from keywords. Apply AI JSON merges structured designs from Ask AI. Reference architectures add proven patterns to the canvas.</p>
            </div>
            <div id="ds-canvas-wrap" class="network-mode">
              <div id="ds-floorplan"></div>
              <div id="ds-toolbar"></div>
              <svg id="ds-svg" xmlns="http://www.w3.org/2000/svg">
                <g id="ds-viewport">
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
            <div id="ds-inspector"><div class="ds-empty">Select a device or link to edit properties</div></div>
            <div id="ds-panel-tabs">
              <button type="button" data-panel="bom" class="active">BOM</button>
              <button type="button" data-panel="cables">Cables</button>
              <button type="button" data-panel="validate">Validate</button>
              <button type="button" data-panel="sites">Sites</button>
            </div>
            <div id="ds-panel-body"></div>
            <div id="ds-status"><span id="ds-status-left"></span><span id="ds-status-right"></span></div>
          </aside>
        </div>`;
      document.body.appendChild(root);
      this.el = root;
      this.buildToolbar();
      this.wireEvents();
      this.populateTemplates();
      this.populateArchPresets();
    }

    buildToolbar() {
      const tb = document.getElementById("ds-toolbar");
      tb.innerHTML = `
        <select id="ds-layer-filter"><option value="all">All layers</option></select>
        <select id="ds-link-media"></select>
        <select id="ds-room-template"><option value="">+ Room template…</option></select>
        <button type="button" id="ds-link-mode">Link: off</button>
        <button type="button" id="ds-snap">Snap: on</button>
        <button type="button" id="ds-layers-band">Layers: on</button>
        <button type="button" id="ds-auto-layout">Auto layout</button>
        <button type="button" id="ds-dup">Duplicate</button>
        <button type="button" id="ds-delete-sel">Delete</button>
        <button type="button" id="ds-floor-upload">Floor plan</button>
        <button type="button" id="ds-fit">Fit</button>
        <input type="file" id="ds-floor-input" accept="image/*" hidden/>`;
      LAYERS.forEach(l => {
        const o = document.createElement("option");
        o.value = l; o.textContent = LAYER_LABELS[l];
        document.getElementById("ds-layer-filter").appendChild(o);
      });
      MEDIA_TYPES.forEach(m => {
        const o = document.createElement("option");
        o.value = m.id; o.textContent = m.label;
        document.getElementById("ds-link-media").appendChild(o);
      });
      Object.entries(ROOM_TEMPLATES).forEach(([k, v]) => {
        const o = document.createElement("option");
        o.value = k; o.textContent = v.name;
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
      $("ds-import-json").onclick = () => this.runJsonImport();
      $("ds-clear").onclick = () => { if (confirm("Clear design?")) { this.design = emptyDesign(this.design.account); this.pushHistory(); this.render(); } };
      $("ds-import-stack").onclick = () => this.importStack();
      $("ds-sync-stack").onclick = () => this.syncToPlanner();
      $("ds-export-pack").onclick = () => this.exportPack();
      $("ds-export-svg").onclick = () => this.exportSvg();
      $("ds-ai-design").onclick = () => this.askAi();
      $("ds-undo").onclick = () => this.history.undo();
      $("ds-redo").onclick = () => this.history.redo();
      $("ds-link-mode").onclick = () => this.toggleLinkMode();
      $("ds-delete-sel").onclick = () => this.deleteSelected();
      $("ds-dup").onclick = () => this.duplicateSelected();
      $("ds-fit").onclick = () => this.fitView();
      $("ds-auto-layout").onclick = () => { autoLayoutNetwork(this.design); this.pushHistory(); this.render(); };
      $("ds-snap").onclick = () => {
        this.design.snapGrid = !this.design.snapGrid;
        $("ds-snap").classList.toggle("active", this.design.snapGrid);
        $("ds-snap").textContent = "Snap: " + (this.design.snapGrid ? "on" : "off");
      };
      $("ds-layers-band").onclick = () => {
        this.design.showLayerBands = !this.design.showLayerBands;
        $("ds-layers-band").classList.toggle("active", this.design.showLayerBands);
        $("ds-layers-band").textContent = "Layers: " + (this.design.showLayerBands ? "on" : "off");
        this.renderCanvas();
      };
      $("ds-layer-filter").onchange = e => { this.layerFilter = e.target.value; this.renderCanvas(); };
      $("ds-palette-search").oninput = e => { this.paletteFilter = e.target.value.toLowerCase(); this.renderPalette(); };
      $("ds-room-template").onchange = e => { if (e.target.value) { this.addRoomTemplate(e.target.value); e.target.value = ""; } };
      $("ds-floor-upload").onclick = () => $("ds-floor-input").click();
      $("ds-floor-input").onchange = e => this.uploadFloorPlan(e.target.files[0]);

      const svg = $("ds-svg");
      svg.onmousedown = e => this.onSvgDown(e);
      svg.onmousemove = e => this.onSvgMove(e);
      svg.onmouseup = () => this.onSvgUp();
      svg.onwheel = e => this.onWheel(e);
      svg.onclick = e => {
        if (e.target === svg || e.target.id === "ds-viewport" || e.target.id === "ds-layer-bands") {
          this.selectedNode = null; this.selectedLink = null;
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
        if (e.key === "Escape") this.close();
      });
    }

    populateTemplates() {
      const tpls = [
        "200-bed hospital, 3 buildings, ISE, Wi-Fi 7, 12 hybrid OR rooms",
        "8 branch SD-WAN with Secure Firewall and Catalyst Center",
        "24 huddle rooms with Room Bar and PoE switch",
        "Data center pod: Nexus spine-leaf, UCS, ACI, Secure Firewall DMZ",
        "K-12 district: 4 sites, Catalyst access, 9179F in gymnasiums",
        "Retail: 50 stores, Meraki MX SD-WAN, MR57 wireless, Umbrella"
      ];
      const box = document.getElementById("ds-templates");
      tpls.forEach(t => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "ds-tpl"; b.textContent = t;
        b.onclick = () => { document.getElementById("ds-intent-text").value = t; };
        box.appendChild(b);
      });
    }

    populateArchPresets() {
      const box = document.getElementById("ds-arch-presets");
      Object.entries(REF_ARCH_PRESETS).forEach(([key, preset]) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "ds-tpl"; b.textContent = "+ " + preset.label;
        b.onclick = () => this.applyRefArch(key);
        box.appendChild(b);
      });
    }

    applyRefArch(key) {
      const preset = REF_ARCH_PRESETS[key];
      if (!preset) return;
      NETWORK_STENCILS = buildNetworkStencils();
      const ox = 80 + this.design.nodes.filter(n => n.canvas === "network").length * 20;
      const idMap = preset.nodes.map(([stencilId, label, x, y]) => {
        const st = stencilFor(stencilId, "network");
        const id = uid();
        this.design.nodes.push({
          id, stencilId, label, pid: st?.pid || FAMILY_PID[stencilId],
          layer: st?.layer || "access", x: ox + x, y: y, canvas: "network", qty: 1
        });
        return id;
      });
      preset.links.forEach(([fi, ti, media], i) => {
        this.design.links.push({
          id: uid(), from: idMap[fi], to: idMap[ti], media,
          label: preset.label + "-" + (i + 1), length: "3m"
        });
      });
      this.pushHistory();
      this.setTab("network");
      this.fitView();
      this.toast("Added " + preset.label);
    }

    addRoomTemplate(tplKey) {
      const tpl = ROOM_TEMPLATES[tplKey];
      if (!tpl) return;
      const roomId = uid();
      const name = `${tpl.name} ${this.design.rooms.length + 1}`;
      this.design.rooms.push({ id: roomId, name, template: tplKey, width: tpl.w, height: tpl.h });
      const ox = 60 + (this.design.rooms.length % 2) * 500;
      const oy = 60 + Math.floor(this.design.rooms.length / 2) * 400;
      applyRoomTemplateToDesign(this.design, tplKey, roomId, name, ox, oy, this.design.nodes, this.design.links);
      this.pushHistory();
      this.setTab("room");
      this.render();
      this.toast("Added " + tpl.name);
    }

    uploadFloorPlan(file) {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        this.design.floorPlan = reader.result;
        document.getElementById("ds-floorplan").style.backgroundImage = `url(${reader.result})`;
        this.pushHistory();
        this.toast("Floor plan loaded");
      };
      reader.readAsDataURL(file);
    }

    open() {
      this.mount();
      NETWORK_STENCILS = buildNetworkStencils();
      this.design = loadDesign();
      const acct = document.querySelector("#acct-name")?.value?.trim();
      if (acct) this.design.account = acct;
      if (this.design.floorPlan)
        document.getElementById("ds-floorplan").style.backgroundImage = `url(${this.design.floorPlan})`;
      document.getElementById("ds-snap").classList.toggle("active", this.design.snapGrid !== false);
      document.getElementById("ds-layers-band").classList.toggle("active", this.design.showLayerBands !== false);
      this.history.snapshot();
      this.el.classList.add("open");
      document.body.classList.add("design-studio-open");
      this.setTab(this.design.mode === "room" ? "room" : "network");
      this.render();
    }

    close() { saveDesign(this.design); this.el?.classList.remove("open"); document.body.classList.remove("design-studio-open"); }

    setTab(tab) {
      this.tab = tab;
      if (tab === "network" || tab === "room") this.design.mode = tab;
      $$("#ds-tabs button").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
      document.getElementById("ds-intent").hidden = tab !== "intent";
      document.getElementById("ds-canvas-wrap").hidden = tab === "intent";
      const wrap = document.getElementById("ds-canvas-wrap");
      wrap.classList.toggle("room-mode", tab === "room");
      wrap.classList.toggle("network-mode", tab === "network");
      if (tab !== "intent") { this.renderPalette(); this.renderCanvas(); }
      this.renderPanel();
    }

    runGenerate() {
      const text = document.getElementById("ds-intent-text").value.trim();
      if (!text) { this.toast("Enter a description"); return; }
      generateFromIntent(text, this.design);
      autoLayoutNetwork(this.design);
      this.pushHistory();
      this.toast("Draft generated — review Network & Room tabs");
      this.setTab("network");
      this.fitView();
    }

    runJsonImport() {
      const raw = document.getElementById("ds-json-import").value.trim();
      if (!raw) { this.toast("Paste JSON first"); return; }
      if (applyJsonDesign(raw, this.design)) {
        this.pushHistory();
        this.render();
        this.toast("AI JSON applied");
      } else this.toast("Invalid JSON — check format");
    }

    importStack() {
      const v2 = window.__cpnV2;
      if (!v2?.phases?.readState) { this.toast("Planner not ready"); return; }
      const stack = v2.phases.readState().stack || [];
      NETWORK_STENCILS = buildNetworkStencils();
      let x = 100, y = 180, added = 0;
      stack.forEach(it => {
        const id = typeof it === "string" ? it : it?.id;
        if (!id) return;
        const name = v2.helpers?.nameOf?.(id) || id;
        let match = NETWORK_STENCILS.find(s => s.id === id || id === s.familyId);
        if (!match) match = NETWORK_STENCILS.find(s => name.toLowerCase().includes(s.label.toLowerCase().slice(0, 6)));
        const stencilId = match?.id || id;
        const st = stencilFor(stencilId, "network") || { layer: "access", pid: FAMILY_PID[id] };
        this.design.nodes.push({
          id: uid(), stencilId, label: name.slice(0, 32), pid: st.pid,
          layer: st.layer || "access", x, y, canvas: "network", qty: 1
        });
        x += 130; if (x > 900) { x = 100; y += 100; }
        added++;
      });
      this.pushHistory();
      this.render();
      this.toast(`Imported ${added} stack items`);
    }

    syncToPlanner() {
      this.toast("Use Export Pack → import families manually; direct planner sync coming soon");
    }

    askAi() {
      const text = document.getElementById("ds-intent-text")?.value?.trim() || "Design a complete Cisco solution";
      const stencils = buildNetworkStencils().slice(0, 30).map(s => s.id).join(", ");
      const prompt = `You are a Cisco Solutions Engineer. Output ONLY valid JSON (no markdown fences):
{"nodes":[{"stencilId":"catalyst-access","label":"Access-1","layer":"access","x":200,"y":200,"canvas":"network","pid":"C9300-48P"}],"links":[{"fromLabel":"Access-1","toLabel":"Core-1","media":"fiber-sm","label":"Uplink","length":"5m"}],"rooms":[{"name":"Conf Room 1"}]}
stencilIds: ${stencils}
room stencils: ${ROOM_STENCILS.map(s => s.id).join(", ")}
media: ${MEDIA_TYPES.map(m => m.id).join(", ")}

Request: ${text}
Account: ${this.design.account}`;
      if (window.__cpnV2?.phases?.openAiWithPrompt) {
        window.__cpnV2.phases.openAiWithPrompt(prompt, { send: true });
        this.toast("AI prompt sent — paste JSON response below and click Apply AI JSON");
        this.setTab("intent");
      } else this.toast("Configure AI assistant first");
    }

    exportPack() {
      const bom = computeBom(this.design);
      const cables = computeCables(this.design);
      const dl = window.__cpnV2?.helpers?.downloadBlob;
      if (!dl) { this.toast("Export unavailable"); return; }
      const slug = (this.design.account || "design").replace(/[^\w-]+/g, "-");
      const bomRows = [["Item Type", "Part Number", "Description", "Qty", "Unit"]];
      bom.forEach(b => bomRows.push([b.type, b.pid, b.desc, b.qty, b.unit || "EA"]));
      dl(`CCW_Prep_${slug}.csv`, "text/csv;charset=utf-8",
        bomRows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n"));

      const cabRows = [["Label", "From Device", "From Port", "To Device", "To Port", "Media", "Cable PID", "Length (m)"]];
      cables.forEach(c => cabRows.push([c.label, c.from, c.fromPort, c.to, c.toPort, c.media, c.cablePid, c.length]));
      dl(`Cable_Schedule_${slug}.csv`, "text/csv;charset=utf-8",
        cabRows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n"));

      const val = validateDesign(this.design);
      const summary = `# Design Summary — ${this.design.account}\n\nGenerated: ${new Date().toISOString()}\nDevices: ${this.design.nodes.length}\nLinks: ${this.design.links.length}\nBOM lines: ${bom.length}\n\n## Validation\n${val.warnings.length ? val.warnings.map(w => "- ⚠ " + w).join("\n") : "✓ No blocking issues"}\n`;
      dl(`Design_Summary_${slug}.md`, "text/markdown", summary);
      dl(`Design_${slug}.json`, "application/json", JSON.stringify(this.design, null, 2));
      this.toast("Exported CCW CSV, cables, summary MD, JSON");
    }

    exportSvg() {
      const vp = document.getElementById("ds-viewport");
      if (!vp) return;
      const clone = vp.cloneNode(true);
      const bbox = vp.getBBox?.() || { x: 0, y: 0, width: 1200, height: 800 };
      const svg = `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="${bbox.x - 20} ${bbox.y - 20} ${bbox.width + 40} ${bbox.height + 40}">${clone.innerHTML}</svg>`;
      window.__cpnV2?.helpers?.downloadBlob?.(`Topology_${(this.design.account || "design").replace(/[^\w-]+/g, "-")}.svg`, "image/svg+xml", svg);
      this.toast("SVG exported");
    }

    toggleLinkMode() {
      this.linkMode = !this.linkMode;
      this.linkFrom = null;
      const btn = document.getElementById("ds-link-mode");
      btn.textContent = "Link: " + (this.linkMode ? "on" : "off");
      btn.classList.toggle("active", this.linkMode);
      document.getElementById("ds-svg").classList.toggle("linking", this.linkMode);
    }

    duplicateSelected() {
      const n = this.design.nodes.find(x => x.id === this.selectedNode);
      if (!n) return;
      const copy = { ...n, id: uid(), x: n.x + 40, y: n.y + 40, label: n.label + " copy" };
      this.design.nodes.push(copy);
      this.selectedNode = copy.id;
      this.pushHistory();
      this.render();
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
      this.pushHistory();
      this.render();
    }

    visibleNodes() {
      const mode = this.tab === "room" ? "room" : "network";
      return this.design.nodes.filter(n => {
        if ((n.canvas || "network") !== mode) return false;
        if (this.layerFilter !== "all" && n.layer !== this.layerFilter) return false;
        return true;
      });
    }

    render() {
      this.renderPalette();
      this.renderCanvas();
      this.renderInspector();
      this.renderPanel();
      const bom = computeBom(this.design);
      document.getElementById("ds-status-left").textContent =
        `${this.design.nodes.length} devices · ${this.design.links.length} links · ${bom.length} BOM lines`;
      document.getElementById("ds-status-right").textContent = `v2 · ${this.design.account}`;
    }

    renderPalette() {
      const grid = document.getElementById("ds-stencil-grid");
      NETWORK_STENCILS = buildNetworkStencils();
      let stencils = this.tab === "room" ? ROOM_STENCILS : NETWORK_STENCILS;
      if (this.paletteFilter) stencils = stencils.filter(s =>
        (s.label + s.id + (s.pid || "")).toLowerCase().includes(this.paletteFilter));
      grid.innerHTML = stencils.slice(0, 60).map(s => `
        <div class="ds-stencil" draggable="true" data-stencil="${s.id}" title="${escapeHtml(s.label)} · ${escapeHtml(s.pid || "")}">
          <span class="ds-st-icon">${s.icon || "▣"}</span>${escapeHtml(s.label.slice(0, 16))}
        </div>`).join("") || `<div class="ds-empty">No stencils match</div>`;
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
      const st = stencilFor(stencilId, mode);
      if (!st) return;
      let cx = x ?? (120 + Math.random() * 300);
      let cy = y ?? (120 + Math.random() * 200);
      if (this.design.snapGrid !== false) { cx = snap(cx); cy = snap(cy); }
      const roomId = mode === "room" && this.design.rooms.length ? this.design.rooms[this.design.rooms.length - 1].id : undefined;
      this.design.nodes.push({
        id: uid(), stencilId, label: st.label, pid: st.pid,
        layer: st.layer || "collab", x: cx, y: cy, canvas: mode,
        w: st.w || 76, h: st.h || 46, qty: 1, roomId
      });
      this.pushHistory();
      this.render();
    }

    renderCanvas() {
      if (this.tab === "intent") return;
      const nodes = this.visibleNodes();
      const nodeIds = new Set(nodes.map(n => n.id));
      const links = this.design.links.filter(l => nodeIds.has(l.from) && nodeIds.has(l.to));
      const pos = id => {
        const n = this.design.nodes.find(x => x.id === id);
        return n ? { x: n.x, y: n.y, w: n.w || 76, h: n.h || 46 } : { x: 0, y: 0, w: 76, h: 46 };
      };

      const bandsG = document.getElementById("ds-layer-bands");
      if (this.tab === "network" && this.design.showLayerBands !== false) {
        bandsG.innerHTML = LAYERS.map(layer => {
          const y = (LAYER_Y[layer] || 200) - 30;
          return `<rect class="ds-layer-band" x="0" y="${y}" width="2000" height="70"/>
            <text class="ds-layer-title" x="8" y="${y + 16}">${LAYER_LABELS[layer]}</text>`;
        }).join("");
      } else bandsG.innerHTML = "";

      const linksG = document.getElementById("ds-links");
      linksG.innerHTML = links.map(l => {
        const a = pos(l.from), b = pos(l.to);
        const x1 = a.x + a.w / 2, y1 = a.y + a.h / 2;
        const x2 = b.x + b.w / 2, y2 = b.y + b.h / 2;
        const sel = this.selectedLink === l.id ? " selected" : "";
        const path = orthPath(x1, y1, x2, y2);
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - 6;
        const media = MEDIA_TYPES.find(m => m.id === l.media);
        return `<path class="ds-link-path${sel}" data-link="${l.id}" d="${path}" marker-end="url(#ds-arrow)"/>
          <text class="ds-link-label" x="${mx}" y="${my}">${escapeHtml(l.label || "")} · ${escapeHtml(media?.label?.slice(0, 8) || "")}</text>`;
      }).join("");

      if (!document.getElementById("ds-arrow-def")) {
        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        defs.id = "ds-arrow-def";
        defs.innerHTML = `<marker id="ds-arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 Z" fill="var(--muted,#888)"/></marker>`;
        document.getElementById("ds-svg").prepend(defs);
      }

      const nodesG = document.getElementById("ds-nodes");
      nodesG.innerHTML = nodes.map(n => {
        const sel = this.selectedNode === n.id ? " selected" : "";
        const st = stencilFor(n.stencilId, n.canvas === "room" ? "room" : "network");
        const w = n.w || 76, h = n.h || 46;
        const qty = n.qty > 1 ? ` ×${n.qty}` : "";
        return `<g class="ds-node${sel}" data-node="${n.id}" transform="translate(${n.x},${n.y})">
          <rect class="ds-node-box" width="${w}" height="${h}" rx="6"/>
          <text class="ds-node-label" x="${w/2}" y="${h/2 - 4}" text-anchor="middle">${escapeHtml((st?.icon || "▣") + " " + (n.label || "").slice(0, 18) + qty)}</text>
          <text class="ds-node-sub" x="${w/2}" y="${h/2 + 9}" text-anchor="middle">${escapeHtml((n.pid || "").slice(0, 18))}</text>
          ${n.layer && this.tab === "network" ? `<text class="ds-node-layer" x="4" y="11">${escapeHtml(LAYER_LABELS[n.layer]?.slice(0, 12) || n.layer)}</text>` : ""}
        </g>`;
      }).join("");

      linksG.querySelectorAll(".ds-link-path").forEach(el => {
        el.onclick = e => { e.stopPropagation(); this.selectedLink = el.dataset.link; this.selectedNode = null; this.renderInspector(); this.renderCanvas(); };
      });

      nodesG.querySelectorAll(".ds-node").forEach(el => {
        el.onmousedown = e => {
          e.stopPropagation();
          const id = el.dataset.node;
          if (this.linkMode) {
            if (!this.linkFrom) { this.linkFrom = id; this.toast("Select target"); }
            else if (this.linkFrom !== id) {
              const media = document.getElementById("ds-link-media").value;
              this.design.links.push({
                id: uid(), from: this.linkFrom, to: id, media,
                label: "Link-" + (this.design.links.length + 1), length: "3m",
                fromPort: "Gi1/0/1", toPort: "Gi1/0/1"
              });
              this.linkFrom = null;
              this.pushHistory();
              this.render();
            }
            return;
          }
          this.selectedNode = id; this.selectedLink = null;
          this.drag = { node: this.design.nodes.find(n => n.id === id) };
          this.renderInspector(); this.renderCanvas();
        };
      });

      this.applyTransform();
    }

    renderInspector() {
      const box = document.getElementById("ds-inspector");
      const node = this.design.nodes.find(n => n.id === this.selectedNode);
      const link = this.design.links.find(l => l.id === this.selectedLink);
      if (node) {
        box.innerHTML = `<h4>Device</h4>
          <label>Label<input id="ds-insp-label" value="${escapeAttr(node.label || "")}"/></label>
          <div class="ds-row2">
            <label>PID<input id="ds-insp-pid" value="${escapeAttr(node.pid || "")}"/></label>
            <label>Qty<input id="ds-insp-qty" type="number" min="1" value="${node.qty || 1}"/></label>
          </div>
          <div class="ds-row2">
            <label>Layer<select id="ds-insp-layer">${LAYERS.map(l => `<option value="${l}" ${node.layer === l ? "selected" : ""}>${LAYER_LABELS[l]}</option>`).join("")}</select></label>
            <label>Site<select id="ds-insp-site">${this.design.sites.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join("")}</select></label>
          </div>`;
        const bind = (id, key, parse) => {
          document.getElementById(id).onchange = e => {
            node[key] = parse ? parse(e.target.value) : e.target.value;
            if (key === "label" || key === "pid") this.pushHistory();
            else saveDesign(this.design);
            this.render();
          };
        };
        bind("ds-insp-label", "label");
        bind("ds-insp-pid", "pid");
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
            <label>Length<input id="ds-insp-len" value="${escapeAttr(link.length || "3m")}"/></label>
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
      box.innerHTML = `<div class="ds-empty">Select a device or link. Shortcuts: L link mode · ⌘Z undo · Del delete · ⌘D duplicate</div>`;
    }

    renderPanel() {
      const body = document.getElementById("ds-panel-body");
      if (this.panelTab === "bom") {
        const bom = computeBom(this.design);
        body.innerHTML = bom.length ? `
          <table class="ds-table"><thead><tr><th>Type</th><th>PID</th><th>Qty</th></tr></thead>
          <tbody>${bom.map(b => `<tr><td>${escapeHtml(b.type)}</td><td title="${escapeAttr(b.desc)}">${escapeHtml(b.pid)}</td><td>${b.qty}</td></tr>`).join("")}</tbody></table>
          <div class="ds-bom-total">${bom.length} line items · ${bom.reduce((s, b) => s + b.qty, 0)} total qty</div>
          <div style="padding:8px 12px"><button type="button" class="ds-btn" id="ds-add-bom">+ Manual BOM line</button></div>` : `<div class="ds-empty">Add devices or generate from Intent</div>`;
        document.getElementById("ds-add-bom")?.addEventListener("click", () => {
          const pid = prompt("Part number (PID):"); if (!pid) return;
          const desc = prompt("Description:", pid) || pid;
          const qty = parseInt(prompt("Qty:", "1") || "1", 10);
          (this.design.bomOverrides ||= []).push({ pid, desc, qty, type: "manual" });
          this.pushHistory(); this.renderPanel();
        });
      } else if (this.panelTab === "cables") {
        const cables = computeCables(this.design);
        body.innerHTML = cables.length ? `
          <table class="ds-table"><thead><tr><th>Label</th><th>From</th><th>Port</th><th>To</th><th>Media</th><th>Len</th></tr></thead>
          <tbody>${cables.map(c => `<tr><td>${escapeHtml(c.label)}</td><td>${escapeHtml(c.from.slice(0, 12))}</td><td>${escapeHtml(c.fromPort)}</td><td>${escapeHtml(c.to.slice(0, 12))}</td><td>${escapeHtml(c.media)}</td><td>${escapeHtml(c.length)}</td></tr>`).join("")}</tbody></table>` : `<div class="ds-empty">Enable Link mode (L) and connect devices</div>`;
      } else if (this.panelTab === "sites") {
        body.innerHTML = `
          <div style="padding:12px;font-size:11px">
            ${this.design.sites.map((s, i) => `<div style="margin-bottom:8px"><strong>${escapeHtml(s.name)}</strong> (${s.type})</div>`).join("")}
            <button type="button" class="ds-btn" id="ds-add-site" style="margin-top:8px">+ Add site</button>
          </div>`;
        document.getElementById("ds-add-site")?.addEventListener("click", () => {
          const name = prompt("Site name:"); if (!name) return;
          this.design.sites.push({ id: uid(), name, type: "branch" });
          this.pushHistory(); this.renderPanel();
        });
      } else {
        const val = validateDesign(this.design);
        body.innerHTML = val.ok
          ? `<div class="ds-empty" style="color:var(--accent)">✓ No blocking issues</div>${val.tips.map(t => `<p style="padding:4px 12px;font-size:11px;color:var(--muted)">💡 ${escapeHtml(t)}</p>`).join("")}`
          : `<ul style="padding:12px 12px 12px 28px;font-size:11px;line-height:1.6">${val.warnings.map(w => `<li style="color:var(--orange)">${escapeHtml(w)}</li>`).join("")}${val.tips.map(t => `<li style="color:var(--muted)">${escapeHtml(t)}</li>`).join("")}</ul>`;
      }
    }

    applyTransform() {
      document.getElementById("ds-viewport")?.setAttribute("transform", `translate(${this.pan.x},${this.pan.y}) scale(${this.pan.zoom})`);
    }

    clientToSvg(cx, cy) {
      const rect = document.getElementById("ds-svg").getBoundingClientRect();
      return { x: (cx - rect.left - this.pan.x) / this.pan.zoom, y: (cy - rect.top - this.pan.y) / this.pan.zoom };
    }

    onSvgDown(e) { if (!e.target.closest(".ds-node") && !e.target.closest(".ds-link-path")) this.panDrag = { ox: e.clientX, oy: e.clientY, px: this.pan.x, py: this.pan.y }; }

    onSvgMove(e) {
      if (this.drag?.node) {
        const pt = this.clientToSvg(e.clientX, e.clientY);
        let nx = pt.x - (this.drag.node.w || 76) / 2;
        let ny = pt.y - (this.drag.node.h || 46) / 2;
        if (this.design.snapGrid !== false) { nx = snap(nx); ny = snap(ny); }
        this.drag.node.x = nx; this.drag.node.y = ny;
        this.renderCanvas();
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
      this.pan.zoom = Math.max(0.25, Math.min(3, this.pan.zoom * (e.deltaY > 0 ? 0.92 : 1.08)));
      this.applyTransform();
    }

    fitView() {
      const nodes = this.visibleNodes();
      if (!nodes.length) { this.pan = { x: 40, y: 40, zoom: 1 }; this.applyTransform(); return; }
      const xs = nodes.flatMap(n => [n.x, n.x + (n.w || 76)]);
      const ys = nodes.flatMap(n => [n.y, n.y + (n.h || 46)]);
      const rect = document.getElementById("ds-svg").getBoundingClientRect();
      const pad = 80, w = Math.max(...xs) - Math.min(...xs) + pad * 2, h = Math.max(...ys) - Math.min(...ys) + pad * 2;
      this.pan.zoom = Math.max(0.35, Math.min(rect.width / w, rect.height / h, 1.3));
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

  window.DesignStudio = { open: () => studio.open(), close: () => studio.close(), instance: studio, buildStencils: buildNetworkStencils };
  window.initDesignStudio = initDesignStudio;

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initDesignStudio);
  else initDesignStudio();
})();

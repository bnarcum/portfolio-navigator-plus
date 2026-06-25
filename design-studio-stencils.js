/**
 * Design Studio v3 — Stencil library with SVG silhouettes & port anchors
 */
(function () {
  "use strict";

  const DEVICE_SVG = {
    switch: `<rect x="4" y="8" width="68" height="32" rx="3" fill="#0d2847" stroke="#2a6090" stroke-width="1.5"/>
      <rect x="8" y="12" width="4" height="4" rx="1" fill="#02c8ff" opacity=".7"/><rect x="14" y="12" width="4" height="4" rx="1" fill="#02c8ff" opacity=".7"/>
      <rect x="20" y="12" width="4" height="4" rx="1" fill="#02c8ff" opacity=".7"/><rect x="26" y="12" width="4" height="4" rx="1" fill="#02c8ff" opacity=".7"/>
      <rect x="32" y="12" width="4" height="4" rx="1" fill="#02c8ff" opacity=".7"/><rect x="38" y="12" width="4" height="4" rx="1" fill="#02c8ff" opacity=".7"/>
      <rect x="44" y="12" width="4" height="4" rx="1" fill="#02c8ff" opacity=".7"/><rect x="50" y="12" width="4" height="4" rx="1" fill="#02c8ff" opacity=".7"/>
      <rect x="56" y="12" width="4" height="4" rx="1" fill="#02c8ff" opacity=".7"/><rect x="62" y="12" width="4" height="4" rx="1" fill="#02c8ff" opacity=".7"/>
      <rect x="58" y="28" width="10" height="6" rx="1" fill="#ff9000" opacity=".8"/>`,
    router: `<rect x="6" y="10" width="64" height="28" rx="4" fill="#0d2847" stroke="#2a6090" stroke-width="1.5"/>
      <circle cx="18" cy="24" r="3" fill="#02c8ff" opacity=".6"/><circle cx="30" cy="24" r="3" fill="#02c8ff" opacity=".6"/>
      <circle cx="42" cy="24" r="3" fill="#02c8ff" opacity=".6"/><rect x="52" y="20" width="12" height="8" rx="2" fill="#ff9000" opacity=".7"/>`,
    firewall: `<rect x="4" y="6" width="68" height="36" rx="3" fill="#1a0d0d" stroke="#803030" stroke-width="1.5"/>
      <path d="M38 14 L48 24 L38 34 L28 24 Z" fill="none" stroke="#ff4444" stroke-width="1.5"/>
      <rect x="8" y="30" width="8" height="4" rx="1" fill="#ff9000" opacity=".6"/><rect x="56" y="30" width="8" height="4" rx="1" fill="#02c8ff" opacity=".6"/>`,
    ap: `<ellipse cx="38" cy="28" rx="28" ry="10" fill="#0d2847" stroke="#2a6090" stroke-width="1.5"/>
      <circle cx="38" cy="22" r="6" fill="#02c8ff" opacity=".5"/>
      <path d="M38 16 Q48 8 58 16" fill="none" stroke="#02c8ff" stroke-width="1.5" opacity=".4"/>
      <path d="M38 16 Q28 8 18 16" fill="none" stroke="#02c8ff" stroke-width="1.5" opacity=".4"/>`,
    nexus: `<rect x="2" y="6" width="72" height="38" rx="3" fill="#0a1a30" stroke="#4060a0" stroke-width="1.5"/>
      <rect x="6" y="10" width="6" height="6" rx="1" fill="#6080ff" opacity=".8"/><rect x="14" y="10" width="6" height="6" rx="1" fill="#6080ff" opacity=".8"/>
      <rect x="22" y="10" width="6" height="6" rx="1" fill="#6080ff" opacity=".8"/><rect x="30" y="10" width="6" height="6" rx="1" fill="#6080ff" opacity=".8"/>
      <rect x="54" y="10" width="16" height="8" rx="1" fill="#ff9000" opacity=".9"/>`,
    server: `<rect x="10" y="4" width="56" height="40" rx="2" fill="#0d2847" stroke="#2a6090" stroke-width="1.5"/>
      <rect x="14" y="8" width="48" height="6" rx="1" fill="#1a3050"/><rect x="14" y="18" width="48" height="6" rx="1" fill="#1a3050"/>
      <rect x="14" y="28" width="48" height="6" rx="1" fill="#1a3050"/><circle cx="56" cy="11" r="2" fill="#00cc66"/><circle cx="56" cy="21" r="2" fill="#00cc66"/>`,
    codec: `<rect x="8" y="12" width="60" height="28" rx="4" fill="#0d2847" stroke="#2a6090" stroke-width="1.5"/>
      <circle cx="24" cy="26" r="8" fill="none" stroke="#02c8ff" stroke-width="1.5"/>
      <rect x="38" y="20" width="24" height="12" rx="2" fill="#1a3050" stroke="#406080"/>`,
    display: `<rect x="6" y="8" width="64" height="36" rx="2" fill="#051020" stroke="#406080" stroke-width="2"/>
      <rect x="10" y="12" width="56" height="28" rx="1" fill="#0a2040"/>
      <rect x="32" y="44" width="12" height="4" rx="1" fill="#406080"/>`,
    camera: `<rect x="12" y="16" width="52" height="24" rx="6" fill="#0d2847" stroke="#2a6090" stroke-width="1.5"/>
      <circle cx="38" cy="28" r="10" fill="none" stroke="#02c8ff" stroke-width="2"/>
      <circle cx="38" cy="28" r="4" fill="#02c8ff" opacity=".5"/>`,
    mic: `<ellipse cx="38" cy="30" rx="20" ry="8" fill="#0d2847" stroke="#2a6090" stroke-width="1.5"/>
      <rect x="34" y="10" width="8" height="14" rx="2" fill="#1a3050" stroke="#406080"/>`,
    touch: `<rect x="14" y="8" width="48" height="36" rx="4" fill="#0d2847" stroke="#2a6090" stroke-width="1.5"/>
      <rect x="18" y="12" width="40" height="28" rx="2" fill="#102840"/>`,
    cloud: `<ellipse cx="38" cy="28" rx="30" ry="16" fill="#102840" stroke="#406080" stroke-width="1.5" stroke-dasharray="4 2"/>
      <text x="38" y="32" text-anchor="middle" fill="#8899aa" font-size="9">CLOUD</text>`,
    user: `<circle cx="38" cy="18" r="10" fill="#1a3050" stroke="#406080"/><path d="M18 44 Q38 30 58 44" fill="#1a3050" stroke="#406080"/>`,
    rack: `<rect x="20" y="4" width="36" height="44" rx="2" fill="#0a1525" stroke="#406080" stroke-width="1.5"/>
      <line x1="24" y1="12" x2="52" y2="12" stroke="#304060"/><line x1="24" y1="22" x2="52" y2="22" stroke="#304060"/>
      <line x1="24" y1="32" x2="52" y2="32" stroke="#304060"/><line x1="24" y1="42" x2="52" y2="42" stroke="#304060"/>`,
    table: `<rect x="8" y="20" width="60" height="24" rx="4" fill="#1a2535" stroke="#506070" stroke-width="1.5"/>
      <ellipse cx="38" cy="20" rx="28" ry="8" fill="none" stroke="#506070" stroke-width="1" stroke-dasharray="3 2"/>`
  };

  function buildCopperPorts(prefix, count, startX, endX) {
    const ports = [];
    for (let i = 1; i <= count; i++) {
      const t = count === 1 ? 0.5 : startX + ((i - 1) / (count - 1)) * (endX - startX);
      ports.push({ id: `${prefix}${i}`, x: t, y: 1, side: "bottom", type: "copper", poe: true });
    }
    return ports;
  }

  const PORT_PRESETS = {
    "switch-48": [
      ...buildCopperPorts("Gi1/0/", 8, 0.06, 0.74),
      { id: "Gi1/0/23", x: 0.82, y: 1, side: "bottom", type: "copper", poe: true },
      { id: "Gi1/0/24", x: 0.88, y: 1, side: "bottom", type: "copper", poe: true },
      { id: "Gi1/0/47", x: 0.92, y: 1, side: "bottom", type: "copper", poe: true },
      { id: "Gi1/0/48", x: 0.98, y: 1, side: "bottom", type: "copper", poe: true },
      { id: "Te1/1/1", x: 0.25, y: 0, side: "top", type: "sfp", speed: "10G" },
      { id: "Te1/1/2", x: 0.75, y: 0, side: "top", type: "sfp", speed: "10G" },
      { id: "Mgmt", x: 0.5, y: 0, side: "top", type: "mgmt" }
    ],
    "switch-24": [
      ...buildCopperPorts("Gi1/0/", 8, 0.08, 0.88),
      { id: "Gi1/0/23", x: 0.92, y: 1, side: "bottom", type: "copper", poe: true },
      { id: "Gi1/0/24", x: 0.98, y: 1, side: "bottom", type: "copper", poe: true },
      { id: "Te1/1/1", x: 0.5, y: 0, side: "top", type: "sfp", speed: "10G" }
    ],
    "switch-chassis": [
      { id: "Te1/1/1", x: 0.3, y: 0, side: "top", type: "sfp", speed: "10G" },
      { id: "Te1/1/2", x: 0.7, y: 0, side: "top", type: "sfp", speed: "10G" },
      { id: "Gi1/0/1", x: 0.2, y: 1, side: "bottom", type: "copper", poe: true },
      { id: "Gi1/0/48", x: 0.8, y: 1, side: "bottom", type: "copper", poe: true }
    ],
    "router-dual": [
      { id: "Gi0/0/0", x: 0.2, y: 1, side: "bottom", type: "copper" },
      { id: "Gi0/0/1", x: 0.8, y: 1, side: "bottom", type: "copper" },
      { id: "Te0/1/0", x: 0.35, y: 0, side: "top", type: "sfp", speed: "10G" },
      { id: "Te0/1/1", x: 0.65, y: 0, side: "top", type: "sfp", speed: "10G" }
    ],
    "firewall-trio": [
      { id: "outside", x: 0.15, y: 0.5, side: "left", type: "copper" },
      { id: "inside", x: 0.85, y: 0.5, side: "right", type: "copper" },
      { id: "dmz", x: 0.5, y: 1, side: "bottom", type: "copper" }
    ],
    "ap-single": [{ id: "ETH0", x: 0.5, y: 1, side: "bottom", type: "copper", poe: true }],
    "nexus-spine": [
      { id: "Eth1/1", x: 0.2, y: 1, side: "bottom", type: "fiber", speed: "40G" },
      { id: "Eth1/2", x: 0.35, y: 1, side: "bottom", type: "fiber", speed: "40G" },
      { id: "Eth1/32", x: 0.8, y: 1, side: "bottom", type: "fiber", speed: "40G" },
      { id: "Eth1/33", x: 0.2, y: 0, side: "top", type: "fiber", speed: "40G" },
      { id: "Eth1/64", x: 0.8, y: 0, side: "top", type: "fiber", speed: "40G" }
    ],
    "codec-av": [
      { id: "LAN", x: 0.15, y: 1, side: "bottom", type: "copper", poe: true },
      { id: "HDMI1", x: 0.85, y: 0.5, side: "right", type: "hdmi" },
      { id: "HDMI2", x: 0.85, y: 0.7, side: "right", type: "hdmi" },
      { id: "USB", x: 0.5, y: 1, side: "bottom", type: "usb" }
    ],
    "display-hdmi": [
      { id: "HDMI1", x: 0.3, y: 1, side: "bottom", type: "hdmi" },
      { id: "HDMI2", x: 0.7, y: 1, side: "bottom", type: "hdmi" }
    ],
    "cam-hdmi": [{ id: "HDMI", x: 0.5, y: 1, side: "bottom", type: "hdmi" }],
    "mic-poe": [{ id: "ETH", x: 0.5, y: 1, side: "bottom", type: "copper", poe: true }],
    "touch-lan": [{ id: "LAN", x: 0.5, y: 1, side: "bottom", type: "copper", poe: true }],
    "amp-spk": [
      { id: "SPK1", x: 0.25, y: 1, side: "bottom", type: "speaker" },
      { id: "SPK2", x: 0.75, y: 1, side: "bottom", type: "speaker" },
      { id: "LAN", x: 0.5, y: 0, side: "top", type: "copper" }
    ],
    "generic": [
      { id: "Port1", x: 0.3, y: 1, side: "bottom", type: "copper" },
      { id: "Port2", x: 0.7, y: 1, side: "bottom", type: "copper" }
    ]
  };

  const NETWORK_DEVICES = {
    "c9500-core": { label: "C9500 Core", pid: "C9500-48Y4C", layer: "core", role: "core", shape: "switch", ports: "switch-48", w: 88, h: 48, poeW: 0, rackU: 1 },
    "c9500-core-2": { label: "C9500 Core (B)", pid: "C9500-48Y4C", layer: "core", role: "core", shape: "switch", ports: "switch-48", w: 88, h: 48 },
    "c9400-dist": { label: "C9400 Dist", pid: "C9400-L-C9407R", layer: "distribution", role: "distribution", shape: "switch", ports: "switch-chassis", w: 88, h: 48, rackU: 7 },
    "c9300-access": { label: "C9300 Access", pid: "C9300-48P", layer: "access", role: "access", shape: "switch", ports: "switch-48", w: 88, h: 48, poeW: 740, rackU: 1 },
    "c9200-access": { label: "C9200 Access", pid: "C9200-24P", layer: "access", role: "access", shape: "switch", ports: "switch-24", w: 80, h: 44, poeW: 370, rackU: 1 },
    "c9200-collab": { label: "C9200 Collab SW", pid: "C9200-24P", layer: "collab", role: "collab-switch", shape: "switch", ports: "switch-24", w: 80, h: 44, poeW: 370 },
    "cw9179f": { label: "CW9179F AP", pid: "CW9179F", layer: "access", role: "ap", shape: "ap", ports: "ap-single", w: 72, h: 44, poeW: 25 },
    "mr57": { label: "MR57 AP", pid: "MR57-HW", layer: "access", role: "ap", shape: "ap", ports: "ap-single", w: 72, h: 44, poeW: 25 },
    "c8200-sdwan": { label: "C8200 SD-WAN", pid: "C8200-1N-4T", layer: "wan", role: "wan-edge", shape: "router", ports: "router-dual", w: 84, h: 44 },
    "c8200-sdwan-2": { label: "C8200 SD-WAN (B)", pid: "C8200-1N-4T", layer: "wan", role: "wan-edge", shape: "router", ports: "router-dual", w: 84, h: 44 },
    "vmanage": { label: "vManage", pid: "SD-WAN-VMS-SMALL", layer: "mgmt", role: "controller", shape: "server", ports: "generic", w: 72, h: 48 },
    "cat-center": { label: "Catalyst Center", pid: "DN3-HW-APL", layer: "mgmt", role: "management", shape: "server", ports: "generic", w: 80, h: 48 },
    "ise-psn": { label: "ISE PSN", pid: "ISE-VM-K9", layer: "security", role: "ise", shape: "server", ports: "generic", w: 72, h: 48 },
    "ise-pan": { label: "ISE PAN", pid: "ISE-VM-K9", layer: "security", role: "ise", shape: "server", ports: "generic", w: 72, h: 48 },
    "fpr-2130": { label: "FPR 2130", pid: "FPR-2130", layer: "security", role: "firewall", shape: "firewall", ports: "firewall-trio", w: 88, h: 52 },
    "fpr-1120": { label: "FPR 1120 Branch", pid: "FPR-1120", layer: "security", role: "firewall", shape: "firewall", ports: "firewall-trio", w: 80, h: 48 },
    "n9k-spine": { label: "N9K Spine", pid: "N9K-C9332D-GX2B", layer: "dc", role: "spine", shape: "nexus", ports: "nexus-spine", w: 92, h: 52 },
    "n9k-leaf": { label: "N9K Leaf", pid: "N9K-C93180YC-FX3", layer: "dc", role: "leaf", shape: "nexus", ports: "nexus-spine", w: 92, h: 52 },
    "apic": { label: "APIC Cluster", pid: "APIC-L3", layer: "dc", role: "apic", shape: "server", ports: "generic", w: 72, h: 48 },
    "ucs-x": { label: "UCS X210c", pid: "UCSX-210C-M7SN", layer: "dc", role: "compute", shape: "server", ports: "generic", w: 72, h: 52 },
    "mx85": { label: "Meraki MX85", pid: "MX85-HW", layer: "wan", role: "wan-edge", shape: "router", ports: "router-dual", w: 80, h: 44 },
    "ms250": { label: "MS250 Switch", pid: "MS250-48FP-HW", layer: "access", role: "access", shape: "switch", ports: "switch-48", w: 88, h: 48, poeW: 740 },
    "umbrella-va": { label: "Umbrella VA", pid: "UMB-VA-VM", layer: "security", role: "dns", shape: "cloud", ports: "generic", w: 76, h: 44 },
    "internet": { label: "Internet / DIA", pid: "N/A-INTERNET", layer: "wan", role: "cloud", shape: "cloud", ports: "generic", w: 80, h: 44 },
    "mpls": { label: "MPLS WAN", pid: "N/A-MPLS", layer: "wan", role: "cloud", shape: "cloud", ports: "generic", w: 80, h: 44 },
    "users-vlan": { label: "Users / VLAN", pid: "N/A-VLAN", layer: "access", role: "logical", shape: "user", ports: "generic", w: 72, h: 48 }
  };

  const ROOM_DEVICES = {
    "room-kit-eq": { label: "Room Kit EQ", pid: "CS-KIT-EQ-K9", shape: "codec", ports: "codec-av", w: 92, h: 52, poeW: 60 },
    "room-kit-pro": { label: "Room Kit Pro G2", pid: "CS-KITPRO-K9", shape: "codec", ports: "codec-av", w: 92, h: 52, poeW: 60 },
    "room-bar": { label: "Room Bar", pid: "CS-BAR-K9", shape: "codec", ports: "codec-av", w: 84, h: 48, poeW: 45 },
    "board-pro": { label: "Board Pro 75", pid: "CS-BRD-75-K9", shape: "display", ports: "display-hdmi", w: 104, h: 60, poeW: 0 },
    "desk-pro": { label: "Desk Pro", pid: "CS-DESKPRO-K9", shape: "codec", ports: "codec-av", w: 76, h: 48, poeW: 30 },
    "quad-cam": { label: "Quad Camera", pid: "CS-QUADCAM", shape: "camera", ports: "cam-hdmi", w: 56, h: 52 },
    "ceiling-mic": { label: "Ceiling Mic Pro", pid: "CS-CEILINGMIC", shape: "mic", ports: "mic-poe", w: 72, h: 40, poeW: 15 },
    "table-mic": { label: "Table Mic Pro", pid: "CS-TABLEMIC", shape: "mic", ports: "mic-poe", w: 68, h: 36, poeW: 10 },
    "touch-10": { label: "Touch 10", pid: "CS-TOUCH10", shape: "touch", ports: "touch-lan", w: 64, h: 48, poeW: 12 },
    "amp-280": { label: "Room Amp 280", pid: "CS-AMP-280", shape: "codec", ports: "amp-spk", w: 56, h: 44 },
    "display-75": { label: "Display 75\"", pid: "DISPLAY-75-4K", shape: "display", ports: "display-hdmi", w: 100, h: 58 },
    "display-86": { label: "Display 86\"", pid: "DISPLAY-86-4K", shape: "display", ports: "display-hdmi", w: 108, h: 62 },
    "credenza-rack": { label: "12U Credenza", pid: "RACK-12U-CRED", shape: "rack", ports: "generic", w: 56, h: 72 },
    "conf-table-12": { label: "Conf Table (12)", pid: "FURN-TABLE-12", shape: "table", ports: "generic", w: 120, h: 56 },
    "conf-table-8": { label: "Huddle Table (8)", pid: "FURN-TABLE-8", shape: "table", ports: "generic", w: 88, h: 48 },
    "c9200-collab": { label: "C9200 Collab SW", pid: "C9200-24P", shape: "switch", ports: "switch-24", w: 80, h: 44, poeW: 370, layer: "collab", role: "collab-switch" }
  };

  const FAMILY_TO_STENCIL = {
    "catalyst-core": "c9500-core", "catalyst-access": "c9300-access", "catalyst-wireless": "cw9179f",
    "catalyst-center": "cat-center", "sdwan": "c8200-sdwan", "secure-routers": "c8200-sdwan",
    "isr-routers": "c8200-sdwan", "sf-enterprise": "fpr-2130", "sf-branch": "fpr-1120",
    "ise": "ise-psn", "nexus": "n9k-leaf", "nexus-one": "n9k-spine", "aci": "apic",
    "ucs": "ucs-x", "meraki-mx": "mx85", "meraki-switches": "ms250", "meraki-wireless": "mr57",
    "umbrella": "umbrella-va", "room-systems": "room-kit-eq", "desk-devices": "desk-pro"
  };

  function getPorts(stencilId, mode) {
    const def = getDef(stencilId, mode);
    if (!def) return PORT_PRESETS.generic;
    return PORT_PRESETS[def.ports] || PORT_PRESETS.generic;
  }

  function getDef(stencilId, mode) {
    if (ROOM_DEVICES[stencilId]) return ROOM_DEVICES[stencilId];
    if (NETWORK_DEVICES[stencilId]) return NETWORK_DEVICES[stencilId];
    const mapped = FAMILY_TO_STENCIL[stencilId];
    if (mapped && NETWORK_DEVICES[mapped]) return NETWORK_DEVICES[mapped];
    return null;
  }

  function portExists(stencilId, mode, portId) {
    if (!portId) return true;
    return getPorts(stencilId, mode).some(p => p.id === portId);
  }

  function portXY(node, portId) {
    const mode = node.canvas === "room" ? "room" : "network";
    const ports = getPorts(node.stencilId, mode);
    const w = node.w || 76, h = node.h || 46;
    const p = ports.find(x => x.id === portId) || ports[0];
    if (!p) return { x: node.x + w / 2, y: node.y + h / 2 };
    let px = node.x + p.x * w, py = node.y + p.y * h;
    if (p.side === "top") py = node.y;
    if (p.side === "bottom") py = node.y + h;
    if (p.side === "left") px = node.x;
    if (p.side === "right") px = node.x + w;
    return { x: px, y: py };
  }

  function renderDeviceSvg(def, w, h, selected) {
    const shape = def?.shape || "switch";
    const inner = DEVICE_SVG[shape] || DEVICE_SVG.switch;
    const sel = selected ? ' class="ds-node-box selected-inner"' : "";
    return `<g transform="scale(${w / 76}, ${h / 48})">${inner.replace("<rect", `<rect${sel}`)}</g>`;
  }

  function renderPorts(node, mode, linkHot) {
    const ports = getPorts(node.stencilId, mode);
    const w = node.w || 76, h = node.h || 46;
    return ports.map(p => {
      let cx = p.x * w, cy = p.y * h;
      if (p.side === "top") cy = 0;
      if (p.side === "bottom") cy = h;
      if (p.side === "left") cx = 0;
      if (p.side === "right") cx = w;
      const hot = linkHot === p.id ? " hot" : "";
      const color = p.poe ? "#ff9000" : p.type === "fiber" ? "#6080ff" : p.type === "hdmi" ? "#44cc88" : "#8899aa";
      return `<circle class="ds-port${hot}" data-port="${p.id}" cx="${cx}" cy="${cy}" r="4" fill="${color}" stroke="#fff" stroke-width=".5">
        <title>${p.id}${p.speed ? " " + p.speed : ""}${p.poe ? " PoE" : ""}</title></circle>`;
    }).join("");
  }

  function buildCatalogStencils() {
    const families = window.__cpnDesignCatalog?.families?.() || [];
    const seen = new Set(Object.keys(NETWORK_DEVICES));
    const out = Object.entries(NETWORK_DEVICES).map(([id, d]) => ({
      id, label: d.label, pid: d.pid, layer: d.layer, role: d.role,
      icon: d.shape === "firewall" ? "🛡" : d.shape === "ap" ? "📶" : "▣",
      category: d.layer === "security" ? "security" : "networking", familyId: id, w: d.w, h: d.h
    }));
    families.forEach(f => {
      const sid = FAMILY_TO_STENCIL[f.id] || f.id;
      if (seen.has(sid)) return;
      seen.add(sid);
      out.push({
        id: f.id, label: f.name.length > 22 ? f.name.slice(0, 20) + "…" : f.name,
        layer: f.category === "security" ? "security" : f.category === "collaboration" ? "collab" : "access",
        pid: `PID-${f.id}`, icon: "▣", familyId: f.id, w: 76, h: 46
      });
    });
    return out;
  }

  function buildRoomStencils() {
    return Object.entries(ROOM_DEVICES).map(([id, d]) => ({
      id, label: d.label, pid: d.pid, icon: d.shape === "display" ? "📺" : d.shape === "camera" ? "🎥" : "📹",
      w: d.w, h: d.h, layer: "collab"
    }));
  }

  function suggestMedia(fromNode, toNode, fromPort, toPort) {
    const fDef = getDef(fromNode.stencilId, fromNode.canvas === "room" ? "room" : "network");
    const tDef = getDef(toNode.stencilId, toNode.canvas === "room" ? "room" : "network");
    const fRole = fDef?.role, tRole = tDef?.role;
    if (/hdmi/i.test(fromPort || "") || /hdmi/i.test(toPort || "")) return "hdmi";
    if (/spk/i.test(fromPort || "") || /spk/i.test(toPort || "")) return "speaker";
    if (fRole === "ap" || tRole === "ap" || /poe|lan|eth/i.test(toPort || "")) return "cat6";
    if (fRole === "spine" || tRole === "spine" || fRole === "leaf" || tRole === "leaf") return "fiber-40g";
    if (fRole === "core" || tRole === "core" || fRole === "distribution") return "fiber-sm";
    if (fRole === "wan-edge" || tRole === "cloud") return "fiber-sm";
    return "cat6a";
  }

  window.__DS_STENCILS = {
    NETWORK_DEVICES, ROOM_DEVICES, FAMILY_TO_STENCIL, PORT_PRESETS,
    getDef, getPorts, portXY, portExists, renderDeviceSvg, renderPorts,
    buildCatalogStencils, buildRoomStencils, suggestMedia, DEVICE_SVG
  };
})();

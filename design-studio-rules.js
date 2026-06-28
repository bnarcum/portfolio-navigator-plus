/**
 * Design Studio v3 — Rules engine, design score, suggestions & PoE
 */
(function () {
  "use strict";

  const ST = () => window.__DS_STENCILS;

  function nodeDef(n) {
    const mode = n.canvas === "room" ? "room" : "network";
    return ST()?.getDef?.(n.stencilId, mode);
  }

  function nodeMode(n) { return n.canvas === "room" ? "room" : "network"; }

  function nets(d) { return d.nodes.filter(n => n.canvas !== "room"); }
  function rooms(d) { return d.nodes.filter(n => n.canvas === "room"); }

  function isPoeSwitch(def) {
    return def && (def.role === "access" || def.role === "collab-switch") && (def.poeW || 0) > 0;
  }

  function isPoeLoad(def, stencilId) {
    if (!def) return /ap|mic|kit|bar|touch|desk|9179|mr57/i.test(stencilId || "");
    if (isPoeSwitch(def)) return false;
    if ((def.poeW || 0) > 0) return true;
    return /ap|mic|kit|bar|touch|desk/i.test(stencilId || "");
  }

  function computePoeBudget(design) {
    const switches = design.nodes.filter(n => isPoeSwitch(nodeDef(n)));
    const loads = design.nodes.filter(n => isPoeLoad(nodeDef(n), n.stencilId));
    const load = loads.reduce((s, n) => s + (nodeDef(n)?.poeW || 15) * (n.qty || 1), 0);
    const budget = switches.reduce((s, n) => s + (nodeDef(n)?.poeW || 0) * (n.qty || 1), 0);
    return { load, budget, headroom: budget - load, switches: switches.length, devices: loads.length };
  }

  function validateLinkPorts(design) {
    const issues = [];
    design.links.forEach(l => {
      const from = design.nodes.find(n => n.id === l.from);
      const to = design.nodes.find(n => n.id === l.to);
      if (!from || !to) return;
      const fm = nodeMode(from), tm = nodeMode(to);
      const STN = ST();
      if (l.fromPort && STN && !STN.portExists(from.stencilId, fm, l.fromPort))
        issues.push({ id: "port-from-" + l.id, msg: `${l.label || "Link"}: invalid fromPort ${l.fromPort} on ${from.label}`, severity: "error" });
      if (l.toPort && STN && !STN.portExists(to.stencilId, tm, l.toPort))
        issues.push({ id: "port-to-" + l.id, msg: `${l.label || "Link"}: invalid toPort ${l.toPort} on ${to.label}`, severity: "error" });
    });
    return issues;
  }

  function isAioCollab(stencilId) {
    return /board-pro|room-bar|desk-pro/i.test(stencilId || "");
  }

  function isExternalCodec(stencilId) {
    return /room-kit|kit-eq|kitpro|codec/i.test(stencilId || "");
  }

  function validateRoomArchitecture(design) {
    const issues = [];
    (design.rooms || []).forEach(room => {
      const nodes = design.nodes.filter(n => n.roomId === room.id);
      const aios = nodes.filter(n => isAioCollab(n.stencilId));
      const codecs = nodes.filter(n => isExternalCodec(n.stencilId));
      if (aios.length && codecs.length) {
        issues.push({
          id: "room-aio-codec-" + room.id,
          msg: `${room.name}: Cisco Board Pro / Room Bar / Desk Pro are all-in-one — remove Room Kit codec (per Webex room system guidance).`,
          severity: "error"
        });
      }
      if (codecs.length > 1 && room.template !== "divisible") {
        issues.push({
          id: "room-dup-codec-" + room.id,
          msg: `${room.name}: multiple codecs (${codecs.map(c => c.label).join(", ")}) — use one codec per space unless divisible room.`,
          severity: "error"
        });
      }
    });
    return issues;
  }

  // Cisco Spaces design rules: sensor gateways, connector need, beacons, outcomes.
  function validateSpaces(design) {
    const w = [], tips = [];
    const all = design.nodes;
    const d = n => nodeDef(n);
    const spacesCloud = all.filter(n => d(n)?.role === "spaces-cloud");
    const connectors = all.filter(n => d(n)?.role === "connector");
    const sensors = all.filter(n => d(n)?.role === "sensor");
    const gateways = all.filter(n => d(n)?.mtGateway);
    const beacons = all.filter(n => d(n)?.spacesBeacon);
    const catalystAps = all.filter(n => d(n)?.spacesBeacon && /cw9179|catalyst|^cw/i.test(n.stencilId || ""));

    if (sensors.length && gateways.length === 0)
      w.push({ id: "spaces-mt-gw", severity: "error", msg: `${sensors.length} Meraki MT sensor(s) need a gateway — add a Meraki MR access point or MV camera (MT is BLE/IoT, not PoE).` });

    if (spacesCloud.length) {
      if (beacons.length === 0)
        tips.push({ id: "spaces-beacons", msg: "Cisco Spaces enabled but no APs — add Catalyst/Meraki APs as BLE beacons for wayfinding & Detect-and-Locate." });
      if (catalystAps.length && connectors.length === 0)
        tips.push({ id: "spaces-connector", msg: "On-prem Catalyst/WLC detected — add a Spaces Connector 3 to stream location data to Cisco Spaces (Meraki is cloud-to-cloud, no connector needed)." });
      tips.push({ id: "spaces-outcomes", msg: `Spaces outcomes enabled: Live Occupancy, Smart Workspaces, wayfinding${sensors.length ? `, IoT (${sensors.length} sensor${sensors.length > 1 ? "s" : ""})` : ""}.` });
    } else if (sensors.length || beacons.length >= 2) {
      tips.push({ id: "spaces-add", msg: "Add the Cisco Spaces cloud node to unlock occupancy, wayfinding and IoT dashboards from your APs/sensors." });
    }
    return { w, tips };
  }

  function validateDesign(design) {
    const w = [], tips = [];
    const network = nets(design);
    const roomNodes = rooms(design);

    w.push(...validateLinkPorts(design));
    w.push(...validateRoomArchitecture(design));
    const sp = validateSpaces(design);
    w.push(...sp.w);
    tips.push(...sp.tips);

    const cores = network.filter(n => /core|c9500|n9k-spine|spine/i.test(n.stencilId + n.label));
    const fws = network.filter(n => /fpr|firewall|sf-/i.test(n.stencilId));
    const mgmt = network.filter(n => /catalyst-center|vmanage|cat-center|intersight/i.test(n.stencilId + n.label));
    const ise = network.filter(n => /ise/i.test(n.stencilId));
    const aps = network.filter(n => /9179|mr57|wireless|ap/i.test(n.stencilId + n.label));

    if (network.length >= 3 && cores.length === 0)
      w.push({ id: "add-core", msg: "No core/aggregation layer — add C9500 or Nexus spine.", severity: "error" });
    if (network.length >= 4 && fws.length === 0)
      w.push({ id: "add-fw", msg: "No perimeter firewall — consider FPR 2130 (DC) or FPR 1120 (branch).", severity: "error" });
    if (network.length >= 5 && design.links.length === 0)
      w.push({ id: "connect", msg: "Devices are not connected — use Link mode (L) or Apply Suggestions.", severity: "error" });
    if (network.length >= 6 && mgmt.length === 0)
      tips.push({ id: "add-mgmt", msg: "Add Catalyst Center or vManage for centralized management." });
    if (aps.length > 0 && !network.some(n => /9200|9300|ms250|access/i.test(n.stencilId)))
      w.push({ id: "add-access", msg: "APs present but no access switch for PoE uplink.", severity: "error" });

    const orphans = network.filter(n => {
      const def = nodeDef(n);
      if (def?.role === "cloud" || def?.role === "logical") return false;
      return !design.links.some(l => l.from === n.id || l.to === n.id);
    });
    if (orphans.length > 0 && network.length > 2)
      tips.push({ id: "orphans", msg: `${orphans.length} unconnected device(s): ${orphans.map(o => o.label).slice(0, 3).join(", ")}` });

    const poe = computePoeBudget(design);
    if (poe.budget > 0 && poe.load > poe.budget)
      w.push({ id: "poe-over", msg: `PoE oversubscribed: ${poe.load}W load vs ${poe.budget}W budget.`, severity: "error" });
    else if (poe.budget > 0 && poe.headroom < 50)
      tips.push({ id: "poe-tight", msg: `PoE headroom tight: ${poe.headroom}W remaining.` });

    roomNodes.filter(n => /kit|bar|board|desk/i.test(n.stencilId || "")).forEach(r => {
      const hasNet = design.links.some(l => {
        if (l.from !== r.id && l.to !== r.id) return false;
        const other = design.nodes.find(n => n.id === (l.from === r.id ? l.to : l.from));
        return other && /switch|9200|9300|collab/i.test(other.stencilId || "");
      });
      if (!hasNet) w.push({ id: "room-poe-" + r.id, msg: `${r.label}: missing PoE/network to collab switch.`, severity: "error" });
    });

    design.links.forEach(l => {
      if (/hdmi/i.test(l.media)) {
        const from = design.nodes.find(n => n.id === l.from);
        const to = design.nodes.find(n => n.id === l.to);
        if (from && to && !/display|board|kit|codec|cam|bar|hdmi/i.test((from.stencilId || "") + (to.stencilId || "")))
          tips.push({ id: "hdmi-" + l.id, msg: `HDMI link ${l.label}: verify AV endpoint.` });
      }
    });

    roomNodes.forEach(n => {
      const def = nodeDef(n);
      if (def?.decorative)
        tips.push({ id: "deco-" + n.id, msg: `${n.label} is layout-only (not a CCW orderable PID).` });
    });

    if (ise.length === 0 && network.length >= 8)
      tips.push({ id: "add-ise", msg: "Consider ISE for 802.1X/NAC on enterprise campus." });

    return { warnings: w, tips, ok: w.filter(x => x.severity === "error").length === 0, poe };
  }

  // Per-node issue map for ambient on-canvas badges: nodeId -> {severity,msg}.
  function nodeIssues(design) {
    const map = {};
    const set = (id, sev, msg, type) => {
      if (!id) return;
      if (!map[id] || (sev === "error" && map[id].severity !== "error")) map[id] = { severity: sev, msg, type: type || sev };
    };
    const network = nets(design);
    network.forEach(n => {
      const def = nodeDef(n);
      if (def?.role === "cloud" || def?.role === "logical" || def?.role === "spaces-cloud") return;
      if (!design.links.some(l => l.from === n.id || l.to === n.id))
        set(n.id, "warn", "Not connected — add a link to this device.", "orphan");
    });
    const hasGw = design.nodes.some(n => nodeDef(n)?.mtGateway);
    if (!hasGw)
      design.nodes.filter(n => nodeDef(n)?.role === "sensor")
        .forEach(n => set(n.id, "error", "MT sensor needs a Meraki MR/MV gateway.", "sensor-gateway"));
    rooms(design).filter(n => /kit|bar|board|desk/i.test(n.stencilId || "")).forEach(r => {
      const ok = design.links.some(l => {
        if (l.from !== r.id && l.to !== r.id) return false;
        const other = design.nodes.find(n => n.id === (l.from === r.id ? l.to : l.from));
        return other && /switch|9200|9300|collab/i.test(other.stencilId || "");
      });
      if (!ok) set(r.id, "error", "Missing PoE/network to a collab switch.", "room-poe");
    });
    return map;
  }

  function computeScore(design) {
    let score = 100;
    const val = validateDesign(design);
    score -= val.warnings.filter(w => w.severity === "error").length * 15;
    score -= val.tips.length * 2;
    const network = nets(design);
    if (network.length >= 2) {
      const connected = network.filter(n => design.links.some(l => l.from === n.id || l.to === n.id)).length;
      const ratio = connected / network.length;
      if (ratio < 0.85) score -= Math.round((0.85 - ratio) * 40);
    }
    if (design.links.length === 0 && design.nodes.length > 1) score -= 25;
    return Math.max(0, Math.min(100, score));
  }

  function getSuggestions(design) {
    const suggestions = [];
    const network = nets(design);
    const STN = ST();
    const cores = network.filter(n => /core|c9500/i.test(n.stencilId));
    const access = network.filter(n => /9200|9300|access|c9200/i.test(n.stencilId));
    const aps = network.filter(n => /9179|mr57|ap/i.test(n.stencilId + n.label));
    const orphans = network.filter(n => {
      const def = nodeDef(n);
      if (def?.role === "cloud" || def?.role === "logical") return false;
      return !design.links.some(l => l.from === n.id || l.to === n.id);
    });

    if (network.length >= 3 && cores.length === 0)
      suggestions.push({ id: "fix-add-core", label: "Add redundant core pair (C9500)", action: "addNodes", payload: { nodes: [
        { stencilId: "c9500-core", label: "Core-A", layer: "core" }, { stencilId: "c9500-core-2", label: "Core-B", layer: "core" }
      ]}});

    if (network.length >= 4 && !network.some(n => /fpr|firewall/i.test(n.stencilId)))
      suggestions.push({ id: "fix-add-fw", label: "Add perimeter firewall (FPR 2130)", action: "addNode", payload: { stencilId: "fpr-2130", label: "Perimeter FW", layer: "security" } });

    if (!network.some(n => /catalyst-center|vmanage/i.test(n.stencilId)) && network.length >= 5)
      suggestions.push({ id: "fix-add-mgmt", label: "Add Catalyst Center", action: "addNode", payload: { stencilId: "cat-center", label: "Catalyst Center", layer: "mgmt" } });

    aps.forEach(ap => {
      const linked = design.links.some(l => l.from === ap.id || l.to === ap.id);
      if (!linked && access.length) {
        const sw = access[0];
        suggestions.push({
          id: "link-ap-" + ap.id, label: `Connect ${ap.label} → ${sw.label} (PoE)`,
          action: "addLink", payload: { from: sw.id, to: ap.id, media: "cat6", fromPort: "Gi1/0/1", toPort: "ETH0", label: "PoE-AP" }
        });
      } else if (!linked && !access.length) {
        suggestions.push({ id: "fix-ap-sw-" + ap.id, label: `Add access switch for ${ap.label}`, action: "addAndLinkAp", payload: { apId: ap.id } });
      }
    });

    if (cores.length >= 1 && access.length >= 1) {
      access.forEach(acc => {
        if (!design.links.some(l => (l.from === acc.id || l.to === acc.id) && cores.some(c => l.from === c.id || l.to === c.id)))
          suggestions.push({
            id: "link-core-acc-" + acc.id, label: `Uplink ${acc.label} → ${cores[0].label}`,
            action: "addLink", payload: { from: cores[0].id, to: acc.id, media: "fiber-sm", fromPort: "Te1/1/1", toPort: "Te1/1/1", label: "Core-Uplink" }
          });
      });
    }

    orphans.slice(0, 5).forEach(o => {
      suggestions.push({ id: "orphan-" + o.id, label: `Connect orphan: ${o.label}`, action: "autoConnect", payload: { nodeId: o.id } });
    });

    const poe = computePoeBudget(design);
    if (poe.load > poe.budget && poe.budget > 0)
      suggestions.push({ id: "fix-poe", label: "Add PoE switch or upgrade to C9300-48HX", action: "addNode", payload: { stencilId: "c9200-collab", label: "Additional PoE SW", layer: "collab" } });

    if (design.nodes.length >= 3 && design.links.length === 0)
      suggestions.push({ id: "auto-wire", label: "Auto-wire all devices (layer-based)", action: "autoWireAll", payload: {} });

    rooms(design).filter(n => /kit|bar|board|desk/i.test(n.stencilId || "")).forEach(dev => {
      const hasNet = design.links.some(l => {
        if (l.from !== dev.id && l.to !== dev.id) return false;
        const other = design.nodes.find(n => n.id === (l.from === dev.id ? l.to : l.from));
        return other && /switch|9200|9300|collab|c9200/i.test(other.stencilId || "");
      });
      if (hasNet) return;
      const roomSwitches = design.nodes.filter(n =>
        n.roomId === dev.roomId && /switch|9200|9300|collab|c9200/i.test(n.stencilId || ""));
      if (roomSwitches.length) {
        const sw = roomSwitches[0];
        suggestions.push({
          id: "room-link-" + dev.id,
          label: `PoE link ${dev.label} → ${sw.label}`,
          action: "addLink",
          payload: { from: sw.id, to: dev.id, media: "cat6", fromPort: "Gi1/0/1", toPort: "LAN", label: "PoE-Collab" }
        });
      } else {
        suggestions.push({
          id: "room-add-sw-" + dev.id,
          label: `Add collab switch for ${dev.label}`,
          action: "addRoomSwitchAndLink",
          payload: { deviceId: dev.id }
        });
      }
    });

    return suggestions.slice(0, 12);
  }

  function linkExists(design, from, to) {
    return design.links.some(l => (l.from === from && l.to === to) || (l.from === to && l.to === from));
  }

  function applyFix(design, suggestion, uid, STN) {
    if (!suggestion) return false;
    const p = suggestion.payload || {};
    const addNode = (spec, x, y) => {
      const def = STN?.getDef?.(spec.stencilId, "network");
      const id = uid();
      design.nodes.push({
        id, stencilId: spec.stencilId, label: spec.label, pid: def?.pid,
        layer: spec.layer || def?.layer || "access", x: x ?? 200 + Math.random() * 200, y: y ?? 200,
        canvas: "network", qty: 1, w: def?.w || 76, h: def?.h || 46
      });
      return id;
    };

    if (suggestion.action === "addNode") { addNode(p, 300, 180); return true; }
    if (suggestion.action === "addNodes") { (p.nodes || []).forEach((n, i) => addNode(n, 280, 180 + i * 100)); return true; }
    if (suggestion.action === "addLink" && p.from && p.to) {
      if (linkExists(design, p.from, p.to)) return false;
      if (!design.nodes.some(n => n.id === p.from) || !design.nodes.some(n => n.id === p.to)) return false;
      design.links.push({ id: uid(), from: p.from, to: p.to, media: p.media || "cat6", label: p.label || "Link", length: "5m", fromPort: p.fromPort || "", toPort: p.toPort || "" });
      return true;
    }
    if (suggestion.action === "addAndLinkAp") {
      const ap = design.nodes.find(n => n.id === p.apId);
      if (!ap) return false;
      const swId = addNode({ stencilId: "c9200-access", label: "Access SW", layer: "access" }, ap.x - 120, ap.y);
      if (linkExists(design, swId, ap.id)) return true;
      design.links.push({ id: uid(), from: swId, to: ap.id, media: "cat6", label: "PoE", length: "3m", fromPort: "Gi1/0/1", toPort: "ETH0" });
      return true;
    }
    if (suggestion.action === "addRoomSwitchAndLink") {
      const dev = design.nodes.find(n => n.id === p.deviceId);
      if (!dev || dev.canvas !== "room") return false;
      const def = STN?.getDef?.("c9200-collab", "room");
      const swId = uid();
      design.nodes.push({
        id: swId, stencilId: "c9200-collab", label: "Collab SW", pid: def?.pid,
        layer: "collab", x: (dev.x || 0) - 100, y: dev.y || 0, canvas: "room", roomId: dev.roomId,
        w: def?.w || 96, h: def?.h || 50, qty: 1
      });
      if (!linkExists(design, swId, dev.id))
        design.links.push({ id: uid(), from: swId, to: dev.id, media: "cat6", label: "PoE-Collab", length: "3m", fromPort: "Gi1/0/1", toPort: "LAN" });
      return true;
    }
    if (suggestion.action === "autoConnect") {
      const node = design.nodes.find(n => n.id === p.nodeId);
      if (!node) return false;
      const others = design.nodes.filter(n => n.id !== node.id && n.canvas === node.canvas);
      const target = others.find(n => /core|dist|switch|9200|9300/i.test(n.stencilId)) || others[0];
      if (!target || linkExists(design, target.id, node.id)) return false;
      const media = STN?.suggestMedia?.(target, node, "Te1/1/1", "Gi1/0/1") || "cat6a";
      design.links.push({ id: uid(), from: target.id, to: node.id, media, label: "Auto-" + node.label, length: "5m", fromPort: "Te1/1/1", toPort: "Gi1/0/1" });
      return true;
    }
    if (suggestion.action === "autoWireAll") { autoWireLayerBased(design, uid, STN); return true; }
    return false;
  }

  function autoWireLayerBased(design, uid, STN) {
    const layerOrder = ["wan", "security", "core", "distribution", "dc", "access", "mgmt", "collab"];
    const byLayer = {};
    nets(design).forEach(n => { (byLayer[n.layer || "access"] ||= []).push(n); });
    for (let i = 0; i < layerOrder.length - 1; i++) {
      const upper = byLayer[layerOrder[i]] || [];
      const lower = byLayer[layerOrder[i + 1]] || [];
      if (!upper.length || !lower.length) continue;
      lower.forEach((ln, j) => {
        const un = upper[j % upper.length];
        if (design.links.some(l => (l.from === un.id && l.to === ln.id) || (l.from === ln.id && l.to === un.id))) return;
        const media = STN?.suggestMedia?.(un, ln, "Te1/1/1", "Te1/1/1") || "fiber-sm";
        design.links.push({ id: uid(), from: un.id, to: ln.id, media, label: `${un.label}-${ln.label}`, length: "5m", fromPort: "Te1/1/1", toPort: "Te1/1/1" });
      });
    }
  }

  function generateCustomerNarrative(design) {
    const network = nets(design);
    const score = computeScore(design);
    const poe = computePoeBudget(design);
    let md = `# Solution Overview — ${design.account || "Design"}\n\n**Design score:** ${score}/100\n\n`;
    md += `## Scope\n- Network devices: ${network.length}\n- Collaboration rooms: ${(design.rooms || []).length || rooms(design).length}\n- Links: ${design.links.length}\n`;
    if (poe.budget) md += `- PoE: ${poe.load}W / ${poe.budget}W (${poe.headroom}W headroom)\n`;
    const cites = design.intentPlan?.citations || [];
    if (cites.length) {
      md += `\n## Validated references (cisco.com / webex.com)\n`;
      cites.forEach(c => { md += `- [${c.label}](${c.url})\n`; });
    }
    return md;
  }

  window.__DS_RULES = {
    validateDesign, validateSpaces, nodeIssues, computeScore, getSuggestions, applyFix, computePoeBudget,
    validateLinkPorts, autoWireLayerBased, generateCustomerNarrative
  };
})();

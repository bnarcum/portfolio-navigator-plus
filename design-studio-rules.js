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

  function validateDesign(design) {
    const w = [], tips = [];
    const network = nets(design);
    const roomNodes = rooms(design);

    w.push(...validateLinkPorts(design));

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

    if (ise.length === 0 && network.length >= 8)
      tips.push({ id: "add-ise", msg: "Consider ISE for 802.1X/NAC on enterprise campus." });

    return { warnings: w, tips, ok: w.filter(x => x.severity === "error").length === 0, poe };
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

    return suggestions.slice(0, 12);
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
      design.links.push({ id: uid(), from: p.from, to: p.to, media: p.media || "cat6", label: p.label || "Link", length: "5m", fromPort: p.fromPort || "", toPort: p.toPort || "" });
      return true;
    }
    if (suggestion.action === "addAndLinkAp") {
      const ap = design.nodes.find(n => n.id === p.apId);
      if (!ap) return false;
      const swId = addNode({ stencilId: "c9200-access", label: "Access SW", layer: "access" }, ap.x - 120, ap.y);
      design.links.push({ id: uid(), from: swId, to: ap.id, media: "cat6", label: "PoE", length: "3m", fromPort: "Gi1/0/1", toPort: "ETH0" });
      return true;
    }
    if (suggestion.action === "autoConnect") {
      const node = design.nodes.find(n => n.id === p.nodeId);
      if (!node) return false;
      const others = design.nodes.filter(n => n.id !== node.id && n.canvas === node.canvas);
      const target = others.find(n => /core|dist|switch|9200|9300/i.test(n.stencilId)) || others[0];
      if (target) {
        const media = STN?.suggestMedia?.(target, node, "Te1/1/1", "Gi1/0/1") || "cat6a";
        design.links.push({ id: uid(), from: target.id, to: node.id, media, label: "Auto-" + node.label, length: "5m", fromPort: "Te1/1/1", toPort: "Gi1/0/1" });
      }
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
    return md;
  }

  window.__DS_RULES = {
    validateDesign, computeScore, getSuggestions, applyFix, computePoeBudget,
    validateLinkPorts, autoWireLayerBased, generateCustomerNarrative
  };
})();

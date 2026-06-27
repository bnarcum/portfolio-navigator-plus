/**
 * Design Studio — CCIE / SE workflow helpers (stack, redundancy, PIDs, MOP)
 */
(function () {
  "use strict";

  function esc(s) {
    return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  }

  function nodeDef(n) {
    const mode = n.canvas === "room" ? "room" : "network";
    return window.__DS_STENCILS?.getDef?.(n.stencilId, mode);
  }

  function nodePid(n) {
    const def = nodeDef(n);
    return n.pid || def?.pid || "";
  }

  function isEligiblePid(pid, def) {
    if (!pid || /^N\/A/i.test(pid)) return false;
    return window.__DS_STENCILS?.isCcwEligible?.(def, pid) !== false;
  }

  function analyzeDesign(design) {
    const nodes = design?.nodes || [];
    const links = design?.links || [];
    const net = nodes.filter(n => n.canvas !== "room");
    const rooms = design?.rooms || [];

    const byRole = {};
    const byLayer = {};
    const byStencil = {};
    net.forEach(n => {
      const def = nodeDef(n);
      const role = def?.role || n.layer || "other";
      const layer = n.layer || def?.layer || "access";
      (byRole[role] ||= []).push(n);
      (byLayer[layer] ||= []).push(n);
      (byStencil[n.stencilId] ||= 0);
      byStencil[n.stencilId]++;
    });

    const cores = (byRole.core || []).length;
    const wanEdges = (byRole["wan-edge"] || []).length;
    const firewalls = (byRole.firewall || []).length;
    const switches = net.filter(n => /switch|9200|9300|9400|9500|ms250/i.test(n.stencilId || ""));
    const aps = (byRole.ap || []).length;

    const redundancy = [
      { id: "dual-core", label: "Dual core switches", ok: cores >= 2, hint: cores >= 2 ? `${cores} core nodes` : "Add second C9500 for HA" },
      { id: "dual-wan", label: "Dual WAN / SD-WAN edge", ok: wanEdges >= 2, hint: wanEdges >= 2 ? `${wanEdges} WAN edges` : "Add backup C8200 or DIA + MPLS" },
      { id: "fw-pair", label: "Firewall HA pair", ok: firewalls >= 2, hint: firewalls >= 2 ? `${firewalls} firewalls` : "Branch: single FPR OK; DC: pair recommended" },
      { id: "ise", label: "ISE policy nodes", ok: (byRole.ise || []).length >= 1, hint: (byRole.ise || []).length ? "ISE present" : "Add ISE for 802.1X / posture" },
      { id: "dna", label: "Catalyst Center / DNA", ok: net.some(n => /cat-center|dn3/i.test(nodePid(n))), hint: "DNA Center for assurance & automation" },
      { id: "collab-poe", label: "Collab PoE switch per room", ok: rooms.length === 0 || nodes.some(n => n.stencilId === "c9200-collab"), hint: `${rooms.length} room(s)` }
    ];

    const techStack = [];
    if (net.some(n => /c9500|c9400|c9300|c9200/i.test(n.stencilId || ""))) techStack.push("Catalyst");
    if (net.some(n => /c8200|vmanage|sdwan/i.test(n.stencilId || ""))) techStack.push("SD-WAN");
    if (net.some(n => /fpr|firewall/i.test(n.stencilId || ""))) techStack.push("Secure Firewall");
    if (net.some(n => /ise/i.test(n.stencilId || ""))) techStack.push("ISE");
    if (net.some(n => /cat-center|dn3/i.test(nodePid(n)))) techStack.push("DNA Center");
    if (net.some(n => /n9k|apic/i.test(n.stencilId || ""))) techStack.push("ACI / Nexus");
    if (net.some(n => /mx|ms250|mr57/i.test(n.stencilId || ""))) techStack.push("Meraki");
    if (nodes.some(n => /room-kit|room-bar|board-pro|desk-pro|quad-cam/i.test(n.stencilId || ""))) techStack.push("Webex Collab");
    if (net.some(n => /umbrella/i.test(n.stencilId || ""))) techStack.push("Umbrella");

    const portUtil = switches.map(sw => {
      const def = nodeDef(sw);
      const ports = window.__DS_STENCILS?.getPorts?.(sw.stencilId, "network") || [];
      const poePorts = ports.filter(p => p.poe).length || 24;
      const used = links.filter(l => l.from === sw.id || l.to === sw.id).length;
      const pct = Math.min(100, Math.round((used / Math.max(poePorts, 1)) * 100));
      const load = def?.poeW || 0;
      return { label: sw.label || sw.stencilId, pid: nodePid(sw), used, poePorts, pct, poeW: load };
    });

    let rackU = 0;
    net.forEach(n => {
      const def = nodeDef(n);
      rackU += (def?.rackU || (def?.shape === "switch" ? 1 : def?.shape === "server" ? 2 : 0)) * (n.qty || 1);
    });

    const vlans = [];
    if ((byLayer.access || []).length) vlans.push({ id: "10", name: "USER-DATA", note: "Access / user VLAN" });
    if (aps) vlans.push({ id: "20", name: "WLAN-CORP", note: `${aps} AP(s) — flex / local switching` });
    if ((byRole.ise || []).length) vlans.push({ id: "30", name: "ISE-QUARANTINE", note: "CWA / remediation" });
    if (nodes.some(n => n.canvas === "room")) vlans.push({ id: "40", name: "AV-COLLAB", note: "Room codec / touch / camera" });
    if ((byLayer.mgmt || []).length) vlans.push({ id: "99", name: "MGMT-OOBB", note: "Out-of-band / DNA / ISE mgmt" });

    const pids = [];
    const seen = new Set();
    nodes.forEach(n => {
      const def = nodeDef(n);
      const pid = nodePid(n);
      if (!isEligiblePid(pid, def)) return;
      const key = pid + "|" + (n.label || "");
      if (seen.has(key)) return;
      seen.add(key);
      pids.push({ pid, label: n.label || def?.label || pid, qty: n.qty || 1 });
    });

    return { redundancy, techStack, portUtil, rackU, vlans, pids, roomCount: rooms.length, linkCount: links.length, deviceCount: nodes.length };
  }

  function copyText(text) {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    return Promise.resolve();
  }

  function copyAllPids(design) {
    const a = analyzeDesign(design);
    const lines = a.pids.map(p => `${p.qty}\t${p.pid}\t${p.label}`);
    return copyText(lines.join("\n")).then(() => lines.length);
  }

  function mopSnippet(design) {
    const a = analyzeDesign(design);
    const lines = [
      `# MOP snippet — ${design.account || "Design"}`,
      `# Devices: ${a.deviceCount} · Links: ${a.linkCount} · Rooms: ${a.roomCount}`,
      `# Stack: ${a.techStack.join(", ") || "—"}`,
      "",
      "## Hardware",
      ...a.pids.map(p => `- ${p.qty}× ${p.pid} (${p.label})`),
      "",
      "## VLAN plan (suggested)",
      ...a.vlans.map(v => `- VLAN ${v.id} ${v.name} — ${v.note}`),
      "",
      "## Redundancy checklist",
      ...a.redundancy.map(r => `- [${r.ok ? "x" : " "}] ${r.label} — ${r.hint}`)
    ];
    return lines.join("\n");
  }

  function renderExpertPanel(studio) {
    const body = document.getElementById("ds-panel-body");
    if (!body) return;
    const a = analyzeDesign(studio.design);

    body.innerHTML = `
      <div class="ds-expert-stack">${a.techStack.map(t => `<span class="ds-expert-chip">${esc(t)}</span>`).join("") || `<span class="ds-expert-chip muted">Generate draft for stack</span>`}</div>
      <div class="ds-expert-actions">
        <button type="button" class="ds-btn" id="ds-copy-pids">Copy PIDs</button>
        <button type="button" class="ds-btn" id="ds-copy-mop">MOP snippet</button>
        <span class="ds-expert-meta">${a.rackU ? `~${a.rackU}U rack` : ""} · ${a.pids.length} SKUs</span>
      </div>
      <section class="ds-expert-section">
        <h5>Redundancy &amp; best practice</h5>
        <ul class="ds-expert-checklist">${a.redundancy.map(r =>
      `<li class="${r.ok ? "ok" : "warn"}"><span class="ds-ex-check">${r.ok ? "✓" : "○"}</span><span><strong>${esc(r.label)}</strong><em>${esc(r.hint)}</em></span></li>`
    ).join("")}</ul>
      </section>
      ${a.portUtil.length ? `<section class="ds-expert-section">
        <h5>Switch port utilization</h5>
        ${a.portUtil.map(p => `<div class="ds-port-util-row">
          <span class="ds-port-util-label" title="${esc(p.pid)}">${esc(p.label.slice(0, 18))}</span>
          <div class="ds-port-util-track"><div class="ds-port-util-fill${p.pct > 80 ? " warn" : ""}" style="width:${p.pct}%"></div></div>
          <span class="ds-port-util-pct">${p.used}/${p.poePorts}</span>
        </div>`).join("")}
      </section>` : ""}
      <section class="ds-expert-section">
        <h5>Suggested VLANs</h5>
        <table class="ds-table ds-vlan-table"><thead><tr><th>VLAN</th><th>Name</th><th>Note</th></tr></thead>
        <tbody>${a.vlans.map(v => `<tr><td>${esc(v.id)}</td><td>${esc(v.name)}</td><td>${esc(v.note)}</td></tr>`).join("")}</tbody></table>
      </section>`;

    document.getElementById("ds-copy-pids")?.addEventListener("click", () => {
      copyAllPids(studio.design).then(n => studio.toast(`Copied ${n} PID line(s)`));
    });
    document.getElementById("ds-copy-mop")?.addEventListener("click", () => {
      copyText(mopSnippet(studio.design)).then(() => studio.toast("MOP snippet copied"));
    });
  }

  function inspectorExtras(node) {
    const def = nodeDef(node);
    const pid = nodePid(node);
    if (!pid || /^N\/A/i.test(pid)) return "";
    const url = `https://www.cisco.com/c/en/us/search.html?q=${encodeURIComponent(pid)}`;
    return `<div class="ds-insp-actions">
      <button type="button" class="ds-btn ds-btn-sm" id="ds-insp-copy-pid">Copy PID</button>
      <a class="ds-btn ds-btn-sm ds-btn-link" href="${url}" target="_blank" rel="noopener noreferrer">Cisco.com ↗</a>
    </div>`;
  }

  function wireInspectorActions(node, studio) {
    document.getElementById("ds-insp-copy-pid")?.addEventListener("click", () => {
      copyText(nodePid(node)).then(() => studio.toast("PID copied"));
    });
  }

  function bomRowActions() {
    return `<button type="button" class="ds-bom-copy" title="Copy PID" aria-label="Copy PID">⎘</button>`;
  }

  function wireBomCopy(body, studio) {
    body?.querySelectorAll(".ds-bom-copy").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const pid = btn.closest("tr")?.dataset?.pid;
        if (pid) copyText(pid).then(() => studio?.toast?.("PID copied"));
      });
    });
  }

  window.__DS_EXPERT = {
    analyzeDesign, copyAllPids, mopSnippet, renderExpertPanel,
    inspectorExtras, wireInspectorActions, bomRowActions, wireBomCopy, copyText
  };
})();

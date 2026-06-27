/**
 * Design Studio — Field Tech inspect side panel (walk mode)
 */
(function () {
  "use strict";

  const ROLE_EDU = {
    core: { title: "Core Switch", body: "High-capacity aggregation layer. Routes traffic between distribution, WAN, and data center fabrics. Typically redundant in pairs." },
    distribution: { title: "Distribution Switch", body: "Aggregates access-layer switches and enforces policy boundaries between building zones." },
    access: { title: "Access Switch", body: "Edge PoE switch powering APs, phones, and endpoints. Budget ~30W per port — plan headroom for codecs." },
    "collab-switch": { title: "Collaboration Switch", body: "Dedicated access for room systems — keeps AV/control traffic segmented from user VLANs." },
    "wan-edge": { title: "WAN Edge Router", body: "SD-WAN or router connecting the site to Internet/MPLS. Terminates tunnels and applies security policy." },
    firewall: { title: "Firewall", body: "Inspects north-south and east-west traffic. Enforces segmentation between security zones." },
    ise: { title: "Cisco ISE", body: "Identity Services Engine — policy server for 802.1X, posture, and guest access across the LAN." },
    dns: { title: "DNS Security", body: "Umbrella or DNS-layer protection — blocks malicious domains before connections establish." },
    ap: { title: "Wireless Access Point", body: "Wi-Fi 6E/7 radio powered via PoE. Connects to access switch with multiple SSIDs/VLANs." },
    spine: { title: "Spine Switch", body: "Data center fabric spine — non-blocking east-west for leaf switches and compute." },
    leaf: { title: "Leaf Switch", body: "Top-of-rack leaf in ACI/BGP EVPN fabric. Hosts servers and service appliances." },
    compute: { title: "Compute Server", body: "UCS or rack server in the DC fabric — dual-homed for redundancy." },
    management: { title: "Management", body: "Catalyst Center or ops platform for inventory, config, and assurance." },
    controller: { title: "SD-WAN Controller", body: "vManage orchestrates WAN edge policies, templates, and VPN overlays." },
    cloud: { title: "WAN / Cloud Handoff", body: "Logical representation of ISP, MPLS, or SaaS edge — where traffic enters or leaves the enterprise." },
    codec: { title: "Room Codec", body: "Video endpoint terminating camera, mic, and display streams on the LAN." },
    camera: { title: "Conference Camera", body: "Captures room video — uplink via HDMI/USB to codec. Check certified cable lengths for 4K." },
    mic: { title: "Ceiling Microphone", body: "Audio pickup for the room — PoE or USB back to codec." },
    display: { title: "Display", body: "Primary room screen receiving HDMI from codec or media player." },
    touch: { title: "Touch Controller", body: "In-room control panel for calls and room automation — usually PoE." },
    logical: { title: "Logical Endpoint", body: "Represents users, VLANs, or services — not a physical box but a design checkpoint." },
    default: { title: "Network Device", body: "Inspect cabling, PID, and downstream links to validate your as-built design." }
  };

  const ZONE_EDU = {
    wan: "WAN edge — Internet/MPLS handoff and SD-WAN termination.",
    security: "Security zone — firewalls, ISE, and policy enforcement.",
    core: "Core layer — high-speed campus aggregation.",
    distribution: "Distribution — connects access to core.",
    dc: "Data center fabric — spine/leaf and compute.",
    access: "Access layer — PoE to endpoints and APs.",
    mgmt: "Management & automation platforms.",
    collab: "Collaboration systems VLANs and switches.",
    display: "Front-of-room video displays.",
    ceiling: "Overhead audio/video capture.",
    table: "Tabletop collaboration devices.",
    rack: "Equipment rack — codecs and switches.",
    wall: "Wall-mounted touch or signage.",
    default: "General endpoint zone."
  };

  function esc(s) {
    return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  }

  function linksForChamber(ch, graph) {
    if (!graph?.corridors) return [];
    return graph.corridors.filter(c => c.from?.id === ch.id || c.to?.id === ch.id);
  }

  function eduFor(ch, def, graph) {
    const role = def?.role || ch.zone || "default";
    const roleInfo = ROLE_EDU[role] || ROLE_EDU.default;
    const zoneNote = ZONE_EDU[ch.zone] || ZONE_EDU.default;
    const tip = window.__DS_MISSIONS?.tipFor?.(ch) || "";
    const layer = (ch.zone || def?.layer || "device").toUpperCase();
    const poe = def?.poeW ? `${def.poeW}W PoE budget` : null;
    const rack = def?.rackU ? `${def.rackU}U rack mount` : null;
    return { roleInfo, zoneNote, tip, layer, poe, rack };
  }

  function render(ch, studio, graph) {
    const panel = document.getElementById("ds-field-panel");
    if (!panel || !ch) return;
    const mode = graph?.kind === "room" ? "room" : "network";
    const def = window.__DS_STENCILS?.getDef?.(ch.stencilId, mode);
    const edu = eduFor(ch, def, graph);
    const links = linksForChamber(ch, graph);
    const linkRows = links.map(l => {
      const other = l.from?.id === ch.id ? l.to : l.from;
      return `<li><span class="ds-fp-media">${esc((l.media || "link").toUpperCase())}</span> <strong>${esc(other?.label || "?")}</strong>${l.fromPort ? `<br><span class="ds-fp-portpath">${esc(l.fromPort)} → ${esc(l.toPort || "")}</span>` : ""}</li>`;
    }).join("") || "<li class='muted'>No diagram links — add connections in Network tab</li>";

    const portList = Array.isArray(def?.ports) ? def.ports : (def?.ports ? [String(def.ports)] : []);
    const ports = portList.slice(0, 10).map(p => `<span class="ds-fp-port">${esc(p)}</span>`).join("");
    const pid = ch.pid || def?.pid || "";
    const ciscoUrl = pid && !/^N\/A/i.test(pid)
      ? `https://www.cisco.com/c/en/us/search.html?q=${encodeURIComponent(pid)}` : "";

    const exploreCtx = studio ? window.__DS_EXPLORE?.resolveContext?.(studio) : null;
    const docLink = exploreCtx?.docs?.[0];

    panel.hidden = false;
    panel.innerHTML = `
      <header class="ds-fp-head">
        <button type="button" class="ds-fp-close" data-action="fp-close" aria-label="Close">✕</button>
        <div class="ds-fp-title">
          <span class="ds-fp-badge">${esc(edu.roleInfo.title)}</span>
          <strong>${esc(ch.label)}</strong>
          ${pid ? `<span class="ds-fp-pid">PID: ${esc(pid)}</span>` : ""}
          <span class="ds-fp-zone">${esc(edu.layer)} · ${esc(ch.zone || "device")}</span>
        </div>
      </header>
      <div class="ds-fp-body">
        ${ch.photoUrl ? `<div class="ds-fp-photo"><img src="${esc(ch.photoUrl)}" alt="${esc(ch.label)}" loading="lazy"/></div>` : ""}
        <section class="ds-fp-section ds-fp-hero">
          <h4>What is this?</h4>
          <p class="ds-fp-lead">${esc(edu.roleInfo.body)}</p>
        </section>
        <section class="ds-fp-section">
          <h4>Field tip</h4>
          <p>${esc(edu.tip || edu.zoneNote)}</p>
        </section>
        ${edu.poe || edu.rack ? `<section class="ds-fp-section ds-fp-specs">
          <h4>Specs</h4>
          <div class="ds-fp-spec-grid">
            ${edu.poe ? `<span>${esc(edu.poe)}</span>` : ""}
            ${edu.rack ? `<span>${esc(edu.rack)}</span>` : ""}
            ${def?.shape ? `<span>${esc(def.shape)} form factor</span>` : ""}
          </div>
        </section>` : ""}
        ${ports ? `<section class="ds-fp-section"><h4>Ports</h4><div class="ds-fp-ports">${ports}</div></section>` : ""}
        <section class="ds-fp-section">
          <h4>Network path (${links.length})</h4>
          <ul class="ds-fp-links">${linkRows}</ul>
        </section>
        <section class="ds-fp-actions">
          <button type="button" class="ds-walk-btn primary" data-action="fp-fly">Walk to device</button>
          <button type="button" class="ds-walk-btn" data-action="fp-trace-poe">Trace PoE path</button>
          <button type="button" class="ds-walk-btn" data-action="fp-trace-av">Trace AV path</button>
          ${pid ? `<button type="button" class="ds-walk-btn" data-action="fp-copy-pid">Copy PID</button>` : ""}
          ${ciscoUrl ? `<a class="ds-walk-btn ds-btn-link" href="${ciscoUrl}" target="_blank" rel="noopener noreferrer">Cisco.com ↗</a>` : ""}
          ${docLink ? `<a class="ds-walk-btn ds-btn-link" href="${docLink.url}" target="_blank" rel="noopener noreferrer">${esc(docLink.label || "Design guide")} ↗</a>` : ""}
        </section>
        <footer class="ds-fp-foot">Press <kbd>Esc</kbd> or click the room to keep walking</footer>
      </div>`;

    panel.dataset.chamberId = ch.id;
    panel.querySelector("[data-action=fp-close]")?.addEventListener("click", () => close());
    panel.querySelector("[data-action=fp-copy-pid]")?.addEventListener("click", () => {
      window.__DS_EXPERT?.copyText?.(pid).then?.(() => studio?.toast?.("PID copied"));
    });
  }

  function close() {
    const panel = document.getElementById("ds-field-panel");
    if (panel) { panel.hidden = true; panel.innerHTML = ""; delete panel.dataset.chamberId; }
    document.getElementById("ds-walk-panel-backdrop")?.setAttribute("hidden", "");
    state?.overlay?.classList?.remove("ds-field-panel-open");
  }

  let state = null;
  function bindWalk(walkState) { state = walkState; }

  window.__DS_FIELD_PANEL = { render, close, bindWalk };
})();

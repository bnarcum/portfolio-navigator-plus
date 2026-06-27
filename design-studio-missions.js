/**
 * Design Studio — Field Tech mission campaign (gamified network walkthrough)
 */
(function () {
  "use strict";

  const TEACH = {
    switch: "PoE switches budget 30W per port — plan headroom for codecs and phones.",
    codec: "Room codecs terminate AV and control on the LAN — keep on dedicated VLAN.",
    camera: "Quad cams need HDMI/USB uplink to the codec — check cable length limits.",
    mic: "Ceiling mics use PoE or USB — verify switch port PoE budget.",
    display: "Displays receive HDMI from the codec — 4K needs certified HDMI length.",
    touch: "Touch panels are control endpoints — PoE keeps install simple.",
    default: "Every endpoint should map to a switch port in your as-built."
  };

  function tipFor(ch) {
    const s = (ch.stencilId || ch.label || "").toLowerCase();
    const def = window.__DS_STENCILS?.getDef?.(ch.stencilId, ch.canvas === "room" ? "room" : "network");
    const role = def?.role || "";
    if (/ise|pan|psn/i.test(s)) return "ISE nodes enforce 802.1X — PAN is admin, PSN handles policy decisions.";
    if (/fpr|firewall/i.test(s)) return "Firewall inspects traffic between zones — verify inside/outside interfaces match the diagram.";
    if (/8200|sd-?wan|mx\d|wan/i.test(s) || role === "wan-edge") return "WAN edge terminates VPN/SD-WAN tunnels — confirm circuit handoff and routing.";
    if (/9500|9400|core/i.test(s) || role === "core") return "Core switches aggregate the campus — expect redundant supervisors and 40/100G uplinks.";
    if (/9300|9200|ms250|switch/i.test(s) || role === "access") return TEACH.switch;
    if (/9179|mr57|ap\b/i.test(s) || role === "ap") return "Access points need PoE+ and correct switchport VLAN/trunk config.";
    if (/n9k|spine|leaf|apic|ucs/i.test(s)) return "Data center fabric device — verify VPC/EVPN peer links and LACP bundles.";
    if (/umbrella/i.test(s)) return "DNS-layer security — forwarders should point through this virtual appliance.";
    if (/internet|mpls|dia/i.test(s)) return "Logical WAN handoff — trace which router or firewall owns this circuit.";
    if (/kit|codec|eq|pro|bar/i.test(s)) return TEACH.codec;
    if (/cam|quad/i.test(s)) return TEACH.camera;
    if (/mic/i.test(s)) return TEACH.mic;
    if (/display/i.test(s)) return TEACH.display;
    if (/touch/i.test(s)) return TEACH.touch;
    return TEACH.default;
  }

  function esc(s) {
    return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
  }

  function buildObjectives(graph) {
    const objs = [];
    const chambers = graph.chambers;
    const switchCh = chambers.find(c => /switch|9200|9300|collab/i.test(c.label || c.stencilId || ""));
    const zones = [...new Set(chambers.map(c => c.zone).filter(z => z && z !== "default"))];

    objs.push({
      id: "hub",
      type: "visit",
      label: "Locate the network hub",
      detail: "Find the PoE switch or codec that feeds this space.",
      chamberIds: switchCh ? [switchCh.id] : [chambers[0]?.id].filter(Boolean),
      visited: new Set(),
      xp: 40
    });

    if (zones.length >= 2) {
      objs.push({
        id: "zones",
        type: "visit_zones",
        label: `Survey all zones (${zones.length})`,
        detail: "Inspect at least one device in each room zone: " + zones.join(", "),
        zones,
        visitedZones: new Set(),
        xp: 60
      });
    }

    objs.push({
      id: "all",
      type: "visit",
      label: `Inspect every device (${chambers.length})`,
      detail: "Walk the full bill of materials — each endpoint gets a visual check.",
      chamberIds: chambers.map(c => c.id),
      visited: new Set(),
      xp: 80
    });

    const poeLink = graph.corridors.find(c => c.media === "cat6" || c.media === "cat6a" || /fiber/i.test(c.media || ""));
    if (poeLink) {
      objs.push({
        id: "poe-trace",
        type: "trace",
        label: "Trace the PoE path",
        detail: `Follow copper/fiber from ${poeLink.from.label} to ${poeLink.to.label}`,
        media: "poe",
        done: false,
        xp: 50
      });
    }

    const avLink = graph.corridors.find(c => c.media === "hdmi" || c.media === "usb");
    if (avLink) {
      objs.push({
        id: "av-trace",
        type: "trace",
        label: "Trace the AV chain",
        detail: `Follow the ${avLink.media?.toUpperCase()} path from ${avLink.from.label} to ${avLink.to.label}`,
        media: "av",
        done: false,
        xp: 50
      });
    }

    return objs;
  }

  function startCampaign(graph, walkState) {
    const objectives = buildObjectives(graph);
    const totalXp = objectives.reduce((s, o) => s + o.xp, 0);
    return {
      title: graph.kind === "room" ? "Field Tech: Room Certification" : "Field Tech: Topology Run",
      subtitle: graph.room?.name || "Network path walkthrough",
      objectives,
      idx: 0,
      xp: 0,
      totalXp,
      rank: null,
      complete: false,
      startedAt: Date.now(),
      waypoints: [],
      briefingSeen: false
    };
  }

  function activeObj(m) {
    return m?.objectives?.[m.idx] || null;
  }

  function objProgress(o) {
    if (!o) return { cur: 0, tot: 1, pct: 0 };
    if (o.type === "visit") {
      const tot = o.chamberIds?.length || 1;
      const cur = o.visited?.size || 0;
      return { cur, tot, pct: tot ? cur / tot : 0 };
    }
    if (o.type === "visit_zones") {
      const tot = o.zones?.length || 1;
      const cur = o.visitedZones?.size || 0;
      return { cur, tot, pct: tot ? cur / tot : 0 };
    }
    if (o.type === "trace") return { cur: o.done ? 1 : 0, tot: 1, pct: o.done ? 1 : 0 };
    return { cur: 0, tot: 1, pct: 0 };
  }

  function isObjDone(o) {
    const p = objProgress(o);
    return p.cur >= p.tot;
  }

  function advanceMission(m) {
    while (m.idx < m.objectives.length && isObjDone(m.objectives[m.idx])) {
      m.xp += m.objectives[m.idx].xp || 0;
      m.idx++;
    }
    if (m.idx >= m.objectives.length && !m.complete) {
      m.complete = true;
      const elapsed = (Date.now() - m.startedAt) / 1000;
      const ratio = m.xp / (m.totalXp || 1);
      m.rank = ratio >= 0.95 && elapsed < 180 ? "Gold" : ratio >= 0.75 ? "Silver" : "Bronze";
      m.elapsed = elapsed;
    }
  }

  function onVisit(m, graph, chamberId, chamber) {
    if (!m || m.complete) return;
    let ping = false;
    const prevIdx = m.idx;
    m.objectives.forEach((o, i) => {
      if (i < m.idx) return;
      if (o.type === "visit" && o.chamberIds?.includes(chamberId)) {
        if (!o.visited.has(chamberId)) { o.visited.add(chamberId); ping = true; }
      }
      if (o.type === "visit_zones" && chamber?.zone && o.zones?.includes(chamber.zone)) {
        if (!o.visitedZones.has(chamber.zone)) { o.visitedZones.add(chamber.zone); ping = true; }
      }
    });
    advanceMission(m);
    if (m.idx > prevIdx && m.objectives[prevIdx]) {
      toastObjective(m.objectives[prevIdx].label + " complete");
    }
    return ping;
  }

  function onTrace(m, media) {
    if (!m || m.complete) return;
    const prevIdx = m.idx;
    const kind = media === "av" ? "av" : "poe";
    m.objectives.forEach((o, i) => {
      if (i < m.idx) return;
      if (o.type === "trace" && ((kind === "av" && o.media === "av") || (kind === "poe" && o.media === "poe"))) {
        o.done = true;
      }
    });
    advanceMission(m);
    if (m.idx > prevIdx && m.objectives[prevIdx]) {
      toastObjective(m.objectives[prevIdx].label + " complete");
    }
  }

  function targetChambers(m, graph) {
    const o = activeObj(m);
    if (!o || !graph) return [];
    if (o.type === "visit") {
      return graph.chambers.filter(c => o.chamberIds?.includes(c.id) && !o.visited?.has(c.id));
    }
    if (o.type === "visit_zones") {
      const need = o.zones?.filter(z => !o.visitedZones?.has(z)) || [];
      return graph.chambers.filter(c => need.includes(c.zone));
    }
    return [];
  }

  function renderHud(m) {
    const panel = document.getElementById("ds-walk-mission");
    const bar = document.getElementById("ds-walk-xp-bar");
    if (!panel || !m) return;
    const o = activeObj(m);
    if (m.complete) {
      panel.innerHTML = `<div class="ds-mission-complete">
        <strong>Mission complete — ${esc(m.rank)} certified</strong>
        <span>${m.xp} XP · ${Math.round(m.elapsed)}s</span>
        <button type="button" class="ds-walk-btn" data-action="mission-replay">Replay</button>
      </div>`;
      return;
    }
    const list = m.objectives.map((obj, i) => {
      const done = i < m.idx || isObjDone(obj);
      const active = i === m.idx;
      const p = objProgress(obj);
      return `<li class="ds-mobj${done ? " done" : ""}${active ? " active" : ""}">
        <span class="ds-mobj-icon">${done ? "✓" : active ? "▶" : "○"}</span>
        <span class="ds-mobj-text">${esc(obj.label)}${active && p.tot > 1 ? ` (${p.cur}/${p.tot})` : ""}</span>
      </li>`;
    }).join("");
    const collapsed = panel.classList.contains("collapsed");
    panel.innerHTML = `
      <div class="ds-mission-head">
        <strong>${esc(m.title)}</strong>
        <span class="ds-mission-xp">${m.xp}/${m.totalXp} XP</span>
        <button type="button" class="ds-mission-toggle" data-action="mission-collapse"
          aria-label="Collapse objectives" title="Collapse objectives">${collapsed ? "▸" : "▾"}</button>
      </div>
      <p class="ds-mission-active">${o ? esc(o.detail || o.label) : "All objectives complete"}</p>
      <ol class="ds-mission-list">${list}</ol>`;
    const toggle = panel.querySelector(".ds-mission-toggle");
    if (toggle) toggle.onclick = e => {
      e.preventDefault();
      e.stopPropagation();
      const isCollapsed = panel.classList.toggle("collapsed");
      toggle.textContent = isCollapsed ? "▸" : "▾";
    };
    if (bar) {
      const pct = Math.round((m.xp / (m.totalXp || 1)) * 100);
      bar.style.width = pct + "%";
    }
  }

  function hideBriefingEl(el) {
    if (!el) return;
    el.hidden = true;
    el.style.display = "none";
    el.style.pointerEvents = "none";
  }

  function showBriefingEl(el) {
    el.hidden = false;
    el.removeAttribute("hidden");
    el.style.display = "flex";
    el.style.pointerEvents = "auto";
  }

  function cleanupBriefing() {
    hideBriefingEl(document.getElementById("ds-walk-briefing"));
    document.getElementById("ds-walk-overlay")?.classList.remove("ds-briefing-open");
  }

  function ensureBriefingEl() {
    let el = document.getElementById("ds-walk-briefing");
    if (!el) {
      el = document.createElement("div");
      el.id = "ds-walk-briefing";
      el.className = "ds-walk-briefing ds-walk-briefing-portal";
      el.hidden = true;
      document.body.appendChild(el);
    } else if (el.parentElement !== document.body) {
      document.body.appendChild(el);
      el.classList.add("ds-walk-briefing-portal");
    }
    return el;
  }

  function dismissBriefing(m, onStart) {
    hideBriefingEl(document.getElementById("ds-walk-briefing"));
    document.getElementById("ds-walk-overlay")?.classList.remove("ds-briefing-open");
    if (m) m.briefingSeen = true;
    onStart?.();
  }

  function renderBriefing(m, onStart) {
    const el = ensureBriefingEl();
    m._briefingStart = onStart;
    showBriefingEl(el);
    document.getElementById("ds-walk-overlay")?.classList.add("ds-briefing-open");
    el.innerHTML = `
      <div class="ds-briefing-card">
        <div class="ds-briefing-badge">FIELD TECH</div>
        <h3>${esc(m.title)}</h3>
        <p>${esc(m.subtitle)}</p>
        <ul>${m.objectives.map(o => `<li>${esc(o.label)} <em>+${o.xp} XP</em></li>`).join("")}</ul>
        <p class="ds-briefing-tip">Walk near devices and press <kbd>E</kbd> to inspect · Follow glowing waypoints · Use Trace buttons for cable missions</p>
        <button type="button" class="ds-walk-btn primary" data-action="mission-start" id="ds-mission-start">Start mission</button>
      </div>`;
    const start = e => {
      e?.preventDefault?.();
      e?.stopPropagation?.();
      dismissBriefing(m, onStart);
    };
    const btn = el.querySelector("#ds-mission-start");
    if (btn) btn.onclick = start;
    el.onclick = e => {
      if (e.target.closest("#ds-mission-start")) start(e);
    };
  }

  function toastObjective(label) {
    const t = document.getElementById("ds-walk-toast");
    if (!t) return;
    t.textContent = "✓ " + label;
    t.classList.add("show");
    clearTimeout(toastObjective._tm);
    toastObjective._tm = setTimeout(() => t.classList.remove("show"), 2200);
  }

  function makeWaypoint(THREE, disposables) {
    const g = new THREE.Group();
    g.userData.kind = "waypoint";
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.35, 0.55, 20),
      new THREE.MeshBasicMaterial({ color: 0xff9000, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.06;
    g.add(ring);
    const top = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.12, 0),
      new THREE.MeshBasicMaterial({ color: 0xffcc66, transparent: true, opacity: 0.75 })
    );
    top.position.y = 1.6;
    g.add(top);
    return g;
  }

  function syncWaypoints(walkState, m, graph) {
    const THREE = walkState.THREE;
    const scene = walkState.scene;
    if (!THREE || !scene || !m || m.complete) return;
    const targets = targetChambers(m, graph).slice(0, 2);
    const existing = walkState.waypointGroup;
    if (existing) scene.remove(existing);
    const group = new THREE.Group();
    targets.forEach((ch, i) => {
      const wp = makeWaypoint(THREE, walkState.disposables);
      const pos = walkState.chamberWorldPos?.(ch) || ch.pos;
      wp.position.set(pos.x, 0, pos.z);
      wp.userData.phase = i * 1.2;
      group.add(wp);
    });
    walkState.waypointGroup = group;
    scene.add(group);
  }

  function animateWaypoints(walkState, t) {
    walkState.waypointGroup?.children.forEach(wp => {
      const ph = wp.userData.phase || 0;
      wp.position.y = Math.sin(t * 2 + ph) * 0.12;
      wp.rotation.y = t * 0.8;
      const top = wp.children[1];
      if (top) top.position.y = 1.6 + Math.sin(t * 3 + ph) * 0.1;
    });
  }

  function inspectHtml(ch) {
    return `<div class="ds-inspect-card">
      <strong>${esc(ch.label)}</strong>
      ${ch.pid ? `<span class="ds-inspect-pid">${esc(ch.pid)}</span>` : ""}
      <p>${esc(tipFor(ch))}</p>
      <span class="ds-inspect-zone">${esc((ch.zone || "device").toUpperCase())}</span>
    </div>`;
  }

  window.__DS_MISSIONS = {
    startCampaign, activeObj, onVisit, onTrace, targetChambers, renderHud, renderBriefing, dismissBriefing, cleanupBriefing,
    syncWaypoints, animateWaypoints, inspectHtml, toastObjective, tipFor, isObjDone, advanceMission
  };
})();

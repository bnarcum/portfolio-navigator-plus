/**
 * Portfolio Navigator Plus — Design Studio
 * Intent Studio (A) + Network Canvas (B) + Room Canvas (D)
 * Shared deal model → BOM + cable schedule → CCW prep export
 */
(function DesignStudioModule() {
  "use strict";

  const STORAGE_KEY = "cpn-design-studio-v1";
  const uid = () => "ds-" + Math.random().toString(36).slice(2, 10);

  const LAYERS = ["wan", "core", "distribution", "access", "security", "mgmt", "collab"];
  const LAYER_LABELS = {
    wan: "WAN / SD-WAN", core: "Core", distribution: "Distribution",
    access: "Access", security: "Security", mgmt: "Management", collab: "Collaboration"
  };

  const NETWORK_STENCILS = [
    { id: "c8200", label: "Secure Router 8200", layer: "wan", category: "network", pid: "C8200-1N-4T", icon: "🔀" },
    { id: "sdwan", label: "SD-WAN Edge", layer: "wan", category: "network", pid: "C8000V-SDWAN", icon: "☁" },
    { id: "c9500", label: "Catalyst 9500 Core", layer: "core", category: "network", pid: "C9500-48Y4C", icon: "⬡" },
    { id: "n9k", label: "Nexus 9300", layer: "core", category: "network", pid: "N9K-C93180YC-FX3", icon: "⬢" },
    { id: "c9300", label: "Catalyst 9300", layer: "distribution", category: "network", pid: "C9300-48P", icon: "▣" },
    { id: "c9200", label: "Catalyst 9200", layer: "access", category: "network", pid: "C9200-48P", icon: "▢" },
    { id: "c9179", label: "Catalyst 9179F AP", layer: "access", category: "network", pid: "CW9179F", icon: "📶" },
    { id: "sf-enterprise", label: "Secure Firewall", layer: "security", category: "security", pid: "FPR-2130", icon: "🛡" },
    { id: "ise", label: "ISE", layer: "security", category: "security", pid: "ISE-VM-K9", icon: "🔐" },
    { id: "catalyst-center", label: "Catalyst Center", layer: "mgmt", category: "network", pid: "DN3-HW-APL", icon: "⚙" },
    { id: "meraki-mx", label: "Meraki MX", layer: "security", category: "network", pid: "MX85-HW", icon: "◈" },
    { id: "ucs", label: "UCS Server", layer: "core", category: "computing", pid: "UCSX-210C-M7SN", icon: "🖥" },
  ];

  const ROOM_STENCILS = [
    { id: "room-kit-eq", label: "Room Kit EQ", pid: "CS-KIT-EQ-K9", icon: "📹", w: 80, h: 50 },
    { id: "room-kit-pro", label: "Room Kit Pro", pid: "CS-KITPRO-K9", icon: "📹", w: 80, h: 50 },
    { id: "board-pro", label: "Board Pro 75", pid: "CS-BRD-75-K9", icon: "🖼", w: 100, h: 60 },
    { id: "desk-pro", label: "Desk Pro", pid: "CS-DESKPRO-K9", icon: "💻", w: 70, h: 45 },
    { id: "quad-cam", label: "Quad Camera", pid: "CS-QUADCAM", icon: "🎥", w: 50, h: 50 },
    { id: "table-mic", label: "Table Mic Pro", pid: "CS-TABLEMIC", icon: "🎤", w: 60, h: 30 },
    { id: "amp", label: "Room Amp", pid: "CS-AMP-280", icon: "🔊", w: 50, h: 40 },
    { id: "switch-poe", label: "PoE Switch", pid: "C9200-24P", icon: "▢", w: 60, h: 40 },
    { id: "display", label: "Display 75\"", pid: "DISPLAY-75", icon: "📺", w: 90, h: 50 },
  ];

  const MEDIA_TYPES = [
    { id: "cat6", label: "Cat6", cablePid: "CAB-CAT6-3M" },
    { id: "fiber-sm", label: "SM Fiber", cablePid: "SFP-10G-LR-S" },
    { id: "fiber-mm", label: "MM Fiber", cablePid: "SFP-10G-SR-S" },
    { id: "dac", label: "DAC", cablePid: "SFP-H10GB-CU3M" },
    { id: "hdmi", label: "HDMI 2.1", cablePid: "CAB-HDMI-3M" },
    { id: "usb-c", label: "USB-C", cablePid: "CAB-USBC-2M" },
    { id: "speaker", label: "Speaker wire", cablePid: "CAB-SPK-10M" },
    { id: "control", label: "Control (RS232)", cablePid: "CAB-CON-5M" },
  ];

  const SERVICE_LINES = [
    { pid: "CON-PREM-SVC", desc: "Solution Support (SSPT)", type: "service" },
    { pid: "CON-PS-8HR", desc: "Professional Services — 8hr block", type: "service" },
  ];

  function emptyDesign(account) {
    return {
      version: 1,
      account: account || "Untitled Design",
      updated: new Date().toISOString(),
      requirements: { notes: "", vertical: "", sites: 1, users: 0 },
      sites: [{ id: "site-1", name: "Main Campus", type: "campus" }],
      rooms: [],
      nodes: [],
      links: [],
      bomOverrides: [],
      mode: "network",
      canvas: { network: { panX: 0, panY: 0, zoom: 1 }, room: { panX: 0, panY: 0, zoom: 1 } }
    };
  }

  function loadDesign() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    const acct = document.querySelector("#acct-name")?.value?.trim();
    return emptyDesign(acct || "Untitled Design");
  }

  function saveDesign(design) {
    design.updated = new Date().toISOString();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(design)); } catch (e) { /* ignore */ }
  }

  function stencilFor(id, mode) {
    const list = mode === "room" ? ROOM_STENCILS : NETWORK_STENCILS;
    return list.find(s => s.id === id);
  }

  function computeBom(design) {
    const lines = new Map();
    const add = (pid, desc, qty, type) => {
      if (!pid) return;
      const k = pid + "|" + type;
      const prev = lines.get(k) || { pid, desc, qty: 0, type };
      prev.qty += qty;
      lines.set(k, prev);
    };

    design.nodes.forEach(n => {
      const st = stencilFor(n.stencilId, n.canvas === "room" ? "room" : "network");
      add(n.pid || st?.pid, n.label || st?.label, 1, "hardware");
      if (st?.layer === "access" || n.stencilId?.includes("9179") || n.stencilId?.includes("9200")) {
        add("DNA-A-48P", "DNA Advantage — 48 port (3yr)", 1, "license");
      }
      if (n.stencilId === "ise") add("ISE-PLR-LIC", "ISE Premier License", 1, "license");
    });

    design.links.forEach(l => {
      const media = MEDIA_TYPES.find(m => m.id === l.media) || MEDIA_TYPES[0];
      add(media.cablePid, media.label + " — " + (l.label || "link"), 1, "cable");
    });

    if (design.nodes.filter(n => n.canvas !== "room").length >= 3) {
      SERVICE_LINES.forEach(s => add(s.pid, s.desc, 1, s.type));
    }

    (design.bomOverrides || []).forEach(o => add(o.pid, o.desc, o.qty || 1, o.type || "manual"));

    return [...lines.values()].sort((a, b) => a.type.localeCompare(b.type));
  }

  function computeCables(design) {
    return design.links.map((l, i) => {
      const from = design.nodes.find(n => n.id === l.from);
      const to = design.nodes.find(n => n.id === l.to);
      const media = MEDIA_TYPES.find(m => m.id === l.media) || MEDIA_TYPES[0];
      return {
        id: l.id,
        from: from?.label || l.from,
        to: to?.label || l.to,
        media: media.label,
        cablePid: media.cablePid,
        length: l.length || "—",
        label: l.label || `LINK-${String(i + 1).padStart(3, "0")}`
      };
    });
  }

  /* ── Intent: rule-based draft generator ── */
  function generateFromIntent(text, design) {
    const t = text.toLowerCase();
    const nodes = [];
    const links = [];
    let x = 120, y = 120;
    const place = (stencilId, label, layer, dx = 0, dy = 0) => {
      const st = NETWORK_STENCILS.find(s => s.id === stencilId);
      const id = uid();
      nodes.push({
        id, stencilId, label: label || st?.label, pid: st?.pid, layer: layer || st?.layer,
        x: x + dx, y: y + dy, canvas: "network", ports: 4
      });
      return id;
    };

    const hasCampus = /campus|building|hospital|enterprise|hq|headquarters/.test(t);
    const hasBranch = /branch|site|remote|store|retail/.test(t);
    const hasSdwan = /sd-wan|sdwan|sd wan|vmanage/.test(t);
    const hasSecurity = /firewall|security|ise|segmentation|zero trust/.test(t);
    const hasCollab = /room|webex|collab|hybrid|meeting|video/.test(t);
    const hasWireless = /wireless|wifi|wi-fi|ap |access point/.test(t);
    const siteCount = parseInt(t.match(/(\d+)\s*(site|building|branch|location)/)?.[1] || "0", 10);
    const roomCount = parseInt(t.match(/(\d+)\s*(room|or |conference|huddle)/)?.[1] || "0", 10);

    if (hasSdwan || hasBranch) {
      const wan = place("c8200", "WAN Edge", "wan", 0, 0);
      const fw = place("sf-enterprise", "Perimeter FW", "security", 180, 0);
      const sw = place("c9200", "Branch Access", "access", 360, 0);
      links.push({ id: uid(), from: wan, to: fw, media: "fiber-sm", label: "WAN-Uplink" });
      links.push({ id: uid(), from: fw, to: sw, media: "cat6", label: "LAN-Trunk" });
      if (hasWireless) {
        const ap = place("c9179", "Wi-Fi 7 AP", "access", 540, 0);
        links.push({ id: uid(), from: sw, to: ap, media: "cat6", label: "AP-PoE" });
      }
      x += 80; y += 140;
    }

    if (hasCampus || (!hasBranch && !hasCollab)) {
      const core = place("c9500", "Core Switch", "core", 0, 0);
      const dist = place("c9300", "Distribution", "distribution", 200, 80);
      const acc = place("c9200", "Access Switch", "access", 400, 160);
      links.push({ id: uid(), from: core, to: dist, media: "fiber-sm", label: "Core-Dist" });
      links.push({ id: uid(), from: dist, to: acc, media: "fiber-mm", label: "Dist-Access" });
      if (hasWireless) {
        const ap = place("c9179", "Wi-Fi 7 AP", "access", 560, 160);
        links.push({ id: uid(), from: acc, to: ap, media: "cat6", label: "AP-PoE" });
      }
      if (hasSecurity || /ise|802\.1x|nac/.test(t)) {
        const ise = place("ise", "ISE Policy", "security", 200, -80);
        links.push({ id: uid(), from: ise, to: dist, media: "cat6", label: "Auth-Trunk" });
      }
      if (hasSdwan) {
        const wan = place("c8200", "SD-WAN Edge", "wan", -180, 0);
        const fw = place("sf-enterprise", "DC Firewall", "security", -180, 120);
        links.push({ id: uid(), from: wan, to: core, media: "fiber-sm", label: "WAN-Core" });
        links.push({ id: uid(), from: fw, to: core, media: "fiber-sm", label: "Sec-Core" });
      }
      place("catalyst-center", "Catalyst Center", "mgmt", 400, -60);
      x += 100; y += 220;
    }

    const rooms = [];
    if (hasCollab || roomCount > 0) {
      const n = roomCount || (hasCollab ? 3 : 0);
      for (let i = 0; i < n; i++) {
        const roomId = uid();
        rooms.push({ id: roomId, name: `Room ${i + 1}`, width: 400, height: 300 });
        const rx = 80 + (i % 3) * 220;
        const ry = 80 + Math.floor(i / 3) * 200;
        const kit = uid();
        nodes.push({
          id: kit, stencilId: "room-kit-eq", label: "Room Kit EQ", pid: "CS-KIT-EQ-K9",
          x: rx, y: ry, canvas: "room", roomId, w: 80, h: 50
        });
        const disp = uid();
        nodes.push({
          id: disp, stencilId: "display", label: "Display 75\"", pid: "DISPLAY-75",
          x: rx + 120, y: ry, canvas: "room", roomId, w: 90, h: 50
        });
        const swId = uid();
        nodes.push({
          id: swId, stencilId: "switch-poe", label: "Room PoE SW", pid: "C9200-24P",
          x: rx, y: ry + 100, canvas: "room", roomId, w: 60, h: 40
        });
        links.push({ id: uid(), from: kit, to: disp, media: "hdmi", label: "Video" });
        links.push({ id: uid(), from: swId, to: kit, media: "cat6", label: "PoE" });
      }
    }

    if (siteCount > 1) {
      design.requirements.sites = siteCount;
      design.requirements.notes = text.slice(0, 500);
    }

    design.nodes = nodes;
    design.links = links;
    design.rooms = rooms;
    design.requirements.notes = text.slice(0, 2000);
    if (rooms.length) design.mode = "room";
    return design;
  }

  /* ── UI Controller ── */
  class DesignStudio {
    constructor() {
      this.design = loadDesign();
      this.tab = "network";
      this.panelTab = "bom";
      this.selectedNode = null;
      this.selectedLink = null;
      this.linkFrom = null;
      this.drag = null;
      this.pan = { x: 0, y: 0, zoom: 1 };
      this.layerFilter = "all";
      this.el = null;
    }

    mount() {
      if (document.getElementById("design-studio")) return;
      const root = document.createElement("div");
      root.id = "design-studio";
      root.innerHTML = `
        <header id="ds-header">
          <span class="ds-logo">Design Studio</span>
          <div id="ds-tabs">
            <button type="button" data-tab="intent">Intent</button>
            <button type="button" data-tab="network" class="active">Network</button>
            <button type="button" data-tab="room">Room</button>
          </div>
          <span class="ds-spacer"></span>
          <button type="button" class="ds-btn" id="ds-import-stack">Import Stack</button>
          <button type="button" class="ds-btn" id="ds-export-pack">Export Pack</button>
          <button type="button" class="ds-btn" id="ds-ai-design">Ask AI</button>
          <button type="button" class="ds-btn primary" id="ds-close">Close</button>
        </header>
        <div id="ds-body">
          <div id="ds-main">
            <div id="ds-intent" hidden>
              <h3 style="padding:0 0 8px;font-size:14px;color:var(--accent)">Describe the opportunity</h3>
              <textarea id="ds-intent-text" placeholder="Example: 200-bed hospital, 3 buildings, SD-WAN at 8 branches, refresh 3850 stacks, 12 hybrid OR rooms with Room Kit EQ…"></textarea>
              <div class="ds-templates" id="ds-templates"></div>
              <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
                <button type="button" class="ds-btn primary" id="ds-generate">Generate Draft Design</button>
                <button type="button" class="ds-btn" id="ds-clear">Clear Design</button>
              </div>
              <p class="ds-hint">Generates logical topology + room layouts on the Network and Room canvases. Edit freely, then export BOM and cable schedule for CCW prep.</p>
            </div>
            <div id="ds-canvas-wrap">
              <div id="ds-toolbar">
                <select id="ds-layer-filter" title="Filter layer">
                  <option value="all">All layers</option>
                </select>
                <select id="ds-link-media" title="Link media type">
                </select>
                <button type="button" id="ds-link-mode">Link mode: off</button>
                <button type="button" id="ds-delete-sel">Delete selected</button>
                <button type="button" id="ds-fit">Fit view</button>
              </div>
              <svg id="ds-svg" xmlns="http://www.w3.org/2000/svg">
                <g id="ds-viewport"><g id="ds-links"></g><g id="ds-nodes"></g></g>
              </svg>
            </div>
          </div>
          <aside id="ds-sidebar">
            <div id="ds-palette"><div class="ds-stencil-grid" id="ds-stencil-grid"></div></div>
            <div id="ds-panel-tabs">
              <button type="button" data-panel="bom" class="active">BOM</button>
              <button type="button" data-panel="cables">Cables</button>
              <button type="button" data-panel="warnings">Validate</button>
            </div>
            <div id="ds-panel-body"></div>
            <div id="ds-status"></div>
          </aside>
        </div>`;
      document.body.appendChild(root);
      this.el = root;
      this.wireEvents();
      this.populateLayerFilter();
      this.populateMediaSelect();
      this.populateTemplates();
    }

    populateLayerFilter() {
      const sel = document.getElementById("ds-layer-filter");
      LAYERS.forEach(l => {
        const o = document.createElement("option");
        o.value = l; o.textContent = LAYER_LABELS[l];
        sel.appendChild(o);
      });
    }

    populateMediaSelect() {
      const sel = document.getElementById("ds-link-media");
      MEDIA_TYPES.forEach(m => {
        const o = document.createElement("option");
        o.value = m.id; o.textContent = m.label;
        sel.appendChild(o);
      });
    }

    populateTemplates() {
      const tpls = [
        "3-building hospital campus with ISE and Wi-Fi 7",
        "8 branch SD-WAN with Secure Firewall and Meraki backup",
        "12 hybrid meeting rooms with Room Kit EQ and Board Pro",
        "Data center pod: Nexus core, UCS compute, Secure Firewall DMZ",
        "K-12 district: 4 sites, Catalyst access, 9179F in gymnasiums"
      ];
      const box = document.getElementById("ds-templates");
      tpls.forEach(t => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "ds-tpl"; b.textContent = t;
        b.addEventListener("click", () => {
          document.getElementById("ds-intent-text").value = t;
        });
        box.appendChild(b);
      });
    }

    wireEvents() {
      document.getElementById("ds-close").addEventListener("click", () => this.close());
      document.getElementById("ds-tabs").addEventListener("click", e => {
        const btn = e.target.closest("[data-tab]");
        if (!btn) return;
        this.setTab(btn.dataset.tab);
      });
      document.getElementById("ds-panel-tabs").addEventListener("click", e => {
        const btn = e.target.closest("[data-panel]");
        if (!btn) return;
        this.panelTab = btn.dataset.panel;
        $$("#ds-panel-tabs button").forEach(b => b.classList.toggle("active", b.dataset.panel === this.panelTab));
        this.renderPanel();
      });
      document.getElementById("ds-generate").addEventListener("click", () => this.runGenerate());
      document.getElementById("ds-clear").addEventListener("click", () => {
        if (confirm("Clear entire design?")) {
          this.design = emptyDesign(this.design.account);
          saveDesign(this.design);
          this.render();
        }
      });
      document.getElementById("ds-import-stack").addEventListener("click", () => this.importStack());
      document.getElementById("ds-export-pack").addEventListener("click", () => this.exportPack());
      document.getElementById("ds-ai-design").addEventListener("click", () => this.askAi());
      document.getElementById("ds-link-mode").addEventListener("click", () => this.toggleLinkMode());
      document.getElementById("ds-delete-sel").addEventListener("click", () => this.deleteSelected());
      document.getElementById("ds-fit").addEventListener("click", () => this.fitView());
      document.getElementById("ds-layer-filter").addEventListener("change", e => {
        this.layerFilter = e.target.value;
        this.renderCanvas();
      });

      const svg = document.getElementById("ds-svg");
      svg.addEventListener("mousedown", e => this.onSvgDown(e));
      svg.addEventListener("mousemove", e => this.onSvgMove(e));
      svg.addEventListener("mouseup", e => this.onSvgUp(e));
      svg.addEventListener("wheel", e => this.onWheel(e), { passive: false });
      svg.addEventListener("click", e => {
        if (e.target === svg || e.target.id === "ds-viewport") {
          this.selectedNode = null;
          this.selectedLink = null;
          this.renderCanvas();
        }
      });
    }

    open() {
      this.mount();
      this.design = loadDesign();
      const acct = document.querySelector("#acct-name")?.value?.trim();
      if (acct) this.design.account = acct;
      this.el.classList.add("open");
      document.body.classList.add("design-studio-open");
      this.setTab(this.design.mode === "room" ? "room" : "network");
      this.render();
    }

    close() {
      saveDesign(this.design);
      this.el?.classList.remove("open");
      document.body.classList.remove("design-studio-open");
    }

    setTab(tab) {
      this.tab = tab;
      this.design.mode = tab === "room" ? "room" : tab === "network" ? "network" : this.design.mode;
      $$("#ds-tabs button").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
      document.getElementById("ds-intent").hidden = tab !== "intent";
      document.getElementById("ds-canvas-wrap").hidden = tab === "intent";
      if (tab !== "intent") {
        document.getElementById("ds-canvas-wrap").classList.toggle("room-mode", tab === "room");
        this.renderPalette();
        this.renderCanvas();
      }
      this.renderPanel();
    }

    runGenerate() {
      const text = document.getElementById("ds-intent-text").value.trim();
      if (!text) { this.toast("Enter a description first"); return; }
      generateFromIntent(text, this.design);
      saveDesign(this.design);
      this.toast("Draft design generated — review Network and Room tabs");
      if (this.design.rooms.length) this.setTab("network");
      setTimeout(() => {
        if (this.design.nodes.some(n => n.canvas === "room")) this.setTab("room");
        else this.setTab("network");
        this.fitView();
      }, 100);
    }

    importStack() {
      const v2 = window.__cpnV2;
      if (!v2?.phases?.readState) { this.toast("Account stack not available"); return; }
      const state = v2.phases.readState();
      const stack = state.stack || [];
      let x = 100, added = 0;
      stack.forEach(it => {
        const id = typeof it === "string" ? it : it?.id;
        if (!id) return;
        const name = v2.helpers?.nameOf?.(id) || id;
        const match = NETWORK_STENCILS.find(s =>
          id.includes(s.id) || name.toLowerCase().includes(s.label.toLowerCase().slice(0, 8))
        );
        const stencilId = match?.id || "c9300";
        const st = NETWORK_STENCILS.find(s => s.id === stencilId);
        this.design.nodes.push({
          id: uid(), stencilId, label: name.slice(0, 28), pid: st?.pid,
          layer: st?.layer || "access", x: x, y: 200, canvas: "network", ports: 4
        });
        x += 140; added++;
      });
      saveDesign(this.design);
      this.render();
      this.toast(`Imported ${added} items from account stack`);
    }

    askAi() {
      const text = document.getElementById("ds-intent-text")?.value?.trim() ||
        "Design a complete Cisco network for this account";
      const prompt = `You are a Cisco Solutions Engineer. Based on this request, output ONLY valid JSON (no markdown) matching this schema:
{"nodes":[{"stencilId":"c9300","label":"...","layer":"access","x":100,"y":100,"canvas":"network"}],"links":[{"fromLabel":"...","toLabel":"...","media":"cat6","label":"..."}],"rooms":[{"name":"Room 1"}]}
Use stencilIds from: ${NETWORK_STENCILS.map(s => s.id).join(", ")} and room: ${ROOM_STENCILS.map(s => s.id).join(", ")}.
Media: ${MEDIA_TYPES.map(m => m.id).join(", ")}.

Request: ${text}

Account context: ${this.design.account}`;
      if (window.__cpnV2?.phases?.openAiWithPrompt) {
        window.__cpnV2.phases.openAiWithPrompt(prompt, { send: true });
        this.toast("AI prompt sent — paste JSON response into Intent and click Generate, or use rule-based Generate");
      } else {
        this.toast("Open AI assistant from main toolbar first");
      }
    }

    exportPack() {
      const bom = computeBom(this.design);
      const cables = computeCables(this.design);
      const dl = window.__cpnV2?.helpers?.downloadBlob;
      if (!dl) { this.toast("Export unavailable"); return; }
      const slug = (this.design.account || "design").replace(/\s+/g, "-");
      const bomRows = [["Line Type", "PID", "Description", "Qty"]];
      bom.forEach(b => bomRows.push([b.type, b.pid, b.desc, b.qty]));
      const bomCsv = bomRows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
      dl(`CCW_Prep_${slug}.csv`, "text/csv", bomCsv);

      const cabRows = [["Label", "From", "To", "Media", "Cable PID", "Length"]];
      cables.forEach(c => cabRows.push([c.label, c.from, c.to, c.media, c.cablePid, c.length]));
      const cabCsv = cabRows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
      dl(`Cable_Schedule_${slug}.csv`, "text/csv", cabCsv);

      dl(`Design_${slug}.json`, "application/json", JSON.stringify(this.design, null, 2));
      this.toast("Exported CCW prep CSV, cable schedule, and design JSON");
    }

    toggleLinkMode() {
      this.linkMode = !this.linkMode;
      this.linkFrom = null;
      document.getElementById("ds-link-mode").textContent = "Link mode: " + (this.linkMode ? "on" : "off");
      document.getElementById("ds-svg").classList.toggle("linking", this.linkMode);
    }

    deleteSelected() {
      if (this.selectedLink) {
        this.design.links = this.design.links.filter(l => l.id !== this.selectedLink);
        this.selectedLink = null;
      } else if (this.selectedNode) {
        this.design.links = this.design.links.filter(
          l => l.from !== this.selectedNode && l.to !== this.selectedNode
        );
        this.design.nodes = this.design.nodes.filter(n => n.id !== this.selectedNode);
        this.selectedNode = null;
      }
      saveDesign(this.design);
      this.render();
    }

    render() {
      this.renderPalette();
      this.renderCanvas();
      this.renderPanel();
      document.getElementById("ds-status").textContent =
        `${this.design.nodes.length} devices · ${this.design.links.length} links · ${computeBom(this.design).length} BOM lines`;
    }

    renderPalette() {
      const grid = document.getElementById("ds-stencil-grid");
      const stencils = this.tab === "room" ? ROOM_STENCILS : NETWORK_STENCILS;
      grid.innerHTML = stencils.map(s => `
        <div class="ds-stencil" draggable="true" data-stencil="${s.id}" title="${s.label}">
          <span class="ds-st-icon">${s.icon}</span>${s.label}
        </div>`).join("");
      grid.querySelectorAll(".ds-stencil").forEach(el => {
        el.addEventListener("dragstart", e => {
          e.dataTransfer.setData("text/stencil", el.dataset.stencil);
        });
        el.addEventListener("click", () => this.addStencil(el.dataset.stencil));
      });
      const wrap = document.getElementById("ds-canvas-wrap");
      wrap.ondragover = e => e.preventDefault();
      wrap.ondrop = e => {
        e.preventDefault();
        const id = e.dataTransfer.getData("text/stencil");
        if (id) {
          const pt = this.clientToSvg(e.clientX, e.clientY);
          this.addStencil(id, pt.x, pt.y);
        }
      };
    }

    addStencil(stencilId, x, y) {
      const mode = this.tab === "room" ? "room" : "network";
      const st = stencilFor(stencilId, mode);
      if (!st) return;
      const cx = x ?? (150 + Math.random() * 200);
      const cy = y ?? (150 + Math.random() * 120);
      this.design.nodes.push({
        id: uid(), stencilId, label: st.label, pid: st.pid,
        layer: st.layer || "collab", x: cx, y: cy, canvas: mode,
        w: st.w || 72, h: st.h || 44, ports: 4
      });
      saveDesign(this.design);
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

    renderCanvas() {
      if (this.tab === "intent") return;
      const nodes = this.visibleNodes();
      const nodeIds = new Set(nodes.map(n => n.id));
      const links = this.design.links.filter(l => nodeIds.has(l.from) && nodeIds.has(l.to));
      const linksG = document.getElementById("ds-links");
      const nodesG = document.getElementById("ds-nodes");
      const pos = id => {
        const n = this.design.nodes.find(x => x.id === id);
        return n ? { x: n.x, y: n.y, w: n.w || 72, h: n.h || 44 } : { x: 0, y: 0, w: 72, h: 44 };
      };

      linksG.innerHTML = links.map(l => {
        const a = pos(l.from), b = pos(l.to);
        const x1 = a.x + a.w / 2, y1 = a.y + a.h / 2;
        const x2 = b.x + b.w / 2, y2 = b.y + b.h / 2;
        const sel = this.selectedLink === l.id ? " selected" : "";
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        return `<line class="ds-link${sel}" data-link="${l.id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>
          <text class="ds-link-label" x="${mx}" y="${my - 4}">${escapeHtml(l.label || "")}</text>`;
      }).join("");

      nodesG.innerHTML = nodes.map(n => {
        const sel = this.selectedNode === n.id ? " selected" : "";
        const st = stencilFor(n.stencilId, n.canvas === "room" ? "room" : "network");
        const w = n.w || 72, h = n.h || 44;
        return `<g class="ds-node${sel}" data-node="${n.id}" transform="translate(${n.x},${n.y})">
          <rect class="ds-node-box" width="${w}" height="${h}" rx="6"/>
          <text class="ds-node-label" x="${w/2}" y="${h/2 - 2}" text-anchor="middle">${escapeHtml((st?.icon || "▣") + " " + (n.label || "").slice(0, 14))}</text>
          <text class="ds-node-sub" x="${w/2}" y="${h/2 + 10}" text-anchor="middle">${escapeHtml(n.pid || "")}</text>
          ${n.layer ? `<text class="ds-node-layer" x="4" y="10">${escapeHtml(LAYER_LABELS[n.layer] || n.layer)}</text>` : ""}
        </g>`;
      }).join("");

      linksG.querySelectorAll(".ds-link").forEach(el => {
        el.addEventListener("click", e => {
          e.stopPropagation();
          this.selectedLink = el.dataset.link;
          this.selectedNode = null;
          this.renderCanvas();
        });
      });

      nodesG.querySelectorAll(".ds-node").forEach(el => {
        el.addEventListener("mousedown", e => {
          e.stopPropagation();
          const id = el.dataset.node;
          if (this.linkMode) {
            if (!this.linkFrom) { this.linkFrom = id; this.toast("Select target device"); }
            else if (this.linkFrom !== id) {
              const media = document.getElementById("ds-link-media").value;
              this.design.links.push({
                id: uid(), from: this.linkFrom, to: id,
                media, label: "Link-" + (this.design.links.length + 1)
              });
              this.linkFrom = null;
              saveDesign(this.design);
              this.render();
            }
            return;
          }
          this.selectedNode = id;
          this.selectedLink = null;
          this.drag = { id, ox: e.clientX, oy: e.clientY, node: this.design.nodes.find(n => n.id === id) };
          this.renderCanvas();
        });
        el.addEventListener("click", e => e.stopPropagation());
      });

      this.applyTransform();
    }

    renderPanel() {
      const body = document.getElementById("ds-panel-body");
      if (this.panelTab === "bom") {
        const bom = computeBom(this.design);
        if (!bom.length) {
          body.innerHTML = `<div class="ds-empty">Add devices to the canvas or run Intent → Generate Draft. BOM updates live.</div>`;
          return;
        }
        body.innerHTML = `<table class="ds-table"><thead><tr><th>Type</th><th>PID</th><th>Qty</th></tr></thead>
          <tbody>${bom.map(b => `<tr><td>${escapeHtml(b.type)}</td><td title="${escapeHtml(b.desc)}">${escapeHtml(b.pid)}</td><td>${b.qty}</td></tr>`).join("")}</tbody></table>`;
      } else if (this.panelTab === "cables") {
        const cables = computeCables(this.design);
        if (!cables.length) {
          body.innerHTML = `<div class="ds-empty">Connect devices in Link mode to build the cable schedule.</div>`;
          return;
        }
        body.innerHTML = `<table class="ds-table"><thead><tr><th>Label</th><th>From</th><th>To</th><th>Media</th></tr></thead>
          <tbody>${cables.map(c => `<tr><td>${escapeHtml(c.label)}</td><td>${escapeHtml(c.from)}</td><td>${escapeHtml(c.to)}</td><td>${escapeHtml(c.media)}</td></tr>`).join("")}</tbody></table>`;
      } else {
        body.innerHTML = this.renderWarnings();
      }
    }

    renderWarnings() {
      const w = [];
      const nets = this.design.nodes.filter(n => n.canvas !== "room");
      if (!nets.some(n => n.layer === "core" || n.stencilId === "c9500" || n.stencilId === "n9k"))
        w.push("No core switch defined — add Catalyst 9500 or Nexus for campus designs.");
      if (!nets.some(n => n.layer === "security" || /sf-|firewall|ise/.test(n.stencilId)))
        w.push("No security control point — consider Secure Firewall or ISE.");
      if (nets.length >= 2 && this.design.links.length === 0)
        w.push("Devices are not connected — use Link mode to define topology.");
      const rooms = this.design.nodes.filter(n => n.canvas === "room");
      rooms.forEach(r => {
        const hasNet = this.design.links.some(l =>
          (l.from === r.id || l.to === r.id) && this.design.nodes.find(n => n.id === (l.from === r.id ? l.to : l.from))?.stencilId === "switch-poe"
        );
        if (r.stencilId?.includes("room") && !hasNet)
          w.push(`${r.label}: no PoE/network link to room switch.`);
      });
      if (!w.length) return `<div class="ds-empty" style="color:var(--accent)">✓ No blocking issues detected. Review BOM before CCW import.</div>`;
      return `<ul style="padding:12px 12px 12px 28px;font-size:12px;line-height:1.6;color:var(--muted)">${w.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`;
    }

    applyTransform() {
      const vp = document.getElementById("ds-viewport");
      if (vp) vp.setAttribute("transform", `translate(${this.pan.x},${this.pan.y}) scale(${this.pan.zoom})`);
    }

    clientToSvg(cx, cy) {
      const svg = document.getElementById("ds-svg");
      const rect = svg.getBoundingClientRect();
      return {
        x: (cx - rect.left - this.pan.x) / this.pan.zoom,
        y: (cy - rect.top - this.pan.y) / this.pan.zoom
      };
    }

    onSvgDown(e) {
      if (e.target.closest(".ds-node")) return;
      this.panDrag = { ox: e.clientX, oy: e.clientY, px: this.pan.x, py: this.pan.y };
    }

    onSvgMove(e) {
      if (this.drag?.node) {
        const pt = this.clientToSvg(e.clientX, e.clientY);
        this.drag.node.x = pt.x - (this.drag.node.w || 72) / 2;
        this.drag.node.y = pt.y - (this.drag.node.h || 44) / 2;
        this.renderCanvas();
        return;
      }
      if (this.panDrag) {
        this.pan.x = this.panDrag.px + (e.clientX - this.panDrag.ox);
        this.pan.y = this.panDrag.py + (e.clientY - this.panDrag.oy);
        this.applyTransform();
      }
    }

    onSvgUp() {
      if (this.drag) {
        saveDesign(this.design);
        this.renderPanel();
      }
      this.drag = null;
      this.panDrag = null;
    }

    onWheel(e) {
      e.preventDefault();
      const z = Math.max(0.3, Math.min(2.5, this.pan.zoom * (e.deltaY > 0 ? 0.92 : 1.08)));
      this.pan.zoom = z;
      this.applyTransform();
    }

    fitView() {
      const nodes = this.visibleNodes();
      if (!nodes.length) { this.pan = { x: 40, y: 40, zoom: 1 }; this.applyTransform(); return; }
      const xs = nodes.flatMap(n => [n.x, n.x + (n.w || 72)]);
      const ys = nodes.flatMap(n => [n.y, n.y + (n.h || 44)]);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      const svg = document.getElementById("ds-svg");
      const rect = svg.getBoundingClientRect();
      const pad = 60;
      const w = maxX - minX + pad * 2, h = maxY - minY + pad * 2;
      const zoom = Math.min(rect.width / w, rect.height / h, 1.2);
      this.pan.zoom = Math.max(0.4, zoom);
      this.pan.x = pad - minX * this.pan.zoom + 20;
      this.pan.y = pad - minY * this.pan.zoom + 20;
      this.applyTransform();
    }

    toast(msg) {
      if (typeof showToast === "function") showToast(msg);
      else console.log("[Design Studio]", msg);
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  }

  function $$(sel, root) { return [...(root || document).querySelectorAll(sel)]; }

  const studio = new DesignStudio();

  function initDesignStudio() {
    studio.mount();
    const btn = document.getElementById("design-studio-btn");
    if (btn && !btn.dataset.wired) {
      btn.dataset.wired = "1";
      btn.addEventListener("click", () => studio.open());
    }
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && document.getElementById("design-studio")?.classList.contains("open")) {
        studio.close();
      }
    });
  }

  window.DesignStudio = { open: () => studio.open(), close: () => studio.close(), instance: studio };
  window.initDesignStudio = initDesignStudio;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDesignStudio);
  } else {
    initDesignStudio();
  }
})();

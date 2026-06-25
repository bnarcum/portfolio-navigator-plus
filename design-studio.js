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

  const LAYERS = ["wan", "core", "distribution", "access", "security", "mgmt", "collab", "dc"];
  const LAYER_LABELS = {
    wan: "WAN / SD-WAN", core: "Core", distribution: "Distribution", access: "Access",
    security: "Security", mgmt: "Management", collab: "Collaboration", dc: "Data Center"
  };
  const LAYER_Y = { wan: 40, security: 120, core: 200, distribution: 300, access: 400, mgmt: 500, collab: 580, dc: 260 };

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
      add(n.pid || def?.pid || st?.pid, n.label || def?.label || st?.label, qty, "hardware");
      if (/9200|9300|9179|meraki|ms250|c9200|c9300/i.test(n.stencilId + (n.pid || "")))
        add("DNA-A-48P-3Y", "Cisco DNA Advantage 48P (3yr)", qty, "license");
      if (/ise/i.test(n.stencilId)) add("ISE-PLR-LIC", "ISE Premier (500 endpoints)", 1, "license");
      if (/fpr|firewall|sf-/i.test(n.stencilId)) add("FPR-SUP-2130", "Secure Firewall TD license", qty, "license");
      if (/room-kit|board|desk|bar|kit-eq|kitpro/i.test(n.stencilId)) add("A-FLEX-ROOM", "Webex Room license", qty, "license");
      if (/ceiling-mic|table-mic/i.test(n.stencilId)) add("A-FLEX-MIC", "Webex Mic license", qty, "license");
    });
    design.links.forEach(l => {
      const m = MEDIA_TYPES.find(x => x.id === l.media) || MEDIA_TYPES[0];
      if (m.cablePid && !m.cablePid.startsWith("N/A")) add(m.cablePid, `${m.label} — ${l.label || "link"}`, 1, "cable");
    });
    const netCount = design.nodes.filter(n => n.canvas !== "room").length;
    if (netCount >= 2) {
      add("CON-PREM-SVC", "Solution Support (SSPT)", 1, "service");
      add("CON-PS-8HR", "Professional Services 8hr", Math.max(1, Math.ceil(netCount / 5)), "service");
    }
    if (netCount >= 8) add("SMARTNET-24X7X4", "Smart Net 24x7x4 (placeholder)", netCount, "service");
    (design.bomOverrides || []).forEach(o => add(o.pid, o.desc, o.qty || 1, o.type || "manual"));
    return [...lines.values()].sort((a, b) => a.type.localeCompare(b.type));
  }

  function computeCables(design) {
    return design.links.map((l, i) => {
      const from = design.nodes.find(n => n.id === l.from);
      const to = design.nodes.find(n => n.id === l.to);
      const media = MEDIA_TYPES.find(m => m.id === l.media) || MEDIA_TYPES[0];
      return { id: l.id, from: from?.label || l.from, to: to?.label || l.to, fromPort: l.fromPort || "—", toPort: l.toPort || "—",
        media: media.label, cablePid: media.cablePid, length: l.length || "3m", label: l.label || `LINK-${String(i + 1).padStart(3, "0")}` };
    });
  }

  function validateDesign(d) { return RULES()?.validateDesign?.(d) || { warnings: [], tips: [], ok: true }; }
  function computeScore(d) { return RULES()?.computeScore?.(d) ?? 0; }
  function getSuggestions(d) { return RULES()?.getSuggestions?.(d) || []; }

  function snap(v, grid = 24) { return Math.round(v / grid) * grid; }

  function orthPath(x1, y1, x2, y2) {
    const mx = (x1 + x2) / 2;
    return `M ${x1} ${y1} L ${mx} ${y1} L ${mx} ${y2} L ${x2} ${y2}`;
  }

  function applyRoomTemplateToDesign(design, tplKey, roomId, roomName, ox, oy, nodesArr, linksArr) {
    TPL()?.applyRoomTemplate?.(design, tplKey, roomId, roomName, ox, oy, nodesArr, linksArr, STN());
  }

  function generateFromIntent(text, design) {
    const t = text.toLowerCase();
    const nodes = [], links = [];
    design.nodes = nodes; design.links = links; design.rooms = [];

    const pickNet = () => {
      if (/data center|datacenter|aci|spine|leaf|nexus/i.test(t)) return "dcSpineLeaf";
      if (/aci pod/i.test(t)) return "dcAciPod";
      if (/hyperflex|hx/i.test(t)) return "hyperflexEdge";
      if (/sd-wan|sdwan|vmanage|multi-site|branch/i.test(t) && /hq|headquarter|8 branch|multi/i.test(t)) return "sdwanFull";
      if (/retail|meraki|store/i.test(t)) return "retailMeraki";
      if (/k-12|k12|school|district/i.test(t)) return "k12District";
      if (/hospital|healthcare|clinical|medical/i.test(t)) return "healthcareCampus";
      if (/zero trust|sase|umbrella/i.test(t)) return "zeroTrustEdge";
      if (/branch|remote|store/i.test(t)) return "branchStandard";
      if (/collapsed|small campus|500 user/i.test(t)) return "campusCollapsed";
      return "campus3tierRedundant";
    };

    const netKey = pickNet();
    TPL()?.applyNetworkTemplate?.(design, netKey, 80, 80, STN());

    const roomTpl = /boardroom|executive board|large room|20 seat/i.test(t) ? "boardroom"
      : /training|classroom/i.test(t) ? "training"
      : /executive office|office/i.test(t) ? "executive"
      : /teams room|microsoft teams|mtr/i.test(t) ? "teamsRoom"
      : /zoom room|zoom/i.test(t) ? "zoomRoom"
      : /divisible|all-hands| divisible/i.test(t) ? "divisible"
      : /huddle|small room/i.test(t) ? "huddle" : "conference";

    const roomCount = parseInt(t.match(/(\d+)\s*(room|conference|huddle|boardroom|meeting)/)?.[1] || "0", 10);
    const hasCollab = /room|webex|collab|hybrid|meeting|video|board|kit/i.test(t);

    if (hasCollab || roomCount > 0) {
      const n = roomCount || (hasCollab ? 2 : 0);
      for (let i = 0; i < Math.min(n, 8); i++) {
        const roomId = uid();
        const roomName = `Room ${i + 1}`;
        const rtpl = TPL()?.ROOM_TEMPLATES?.[roomTpl];
        design.rooms.push({ id: roomId, name: roomName, template: roomTpl, width: rtpl?.w || 480, height: rtpl?.h || 360 });
        applyRoomTemplateToDesign(design, roomTpl, roomId, roomName, 60 + (i % 2) * 560, 60 + Math.floor(i / 2) * 460, design.nodes, design.links);
      }
    }

    design.requirements.notes = text.slice(0, 2000);
    return design;
  }

  function applyJsonDesign(json, design) {
    let data = json;
    if (typeof json === "string") {
      try { data = JSON.parse(json.replace(/^```json?\s*|\s*```$/g, "").trim()); } catch (e) { return false; }
    }
    if (!data || !Array.isArray(data.nodes)) return false;
    const labelToId = new Map();
    design.nodes = data.nodes.map(n => {
      const id = n.id || uid();
      labelToId.set(n.label, id);
      const mode = n.canvas === "room" ? "room" : "network";
      const def = STN()?.getDef?.(n.stencilId, mode);
      return { id, stencilId: n.stencilId, label: n.label || def?.label, pid: n.pid || def?.pid,
        layer: n.layer || def?.layer || "access", x: n.x || 100, y: n.y || 100, canvas: mode,
        qty: n.qty || 1, w: n.w || def?.w, h: n.h || def?.h, roomId: n.roomId };
    });
    design.links = (data.links || []).map(l => {
      const from = design.nodes.find(n => n.label === l.fromLabel)?.id || l.from || labelToId.get(l.fromLabel);
      const to = design.nodes.find(n => n.label === l.toLabel)?.id || l.to || labelToId.get(l.toLabel);
      if (!from || !to) return null;
      return { id: l.id || uid(), from, to, media: l.media || "cat6", label: l.label || "Link", length: l.length || "3m", fromPort: l.fromPort || "", toPort: l.toPort || "" };
    }).filter(Boolean);
    if (data.rooms) design.rooms = data.rooms.map(r => ({ ...r, id: r.id || uid() }));
    return true;
  }

  function autoLayoutNetwork(design) {
    const nodes = design.nodes.filter(n => n.canvas !== "room");
    const byLayer = {};
    nodes.forEach(n => { (byLayer[n.layer || "access"] ||= []).push(n); });
    let col = 0;
    LAYERS.forEach(layer => {
      const group = byLayer[layer];
      if (!group) return;
      group.forEach((n, i) => {
        n.x = 80 + col * 200; n.y = (LAYER_Y[layer] || 200) + i * 90;
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
      this.presentation = false; this.showPorts = true; this.showMinimap = true;
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
          <button type="button" class="ds-btn" id="ds-import-stack">Import Stack</button>
          <button type="button" class="ds-btn" id="ds-export-svg">SVG</button>
          <button type="button" class="ds-btn warn" id="ds-export-pack">Export Pack</button>
          <button type="button" class="ds-btn" id="ds-ai-design">Ask AI</button>
          <button type="button" class="ds-btn primary" id="ds-close">Close</button>
        </header>
        <div id="ds-body">
          <div id="ds-main">
            <div id="ds-intent" hidden>
              <h3 style="margin:0 0 8px;font-size:14px;color:var(--accent)">Describe the opportunity</h3>
              <textarea id="ds-intent-text" placeholder="200-bed hospital, redundant core, SD-WAN at 8 branches, 12 conference rooms with Room Kit EQ…"></textarea>
              <div class="ds-templates" id="ds-templates"></div>
              <p style="font-size:11px;color:var(--muted);margin:8px 0 4px">Reference architectures — open <strong>Gallery</strong> for full library</p>
              <div class="ds-arch-row" id="ds-arch-presets"></div>
              <div style="display:flex;gap:8px;margin:12px 0;flex-wrap:wrap">
                <button type="button" class="ds-btn primary" id="ds-generate">Generate Draft</button>
                <button type="button" class="ds-btn" id="ds-import-json">Apply AI JSON</button>
                <button type="button" class="ds-btn" id="ds-clear">Clear</button>
              </div>
              <label style="font-size:11px;color:var(--muted)">Paste AI JSON response</label>
              <textarea id="ds-json-import" class="ds-json-area" placeholder='{"nodes":[...],"links":[...]}'></textarea>
            </div>
            <div id="ds-canvas-wrap" class="network-mode">
              <div id="ds-floorplan"></div>
              <div id="ds-toolbar"></div>
              <div id="ds-minimap"><svg id="ds-minimap-svg"></svg></div>
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
      this.wireEvents();
      this.populateTemplates();
      this.populateArchPresets();
      this.buildGallery();
    }

    buildToolbar() {
      const tb = document.getElementById("ds-toolbar");
      tb.innerHTML = `
        <select id="ds-layer-filter"><option value="all">All layers</option></select>
        <select id="ds-link-media"></select>
        <select id="ds-room-template"><option value="">+ Room template…</option></select>
        <button type="button" id="ds-link-mode">Link: off</button>
        <button type="button" id="ds-ports" class="active">Ports: on</button>
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
      $("ds-import-json").onclick = () => this.runJsonImport();
      $("ds-clear").onclick = () => { if (confirm("Clear design?")) { this.design = emptyDesign(this.design.account); this.pushHistory(); this.render(); } };
      $("ds-import-stack").onclick = () => this.importStack();
      $("ds-export-pack").onclick = () => this.exportPack();
      $("ds-export-svg").onclick = () => this.exportSvg();
      $("ds-ai-design").onclick = () => this.askAi();
      $("ds-undo").onclick = () => this.history.undo();
      $("ds-redo").onclick = () => this.history.redo();
      $("ds-link-mode").onclick = () => this.toggleLinkMode();
      $("ds-ports").onclick = () => { this.showPorts = !this.showPorts; $("ds-ports").classList.toggle("active", this.showPorts); $("ds-ports").textContent = "Ports: " + (this.showPorts ? "on" : "off"); this.renderCanvas(); };
      $("ds-delete-sel").onclick = () => this.deleteSelected();
      $("ds-dup").onclick = () => this.duplicateSelected();
      $("ds-fit").onclick = () => this.fitView();
      $("ds-auto-layout").onclick = () => { autoLayoutNetwork(this.design); this.pushHistory(); this.render(); };
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
        if (e.key === "/") { e.preventDefault(); $("ds-palette-search")?.focus(); }
        if (e.key === "Escape") { if (document.getElementById("ds-gallery-modal")?.hidden === false) this.closeGallery(); else this.close(); }
      });
    }

    populateTemplates() {
      const tpls = [
        "200-bed hospital, redundant core, ISE, 12 conference rooms Room Kit EQ",
        "SD-WAN HQ + 8 branches with Secure Firewall and Catalyst Center",
        "24 huddle rooms Room Bar, PoE switch per room",
        "DC spine-leaf VXLAN, UCS compute, border firewall",
        "K-12 district hub, 9179F in gymnasiums, Umbrella",
        "Retail 50 stores Meraki MX SD-WAN MR57",
        "Zero trust SASE with Umbrella and Duo",
        "Boardroom 14 seats Room Kit Pro, dual display, ceiling mics"
      ];
      const box = document.getElementById("ds-templates");
      tpls.forEach(t => {
        const b = document.createElement("button"); b.type = "button"; b.className = "ds-tpl"; b.textContent = t;
        b.onclick = () => { document.getElementById("ds-intent-text").value = t; };
        box.appendChild(b);
      });
    }

    populateArchPresets() {
      const box = document.getElementById("ds-arch-presets");
      const nets = TPL()?.NETWORK_TEMPLATES || {};
      Object.entries(nets).slice(0, 6).forEach(([key, preset]) => {
        const b = document.createElement("button"); b.type = "button"; b.className = "ds-tpl"; b.textContent = "+ " + preset.label;
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
      this.pushHistory(); this.setTab("network"); this.fitView();
      this.toast("Added " + tpl.label);
    }

    addRoomTemplate(tplKey) {
      const tpl = TPL()?.ROOM_TEMPLATES?.[tplKey];
      if (!tpl) return;
      const roomId = uid();
      const name = `${tpl.name} ${this.design.rooms.length + 1}`;
      this.design.rooms.push({ id: roomId, name, template: tplKey, width: tpl.w, height: tpl.h });
      const ox = 60 + (this.design.rooms.length % 2) * (tpl.w + 80);
      const oy = 60 + Math.floor(this.design.rooms.length / 2) * (tpl.h + 80);
      applyRoomTemplateToDesign(this.design, tplKey, roomId, name, ox, oy, this.design.nodes, this.design.links);
      this.pushHistory(); this.setTab("room"); this.render();
      this.toast("Added " + tpl.name);
    }

    togglePresentation() {
      this.presentation = !this.presentation;
      this.el.classList.toggle("ds-present-mode", this.presentation);
      document.getElementById("ds-present").classList.toggle("active", this.presentation);
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
      ["ds-snap", "ds-layers-band", "ds-ports"].forEach(id => document.getElementById(id)?.classList.add("active"));
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
      this.toast(`Draft generated · Score ${computeScore(this.design)}/100`);
      this.setTab("network"); this.fitView();
    }

    runJsonImport() {
      const raw = document.getElementById("ds-json-import").value.trim();
      if (!raw) { this.toast("Paste JSON first"); return; }
      if (applyJsonDesign(raw, this.design)) { this.pushHistory(); this.render(); this.toast("AI JSON applied"); }
      else this.toast("Invalid JSON");
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
        this.toast("AI prompt sent — paste JSON and Apply");
        this.setTab("intent");
      } else this.toast("Configure AI assistant first");
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
      const bbox = vp.getBBox?.() || { x: 0, y: 0, width: 1200, height: 800 };
      const svg = `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="${bbox.x - 20} ${bbox.y - 20} ${bbox.width + 40} ${bbox.height + 40}">${clone.innerHTML}</svg>`;
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
      return this.showPorts && (this.linkMode || this.selectedNode === n.id);
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
        if (this.layerFilter !== "all" && n.layer !== this.layerFilter) return false;
        return true;
      });
    }

    render() {
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
      document.getElementById("ds-status-right").textContent = `v3 · ${this.design.account}`;
    }

    renderPalette() {
      const grid = document.getElementById("ds-stencil-grid");
      NETWORK_STENCILS = buildNetworkStencils();
      ROOM_STENCILS = buildRoomStencils();
      let stencils = this.tab === "room" ? ROOM_STENCILS : NETWORK_STENCILS;
      if (this.paletteFilter) stencils = stencils.filter(s => (s.label + s.id + (s.pid || "")).toLowerCase().includes(this.paletteFilter));
      grid.innerHTML = stencils.slice(0, 72).map(s => {
        const def = STN()?.getDef?.(s.id, this.tab === "room" ? "room" : "network");
        const shape = def?.shape || "switch";
        return `<div class="ds-stencil" draggable="true" data-stencil="${s.id}" title="${escapeHtml(s.label)} · ${escapeHtml(s.pid || "")}">
          <span class="ds-st-icon ds-shape-${shape}">${s.icon || "▣"}</span>${escapeHtml(s.label.slice(0, 14))}</div>`;
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
      const seen = new Set();
      let html = "";
      this.design.rooms.forEach(room => {
        const tpl = TPL()?.ROOM_TEMPLATES?.[room.template];
        if (!tpl?.zones || seen.has(room.id)) return;
        seen.add(room.id);
        const roomNodes = this.design.nodes.filter(n => n.roomId === room.id);
        if (!roomNodes.length) return;
        const minX = Math.min(...roomNodes.map(n => n.x)) - 20;
        const minY = Math.min(...roomNodes.map(n => n.y)) - 20;
        Object.entries(tpl.zones).forEach(([name, z]) => {
          const label = String(name).toUpperCase();
          html += `<g class="ds-zone" data-room="${room.id}" data-zone="${escapeAttr(name)}" transform="translate(${minX + z.x},${minY + z.y})">
            <rect class="ds-zone-rect" width="${z.w}" height="${z.h}" rx="8"/>
            <text class="ds-zone-label-text" x="8" y="14">${escapeHtml(label)}</text>
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
      const roomNodes = this.design.nodes.filter(n => n.roomId === roomId);
      if (!roomNodes.length) return;
      const minX = Math.min(...roomNodes.map(n => n.x)) - 20;
      const minY = Math.min(...roomNodes.map(n => n.y)) - 20;
      document.querySelectorAll(`#ds-room-zones .ds-zone[data-room="${roomId}"]`).forEach(el => {
        const name = el.dataset.zone;
        const z = tpl.zones[name];
        if (z) el.setAttribute("transform", `translate(${minX + z.x},${minY + z.y})`);
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
        const path = orthPath(a.x, a.y, b.x, b.y);
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 - 6;
        g.querySelector(".ds-link-path")?.setAttribute("d", path);
        const labels = g.querySelectorAll(".ds-link-label");
        if (labels[0]) { labels[0].setAttribute("x", mx); labels[0].setAttribute("y", my); }
        if (labels[1]) { labels[1].setAttribute("x", mx); labels[1].setAttribute("y", my + 10); }
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
      this.renderRoomZones();
      const nodes = this.visibleNodes();
      const nodeIds = new Set(nodes.map(n => n.id));
      const links = this.design.links.filter(l => nodeIds.has(l.from) && nodeIds.has(l.to));

      const bandsG = document.getElementById("ds-layer-bands");
      if (this.tab === "network" && this.design.showLayerBands !== false) {
        bandsG.innerHTML = LAYERS.map(layer => {
          const y = (LAYER_Y[layer] || 200) - 30;
          return `<rect class="ds-layer-band" x="0" y="${y}" width="2400" height="70"/>
            <text class="ds-layer-title" x="8" y="${y + 16}">${LAYER_LABELS[layer]}</text>`;
        }).join("");
      } else bandsG.innerHTML = "";

      const linksG = document.getElementById("ds-links");
      linksG.innerHTML = links.map(l => {
        const { a, b } = this.linkEndpoints(l);
        const sel = this.selectedLink === l.id ? " selected" : "";
        const path = orthPath(a.x, a.y, b.x, b.y);
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 - 6;
        const media = MEDIA_TYPES.find(m => m.id === l.media);
        const portLbl = l.fromPort && l.toPort ? `${l.fromPort}→${l.toPort}` : "";
        return `<g class="ds-link${sel}" data-link="${l.id}">
          <path class="ds-link-path${sel}" d="${path}" marker-end="url(#ds-arrow)"/>
          <text class="ds-link-label" x="${mx}" y="${my}">${escapeHtml(l.label || "")} ${escapeHtml(portLbl)}</text>
          <text class="ds-link-label" x="${mx}" y="${my + 10}" font-size="8">${escapeHtml(media?.label?.slice(0, 12) || "")}</text>
        </g>`;
      }).join("");

      if (!document.getElementById("ds-arrow-def")) {
        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        defs.id = "ds-arrow-def";
        defs.innerHTML = `<marker id="ds-arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 Z" fill="#8899aa"/></marker>`;
        document.getElementById("ds-svg").prepend(defs);
      }

      const nodesG = document.getElementById("ds-nodes");
      const mode = this.tab === "room" ? "room" : "network";
      nodesG.innerHTML = nodes.map(n => {
        const sel = this.selectedNode === n.id ? " selected" : "";
        const def = STN()?.getDef?.(n.stencilId, mode);
        const w = n.w || def?.w || 76, h = n.h || def?.h || 46;
        const qty = n.qty > 1 ? ` ×${n.qty}` : "";
        const svgInner = STN()?.renderDeviceSvg?.(def, w, h, sel) || `<rect class="ds-node-box" width="${w}" height="${h}" rx="6"/>`;
        const ports = this.showPortsOnNode(n) ? STN()?.renderPorts?.(n, mode, this.linkFrom === n.id ? this.linkFromPort : null) || "" : "";
        return `<g class="ds-node${sel}" data-node="${n.id}" transform="translate(${n.x},${n.y})">
          ${svgInner}
          <rect class="ds-node-hit" width="${w}" height="${h}" rx="6" fill="transparent"/>
          <text class="ds-node-label" x="${w/2}" y="${h - 8}" text-anchor="middle">${escapeHtml((n.label || "").slice(0, 20) + qty)}</text>
          <text class="ds-node-sub" x="${w/2}" y="${h - 1}" text-anchor="middle">${escapeHtml((n.pid || "").slice(0, 16))}</text>
          ${n.layer && this.tab === "network" ? `<text class="ds-node-layer" x="4" y="10">${escapeHtml(LAYER_LABELS[n.layer]?.slice(0, 10) || n.layer)}</text>` : ""}
          <g class="ds-ports">${ports}</g>
        </g>`;
      }).join("");

      linksG.querySelectorAll(".ds-link").forEach(el => {
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
          if (prev !== id) this.renderCanvas();
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
      box.innerHTML = `<div class="ds-empty">Select device or link · L link · / search · P present · F fit</div>`;
    }

    renderPanel() {
      const body = document.getElementById("ds-panel-body");
      if (this.panelTab === "bom") {
        const bom = computeBom(this.design);
        body.innerHTML = bom.length ? `
          <table class="ds-table"><thead><tr><th>Type</th><th>PID</th><th>Qty</th></tr></thead>
          <tbody>${bom.map(b => `<tr><td>${escapeHtml(b.type)}</td><td title="${escapeAttr(b.desc)}">${escapeHtml(b.pid)}</td><td>${b.qty}</td></tr>`).join("")}</tbody></table>
          <div class="ds-bom-total">${bom.length} lines · ${bom.reduce((s, b) => s + b.qty, 0)} qty</div>
          <div style="padding:8px 12px"><button type="button" class="ds-btn" id="ds-add-bom">+ Manual BOM</button></div>` : `<div class="ds-empty">Generate from Intent or Gallery</div>`;
        document.getElementById("ds-add-bom")?.addEventListener("click", () => {
          const pid = prompt("PID:"); if (!pid) return;
          (this.design.bomOverrides ||= []).push({ pid, desc: prompt("Desc:", pid) || pid, qty: parseInt(prompt("Qty:", "1") || "1", 10), type: "manual" });
          this.pushHistory(); this.renderPanel();
        });
      } else if (this.panelTab === "cables") {
        const cables = computeCables(this.design);
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
      const pad = 80, w = Math.max(...xs) - Math.min(...xs) + pad * 2, h = Math.max(...ys) - Math.min(...ys) + pad * 2;
      this.pan.zoom = Math.max(0.25, Math.min(rect.width / w, rect.height / h, 1.4));
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

/**
 * Design Studio — Network Path Walkthrough (Three.js corridors + Doom-style raycaster)
 */
(function () {
  "use strict";

  const THREE_URL = "vendor/three.module.min.js";
  const MEDIA_COLORS = {
    cat6: 0xd4a060, cat6a: 0xe8b870, hdmi: 0x5ce0a8, usb: 0x44cc88,
    "fiber-sm": 0x6eb8ff, "fiber-mm": 0x6eb8ff, speaker: 0xc8a0e8, control: 0xc8a0e8
  };
  const ZONE_3D = {
    display: { z: -14, y: 4, spread: 14 },
    ceiling: { z: -7, y: 9, spread: 12 },
    table: { z: 0, y: 2, spread: 10 },
    rack: { z: 12, y: 2.5, spread: 12 },
    wall: { z: -12, y: 5, spread: 12 },
    default: { z: 0, y: 3, spread: 10 }
  };

  const state = {
    studio: null,
    mode: null,
    overlay: null,
    animId: 0,
    THREE: null,
    renderer: null,
    scene: null,
    camera: null,
    keys: {},
    pointerLocked: false,
    yaw: 0,
    pitch: 0,
    pos: { x: 0, y: 1.7, z: 0 },
    chambers: [],
    trace: null,
    doom: null
  };

  function esc(s) {
    return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
  }

  async function loadThree() {
    if (state.THREE) return state.THREE;
    const m = await import(THREE_URL);
    state.THREE = m;
    return m;
  }

  function tplItemForNode(studio, room, node) {
    const tpl = window.__DS_TEMPLATES?.ROOM_TEMPLATES?.[room.template];
    if (!tpl?.items) return null;
    return tpl.items.find(it => it.label === node.label)
      || tpl.items.find(it => it.stencilId === node.stencilId);
  }

  function nodeChamberPos(room, node, item) {
    const zone = item?.zone || "default";
    const zc = ZONE_3D[zone] || ZONE_3D.default;
    const rx = item?.relX ?? 0.5;
    const x = (rx - 0.5) * zc.spread * 2;
    return { x, y: zc.y, z: zc.z };
  }

  function buildRoomGraph(studio) {
    const roomId = studio.activeRoomId;
    const room = studio.design.rooms.find(r => r.id === roomId);
    if (!room) return null;
    const nodes = studio.design.nodes.filter(n => n.roomId === roomId && !window.__DS_STENCILS?.getDef?.(n.stencilId, "room")?.decorative);
    const nodeIds = new Set(nodes.map(n => n.id));
    const links = studio.design.links.filter(l => nodeIds.has(l.from) && nodeIds.has(l.to));
    const chambers = nodes.map(n => {
      const item = tplItemForNode(studio, room, n);
      const def = window.__DS_STENCILS?.getDef?.(n.stencilId, "room");
      const pos = nodeChamberPos(room, n, item);
      return {
        id: n.id,
        label: n.label || def?.label || n.stencilId,
        pid: n.pid || def?.pid || "",
        zone: item?.zone || "default",
        pos,
        color: MEDIA_COLORS.cat6
      };
    });
    const chamberMap = Object.fromEntries(chambers.map(c => [c.id, c]));
    const corridors = links.map(l => {
      const a = chamberMap[l.from];
      const b = chamberMap[l.to];
      if (!a || !b) return null;
      return {
        id: l.id,
        from: a,
        to: b,
        media: l.media || "cat6",
        label: l.label || "Link",
        fromPort: l.fromPort,
        toPort: l.toPort,
        color: MEDIA_COLORS[l.media] || MEDIA_COLORS.cat6
      };
    }).filter(Boolean);
    return { room, chambers, corridors };
  }

  function buildMazeFromGraph(graph) {
    const n = graph.chambers.length;
    const cols = Math.max(3, Math.ceil(Math.sqrt(n * 2)));
    const grid = [];
    const cell = (r, c) => {
      if (!grid[r]) grid[r] = [];
      if (grid[r][c] === undefined) grid[r][c] = 1;
      return grid[r][c];
    };
    const placements = [];
    graph.chambers.forEach((ch, i) => {
      const r = 1 + Math.floor(i / cols) * 4;
      const c = 1 + (i % cols) * 4;
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) cell(r + dr, c + dc) = 0;
      placements.push({ chamber: ch, r, c });
    });
    graph.corridors.forEach(cor => {
      const pa = placements.find(p => p.chamber.id === cor.from.id);
      const pb = placements.find(p => p.chamber.id === cor.to.id);
      if (!pa || !pb) return;
      let r = pa.r, c = pa.c;
      while (r !== pb.r) { r += r < pb.r ? 1 : -1; cell(r, c) = 0; }
      while (c !== pb.c) { c += c < pb.c ? 1 : -1; cell(r, c) = 0; }
    });
    const maxR = grid.length;
    const maxC = Math.max(...grid.map(row => row?.length || 0), cols * 4 + 2);
    for (let r = 0; r < maxR; r++) {
      if (!grid[r]) grid[r] = [];
      for (let c = 0; c < maxC; c++) if (grid[r][c] === undefined) grid[r][c] = 1;
    }
    const spawn = placements[0] || { r: 2, c: 2 };
    return { grid, placements, spawn, corridors: graph.corridors };
  }

  function hudHtml(mode) {
    return `<div class="ds-walk-hud">
      <div class="ds-walk-hud-top">
        <strong class="ds-walk-title">${mode === "retro" ? "⬡ Network Dungeon" : "⬡ Path Walkthrough"}</strong>
        <span class="ds-walk-hint">WASD move · Mouse look · Click to capture · Esc exit</span>
        <button type="button" class="ds-walk-close" title="Exit walkthrough">✕</button>
      </div>
      <div class="ds-walk-hud-mid">
        <button type="button" class="ds-walk-btn" data-action="trace-av">Trace AV path</button>
        <button type="button" class="ds-walk-btn" data-action="trace-poe">Trace PoE bus</button>
        <button type="button" class="ds-walk-btn${mode === "retro" ? " active" : ""}" data-action="mode-retro">Retro</button>
        <button type="button" class="ds-walk-btn${mode === "corridor" ? " active" : ""}" data-action="mode-corridor">Corridor</button>
      </div>
      <div class="ds-walk-status" id="ds-walk-status">Explore the signal paths between devices</div>
    </div>`;
  }

  function bindHud(mode) {
    state.overlay?.querySelector(".ds-walk-close")?.addEventListener("click", () => close());
    state.overlay?.querySelectorAll("[data-action]").forEach(btn => {
      btn.addEventListener("click", () => {
        const a = btn.dataset.action;
        if (a === "mode-retro") switchMode("retro");
        else if (a === "mode-corridor") switchMode("corridor");
        else if (a === "trace-av") startTrace("av");
        else if (a === "trace-poe") startTrace("poe");
      });
    });
  }

  function setStatus(msg) {
    const el = document.getElementById("ds-walk-status");
    if (el) el.textContent = msg;
  }

  function startTrace(kind) {
    const graph = buildRoomGraph(state.studio);
    if (!graph) return;
    const pick = kind === "av"
      ? graph.corridors.find(c => c.media === "hdmi" || c.media === "usb")
      : graph.corridors.find(c => c.media === "cat6" || c.media === "cat6a");
    if (!pick) { setStatus(kind === "av" ? "No AV link in this room" : "No PoE link in this room"); return; }
    state.trace = {
      waypoints: [pick.from.pos, pick.to.pos],
      label: `${pick.label} · ${pick.fromPort || ""} → ${pick.toPort || ""}`,
      t: 0
    };
    setStatus(`Tracing: ${pick.label}`);
  }

  function switchMode(mode) {
    if (mode === state.mode) return;
    const studio = state.studio;
    close(true);
    open(studio, mode);
  }

  function makeCorridorMesh(THREE, a, b, color) {
    const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
    const len = Math.hypot(dx, dy, dz) || 0.1;
    const geo = new THREE.CylinderGeometry(0.35, 0.35, len, 10, 1, true);
    const mat = new THREE.MeshStandardMaterial({
      color, emissive: color, emissiveIntensity: 0.35,
      transparent: true, opacity: 0.85, metalness: 0.4, roughness: 0.35, side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx, dy, dz).normalize());
    return mesh;
  }

  function makeChamber(THREE, ch) {
    const g = new THREE.Group();
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 2.8, 3.2),
      new THREE.MeshStandardMaterial({ color: 0x0a2038, metalness: 0.2, roughness: 0.7, emissive: 0x02c8ff, emissiveIntensity: 0.08 })
    );
    box.position.y = 1.4;
    g.add(box);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.8, 0.06, 8, 24),
      new THREE.MeshBasicMaterial({ color: 0x02c8ff, transparent: true, opacity: 0.5 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.05;
    g.add(ring);
    const plat = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.4, 0.2, 16),
      new THREE.MeshStandardMaterial({ color: 0x1a3050, emissive: 0x0a60ff, emissiveIntensity: 0.15 })
    );
    plat.position.y = 0.1;
    g.add(plat);
    g.position.set(ch.pos.x, 0, ch.pos.z);
    g.userData = { chamber: ch };
    return g;
  }

  async function initCorridor(studio, canvas) {
    const THREE = await loadThree();
    const graph = buildRoomGraph(studio);
    if (!graph?.chambers.length) throw new Error("no-room");

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x040c18, 1);
    state.renderer = renderer;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x040c18, 0.028);
    state.scene = scene;

    const camera = new THREE.PerspectiveCamera(72, 1, 0.1, 200);
    state.camera = camera;

    scene.add(new THREE.AmbientLight(0x406080, 0.9));
    const dir = new THREE.DirectionalLight(0x88ccff, 1.1);
    dir.position.set(8, 20, 6);
    scene.add(dir);
    const rim = new THREE.PointLight(0x02c8ff, 0.8, 40);
    rim.position.set(0, 8, -10);
    scene.add(rim);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.MeshStandardMaterial({ color: 0x081828, metalness: 0.1, roughness: 0.9 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
    const grid = new THREE.GridHelper(80, 40, 0x02c8ff, 0x0c2840);
    grid.material.opacity = 0.25;
    grid.material.transparent = true;
    scene.add(grid);

    graph.chambers.forEach(ch => scene.add(makeChamber(THREE, ch)));
    graph.corridors.forEach(cor => {
      scene.add(makeCorridorMesh(THREE, cor.from.pos, cor.to.pos, cor.color));
    });

    const spawn = graph.chambers.find(c => /switch|9200|9300/i.test(c.label)) || graph.chambers[0];
    state.pos = { x: spawn.pos.x, y: 1.7, z: spawn.pos.z + 4 };
    state.yaw = Math.PI;
    state.pitch = 0;
    state.chambers = graph.chambers;
    resizeCorridor();
  }

  function resizeCorridor() {
    const wrap = state.overlay?.querySelector(".ds-walk-canvas-wrap");
    if (!wrap || !state.renderer || !state.camera) return;
    const w = wrap.clientWidth, h = wrap.clientHeight;
    state.renderer.setSize(w, h, false);
    state.camera.aspect = w / h;
    state.camera.updateProjectionMatrix();
  }

  function updateCorridorCamera() {
    const cam = state.camera;
    if (!cam) return;
    const speed = state.keys["Shift"] ? 0.22 : 0.12;
    const fwd = new state.THREE.Vector3(Math.sin(state.yaw), 0, Math.cos(state.yaw));
    const right = new state.THREE.Vector3(Math.cos(state.yaw), 0, -Math.sin(state.yaw));
    if (state.keys["w"] || state.keys["ArrowUp"]) { state.pos.x += fwd.x * speed; state.pos.z += fwd.z * speed; }
    if (state.keys["s"] || state.keys["ArrowDown"]) { state.pos.x -= fwd.x * speed; state.pos.z -= fwd.z * speed; }
    if (state.keys["a"] || state.keys["ArrowLeft"]) { state.pos.x -= right.x * speed; state.pos.z -= right.z * speed; }
    if (state.keys["d"] || state.keys["ArrowRight"]) { state.pos.x += right.x * speed; state.pos.z += right.z * speed; }

    if (state.trace) {
      const wps = state.trace.waypoints;
      state.trace.t = Math.min(1, state.trace.t + 0.008);
      const t = state.trace.t;
      const ax = wps[0].x, az = wps[0].z, bx = wps[1].x, bz = wps[1].z;
      state.pos.x = ax + (bx - ax) * t;
      state.pos.z = az + (bz - az) * t + 3;
      state.yaw = Math.atan2(bx - ax, bz - az);
      if (t >= 1) {
        setStatus(`Arrived: ${state.trace.label}`);
        state.trace = null;
      }
    }

    cam.position.set(state.pos.x, state.pos.y, state.pos.z);
    const look = new state.THREE.Vector3(
      state.pos.x + Math.sin(state.yaw) * Math.cos(state.pitch),
      state.pos.y + Math.sin(state.pitch),
      state.pos.z + Math.cos(state.yaw) * Math.cos(state.pitch)
    );
    cam.lookAt(look);
  }

  function loopCorridor() {
    updateCorridorCamera();
    state.renderer?.render(state.scene, state.camera);
    state.animId = requestAnimationFrame(loopCorridor);
  }

  /* ── Doom-style raycaster ── */
  function initDoom(studio, canvas) {
    const graph = buildRoomGraph(studio);
    if (!graph?.chambers.length) throw new Error("no-room");
    const maze = buildMazeFromGraph(graph);
    const ctx = canvas.getContext("2d");
    const W = canvas.width = canvas.clientWidth;
    const H = canvas.height = canvas.clientHeight;

    const player = {
      x: maze.spawn.c * 2 + 0.5,
      y: maze.spawn.r * 2 + 0.5,
      dir: 0,
      fov: Math.PI / 3
    };

    state.doom = { ctx, W, H, maze, player, graph, t: 0 };

    state.pos = { x: player.x, y: 1.7, z: player.y };
    state.yaw = player.dir;
  }

  function castRay(maze, px, py, dir) {
    const sin = Math.sin(dir), cos = Math.cos(dir);
    let dist = 0;
    while (dist < 32) {
      dist += 0.04;
      const rx = px + cos * dist, ry = py + sin * dist;
      const gx = Math.floor(rx / 2), gy = Math.floor(ry / 2);
      if (gy < 0 || gx < 0 || gy >= maze.grid.length || gx >= (maze.grid[0]?.length || 0)) return dist;
      if (maze.grid[gy][gx] === 1) return dist;
    }
    return 32;
  }

  function renderDoom() {
    const d = state.doom;
    if (!d) return;
    const { ctx, W, H, maze, player } = d;
    d.t += 0.016;

    if (state.keys["w"] || state.keys["ArrowUp"]) {
      const nx = player.x + Math.cos(player.dir) * 0.08;
      const ny = player.y + Math.sin(player.dir) * 0.08;
      if (maze.grid[Math.floor(ny / 2)]?.[Math.floor(nx / 2)] === 0) { player.x = nx; player.y = ny; }
    }
    if (state.keys["s"] || state.keys["ArrowDown"]) {
      const nx = player.x - Math.cos(player.dir) * 0.08;
      const ny = player.y - Math.sin(player.dir) * 0.08;
      if (maze.grid[Math.floor(ny / 2)]?.[Math.floor(nx / 2)] === 0) { player.x = nx; player.y = ny; }
    }
    if (state.keys["a"] || state.keys["ArrowLeft"]) player.dir -= 0.05;
    if (state.keys["d"] || state.keys["ArrowRight"]) player.dir += 0.05;

    if (state.trace) {
      state.trace.t = Math.min(1, state.trace.t + 0.012);
      const target = state.trace.waypoints[1];
      const tx = target.x * 0.5 + 10, ty = target.z * 0.5 + 10;
      const dx = tx - player.x, dy = ty - player.y;
      player.dir = Math.atan2(dy, dx);
      if (Math.hypot(dx, dy) > 0.3) {
        player.x += Math.cos(player.dir) * 0.1;
        player.y += Math.sin(player.dir) * 0.1;
      } else {
        setStatus(`Arrived: ${state.trace.label}`);
        state.trace = null;
      }
    }

    const sky = ctx.createLinearGradient(0, 0, 0, H / 2);
    sky.addColorStop(0, "#0a1830");
    sky.addColorStop(1, "#142840");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H / 2);
    ctx.fillStyle = "#1a2838";
    ctx.fillRect(0, H / 2, W, H / 2);

    const numRays = Math.floor(W / 2);
    for (let i = 0; i < numRays; i++) {
      const rayDir = player.dir - player.fov / 2 + (i / numRays) * player.fov;
      const dist = castRay(maze, player.x, player.y, rayDir);
      const corrected = dist * Math.cos(rayDir - player.dir);
      const wallH = Math.min(H, (H / corrected) * 0.55);
      const shade = Math.max(0.15, 1 - corrected / 14);
      const pulse = 0.85 + 0.15 * Math.sin(d.t * 3 + i * 0.1);
      const r = Math.floor(20 + 80 * shade * pulse);
      const g = Math.floor(60 + 120 * shade * pulse);
      const b = Math.floor(100 + 100 * shade);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(i * 2, (H - wallH) / 2, 2, wallH);
    }

    ctx.fillStyle = "rgba(2,200,255,0.85)";
    ctx.font = "bold 11px system-ui,sans-serif";
    ctx.fillText("NETWORK DUNGEON — follow the copper & fiber", 12, H - 14);

    state.animId = requestAnimationFrame(renderDoom);
  }

  function bindInput(canvas) {
    const onKey = e => {
      state.keys[e.key] = e.type === "keydown";
      if (e.key === "Escape") { e.preventDefault(); close(); }
    };
    const onMove = e => {
      if (!state.pointerLocked) return;
      state.yaw -= e.movementX * 0.002;
      state.pitch = Math.max(-0.6, Math.min(0.6, state.pitch - e.movementY * 0.002));
    };
    const onClick = () => {
      if (state.mode === "corridor") canvas.requestPointerLock?.();
    };
    const onLock = () => { state.pointerLocked = document.pointerLockElement === canvas; };

    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("click", onClick);
    document.addEventListener("pointerlockchange", onLock);
    state._inputCleanup = () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("click", onClick);
      document.removeEventListener("pointerlockchange", onLock);
      document.exitPointerLock?.();
    };
  }

  async function open(studio, mode) {
    if (!studio || studio.tab !== "room") {
      studio?.toast?.("Switch to Room tab first");
      return;
    }
    const graph = buildRoomGraph(studio);
    if (!graph?.chambers.length) {
      studio.toast?.("Add a room template with devices first");
      return;
    }

    mode = mode === "retro" ? "retro" : "corridor";
    state.studio = studio;
    state.mode = mode;

    let overlay = document.getElementById("ds-walk-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "ds-walk-overlay";
      document.getElementById("ds-canvas-wrap")?.appendChild(overlay);
    }
    state.overlay = overlay;
    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");
    overlay.className = `ds-walk-overlay ds-walk-${mode}`;
    overlay.innerHTML = `${hudHtml(mode)}
      <div class="ds-walk-canvas-wrap">
        <canvas id="ds-walk-canvas"></canvas>
      </div>`;
    bindHud(mode);

    const canvas = overlay.querySelector("#ds-walk-canvas");
    bindInput(canvas);

    try {
      if (mode === "retro") {
        initDoom(studio, canvas);
        loopDoom();
      } else {
        await initCorridor(studio, canvas);
        loopCorridor();
      }
      studio.roomView = mode === "retro" ? "retro" : "walk";
      window.__DS_PREMIUM?.renderRoomViewToggle?.(studio);
      setStatus(`${graph.room.name} — ${graph.chambers.length} chambers · ${graph.corridors.length} paths`);
    } catch (err) {
      console.error(err);
      studio.toast?.("Walkthrough failed to load — try Retro mode");
      close();
    }

    state._resize = () => {
      if (state.mode === "corridor") resizeCorridor();
      else if (state.doom) {
        const c = overlay.querySelector("#ds-walk-canvas");
        if (c) { c.width = c.clientWidth; c.height = c.clientHeight; state.doom.W = c.width; state.doom.H = c.height; }
      }
    };
    window.addEventListener("resize", state._resize);
  }

  function loopDoom() {
    renderDoom();
  }

  function close(silent) {
    cancelAnimationFrame(state.animId);
    state._inputCleanup?.();
    if (state._resize) window.removeEventListener("resize", state._resize);
    state.renderer?.dispose?.();
    state.renderer = null;
    state.scene = null;
    state.camera = null;
    state.doom = null;
    state.trace = null;
    state.keys = {};
    if (state.overlay) {
      state.overlay.hidden = true;
      state.overlay.setAttribute("aria-hidden", "true");
      state.overlay.innerHTML = "";
    }
    if (state.studio && !silent) {
      state.studio.roomView = "diagram";
      window.__DS_PREMIUM?.renderRoomViewToggle?.(state.studio);
    }
    state.mode = null;
    if (!silent) state.studio = null;
  }

  function toggle(studio, mode) {
    if (state.mode) close(true);
    else open(studio, mode);
  }

  window.__DS_WALK = { open, close, toggle, isOpen: () => !!state.mode };
})();

/**
 * Design Studio — Network Path Walkthrough (premium 3D + retro maze)
 */
(function () {
  "use strict";

  const CELL = 4;
  const MEDIA_COLORS = {
    cat6: 0xd4a060, cat6a: 0xe8b870, hdmi: 0x5ce0a8, usb: 0x44cc88,
    "fiber-sm": 0x6eb8ff, "fiber-mm": 0x6eb8ff, speaker: 0xc8a0e8, control: 0xc8a0e8
  };
  const ZONE_THEME = {
    display: { color: 0x1a4a38, accent: 0x44cc88, light: 0x5ce0a8 },
    ceiling: { color: 0x2a2048, accent: 0xa080e0, light: 0xc8a0ff },
    table: { color: 0x3a2810, accent: 0xff9933, light: 0xffb366 },
    rack: { color: 0x0a2848, accent: 0x02c8ff, light: 0x4ad4ff },
    wall: { color: 0x1a3050, accent: 0x66aadd, light: 0x88ccff },
    wan: { color: 0x102838, accent: 0x7ee8ff, light: 0xaaeeff },
    security: { color: 0x381028, accent: 0xff8cc4, light: 0xffaadd },
    core: { color: 0x102040, accent: 0x8ab4ff, light: 0xaaccff },
    access: { color: 0x0a2838, accent: 0x7ee8ff, light: 0x99eeff },
    collab: { color: 0x103828, accent: 0x8ee8b8, light: 0xaaffcc },
    default: { color: 0x142838, accent: 0x02c8ff, light: 0x55ddff }
  };
  const ZONE_3D = {
    display: { z: -14, y: 4, spread: 14 },
    ceiling: { z: -7, y: 9, spread: 12 },
    table: { z: 0, y: 2, spread: 10 },
    rack: { z: 12, y: 2.5, spread: 12 },
    wall: { z: -12, y: 5, spread: 12 },
    default: { z: 0, y: 3, spread: 10 }
  };
  const NET_LAYER_Z = { wan: -18, security: -12, core: -6, distribution: 0, dc: 2, access: 8, mgmt: 4, collab: 12 };

  const state = {
    studio: null, mode: null, overlay: null, animId: 0, clock: 0,
    THREE: null, renderer: null, scene: null, camera: null,
    keys: {}, pointerLocked: false, yaw: 0, pitch: 0,
    pos: { x: 0, y: 1.7, z: 0 }, chambers: [], devicePods: [], cables: [],
    trace: null, maze: null, graph: null, texCache: new Map(), disposables: []
  };

  function esc(s) {
    return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
  }

  function zoneTheme(zone) {
    return ZONE_THEME[zone] || ZONE_THEME.default;
  }

  function chamberPhoto(stencilId, canvas) {
    const mode = canvas === "room" ? "room" : "network";
    const def = window.__DS_STENCILS?.getDef?.(stencilId, mode);
    return window.__DS_PHOTOS?.resolveUrl?.(stencilId, def) || null;
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

  function makeChamberBase(studio, n, extra) {
    const def = window.__DS_STENCILS?.getDef?.(n.stencilId, n.canvas === "room" ? "room" : "network");
    const zone = extra?.zone || "default";
    return {
      id: n.id,
      stencilId: n.stencilId,
      label: n.label || def?.label || n.stencilId,
      pid: n.pid || def?.pid || "",
      zone,
      photoUrl: chamberPhoto(n.stencilId, n.canvas),
      pos: extra?.pos || { x: 0, y: 3, z: 0 },
      color: MEDIA_COLORS.cat6
    };
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
      return makeChamberBase(studio, n, { zone: item?.zone || "default", pos: nodeChamberPos(room, n, item) });
    });
    return linkGraph(room, chambers, links, "room");
  }

  function buildNetworkGraph(studio) {
    const nodes = studio.design.nodes.filter(n => {
      if (n.roomId || n.canvas === "room") return false;
      return !window.__DS_STENCILS?.getDef?.(n.stencilId, "network")?.decorative;
    });
    const nodeIds = new Set(nodes.map(n => n.id));
    const links = studio.design.links.filter(l => nodeIds.has(l.from) && nodeIds.has(l.to));
    const chambers = nodes.map(n => {
      const layer = n.layer || "access";
      const lx = { wan: 40, security: 188, core: 336, distribution: 484, dc: 632, access: 780, mgmt: 928, collab: 1076 }[layer] || n.x;
      return makeChamberBase(studio, n, {
        zone: layer,
        pos: { x: (lx - 500) * 0.06, y: 3 + (n.y || 0) * 0.004, z: NET_LAYER_Z[layer] || 0 }
      });
    });
    return linkGraph({ name: "Network topology" }, chambers, links, "network");
  }

  function linkGraph(room, chambers, links, kind) {
    const chamberMap = Object.fromEntries(chambers.map(c => [c.id, c]));
    const corridors = links.map(l => {
      const a = chamberMap[l.from], b = chamberMap[l.to];
      if (!a || !b) return null;
      return {
        id: l.id, from: a, to: b, media: l.media || "cat6",
        label: l.label || "Link", fromPort: l.fromPort, toPort: l.toPort,
        color: MEDIA_COLORS[l.media] || MEDIA_COLORS.cat6
      };
    }).filter(Boolean);
    return { room, chambers, corridors, kind };
  }

  function buildGraph(studio) {
    return studio.tab === "room" ? buildRoomGraph(studio) : buildNetworkGraph(studio);
  }

  function buildMazeFromGraph(graph) {
    const n = graph.chambers.length;
    const cols = Math.max(3, Math.ceil(Math.sqrt(n * 2)));
    const grid = [];
    const carve = (r, c) => { if (!grid[r]) grid[r] = []; grid[r][c] = 0; };
    const placements = [];
    graph.chambers.forEach((ch, i) => {
      const r = 1 + Math.floor(i / cols) * 4;
      const c = 1 + (i % cols) * 4;
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) carve(r + dr, c + dc);
      placements.push({ chamber: ch, r, c });
    });
    graph.corridors.forEach(cor => {
      const pa = placements.find(p => p.chamber.id === cor.from.id);
      const pb = placements.find(p => p.chamber.id === cor.to.id);
      if (!pa || !pb) return;
      let r = pa.r, c = pa.c;
      while (r !== pb.r) { r += r < pb.r ? 1 : -1; carve(r, c); }
      while (c !== pb.c) { c += c < pb.c ? 1 : -1; carve(r, c); }
    });
    const maxR = grid.length;
    const maxC = Math.max(...grid.map(row => row?.length || 0), cols * 4 + 2);
    for (let r = 0; r < maxR; r++) {
      if (!grid[r]) grid[r] = [];
      for (let c = 0; c < maxC; c++) if (grid[r][c] === undefined) grid[r][c] = 1;
    }
    return { grid, placements, spawn: placements[0] || { r: 2, c: 2 }, corridors: graph.corridors };
  }

  function sizeWalkCanvas(canvas) {
    const wrap = canvas.closest(".ds-walk-canvas-wrap") || canvas.parentElement;
    const rect = wrap?.getBoundingClientRect();
    const w = Math.max(Math.floor(rect?.width || wrap?.clientWidth || 800), 320);
    const h = Math.max(Math.floor(rect?.height || wrap?.clientHeight || 480), 260);
    canvas.width = w;
    canvas.height = h;
    return { w, h };
  }

  function waitForCanvasSize(canvas, maxTries = 30) {
    return new Promise(resolve => {
      let tries = 0;
      const tick = () => {
        const wrap = canvas.closest(".ds-walk-canvas-wrap") || canvas.parentElement;
        if ((wrap?.clientWidth || 0) > 48 && (wrap?.clientHeight || 0) > 48) return resolve(sizeWalkCanvas(canvas));
        if (++tries >= maxTries) return resolve(sizeWalkCanvas(canvas));
        requestAnimationFrame(tick);
      };
      tick();
    });
  }

  async function loadThree() {
    if (state.THREE) return state.THREE;
    if (window.__cpnWalkTHREE) { state.THREE = window.__cpnWalkTHREE; return state.THREE; }
    for (let i = 0; i < 40; i++) {
      if (window.__cpnWalkTHREE) { state.THREE = window.__cpnWalkTHREE; return state.THREE; }
      await new Promise(r => setTimeout(r, 50));
    }
    const url = new URL("vendor/three.module.min.js", document.baseURI).href;
    state.THREE = await import(/* @vite-ignore */ url);
    window.__cpnWalkTHREE = state.THREE;
    return state.THREE;
  }

  async function loadTexture(THREE, url) {
    if (!url) return null;
    if (state.texCache.has(url)) return state.texCache.get(url);
    const loader = new THREE.TextureLoader();
    try {
      const tex = await loader.loadAsync(url);
      if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      state.texCache.set(url, tex);
      state.disposables.push(tex);
      return tex;
    } catch {
      return null;
    }
  }

  function makeCanvasTexture(THREE, drawFn, w = 512, h = 128) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    drawFn(canvas.getContext("2d"), w, h);
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 4;
    state.disposables.push(tex);
    return tex;
  }

  function makeFallbackIconTexture(THREE, label, theme) {
    return makeCanvasTexture(THREE, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#0c2840");
      g.addColorStop(1, "#142838");
      ctx.fillStyle = g;
      roundRect(ctx, 8, 8, w - 16, h - 16, 14);
      ctx.fill();
      ctx.strokeStyle = "#" + theme.accent.toString(16).padStart(6, "0");
      ctx.lineWidth = 3;
      roundRect(ctx, 8, 8, w - 16, h - 16, 14);
      ctx.stroke();
      ctx.fillStyle = "#e8f4ff";
      ctx.font = "bold 28px system-ui,sans-serif";
      ctx.textAlign = "center";
      ctx.fillText((label || "?").slice(0, 14), w / 2, h / 2 + 6);
    }, 256, 160);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function makeLabelSprite(THREE, title, subtitle, theme) {
    const tex = makeCanvasTexture(THREE, (ctx, w, h) => {
      ctx.fillStyle = "rgba(4,16,31,0.92)";
      roundRect(ctx, 4, 4, w - 8, h - 8, 10);
      ctx.fill();
      ctx.strokeStyle = "rgba(2,200,255,0.45)";
      ctx.lineWidth = 2;
      roundRect(ctx, 4, 4, w - 8, h - 8, 10);
      ctx.stroke();
      ctx.fillStyle = "#f0f8ff";
      ctx.font = "bold 22px system-ui,sans-serif";
      ctx.textAlign = "center";
      ctx.fillText((title || "").slice(0, 22), w / 2, 42);
      if (subtitle) {
        ctx.fillStyle = "#9ec0dc";
        ctx.font = "600 16px system-ui,sans-serif";
        ctx.fillText(subtitle.slice(0, 24), w / 2, 72);
      }
      const accent = "#" + theme.accent.toString(16).padStart(6, "0");
      ctx.fillStyle = accent;
      ctx.fillRect(16, h - 18, w - 32, 4);
    }, 512, 96);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(3.6, 0.68, 1);
    sprite.renderOrder = 10;
    state.disposables.push(mat);
    return sprite;
  }

  async function makeDevicePod(THREE, ch, scale = 1) {
    const theme = zoneTheme(ch.zone);
    const g = new THREE.Group();
    g.userData = { chamber: ch, kind: "pod" };

    const plat = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5 * scale, 1.75 * scale, 0.18 * scale, 24),
      new THREE.MeshStandardMaterial({ color: theme.color, metalness: 0.55, roughness: 0.35, emissive: theme.accent, emissiveIntensity: 0.12 })
    );
    plat.position.y = 0.09 * scale;
    g.add(plat);

    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(2.6 * scale, 0.35 * scale, 1.6 * scale),
      new THREE.MeshStandardMaterial({ color: 0x0a1828, metalness: 0.7, roughness: 0.25 })
    );
    pillar.position.y = 0.35 * scale;
    g.add(pillar);

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(2.5 * scale, 1.65 * scale, 0.12 * scale),
      new THREE.MeshStandardMaterial({ color: 0x1a3050, metalness: 0.8, roughness: 0.2, emissive: theme.accent, emissiveIntensity: 0.06 })
    );
    frame.position.set(0, 1.35 * scale, 0.82 * scale);
    g.add(frame);

    let photoTex = await loadTexture(THREE, ch.photoUrl);
    if (!photoTex) photoTex = makeFallbackIconTexture(THREE, ch.label, theme);
    const photo = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2 * scale, 1.4 * scale),
      new THREE.MeshStandardMaterial({ map: photoTex, metalness: 0.15, roughness: 0.45, emissive: 0x111111, emissiveIntensity: 0.15 })
    );
    photo.position.set(0, 1.35 * scale, 0.9 * scale);
    g.add(photo);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.65 * scale, 0.05 * scale, 8, 32),
      new THREE.MeshBasicMaterial({ color: theme.accent, transparent: true, opacity: 0.65 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.04 * scale;
    g.add(ring);

    const glow = new THREE.PointLight(theme.light, 0.9 * scale, 8 * scale);
    glow.position.set(0, 1.8 * scale, 0.5 * scale);
    g.add(glow);

    const label = makeLabelSprite(THREE, ch.label, ch.pid, theme);
    label.position.set(0, 2.55 * scale, 0);
    g.add(label);

    const zoneBadge = makeLabelSprite(THREE, (ch.zone || "device").toUpperCase(), "", theme);
    zoneBadge.scale.set(1.8 * scale, 0.35 * scale, 1);
    zoneBadge.position.set(0, 0.55 * scale, 1.1 * scale);
    g.add(zoneBadge);

    g.position.set(ch.pos.x, 0, ch.pos.z);
    state.devicePods.push(g);
    return g;
  }

  function makeCableRun(THREE, cor) {
    const a = cor.from.pos, b = cor.to.pos;
    const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
    const len = Math.hypot(dx, dy, dz) || 0.1;
    const g = new THREE.Group();
    const dir = new THREE.Vector3(dx, dy, dz).normalize();

    const outer = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, len, 12, 1, true),
      new THREE.MeshStandardMaterial({ color: cor.color, emissive: cor.color, emissiveIntensity: 0.2, transparent: true, opacity: 0.35, metalness: 0.5, roughness: 0.4, side: THREE.DoubleSide })
    );
    outer.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
    outer.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    g.add(outer);

    const core = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, len, 10),
      new THREE.MeshStandardMaterial({ color: cor.color, emissive: cor.color, emissiveIntensity: 0.85, metalness: 0.3, roughness: 0.2 })
    );
    core.position.copy(outer.position);
    core.quaternion.copy(outer.quaternion);
    g.add(core);

    const pulse = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 })
    );
    pulse.userData = { cable: true, a, b, t: Math.random() };
    g.add(pulse);

    g.userData = { corridor: cor };
    state.cables.push(g);
    return g;
  }

  function addEnvironment(THREE, scene, dark = false) {
    scene.fog = new THREE.FogExp2(dark ? 0x020810 : 0x040c18, dark ? 0.045 : 0.028);
    scene.add(new THREE.HemisphereLight(0x88aacc, 0x081018, dark ? 0.55 : 0.75));
    const dir = new THREE.DirectionalLight(0x99ccff, dark ? 0.7 : 1.0);
    dir.position.set(10, 24, 8);
    scene.add(dir);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 120),
      new THREE.MeshStandardMaterial({ color: dark ? 0x060e18 : 0x081828, metalness: 0.35, roughness: 0.75 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
    const grid = new THREE.GridHelper(120, 60, 0x02c8ff, dark ? 0x0a1828 : 0x0c2840);
    grid.material.opacity = dark ? 0.18 : 0.22;
    grid.material.transparent = true;
    scene.add(grid);
  }

  async function initCorridor(studio, canvas, graph) {
    const THREE = await loadThree();
    if (!graph?.chambers.length) throw new Error("no-graph");
    state.graph = graph;
    state.devicePods = [];
    state.cables = [];

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x040c18, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace || renderer.outputEncoding;
    state.renderer = renderer;

    const scene = new THREE.Scene();
    state.scene = scene;
    addEnvironment(THREE, scene, false);

    const camera = new THREE.PerspectiveCamera(68, 1, 0.1, 220);
    state.camera = camera;

    const pods = await Promise.all(graph.chambers.map(ch => makeDevicePod(THREE, ch, 1)));
    pods.forEach(p => scene.add(p));
    graph.corridors.forEach(cor => scene.add(makeCableRun(THREE, cor)));

    const spawn = graph.chambers.find(c => /switch|9200|9300/i.test(c.label)) || graph.chambers[0];
    state.pos = { x: spawn.pos.x, y: 1.7, z: spawn.pos.z + 5 };
    state.yaw = Math.PI;
    state.pitch = -0.08;
    state.chambers = graph.chambers;
    resizeRenderer();
  }

  async function initRetroMaze(studio, canvas, graph) {
    const THREE = await loadThree();
    const maze = buildMazeFromGraph(graph);
    state.graph = graph;
    state.maze = maze;
    state.devicePods = [];
    state.cables = [];

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x020810, 1);
    state.renderer = renderer;

    const scene = new THREE.Scene();
    state.scene = scene;
    addEnvironment(THREE, scene, true);

    const camera = new THREE.PerspectiveCamera(72, 1, 0.1, 120);
    state.camera = camera;

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1a3050, metalness: 0.4, roughness: 0.65, emissive: 0x0a1828, emissiveIntensity: 0.15 });
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0x0a1420, metalness: 0.2, roughness: 0.9 });

    for (let r = 0; r < maze.grid.length; r++) {
      for (let c = 0; c < (maze.grid[r]?.length || 0); c++) {
        const wx = c * CELL + CELL / 2;
        const wz = r * CELL + CELL / 2;
        if (maze.grid[r][c] === 1) {
          const wall = new THREE.Mesh(new THREE.BoxGeometry(CELL, 3.2, CELL), wallMat);
          wall.position.set(wx, 1.6, wz);
          scene.add(wall);
        } else {
          const tile = new THREE.Mesh(
            new THREE.PlaneGeometry(CELL * 0.96, CELL * 0.96),
            new THREE.MeshStandardMaterial({ color: 0x0c1c2c, metalness: 0.5, roughness: 0.6, emissive: 0x061018, emissiveIntensity: 0.2 })
          );
          tile.rotation.x = -Math.PI / 2;
          tile.position.set(wx, 0.02, wz);
          scene.add(tile);
          const ceil = new THREE.Mesh(new THREE.PlaneGeometry(CELL * 0.98, CELL * 0.98), ceilMat);
          ceil.rotation.x = Math.PI / 2;
          ceil.position.set(wx, 3.1, wz);
          scene.add(ceil);
        }
      }
    }

    const pods = await Promise.all(maze.placements.map(p => {
      const ch = { ...p.chamber, pos: { x: p.c * CELL + CELL / 2, y: 0, z: p.r * CELL + CELL / 2 } };
      return makeDevicePod(THREE, ch, 0.72);
    }));
    pods.forEach(p => scene.add(p));

    maze.corridors.forEach(cor => {
      const pa = maze.placements.find(p => p.chamber.id === cor.from.id);
      const pb = maze.placements.find(p => p.chamber.id === cor.to.id);
      if (!pa || !pb) return;
      const fake = {
        ...cor,
        from: { pos: { x: pa.c * CELL + CELL / 2, y: 1.2, z: pa.r * CELL + CELL / 2 } },
        to: { pos: { x: pb.c * CELL + CELL / 2, y: 1.2, z: pb.r * CELL + CELL / 2 } }
      };
      scene.add(makeCableRun(THREE, fake));
    });

    const sp = maze.spawn;
    state.pos = { x: sp.c * CELL + CELL / 2, y: 1.65, z: sp.r * CELL + CELL / 2 + 1.2 };
    state.yaw = 0;
    state.pitch = 0;
    state.chambers = graph.chambers;
    document.getElementById("ds-walk-minimap")?.removeAttribute("hidden");
    resizeRenderer();
  }

  function resizeRenderer() {
    const wrap = state.overlay?.querySelector(".ds-walk-canvas-wrap");
    if (!wrap || !state.renderer || !state.camera) return;
    const w = wrap.clientWidth, h = wrap.clientHeight;
    state.renderer.setSize(w, h, false);
    state.camera.aspect = w / h;
    state.camera.updateProjectionMatrix();
  }

  function mazeBlocked(x, z) {
    const m = state.maze;
    if (!m) return false;
    const gx = Math.floor(x / CELL), gz = Math.floor(z / CELL);
    if (gz < 0 || gx < 0 || gz >= m.grid.length || gx >= (m.grid[0]?.length || 0)) return true;
    return m.grid[gz][gx] === 1;
  }

  function tryMove(dx, dz) {
    const r = 0.35;
    const nx = state.pos.x + dx, nz = state.pos.z + dz;
    if (!mazeBlocked(nx + Math.sign(dx) * r, state.pos.z) && !mazeBlocked(nx, state.pos.z + Math.sign(dz) * r)) {
      if (!mazeBlocked(nx, nz)) { state.pos.x = nx; state.pos.z = nz; return; }
    }
    if (!mazeBlocked(nx, state.pos.z)) state.pos.x = nx;
    else if (!mazeBlocked(state.pos.x, nz)) state.pos.z = nz;
  }

  function updatePlayer() {
    const speed = state.keys["Shift"] ? 0.2 : 0.11;
    const fwd = new state.THREE.Vector3(Math.sin(state.yaw), 0, Math.cos(state.yaw));
    const right = new state.THREE.Vector3(Math.cos(state.yaw), 0, -Math.sin(state.yaw));
    let mx = 0, mz = 0;
    if (state.keys["w"] || state.keys["ArrowUp"]) { mx += fwd.x * speed; mz += fwd.z * speed; }
    if (state.keys["s"] || state.keys["ArrowDown"]) { mx -= fwd.x * speed; mz -= fwd.z * speed; }
    if (state.keys["a"] || state.keys["ArrowLeft"]) { mx -= right.x * speed; mz -= right.z * speed; }
    if (state.keys["d"] || state.keys["ArrowRight"]) { mx += right.x * speed; mz += right.z * speed; }

    if (state.mode === "retro") tryMove(mx, mz);
    else { state.pos.x += mx; state.pos.z += mz; }

    if (state.trace) {
      const wps = state.trace.waypoints;
      state.trace.t = Math.min(1, state.trace.t + 0.007);
      const t = state.trace.t;
      const ax = wps[0].x, az = wps[0].z, bx = wps[1].x, bz = wps[1].z;
      state.pos.x = ax + (bx - ax) * t;
      state.pos.z = az + (bz - az) * t + (state.mode === "retro" ? 0 : 3);
      state.yaw = Math.atan2(bx - ax, bz - az);
      if (t >= 1) { setStatus(`Arrived: ${state.trace.label}`); state.trace = null; }
    }

    const cam = state.camera;
    if (!cam) return;
    cam.position.set(state.pos.x, state.pos.y, state.pos.z);
    cam.lookAt(
      state.pos.x + Math.sin(state.yaw) * Math.cos(state.pitch),
      state.pos.y + Math.sin(state.pitch),
      state.pos.z + Math.cos(state.yaw) * Math.cos(state.pitch)
    );
  }

  function animateCables(t) {
    state.cables.forEach(g => {
      g.children.forEach(ch => {
        if (!ch.userData?.cable) return;
        const { a, b } = ch.userData;
        ch.userData.t = (ch.userData.t + 0.012) % 1;
        const u = ch.userData.t;
        ch.position.set(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u, a.z + (b.z - a.z) * u);
      });
    });
    state.devicePods.forEach((pod, i) => {
      const ring = pod.children.find(c => c.geometry?.type === "TorusGeometry");
      if (ring) ring.rotation.z = t * 0.4 + i;
    });
  }

  function updateFocusHud() {
    if (!state.camera || !state.devicePods.length) return;
    const THREE = state.THREE;
    const forward = new THREE.Vector3();
    state.camera.getWorldDirection(forward);
    let best = null, bestDot = 0.55;
    state.devicePods.forEach(pod => {
      const ch = pod.userData?.chamber;
      if (!ch) return;
      const to = new THREE.Vector3(pod.position.x - state.pos.x, 1.4 - state.pos.y, pod.position.z - state.pos.z);
      const dist = to.length();
      if (dist > 14) return;
      to.normalize();
      const dot = forward.dot(to);
      if (dot > bestDot) { bestDot = dot; best = ch; }
    });
    const el = document.getElementById("ds-walk-focus");
    if (!el) return;
    if (best) {
      el.hidden = false;
      el.innerHTML = `<strong>${esc(best.label)}</strong>${best.pid ? `<span>${esc(best.pid)}</span>` : ""}`;
    } else el.hidden = true;
  }

  function drawMinimap() {
    const mm = document.getElementById("ds-walk-minimap");
    const m = state.maze;
    if (!mm || !m || state.mode !== "retro") return;
    const ctx = mm.getContext("2d");
    const W = mm.width = 140, H = mm.height = 100;
    ctx.fillStyle = "rgba(4,16,31,0.92)";
    ctx.fillRect(0, 0, W, H);
    const rows = m.grid.length, cols = m.grid[0]?.length || 1;
    const sx = W / cols, sy = H / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = m.grid[r][c] === 1 ? "#1a3050" : "#0a2030";
        ctx.fillRect(c * sx, r * sy, sx - 0.5, sy - 0.5);
      }
    }
    m.placements.forEach(p => {
      ctx.fillStyle = "#44cc88";
      ctx.fillRect(p.c * sx + 1, p.r * sy + 1, sx * 2 - 2, sy * 2 - 2);
    });
    const px = (state.pos.x / CELL) * sx;
    const py = (state.pos.z / CELL) * sy;
    ctx.fillStyle = "#02c8ff";
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ff9000";
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + Math.sin(state.yaw) * 10, py + Math.cos(state.yaw) * 10);
    ctx.stroke();
  }

  function loop() {
    if (!state.renderer || !state.scene || !state.camera) return;
    state.clock += 0.016;
    updatePlayer();
    animateCables(state.clock);
    updateFocusHud();
    if (state.mode === "retro") drawMinimap();
    state.renderer?.render(state.scene, state.camera);
    state.animId = requestAnimationFrame(loop);
  }

  function hudHtml(mode) {
    return `<div class="ds-walk-hud">
      <div class="ds-walk-hud-top">
        <strong class="ds-walk-title">${mode === "retro" ? "⬡ Network Dungeon" : "⬡ Path Walkthrough"}</strong>
        <span class="ds-walk-hint">WASD move · Click canvas · Mouse look · Esc exit</span>
        <button type="button" class="ds-walk-close" title="Exit walkthrough">✕</button>
      </div>
      <div class="ds-walk-hud-mid">
        <button type="button" class="ds-walk-btn" data-action="trace-av">Trace AV path</button>
        <button type="button" class="ds-walk-btn" data-action="trace-poe">Trace PoE bus</button>
        <button type="button" class="ds-walk-btn${mode === "retro" ? " active" : ""}" data-action="mode-retro">Retro</button>
        <button type="button" class="ds-walk-btn${mode === "corridor" ? " active" : ""}" data-action="mode-corridor">Corridor</button>
      </div>
      <div class="ds-walk-focus" id="ds-walk-focus" hidden></div>
      <div class="ds-walk-status" id="ds-walk-status">Explore the signal paths between devices</div>
    </div>`;
  }

  function bindHud() {
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
    if (el) { el.textContent = msg; el.classList.remove("ds-walk-error"); }
  }

  function chamberWorldPos(ch) {
    if (state.mode === "retro" && state.maze) {
      const p = state.maze.placements.find(x => x.chamber.id === ch.id);
      if (p) return { x: p.c * CELL + CELL / 2, y: 1.2, z: p.r * CELL + CELL / 2 };
    }
    return ch.pos;
  }

  function startTrace(kind) {
    const graph = buildGraph(state.studio);
    if (!graph) return;
    const pick = kind === "av"
      ? graph.corridors.find(c => c.media === "hdmi" || c.media === "usb")
      : graph.corridors.find(c => c.media === "cat6" || c.media === "cat6a" || /fiber/i.test(c.media || ""));
    if (!pick) { setStatus(kind === "av" ? "No AV link in this room" : "No PoE link in this room"); return; }
    state.trace = {
      waypoints: [chamberWorldPos(pick.from), chamberWorldPos(pick.to)],
      label: `${pick.label} · ${pick.fromPort || ""} → ${pick.toPort || ""}`,
      t: 0
    };
    setStatus(`Tracing: ${pick.label}`);
  }

  function switchMode(mode) {
    if (mode === state.mode) return;
    open(state.studio, mode);
  }

  function bindInput(canvas) {
    const onKey = e => {
      state.keys[e.key] = e.type === "keydown";
      if (e.key === "Escape") { e.preventDefault(); close(); }
    };
    const onMove = e => {
      if (!state.pointerLocked) return;
      state.yaw -= e.movementX * 0.0022;
      state.pitch = Math.max(-0.55, Math.min(0.55, state.pitch - e.movementY * 0.0022));
    };
    const onClick = () => canvas.requestPointerLock?.();
    const onLock = () => {
      state.pointerLocked = document.pointerLockElement === canvas;
      state.overlay?.classList.toggle("ds-walk-locked", state.pointerLocked);
    };
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

  function showWalkError(msg) {
    const status = document.getElementById("ds-walk-status");
    if (status) { status.textContent = msg; status.classList.add("ds-walk-error"); }
  }

  function disposeScene() {
    state.disposables.forEach(d => d.dispose?.());
    state.disposables = [];
    state.texCache.clear();
    state.devicePods = [];
    state.cables = [];
    state.renderer?.dispose?.();
    state.renderer = null;
    state.scene = null;
    state.camera = null;
    state.maze = null;
    state.graph = null;
  }

  async function open(studio, mode) {
    if (!studio || (studio.tab !== "room" && studio.tab !== "network")) {
      studio?.toast?.("Open Network or Room tab first");
      return;
    }
    const graph = buildGraph(studio);
    if (!graph?.chambers.length) {
      studio.toast?.(studio.tab === "room" ? "Add a room template with devices first" : "Add network devices first");
      return;
    }

    mode = mode === "retro" ? "retro" : "corridor";
    if (state.mode) close(true);
    state.studio = studio;
    state.mode = mode;

    let overlay = document.getElementById("ds-walk-overlay");
    const wrap = document.getElementById("ds-canvas-wrap");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "ds-walk-overlay";
      wrap?.appendChild(overlay);
    } else if (wrap) wrap.appendChild(overlay);

    state.overlay = overlay;
    overlay.hidden = false;
    overlay.removeAttribute("hidden");
    overlay.setAttribute("aria-hidden", "false");
    overlay.className = `ds-walk-overlay ds-walk-${mode}`;
    overlay.innerHTML = `${hudHtml(mode)}
      <div class="ds-walk-stage">
        <div class="ds-walk-crosshair" aria-hidden="true"></div>
        <canvas id="ds-walk-minimap" class="ds-walk-minimap" hidden></canvas>
        <div class="ds-walk-canvas-wrap">
          <canvas id="ds-walk-canvas"></canvas>
        </div>
      </div>`;
    bindHud();

    const canvas = overlay.querySelector("#ds-walk-canvas");
    bindInput(canvas);
    setStatus("Loading walkthrough…");
    await waitForCanvasSize(canvas);

    try {
      if (mode === "retro") await initRetroMaze(studio, canvas, graph);
      else await initCorridor(studio, canvas, graph);
      loop();
      studio.roomView = mode === "retro" ? "retro" : "walk";
      window.__DS_PREMIUM?.renderRoomViewToggle?.(studio);
      const title = graph.room?.name || "Topology";
      setStatus(`${title} — ${graph.chambers.length} devices · ${graph.corridors.length} links · Click canvas to look around`);
    } catch (err) {
      console.error("[DS Walk]", err);
      showWalkError(err?.message === "three-load" ? "3D library failed to load — hard-refresh" : `Walkthrough failed: ${err.message}`);
      studio.toast?.("Walkthrough failed — see overlay message");
    }

    state._resize = () => resizeRenderer();
    window.addEventListener("resize", state._resize);
  }

  function close(silent) {
    cancelAnimationFrame(state.animId);
    state.animId = 0;
    state._inputCleanup?.();
    if (state._resize) window.removeEventListener("resize", state._resize);
    disposeScene();
    state.trace = null;
    state.keys = {};
    state.pointerLocked = false;
    if (state.overlay) {
      state.overlay.hidden = true;
      state.overlay.setAttribute("aria-hidden", "true");
      state.overlay.innerHTML = "";
    }
    if (state.studio && !silent) {
      state.studio.roomView = "diagram";
      window.__DS_PREMIUM?.renderRoomViewToggle?.(state.studio);
      state.studio.scheduleFitView?.();
    }
    state.mode = null;
    if (!silent) state.studio = null;
  }

  function debugStats() {
    return {
      mode: state.mode,
      pods: state.devicePods.length,
      cables: state.cables.length,
      hasRenderer: !!state.renderer,
      photos: state.devicePods.filter(p => p.userData?.chamber?.photoUrl).length
    };
  }

  window.__DS_WALK = { open, close, toggle: (s, m) => state.mode ? close(true) : open(s, m), isOpen: () => !!state.mode, debugStats };
})();

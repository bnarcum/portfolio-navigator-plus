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
    studio: null, mode: null, overlay: null, animId: 0, clock: 0, lastFrame: 0,
    THREE: null, renderer: null, scene: null, camera: null, raycaster: null,
    keys: {}, pointerLocked: false, lookDrag: false, lookLast: { x: 0, y: 0 },
    yaw: 0, pitch: 0, vel: { x: 0, z: 0 },
    pos: { x: 0, y: 1.7, z: 0 }, fly: null,
    chambers: [], devicePods: [], cables: [], colliders: [], bounds: null,
    trace: null, maze: null, graph: null, texCache: new Map(), disposables: [],
    focusId: null, navIndex: 0, mission: null, waypointGroup: null, nearChamber: null
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
    state.colliders.push({ x: ch.pos.x, z: ch.pos.z, r: 2.1 * scale, id: ch.id });
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
    scene.add(new THREE.HemisphereLight(0x99bbdd, 0x081018, dark ? 0.6 : 0.85));
    const dir = new THREE.DirectionalLight(0xaaddff, dark ? 0.85 : 1.15);
    dir.position.set(10, 24, 8);
    scene.add(dir);
    const rim = new THREE.DirectionalLight(0x02c8ff, dark ? 0.25 : 0.35);
    rim.position.set(-12, 8, -14);
    scene.add(rim);
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
    state.colliders = [];

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
    state.raycaster = new THREE.Raycaster();

    const pods = await Promise.all(graph.chambers.map(ch => makeDevicePod(THREE, ch, 1)));
    pods.forEach(p => scene.add(p));
    graph.corridors.forEach(cor => scene.add(makeCableRun(THREE, cor)));

    const xs = graph.chambers.map(c => c.pos.x);
    const zs = graph.chambers.map(c => c.pos.z);
    state.bounds = {
      minX: Math.min(...xs) - 8, maxX: Math.max(...xs) + 8,
      minZ: Math.min(...zs) - 8, maxZ: Math.max(...zs) + 8
    };

    const spawn = graph.chambers.find(c => /switch|9200|9300/i.test(c.label)) || graph.chambers[0];
    teleportToChamber(spawn, true);
    state.chambers = graph.chambers;
    state.navIndex = graph.chambers.indexOf(spawn);
    document.getElementById("ds-walk-minimap")?.removeAttribute("hidden");
    buildDeviceNav(graph.chambers);
    resizeRenderer();
  }

  async function initRetroMaze(studio, canvas, graph) {
    const THREE = await loadThree();
    const maze = buildMazeFromGraph(graph);
    state.graph = graph;
    state.maze = maze;
    state.devicePods = [];
    state.cables = [];
    state.colliders = [];

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x020810, 1);
    state.renderer = renderer;

    const scene = new THREE.Scene();
    state.scene = scene;
    addEnvironment(THREE, scene, true);

    const camera = new THREE.PerspectiveCamera(72, 1, 0.1, 120);
    state.camera = camera;
    state.raycaster = new THREE.Raycaster();

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
    const spawnCh = maze.placements.find(p => p.r === sp.r && p.c === sp.c)?.chamber || graph.chambers[0];
    teleportToChamber(spawnCh, true);
    state.chambers = graph.chambers;
    state.navIndex = graph.chambers.indexOf(spawnCh);
    document.getElementById("ds-walk-minimap")?.removeAttribute("hidden");
    buildDeviceNav(graph.chambers);
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

  function chamberStandPos(ch) {
    const p = chamberWorldPos(ch);
    return { x: p.x, y: state.mode === "retro" ? 1.65 : 1.7, z: p.z + 3.2 };
  }

  function faceChamber(ch) {
    const p = chamberWorldPos(ch);
    state.yaw = Math.atan2(p.x - state.pos.x, p.z - state.pos.z);
    state.pitch = -0.06;
  }

  function teleportToChamber(ch, instant) {
    if (!ch) return;
    const dest = chamberStandPos(ch);
    state.navIndex = Math.max(0, state.chambers.indexOf(ch));
    highlightNavChip(ch.id);
    if (instant) {
      state.pos = { ...dest };
      state.vel = { x: 0, z: 0 };
      faceChamber(ch);
      state.fly = null;
    } else {
      state.fly = {
        from: { ...state.pos },
        to: dest,
        yawFrom: state.yaw,
        yawTo: Math.atan2(chamberWorldPos(ch).x - dest.x, chamberWorldPos(ch).z - dest.z),
        t: 0,
        dur: 0.65,
        chamber: ch
      };
      state.vel = { x: 0, z: 0 };
    }
    setStatus(`At ${ch.label}${ch.pid ? " · " + ch.pid : ""}`);
    const ping = window.__DS_MISSIONS?.onVisit?.(state.mission, state.graph, ch.id, ch);
    if (ping) window.__DS_MISSIONS?.toastObjective?.("Device inspected");
    window.__DS_MISSIONS?.renderHud?.(state.mission);
    window.__DS_MISSIONS?.syncWaypoints?.(state, state.mission, state.graph);
  }

  function cycleDevice(dir) {
    if (!state.chambers.length) return;
    state.navIndex = (state.navIndex + dir + state.chambers.length) % state.chambers.length;
    teleportToChamber(state.chambers[state.navIndex], false);
  }

  function buildDeviceNav(chambers) {
    const bar = document.getElementById("ds-walk-devices");
    if (!bar) return;
    bar.innerHTML = chambers.map((ch, i) => {
      const theme = zoneTheme(ch.zone);
      const accent = "#" + theme.accent.toString(16).padStart(6, "0");
      return `<button type="button" class="ds-walk-dev${i === state.navIndex ? " active" : ""}" data-chamber="${ch.id}" title="${esc(ch.label)}${ch.pid ? " · " + ch.pid : ""}">
        <i style="background:${accent}"></i><span>${esc(ch.label.slice(0, 16))}</span></button>`;
    }).join("");
    bar.querySelectorAll("[data-chamber]").forEach(btn => {
      btn.addEventListener("click", () => {
        const ch = chambers.find(c => c.id === btn.dataset.chamber);
        teleportToChamber(ch, false);
      });
    });
  }

  function highlightNavChip(id) {
    document.querySelectorAll(".ds-walk-dev").forEach(el => {
      el.classList.toggle("active", el.dataset.chamber === id);
    });
    state.focusId = id;
    state.devicePods.forEach(pod => {
      const on = pod.userData?.chamber?.id === id;
      pod.scale.setScalar(on ? 1.06 : 1);
      const ring = pod.children.find(c => c.geometry?.type === "TorusGeometry");
      if (ring?.material) ring.material.opacity = on ? 1 : 0.55;
    });
  }

  function minimapTeleport(mx, my, mmW, mmH) {
    if (state.mode === "retro" && state.maze) {
      const m = state.maze;
      const cols = m.grid[0]?.length || 1;
      const rows = m.grid.length;
      const c = Math.floor((mx / mmW) * cols);
      const r = Math.floor((my / mmH) * rows);
      if (m.grid[r]?.[c] !== 0) return;
      state.pos.x = c * CELL + CELL / 2;
      state.pos.z = r * CELL + CELL / 2;
      state.vel = { x: 0, z: 0 };
      return;
    }
    if (!state.bounds || !state.chambers.length) return;
    const tX = state.bounds.minX + (mx / mmW) * (state.bounds.maxX - state.bounds.minX);
    const tZ = state.bounds.minZ + (my / mmH) * (state.bounds.maxZ - state.bounds.minZ);
    let best = null, bestD = Infinity;
    state.chambers.forEach(ch => {
      const p = chamberWorldPos(ch);
      const d = (p.x - tX) ** 2 + (p.z - tZ) ** 2;
      if (d < bestD) { bestD = d; best = ch; }
    });
    if (best) teleportToChamber(best, false);
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

  function podBlocked(x, z, pad = 0.45) {
    for (const col of state.colliders) {
      const dx = x - col.x, dz = z - col.z;
      if (dx * dx + dz * dz < (col.r + pad) ** 2) return true;
    }
    return false;
  }

  function tryMoveCorridor(dx, dz) {
    const b = state.bounds;
    let nx = state.pos.x + dx, nz = state.pos.z + dz;
    if (b) {
      nx = Math.max(b.minX, Math.min(b.maxX, nx));
      nz = Math.max(b.minZ, Math.min(b.maxZ, nz));
    }
    const tryAxis = (tx, tz) => !podBlocked(tx, tz);
    if (tryAxis(nx, nz)) { state.pos.x = nx; state.pos.z = nz; return; }
    if (tryAxis(nx, state.pos.z)) state.pos.x = nx;
    else if (tryAxis(state.pos.x, nz)) state.pos.z = nz;
  }

  function updateFly(dt) {
    const f = state.fly;
    if (!f) return false;
    f.t = Math.min(1, f.t + dt / f.dur);
    const e = f.t < 0.5 ? 2 * f.t * f.t : 1 - (-2 * f.t + 2) ** 2 / 2;
    state.pos.x = f.from.x + (f.to.x - f.from.x) * e;
    state.pos.y = f.from.y + (f.to.y - f.from.y) * e;
    state.pos.z = f.from.z + (f.to.z - f.from.z) * e;
    let dy = f.yawTo - f.yawFrom;
    while (dy > Math.PI) dy -= Math.PI * 2;
    while (dy < -Math.PI) dy += Math.PI * 2;
    state.yaw = f.yawFrom + dy * e;
    if (f.t >= 1) {
      if (f.chamber) highlightNavChip(f.chamber.id);
      state.fly = null;
    }
    return true;
  }

  function updatePlayer(dt) {
    if (updateFly(dt)) { applyCamera(); return; }

    const THREE = state.THREE;
    const maxSpd = state.keys["Shift"] ? 16 : 10;
    const accel = 42;
    const friction = 10;
    const fwd = new THREE.Vector3(Math.sin(state.yaw), 0, Math.cos(state.yaw));
    const right = new THREE.Vector3(Math.cos(state.yaw), 0, -Math.sin(state.yaw));

    let ix = 0, iz = 0;
    if (state.keys["w"] || state.keys["ArrowUp"]) { ix += fwd.x; iz += fwd.z; }
    if (state.keys["s"] || state.keys["ArrowDown"]) { ix -= fwd.x; iz -= fwd.z; }
    if (state.keys["a"] || state.keys["ArrowLeft"]) { ix -= right.x; iz -= right.z; }
    if (state.keys["d"] || state.keys["ArrowRight"]) { ix += right.x; iz += right.z; }

    if (ix !== 0 || iz !== 0) {
      const len = Math.hypot(ix, iz) || 1;
      state.vel.x += (ix / len) * accel * dt;
      state.vel.z += (iz / len) * accel * dt;
    } else {
      const damp = Math.exp(-friction * dt);
      state.vel.x *= damp;
      state.vel.z *= damp;
    }
    const spd = Math.hypot(state.vel.x, state.vel.z);
    if (spd > maxSpd) {
      state.vel.x = (state.vel.x / spd) * maxSpd;
      state.vel.z = (state.vel.z / spd) * maxSpd;
    }

    const mx = state.vel.x * dt;
    const mz = state.vel.z * dt;
    if (state.mode === "retro") tryMove(mx, mz);
    else if (mx || mz) tryMoveCorridor(mx, mz);

    if (state.trace) {
      const wps = state.trace.waypoints;
      state.trace.t = Math.min(1, state.trace.t + dt * 0.45);
      const t = state.trace.t;
      const ax = wps[0].x, az = wps[0].z, bx = wps[1].x, bz = wps[1].z;
      state.pos.x = ax + (bx - ax) * t;
      state.pos.z = az + (bz - az) * t;
      state.pos.y = state.mode === "retro" ? 1.65 : 1.7;
      state.yaw = Math.atan2(bx - ax, bz - az);
      state.vel = { x: 0, z: 0 };
      if (t >= 1) { setStatus(`Arrived: ${state.trace.label}`); state.trace = null; }
    }
    applyCamera();
  }

  function interactNearby() {
    const ch = state.nearChamber;
    if (!ch) return;
    window.__DS_MISSIONS?.onVisit?.(state.mission, state.graph, ch.id, ch);
    highlightNavChip(ch.id);
    const el = document.getElementById("ds-walk-inspect");
    if (el) {
      el.hidden = false;
      el.innerHTML = window.__DS_MISSIONS?.inspectHtml?.(ch) || "";
    }
    window.__DS_MISSIONS?.toastObjective?.("Inspected: " + ch.label);
    window.__DS_MISSIONS?.renderHud?.(state.mission);
    window.__DS_MISSIONS?.syncWaypoints?.(state, state.mission, state.graph);
    if (state.mission?.complete) showMissionComplete();
  }

  function showMissionComplete() {
    state.overlay?.classList.add("ds-walk-victory");
    window.__DS_MISSIONS?.renderHud?.(state.mission);
    setStatus(`Certified ${state.mission.rank} — ${state.mission.xp} XP earned`);
  }

  function updateProximity() {
    let best = null, bestD = 5.5;
    state.devicePods.forEach(pod => {
      const ch = pod.userData?.chamber;
      if (!ch) return;
      const p = chamberWorldPos(ch);
      const d = Math.hypot(p.x - state.pos.x, p.z - state.pos.z);
      if (d < bestD) { bestD = d; best = ch; }
    });
    state.nearChamber = best;
    const prompt = document.getElementById("ds-walk-prompt");
    if (prompt) {
      if (best) {
        prompt.hidden = false;
        prompt.textContent = `Press E to inspect ${best.label}`;
      } else prompt.hidden = true;
    }
  }

  function initMissionSystem(graph) {
    if (!window.__DS_MISSIONS) return;
    state.chamberWorldPos = chamberWorldPos;
    state.mission = window.__DS_MISSIONS.startCampaign(graph, state);
    window.__DS_MISSIONS.renderHud(state.mission);
    window.__DS_MISSIONS.syncWaypoints(state, state.mission, graph);
    window.__DS_MISSIONS.renderBriefing(state.mission, () => {
      window.__DS_MISSIONS.syncWaypoints(state, state.mission, graph);
    });
  }

  function applyCamera() {
    const cam = state.camera;
    if (!cam) return;
    cam.position.set(state.pos.x, state.pos.y, state.pos.z);
    cam.lookAt(
      state.pos.x + Math.sin(state.yaw) * Math.cos(state.pitch),
      state.pos.y + Math.sin(state.pitch),
      state.pos.z + Math.cos(state.yaw) * Math.cos(state.pitch)
    );
    const compass = document.getElementById("ds-walk-compass");
    if (compass) compass.style.transform = `rotate(${-state.yaw}rad)`;
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
    if (!mm) return;
    const ctx = mm.getContext("2d");
    const W = mm.width = 168, H = mm.height = 118;
    ctx.fillStyle = "rgba(4,16,31,0.94)";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(2,200,255,0.35)";
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

    if (state.mode === "retro" && state.maze) {
      const m = state.maze;
      const rows = m.grid.length, cols = m.grid[0]?.length || 1;
      const sx = (W - 8) / cols, sy = (H - 8) / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.fillStyle = m.grid[r][c] === 1 ? "#1a3050" : "#0a2030";
          ctx.fillRect(4 + c * sx, 4 + r * sy, sx - 0.5, sy - 0.5);
        }
      }
      m.placements.forEach(p => {
        ctx.fillStyle = "#44cc88";
        ctx.fillRect(4 + p.c * sx + 1, 4 + p.r * sy + 1, sx * 2 - 2, sy * 2 - 2);
      });
      const px = 4 + (state.pos.x / CELL) * sx;
      const py = 4 + (state.pos.z / CELL) * sy;
      drawMinimapPlayer(ctx, px, py);
      return;
    }

    if (!state.bounds || !state.chambers.length) return;
    const b = state.bounds;
    const pad = 6;
    const rw = W - pad * 2, rh = H - pad * 2;
    const scale = Math.min(rw / (b.maxX - b.minX), rh / (b.maxZ - b.minZ));
    const ox = pad + (rw - (b.maxX - b.minX) * scale) / 2;
    const oz = pad + (rh - (b.maxZ - b.minZ) * scale) / 2;
    const toX = x => ox + (x - b.minX) * scale;
    const toZ = z => oz + (z - b.minZ) * scale;

    state.cables.forEach(g => {
      const cor = g.userData?.corridor;
      if (!cor) return;
      const a = cor.from.pos, bp = cor.to.pos;
      ctx.strokeStyle = "rgba(212,160,96,0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(toX(a.x), toZ(a.z));
      ctx.lineTo(toX(bp.x), toZ(bp.z));
      ctx.stroke();
    });
    state.chambers.forEach(ch => {
      const p = ch.pos;
      const theme = zoneTheme(ch.zone);
      ctx.fillStyle = "#" + theme.accent.toString(16).padStart(6, "0");
      ctx.beginPath();
      ctx.arc(toX(p.x), toZ(p.z), ch.id === state.focusId ? 5 : 4, 0, Math.PI * 2);
      ctx.fill();
    });
    drawMinimapPlayer(ctx, toX(state.pos.x), toZ(state.pos.z));
  }

  function drawMinimapPlayer(ctx, px, py) {
    ctx.fillStyle = "#02c8ff";
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ff9000";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + Math.sin(state.yaw) * 12, py + Math.cos(state.yaw) * 12);
    ctx.stroke();
  }

  function loop(now) {
    if (!state.renderer || !state.scene || !state.camera) return;
    const t = (now || performance.now()) / 1000;
    const dt = Math.min(0.05, state.lastFrame ? t - state.lastFrame : 0.016);
    state.lastFrame = t;
    state.clock += dt;
    updatePlayer(dt);
    animateCables(state.clock);
    updateFocusHud();
    updateProximity();
    window.__DS_MISSIONS?.animateWaypoints?.(state, state.clock);
    if (state.mission && !state.mission.complete) window.__DS_MISSIONS?.renderHud?.(state.mission);
    drawMinimap();
    state.renderer.render(state.scene, state.camera);
    state.animId = requestAnimationFrame(loop);
  }

  function hudHtml(mode) {
    return `<div class="ds-walk-hud">
      <div class="ds-walk-hud-top">
        <strong class="ds-walk-title">${mode === "retro" ? "⬡ Signal Quest" : "⬡ Field Tech Walk"}</strong>
        <span class="ds-walk-hint">WASD · Drag look · E inspect · [ ] devices · Minimap jump</span>
        <button type="button" class="ds-walk-close" title="Exit walkthrough">✕</button>
      </div>
      <div class="ds-walk-xp-track"><div class="ds-walk-xp-bar" id="ds-walk-xp-bar"></div></div>
      <div class="ds-walk-hud-mid">
        <button type="button" class="ds-walk-btn" data-action="trace-av">Trace AV</button>
        <button type="button" class="ds-walk-btn" data-action="trace-poe">Trace PoE</button>
        <button type="button" class="ds-walk-btn" data-action="prev-dev">‹</button>
        <button type="button" class="ds-walk-btn" data-action="next-dev">›</button>
        <button type="button" class="ds-walk-btn${mode === "retro" ? " active" : ""}" data-action="mode-retro">Dungeon</button>
        <button type="button" class="ds-walk-btn${mode === "corridor" ? " active" : ""}" data-action="mode-corridor">Open</button>
      </div>
      <div class="ds-walk-mission" id="ds-walk-mission"></div>
      <div class="ds-walk-devices" id="ds-walk-devices"></div>
      <div class="ds-walk-focus" id="ds-walk-focus" hidden></div>
      <div class="ds-walk-status" id="ds-walk-status">Mission briefing loading…</div>
    </div>`;
  }

  function bindHud() {
    state.overlay?.querySelector(".ds-walk-close")?.addEventListener("click", () => close());
    state.overlay?.addEventListener("click", e => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const a = btn.dataset.action;
      if (a === "mode-retro") switchMode("retro");
      else if (a === "mode-corridor") switchMode("corridor");
      else if (a === "trace-av") startTrace("av");
      else if (a === "trace-poe") startTrace("poe");
      else if (a === "prev-dev") cycleDevice(-1);
      else if (a === "next-dev") cycleDevice(1);
      else if (a === "mission-replay") {
        if (state.graph) {
          state.mission = window.__DS_MISSIONS?.startCampaign(state.graph, state);
          state.overlay?.classList.remove("ds-walk-victory");
          window.__DS_MISSIONS?.renderHud?.(state.mission);
          window.__DS_MISSIONS?.syncWaypoints?.(state, state.mission, state.graph);
          window.__DS_MISSIONS?.renderBriefing?.(state.mission, () => {});
        }
      }
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
    window.__DS_MISSIONS?.onTrace?.(state.mission, kind);
    window.__DS_MISSIONS?.renderHud?.(state.mission);
    window.__DS_MISSIONS?.syncWaypoints?.(state, state.mission, state.graph);
    if (state.mission?.complete) showMissionComplete();
  }

  function switchMode(mode) {
    if (mode === state.mode) return;
    open(state.studio, mode);
  }

  function pickDeviceAt(clientX, clientY, canvas) {
    if (!state.raycaster || !state.camera) return null;
    const rect = canvas.getBoundingClientRect();
    const ndc = new state.THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    state.raycaster.setFromCamera(ndc, state.camera);
    const hits = state.raycaster.intersectObjects(state.devicePods, true);
    for (const hit of hits) {
      let o = hit.object;
      while (o && !o.userData?.chamber) o = o.parent;
      if (o?.userData?.chamber) return o.userData.chamber;
    }
    return null;
  }

  function bindInput(canvas) {
    const onKey = e => {
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      state.keys[e.key] = e.type === "keydown";
      if (e.type === "keydown") {
        if (e.key === "Escape") { e.preventDefault(); close(); return; }
        if (e.key === "[" || e.key === "{") { e.preventDefault(); cycleDevice(-1); return; }
        if (e.key === "]" || e.key === "}") { e.preventDefault(); cycleDevice(1); return; }
        if (e.key === "Tab") { e.preventDefault(); cycleDevice(e.shiftKey ? -1 : 1); return; }
        if (e.key === "e" || e.key === "E") { e.preventDefault(); interactNearby(); return; }
      }
    };
    const onLook = (dx, dy) => {
      state.yaw -= dx * 0.003;
      state.pitch = Math.max(-0.55, Math.min(0.55, state.pitch - dy * 0.003));
    };
    let downPos = null;
    const onDown = e => {
      if (e.button !== 0 && e.button !== 2) return;
      const mm = e.target.closest("#ds-walk-minimap");
      if (mm) {
        const r = mm.getBoundingClientRect();
        const scaleX = mm.width / r.width;
        const scaleY = mm.height / r.height;
        minimapTeleport((e.clientX - r.left) * scaleX, (e.clientY - r.top) * scaleY, mm.width, mm.height);
        return;
      }
      if (!canvas.contains(e.target) && e.target !== canvas) return;
      state.lookDrag = true;
      downPos = { x: e.clientX, y: e.clientY };
      state.lookLast = { x: e.clientX, y: e.clientY };
    };
    const onMove = e => {
      if (state.pointerLocked) {
        onLook(e.movementX, e.movementY);
        return;
      }
      if (!state.lookDrag) return;
      onLook(e.clientX - state.lookLast.x, e.clientY - state.lookLast.y);
      state.lookLast = { x: e.clientX, y: e.clientY };
    };
    const onUp = e => {
      if (e.button === 0 && downPos) {
        const moved = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
        if (moved < 6) {
          const ch = pickDeviceAt(e.clientX, e.clientY, canvas);
          if (ch) teleportToChamber(ch, false);
          else interactNearby();
        }
      }
      state.lookDrag = false;
      downPos = null;
    };
    const onDbl = () => canvas.requestPointerLock?.();
    const onWheel = e => {
      if (!canvas.matches(":hover")) return;
      e.preventDefault();
      const boost = e.deltaY < 0 ? 1.12 : 0.9;
      state.vel.x *= boost;
      state.vel.z *= boost;
    };
    const onLock = () => {
      state.pointerLocked = document.pointerLockElement === canvas;
      state.overlay?.classList.toggle("ds-walk-locked", state.pointerLocked);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("dblclick", onDbl);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    document.addEventListener("pointerlockchange", onLock);
    state._inputCleanup = () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("dblclick", onDbl);
      canvas.removeEventListener("wheel", onWheel);
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
    state.colliders = [];
    state.bounds = null;
    state.fly = null;
    state.vel = { x: 0, z: 0 };
    state.lastFrame = 0;
    state.renderer?.dispose?.();
    state.renderer = null;
    state.scene = null;
    state.camera = null;
    state.maze = null;
    state.graph = null;
    state.mission = null;
    if (state.waypointGroup && state.scene) state.scene.remove(state.waypointGroup);
    state.waypointGroup = null;
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
      <div id="ds-walk-briefing" class="ds-walk-briefing" hidden></div>
      <div class="ds-walk-stage">
        <div class="ds-walk-crosshair" aria-hidden="true"></div>
        <div class="ds-walk-prompt" id="ds-walk-prompt" hidden>Press E to inspect</div>
        <div class="ds-walk-inspect" id="ds-walk-inspect" hidden></div>
        <div class="ds-walk-toast" id="ds-walk-toast"></div>
        <div class="ds-walk-compass" id="ds-walk-compass" aria-hidden="true"><span>N</span></div>
        <canvas id="ds-walk-minimap" class="ds-walk-minimap" title="Click to jump"></canvas>
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
      initMissionSystem(graph);
      loop();
      studio.roomView = mode === "retro" ? "retro" : "walk";
      window.__DS_PREMIUM?.renderRoomViewToggle?.(studio);
      setStatus("Accept the mission briefing to begin your certification run");
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
      photos: state.devicePods.filter(p => p.userData?.chamber?.photoUrl).length,
      mission: !!state.mission,
      missionComplete: !!state.mission?.complete
    };
  }

  window.__DS_WALK = { open, close, toggle: (s, m) => state.mode ? close(true) : open(s, m), isOpen: () => !!state.mode, debugStats };
})();

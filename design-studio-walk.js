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
    focusId: null, navIndex: 0, mission: null, waypointGroup: null, nearChamber: null,
    reticleChamber: null, bobPhase: 0, viewmodel: null, worldBounds: null,
    dustParticles: null, footPhase: 0,
    topology: null, easyNav: true
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

  function applyDiagramLayout(studio, chambers, nodes, kind) {
    const layout = window.__DS_WALK_LAYOUT?.diagramToWorld(nodes, kind);
    if (!layout?.positions) return null;
    chambers.forEach(ch => {
      const p = layout.positions[ch.id];
      if (p) ch.pos = { x: p.x, y: p.y, z: p.z, diagramX: p.diagramX, diagramY: p.diagramY };
    });
    return {
      bounds: layout.bounds,
      diagram: { cx: layout.center.cx, cy: layout.center.cy, scale: layout.scale, kind }
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
      return makeChamberBase(studio, n, { zone: item?.zone || "default", pos: { x: 0, y: 3, z: 0 } });
    });
    const graph = linkGraph(room, chambers, links, "room");
    const layoutInfo = applyDiagramLayout(studio, graph.chambers, nodes, "room");
    graph.layoutBounds = layoutInfo?.bounds;
    graph.layoutDiagram = layoutInfo?.diagram;
    return graph;
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
      return makeChamberBase(studio, n, { zone: layer, pos: { x: 0, y: 3, z: 0 } });
    });
    const graph = linkGraph({ name: "Network topology" }, chambers, links, "network");
    const layoutInfo = applyDiagramLayout(studio, graph.chambers, nodes, "network");
    graph.layoutBounds = layoutInfo?.bounds;
    graph.layoutDiagram = layoutInfo?.diagram;
    return graph;
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

  function buildTopology(graph) {
    return window.__DS_WALK_LAYOUT?.buildWalkTopology?.(graph.chambers, graph.corridors) || null;
  }

  function makeWalkway(THREE, cor) {
    const ax = cor.from.pos.x, az = cor.from.pos.z;
    const bx = cor.to.pos.x, bz = cor.to.pos.z;
    const dx = bx - ax, dz = bz - az;
    const len = Math.hypot(dx, dz) || 0.1;
    const g = new THREE.Group();
    const y = 0.035;

    const walk = new THREE.Mesh(
      new THREE.BoxGeometry(len, 0.07, 1.55),
      new THREE.MeshStandardMaterial({
        color: 0x142838, emissive: cor.color, emissiveIntensity: 0.42,
        metalness: 0.45, roughness: 0.48
      })
    );
    walk.position.set((ax + bx) / 2, y, (az + bz) / 2);
    walk.rotation.y = Math.atan2(dx, dz);
    g.add(walk);

    const edgeMat = new THREE.MeshStandardMaterial({
      color: cor.color, emissive: cor.color, emissiveIntensity: 0.75, metalness: 0.25, roughness: 0.35
    });
    [-0.72, 0.72].forEach(off => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(len * 0.98, 0.12, 0.06), edgeMat);
      rail.position.copy(walk.position);
      rail.position.y = y + 0.05;
      rail.rotation.copy(walk.rotation);
      const perp = Math.atan2(dx, dz) + Math.PI / 2;
      rail.position.x += Math.sin(perp) * off;
      rail.position.z += Math.cos(perp) * off;
      g.add(rail);
    });

    g.userData = { corridor: cor, walkway: true };
    return g;
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
    sprite.scale.set(2.4, 0.45, 1);
    sprite.renderOrder = 10;
    state.disposables.push(mat);
    return sprite;
  }

  function podLift(zone, kind) {
    if (kind !== "room") return 1.05;
    const z = (zone || "").toLowerCase();
    if (z === "ceiling") return 3.1;
    if (z === "wall") return 2.0;
    if (z === "display") return 1.55;
    if (z === "rack") return 1.05;
    if (z === "table") return 0.82;
    return 1.1;
  }

  async function makeDevicePod(THREE, ch, scale = 1, kind = "room") {
    const theme = zoneTheme(ch.zone);
    const g = new THREE.Group();
    g.userData = { chamber: ch, kind: "pod" };
    const lift = podLift(ch.zone, kind);
    const mode = kind === "room" ? "room" : "network";
    const def = window.__DS_STENCILS?.getDef?.(ch.stencilId, mode);

    let photoTex = await loadTexture(THREE, ch.photoUrl);
    if (!photoTex) photoTex = makeFallbackIconTexture(THREE, ch.label, theme);

    window.__DS_WALK_MODELS?.init?.(THREE);
    const deviceGroup = await window.__DS_WALK_MODELS?.build?.(THREE, {
      ch, def, kind, photoTex, scale, theme, lift
    });
    if (deviceGroup) {
      g.add(deviceGroup);
      if (deviceGroup.userData?.photoMesh) g.userData.photoMesh = deviceGroup.userData.photoMesh;
    }

    const modelTop = lift + (kind === "room" ? 1.2 : 0.95) * scale;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.55 * scale, 0.62 * scale, 32),
      new THREE.MeshBasicMaterial({ color: theme.accent, transparent: true, opacity: 0.25, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.03 * scale;
    g.add(ring);

    const glow = new THREE.PointLight(theme.light, 0.15 * scale, 4 * scale);
    glow.position.set(0, modelTop * 0.65, 0.15 * scale);
    glow.userData.podGlow = true;
    g.add(glow);

    const label = makeLabelSprite(THREE, ch.label, ch.pid, theme);
    label.position.set(0, modelTop + 0.25, 0);
    label.visible = false;
    g.add(label);

    const zoneBadge = makeLabelSprite(THREE, (ch.zone || "device").toUpperCase(), "", theme);
    zoneBadge.scale.set(1.2 * scale, 0.24 * scale, 1);
    zoneBadge.position.set(0, lift + 0.15, 0.05);
    zoneBadge.visible = false;
    g.add(zoneBadge);

    g.userData.labelSprite = label;
    g.userData.zoneBadge = zoneBadge;
    g.userData.glowLight = glow;
    g.userData.ring = ring;
    g.userData.deviceGroup = deviceGroup;

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.7 * scale, 32),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    g.add(shadow);

    const hitbox = new THREE.Mesh(
      new THREE.SphereGeometry(1.8 * scale, 10, 10),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitbox.position.set(0, lift, 0);
    hitbox.userData = { chamber: ch, kind: "hitbox" };
    g.add(hitbox);

    g.position.set(ch.pos.x, 0, ch.pos.z);
    state.devicePods.push(g);
    state.colliders.push({ x: ch.pos.x, z: ch.pos.z, r: 0.95 * scale, id: ch.id });
    return g;
  }

  function makeCableRun(THREE, cor) {
    const ax = cor.from.pos.x, az = cor.from.pos.z;
    const bx = cor.to.pos.x, bz = cor.to.pos.z;
    const dx = bx - ax, dz = bz - az;
    const len = Math.hypot(dx, dz) || 0.1;
    const g = new THREE.Group();
    const y = 0.07;

    const tray = new THREE.Mesh(
      new THREE.BoxGeometry(len, 0.05, 0.55),
      new THREE.MeshStandardMaterial({
        color: 0x0c1828, emissive: cor.color, emissiveIntensity: 0.35,
        metalness: 0.65, roughness: 0.35
      })
    );
    tray.position.set((ax + bx) / 2, y, (az + bz) / 2);
    tray.rotation.y = Math.atan2(dx, dz);
    g.add(tray);

    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(len * 0.96, 0.02, 0.12),
      new THREE.MeshStandardMaterial({
        color: cor.color, emissive: cor.color, emissiveIntensity: 0.9, metalness: 0.2, roughness: 0.3
      })
    );
    stripe.position.copy(tray.position);
    stripe.position.y = y + 0.03;
    stripe.rotation.copy(tray.rotation);
    g.add(stripe);

    const pulse = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 })
    );
    pulse.userData = {
      cable: true,
      a: { x: ax, y: y + 0.05, z: az },
      b: { x: bx, y: y + 0.05, z: bz },
      t: Math.random()
    };
    g.add(pulse);

    g.userData = { corridor: cor };
    state.cables.push(g);
    return g;
  }

  function makeFloorTexture(THREE) {
    return makeCanvasTexture(THREE, (ctx, w, h) => {
      ctx.fillStyle = "#0a1420";
      ctx.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 32) {
        for (let x = 0; x < w; x += 32) {
          ctx.strokeStyle = (x + y) % 64 === 0 ? "rgba(2,200,255,0.12)" : "rgba(2,200,255,0.04)";
          ctx.strokeRect(x + 0.5, y + 0.5, 31, 31);
        }
      }
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.55);
      g.addColorStop(0, "rgba(2,200,255,0.08)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }, 512, 512);
  }

  function addRoomDecor(THREE, scene, bounds) {
    if (!bounds) return;
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cz = (bounds.minZ + bounds.maxZ) / 2;
    const wood = new THREE.MeshStandardMaterial({ color: 0x4a3c30, roughness: 0.62, metalness: 0.08 });
    const table = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.1, 2.4), wood);
    table.position.set(cx, 0.38, cz);
    scene.add(table);
    const legs = [[-2.4, -0.9], [2.4, -0.9], [-2.4, 0.9], [2.4, 0.9]];
    legs.forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.38, 8), wood);
      leg.position.set(cx + lx, 0.19, cz + lz);
      scene.add(leg);
    });
    const chairMat = new THREE.MeshStandardMaterial({ color: 0x2a3238, roughness: 0.7, metalness: 0.2 });
    [[-1.2, 1.8], [1.2, 1.8], [-1.2, -1.8], [1.2, -1.8]].forEach(([ox, oz]) => {
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 0.55), chairMat);
      seat.position.set(cx + ox, 0.42, cz + oz);
      scene.add(seat);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 0.06), chairMat);
      back.position.set(cx + ox, 0.68, cz + oz + (oz > 0 ? 0.24 : -0.24));
      scene.add(back);
    });
    const screen = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 1.8, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.3, roughness: 0.4, emissive: 0x223344, emissiveIntensity: 0.15 })
    );
    screen.position.set(cx, 2.1, cz - 3.2);
    scene.add(screen);
    const rack = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 2.2, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x1a2028, metalness: 0.75, roughness: 0.35 })
    );
    rack.position.set(cx + 4.5, 1.1, cz - 2.5);
    scene.add(rack);
  }

  function makeCarpetTexture(THREE) {
    return makeCanvasTexture(THREE, (ctx, w, h) => {
      ctx.fillStyle = "#3a3835";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 8000; i++) {
        const x = Math.random() * w, y = Math.random() * h;
        const g = 40 + Math.random() * 30;
        ctx.fillStyle = `rgba(${g},${g - 4},${g - 8},0.35)`;
        ctx.fillRect(x, y, 1, 1);
      }
    }, 256, 256);
  }

  function setSkyBackground(THREE, scene, kind) {
    const tex = makeCanvasTexture(THREE, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      if (kind === "network") {
        g.addColorStop(0, "#243040");
        g.addColorStop(0.45, "#141c28");
        g.addColorStop(1, "#0a1018");
      } else {
        g.addColorStop(0, "#2a3848");
        g.addColorStop(0.5, "#1a2430");
        g.addColorStop(1, "#101820");
      }
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }, 4, 1024);
    scene.background = tex;
  }

  function addEpicVenue(THREE, scene, bounds, kind) {
    if (!bounds) return;
    const pad = 16;
    const w = Math.max(bounds.maxX - bounds.minX + pad * 2, 32);
    const d = Math.max(bounds.maxZ - bounds.minZ + pad * 2, 32);
    const h = kind === "room" ? 9 : 11;
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cz = (bounds.minZ + bounds.maxZ) / 2;
    setSkyBackground(THREE, scene, kind);

    const floorTex = kind === "room" ? makeCarpetTexture(THREE) : makeFloorTexture(THREE);
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(w / 6, d / 6);

    const floorColor = kind === "network" ? 0x2a3038 : 0x888880;
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      new THREE.MeshStandardMaterial({
        map: floorTex, color: floorColor, metalness: kind === "network" ? 0.55 : 0.25,
        roughness: kind === "network" ? 0.42 : 0.72
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(cx, 0, cz);
    floor.receiveShadow = true;
    scene.add(floor);

    const wallMat = new THREE.MeshStandardMaterial({
      color: kind === "network" ? 0x141c26 : 0x2a323c, metalness: 0.35, roughness: 0.78
    });
    const walls = [
      { sx: w, sz: 0.5, x: cx, z: cz - d / 2 },
      { sx: w, sz: 0.5, x: cx, z: cz + d / 2 },
      { sx: 0.5, sz: d, x: cx - w / 2, z: cz },
      { sx: 0.5, sz: d, x: cx + w / 2, z: cz }
    ];
    walls.forEach(wl => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(wl.sx, h, wl.sz), wallMat);
      wall.position.set(wl.x, h / 2, wl.z);
      scene.add(wall);
    });

    const ceil = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      new THREE.MeshStandardMaterial({ color: 0x0e141c, metalness: 0.2, roughness: 0.92, side: THREE.DoubleSide })
    );
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(cx, h, cz);
    scene.add(ceil);

    const gridN = kind === "network" ? 4 : 3;
    const corners = [[0, 0], [gridN - 1, 0], [0, gridN - 1], [gridN - 1, gridN - 1]];
    corners.forEach(([i, j]) => {
      const lx = cx + (i / (gridN - 1) - 0.5) * w * 0.85;
      const lz = cz + (j / (gridN - 1) - 0.5) * d * 0.85;
      const bulb = new THREE.PointLight(kind === "network" ? 0xc8dce8 : 0xffeedd, 0.45, 22, 2);
      bulb.position.set(lx, h - 0.6, lz);
      scene.add(bulb);
    });
  }

  function addDustParticles(THREE, scene, bounds) {
    if (!bounds) return;
    const count = 60;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cz = (bounds.minZ + bounds.maxZ) / 2;
    const spreadX = (bounds.maxX - bounds.minX) + 10;
    const spreadZ = (bounds.maxZ - bounds.minZ) + 10;
    for (let i = 0; i < count; i++) {
      pos[i * 3] = cx + (Math.random() - 0.5) * spreadX;
      pos[i * 3 + 1] = 1 + Math.random() * 8;
      pos[i * 3 + 2] = cz + (Math.random() - 0.5) * spreadZ;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0xaaccdd, size: 0.04, transparent: true, opacity: 0.12, depthWrite: false });
    const pts = new THREE.Points(geo, mat);
    pts.userData.dust = true;
    scene.add(pts);
    state.dustParticles = pts;
  }

  function addEnvironment(THREE, scene, dark = false) {
    scene.fog = new THREE.FogExp2(dark ? 0x020610 : 0x060e1a, dark ? 0.038 : 0.022);
    scene.add(new THREE.HemisphereLight(0x6688aa, 0x040810, dark ? 0.35 : 0.45));
    const dir = new THREE.DirectionalLight(0x99ccee, dark ? 0.55 : 0.75);
    dir.position.set(10, 24, 8);
    scene.add(dir);
    const rim = new THREE.DirectionalLight(0x02c8ff, dark ? 0.18 : 0.28);
    rim.position.set(-12, 8, -14);
    scene.add(rim);
    const amb = new THREE.AmbientLight(0x1a2840, dark ? 0.25 : 0.35);
    scene.add(amb);
  }

  function addWorldScenery(THREE, scene, graph) {
    if (graph.kind !== "network") return;
    const layers = [...new Set(graph.chambers.map(c => c.zone).filter(Boolean))];
    layers.forEach(layer => {
      const list = graph.chambers.filter(c => c.zone === layer);
      if (!list.length) return;
      const xs = list.map(c => c.pos.x), zs = list.map(c => c.pos.z);
      const minX = Math.min(...xs) - 2, maxX = Math.max(...xs) + 2;
      const minZ = Math.min(...zs) - 2, maxZ = Math.max(...zs) + 2;
      const theme = zoneTheme(layer);
      const lane = new THREE.Mesh(
        new THREE.PlaneGeometry(maxX - minX, maxZ - minZ),
        new THREE.MeshStandardMaterial({
          color: theme.color, transparent: true, opacity: 0.08,
          metalness: 0.3, roughness: 0.9, depthWrite: false
        })
      );
      lane.rotation.x = -Math.PI / 2;
      lane.position.set((minX + maxX) / 2, 0.02, (minZ + maxZ) / 2);
      scene.add(lane);
      const sign = makeLabelSprite(THREE, layer.toUpperCase(), "", theme);
      sign.position.set((minX + maxX) / 2, 2.4, minZ - 0.5);
      sign.scale.set(1.2, 0.24, 1);
      sign.material.opacity = 0.45;
      scene.add(sign);
    });
  }

  function makeViewmodel(THREE, camera) {
    const g = new THREE.Group();
    g.userData.kind = "viewmodel";
    const glove = new THREE.MeshStandardMaterial({ color: 0x3a4858, metalness: 0.35, roughness: 0.55 });
    const tablet = new THREE.MeshStandardMaterial({ color: 0x0c2038, emissive: 0x02c8ff, emissiveIntensity: 0.25, metalness: 0.7, roughness: 0.3 });
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.07, 0.22), glove);
    left.position.set(-0.2, -0.16, -0.32);
    left.rotation.y = 0.12;
    const right = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.2), glove);
    right.position.set(0.24, -0.18, -0.3);
    right.rotation.y = -0.08;
    const pad = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.02), tablet);
    pad.position.set(0.12, -0.1, -0.38);
    pad.rotation.x = -0.35;
    g.add(left, right, pad);
    camera.add(g);
    return g;
  }

  async function loadDevicePods(THREE, graph, scale = 1) {
    for (const ch of graph.chambers) {
      if (!Number.isFinite(ch.pos?.x) || !Number.isFinite(ch.pos?.z)) {
        ch.pos = { x: 0, y: ch.pos?.y ?? 3, z: 0 };
      }
      try {
        const pod = await makeDevicePod(THREE, ch, scale, graph.kind);
        state.scene?.add(pod);
      } catch (err) {
        console.warn("[DS Walk] pod skipped:", ch.label, err);
      }
      await new Promise(r => requestAnimationFrame(r));
    }
  }

  async function initCorridor(studio, canvas, graph) {
    const THREE = await loadThree();
    if (!graph?.chambers.length) throw new Error("no-graph");
    state.graph = graph;
    state.devicePods = [];
    state.cables = [];
    state.colliders = [];

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x040810, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace || renderer.outputEncoding;
    if (THREE.ACESFilmicToneMapping) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.18;
    }
    state.renderer = renderer;

    const scene = new THREE.Scene();
    state.scene = scene;
    addEnvironment(THREE, scene, false);
    state.bounds = graph.layoutBounds || {
      minX: Math.min(...graph.chambers.map(c => c.pos.x)) - 8,
      maxX: Math.max(...graph.chambers.map(c => c.pos.x)) + 8,
      minZ: Math.min(...graph.chambers.map(c => c.pos.z)) - 8,
      maxZ: Math.max(...graph.chambers.map(c => c.pos.z)) + 8
    };
    addEpicVenue(THREE, scene, state.bounds, graph.kind);
    addDustParticles(THREE, scene, state.bounds);
    addWorldScenery(THREE, scene, graph);

    const camera = new THREE.PerspectiveCamera(76, 1, 0.1, 220);
    camera.rotation.order = "YXZ";
    state.camera = camera;
    scene.add(camera);
    state.viewmodel = makeViewmodel(THREE, camera);
    state.raycaster = new THREE.Raycaster();

    state.topology = buildTopology(graph);
    graph.corridors.forEach(cor => {
      scene.add(makeCableRun(THREE, cor));
      scene.add(makeWalkway(THREE, cor));
    });
    if (graph.kind === "room") addRoomDecor(THREE, scene, state.bounds);

    const spawn = graph.chambers.find(c => /switch|9200|9300/i.test(c.label)) || graph.chambers[0];
    state.chambers = graph.chambers;
    teleportToChamber(spawn, true);
    state.navIndex = graph.chambers.indexOf(spawn);
    document.getElementById("ds-walk-minimap")?.removeAttribute("hidden");
    buildDeviceNav(graph.chambers);
    buildConnectedNav(spawn);
    resizeRenderer();

    setStatus("Loading devices…");
    loadDevicePods(THREE, graph, 1).then(() => {
      if (state.mode) setStatus("Pick a device below or tap a connected link");
    });
  }

  function addCableChannelWalls(THREE, scene, topology) {
    if (!topology?.segments?.length) return;
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x1a3050, metalness: 0.4, roughness: 0.65, emissive: 0x0a1828, emissiveIntensity: 0.15
    });
    topology.segments.forEach(s => {
      const dx = s.bx - s.ax, dz = s.bz - s.az;
      const len = Math.hypot(dx, dz) || 0.1;
      const nx = -dz / len, nz = dx / len;
      const off = 0.95;
      [-off, off].forEach(side => {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(len, 2.8, 0.22), wallMat);
        wall.position.set((s.ax + s.bx) / 2 + nx * side, 1.4, (s.az + s.bz) / 2 + nz * side);
        wall.rotation.y = Math.atan2(dx, dz);
        scene.add(wall);
      });
    });
    topology.pads?.forEach(p => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(p.r * 0.92, 0.12, 8, 24),
        wallMat
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(p.x, 0.55, p.z);
      scene.add(ring);
    });
  }

  async function initRetroMaze(studio, canvas, graph) {
    const THREE = await loadThree();
    const topology = buildTopology(graph);
    state.topology = topology;
    state.graph = graph;
    state.maze = topology;
    state.devicePods = [];
    state.cables = [];
    state.colliders = [];

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x020608, 1);
    if (THREE.ACESFilmicToneMapping) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
    }
    state.renderer = renderer;

    const scene = new THREE.Scene();
    state.scene = scene;
    addEnvironment(THREE, scene, true);

    const camera = new THREE.PerspectiveCamera(72, 1, 0.1, 120);
    camera.rotation.order = "YXZ";
    state.camera = camera;
    scene.add(camera);
    state.viewmodel = makeViewmodel(THREE, camera);
    state.raycaster = new THREE.Raycaster();

    const xs = graph.chambers.map(c => c.pos.x), zs = graph.chambers.map(c => c.pos.z);
    state.bounds = graph.layoutBounds || {
      minX: Math.min(...xs) - 8, maxX: Math.max(...xs) + 8,
      minZ: Math.min(...zs) - 8, maxZ: Math.max(...zs) + 8
    };
    const b = state.bounds;
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(Math.max(b.maxX - b.minX, 24), Math.max(b.maxZ - b.minZ, 24)),
      new THREE.MeshStandardMaterial({ color: 0x0a1420, metalness: 0.35, roughness: 0.75 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set((b.minX + b.maxX) / 2, 0, (b.minZ + b.maxZ) / 2);
    scene.add(floor);

    addCableChannelWalls(THREE, scene, topology);
    graph.corridors.forEach(cor => scene.add(makeWalkway(THREE, cor)));
    graph.corridors.forEach(cor => scene.add(makeCableRun(THREE, cor)));

    const spawn = graph.chambers.find(c => /switch|9200|9300|kit/i.test(c.label)) || graph.chambers[0];
    state.chambers = graph.chambers;
    teleportToChamber(spawn, true);
    state.navIndex = graph.chambers.indexOf(spawn);
    document.getElementById("ds-walk-minimap")?.removeAttribute("hidden");
    buildDeviceNav(graph.chambers);
    buildConnectedNav(spawn);
    resizeRenderer();

    setStatus("Loading devices…");
    loadDevicePods(THREE, graph, 0.85).then(() => {
      if (state.mode) setStatus("Pick a device below or tap a connected link");
    });
  }

  function resizeRenderer() {
    const wrap = state.overlay?.querySelector(".ds-walk-canvas-wrap");
    if (!wrap || !state.renderer || !state.camera) return;
    const w = wrap.clientWidth, h = wrap.clientHeight;
    state.renderer.setSize(w, h, false);
    state.camera.aspect = w / h;
    state.camera.updateProjectionMatrix();
  }

  function snapToWalkable(x, z) {
    const topo = state.topology;
    if (!topo?.isWalkable || topo.isWalkable(x, z)) return { x, z };
    for (let r = 0.4; r < 8; r += 0.45) {
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
        const tx = x + Math.cos(a) * r, tz = z + Math.sin(a) * r;
        if (topo.isWalkable(tx, tz)) return { x: tx, z: tz };
      }
    }
    return { x, z };
  }

  function chamberStandPos(ch) {
    const p = chamberWorldPos(ch);
    const stand = { x: p.x, y: state.mode === "retro" ? 1.65 : 1.7, z: p.z + 2.4 };
    if (state.mode === "retro") {
      const snap = snapToWalkable(stand.x, stand.z);
      stand.x = snap.x;
      stand.z = snap.z;
    }
    return stand;
  }

  function faceChamber(ch) {
    const p = chamberWorldPos(ch);
    state.yaw = Math.atan2(p.x - state.pos.x, p.z - state.pos.z);
    state.pitch = -0.06;
  }

  function teleportToChamber(ch, instant) {
    if (!ch) return;
    const dest = chamberStandPos(ch);
    const prev = state.chambers[state.navIndex];
    state.navIndex = Math.max(0, state.chambers.indexOf(ch));
    highlightNavChip(ch.id);
    buildConnectedNav(ch);

    if (!instant && prev && prev.id !== ch.id && state.topology?.pathWaypoints) {
      const path = state.topology.pathWaypoints(prev.id, ch.id);
      if (path?.length) {
        state.fly = {
          from: { ...state.pos },
          path,
          i: 0,
          t: 0,
          stepDur: 0.5,
          chamber: ch,
          dest
        };
        state.vel = { x: 0, z: 0 };
        setStatus(`Following link path to ${ch.label}`);
        return;
      }
    }

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
        if (!ch) return;
        teleportToChamber(ch, false);
        openFieldPanel(ch);
      });
    });
  }

  function buildConnectedNav(ch) {
    const bar = document.getElementById("ds-walk-links");
    if (!bar) return;
    if (!ch || !state.topology?.segments?.length) {
      bar.innerHTML = "";
      bar.hidden = true;
      return;
    }
    const links = state.topology.segments.filter(s => s.cor.from.id === ch.id || s.cor.to.id === ch.id);
    if (!links.length) {
      bar.innerHTML = "";
      bar.hidden = true;
      return;
    }
    bar.hidden = false;
    bar.innerHTML = `<span class="ds-walk-links-label">Connected — follow a link:</span>` + links.map(s => {
      const other = s.cor.from.id === ch.id ? s.cor.to : s.cor.from;
      const media = (s.cor.media || s.cor.label || "link").toUpperCase();
      return `<button type="button" class="ds-walk-link" data-hop="${other.id}" title="${esc(s.cor.label || media)}">
        ${esc(media)} → ${esc(other.label.slice(0, 18))}</button>`;
    }).join("");
    bar.querySelectorAll("[data-hop]").forEach(btn => {
      btn.addEventListener("click", () => {
        const target = state.chambers.find(c => c.id === btn.dataset.hop);
        if (target) teleportToChamber(target, false);
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
      pod.scale.setScalar(on ? 1.04 : 1);
      if (pod.userData.ring?.material) pod.userData.ring.material.opacity = on ? 0.55 : 0.2;
    });
  }

  function minimapTeleport(mx, my, mmW, mmH) {
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
    const topo = state.topology;
    if (topo?.isWalkable) return !topo.isWalkable(x, z);
    const m = state.maze;
    if (!m?.grid) return false;
    const c = Math.round((x - m.origin.x) / m.cellSize);
    const r = Math.round((z - m.origin.z) / m.cellSize);
    if (r < 0 || c < 0 || r >= m.rows || c >= m.cols) return true;
    return m.grid[r][c] === 1;
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
    let nx = state.pos.x + dx, nz = state.pos.z + dz;
    const b = state.bounds;
    if (b) {
      nx = Math.max(b.minX, Math.min(b.maxX, nx));
      nz = Math.max(b.minZ, Math.min(b.maxZ, nz));
    }
    const tryAxis = (tx, tz) => !podBlocked(tx, tz, 0.25);
    if (tryAxis(nx, nz)) { state.pos.x = nx; state.pos.z = nz; return; }
    if (tryAxis(nx, state.pos.z)) state.pos.x = nx;
    else if (tryAxis(state.pos.x, nz)) state.pos.z = nz;
  }

  function flyEase(t) {
    return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
  }

  function updateFly(dt) {
    const f = state.fly;
    if (!f) return false;

    if (f.path?.length) {
      const idx = f.i || 0;
      const fromPt = idx === 0 ? f.from : f.path[idx - 1];
      const toPt = idx < f.path.length ? f.path[idx] : f.dest;
      f.t = Math.min(1, f.t + dt / (f.stepDur || 0.5));
      const e = flyEase(f.t);
      state.pos.x = fromPt.x + (toPt.x - fromPt.x) * e;
      state.pos.z = fromPt.z + (toPt.z - fromPt.z) * e;
      state.pos.y = state.mode === "retro" ? 1.65 : 1.7;
      state.yaw = Math.atan2(toPt.x - state.pos.x, toPt.z - state.pos.z);
      if (f.t >= 1) {
        f.i = idx + 1;
        f.t = 0;
        if (f.i >= f.path.length) {
          if (f.dest) state.pos = { ...f.dest };
          if (f.chamber) {
            highlightNavChip(f.chamber.id);
            buildConnectedNav(f.chamber);
            faceChamber(f.chamber);
            setStatus(`At ${f.chamber.label}${f.chamber.pid ? " · " + f.chamber.pid : ""}`);
            window.__DS_MISSIONS?.onVisit?.(state.mission, state.graph, f.chamber.id, f.chamber);
            window.__DS_MISSIONS?.renderHud?.(state.mission);
            window.__DS_MISSIONS?.syncWaypoints?.(state, state.mission, state.graph);
          }
          state.fly = null;
        }
      }
      return true;
    }

    f.t = Math.min(1, f.t + dt / f.dur);
    const e = flyEase(f.t);
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
    const maxSpd = state.keys["Shift"] ? 10 : 7.5;
    const accel = 34;
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
    if (mx || mz) {
      if (state.mode === "retro") tryMove(mx, mz);
      else tryMoveCorridor(mx, mz);
    }

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
    const footSpd = Math.hypot(state.vel.x, state.vel.z);
    if (footSpd > 0.3) {
      state.footPhase += dt;
      if (state.footPhase > 0.36) {
        state.footPhase = 0;
        window.__DS_WALK_AUDIO?.sfx?.footstep?.();
      }
    }
    applyCamera();
  }

  function pickReticleChamber() {
    if (!state.camera || !state.devicePods.length) return null;
    const THREE = state.THREE;
    const forward = new THREE.Vector3();
    state.camera.getWorldDirection(forward);
    let best = null, bestDot = 0.52;
    state.devicePods.forEach(pod => {
      const ch = pod.userData?.chamber;
      if (!ch) return;
      const to = new THREE.Vector3(pod.position.x - state.pos.x, 1.4 - state.pos.y, pod.position.z - state.pos.z);
      const dist = to.length();
      if (dist > 16) return;
      to.normalize();
      const dot = forward.dot(to);
      if (dot > bestDot) { bestDot = dot; best = ch; }
    });
    return best;
  }

  function openFieldPanel(ch) {
    if (!ch) return;
    window.__DS_WALK_AUDIO?.sfx?.inspect?.();
    window.__DS_MISSIONS?.onVisit?.(state.mission, state.graph, ch.id, ch);
    highlightNavChip(ch.id);
    window.__DS_FIELD_PANEL?.render?.(ch, state.studio, state.graph);
    state.overlay?.classList.add("ds-field-panel-open");
    document.getElementById("ds-walk-panel-backdrop")?.removeAttribute("hidden");
    window.__DS_MISSIONS?.toastObjective?.("Inspected: " + ch.label);
    window.__DS_MISSIONS?.renderHud?.(state.mission);
    window.__DS_MISSIONS?.syncWaypoints?.(state, state.mission, state.graph);
    if (state.mission?.complete) showMissionComplete();
  }

  function interactNearby() {
    const ch = state.reticleChamber;
    if (!ch) return;
    openFieldPanel(ch);
  }

  function showMissionComplete() {
    state.overlay?.classList.add("ds-walk-victory");
    window.__DS_MISSIONS?.renderHud?.(state.mission);
    setStatus(`Certified ${state.mission.rank} — ${state.mission.xp} XP earned`);
  }

  function updateReticleFocus() {
    const ch = pickReticleChamber();
    state.reticleChamber = ch;
    state.nearChamber = ch;
    const prompt = document.getElementById("ds-walk-prompt");
    if (prompt) {
      if (ch) {
        const p = chamberWorldPos(ch);
        const near = Math.hypot(p.x - state.pos.x, p.z - state.pos.z) < 9;
        prompt.hidden = !near;
        prompt.textContent = near ? `Tap Inspect or press E — ${ch.label}` : `Walk closer to ${ch.label}`;
      } else prompt.hidden = true;
    }
    const el = document.getElementById("ds-walk-focus");
    if (el) {
      if (ch) {
        el.hidden = false;
        el.innerHTML = `<strong>${esc(ch.label)}</strong>${ch.pid ? `<span>${esc(ch.pid)}</span>` : ""}`;
      } else el.hidden = true;
    }
    state.devicePods.forEach(pod => {
      const pch = pod.userData?.chamber;
      if (!pch) return;
      const p = chamberWorldPos(pch);
      const dist = Math.hypot(p.x - state.pos.x, p.z - state.pos.z);
      const focused = ch?.id === pch.id;
      const showLabel = focused;
      if (pod.userData.labelSprite) {
        pod.userData.labelSprite.visible = showLabel;
        pod.userData.labelSprite.material.opacity = focused ? 1 : 0.65;
      }
      if (pod.userData.zoneBadge) pod.userData.zoneBadge.visible = focused;
      if (pod.userData.glowLight) pod.userData.glowLight.intensity = focused ? 1.4 : 0.55;
      if (pod.userData.ring) {
        pod.userData.ring.material.opacity = focused ? 0.55 : 0.2;
      }
      if (pod.userData.photoMesh?.material) {
        pod.userData.photoMesh.material.emissiveIntensity = focused ? 0.22 : 0.1;
      }
    });
  }

  function safePointerLock(el) {
    if (!el?.requestPointerLock) return;
    try {
      const p = el.requestPointerLock();
      if (p?.catch) p.catch(() => {});
    } catch (_) { /* denied or unsupported */ }
  }

  function initMissionSystem(graph) {
    if (!window.__DS_MISSIONS) return;
    state.chamberWorldPos = chamberWorldPos;
    state.mission = window.__DS_MISSIONS.startCampaign(graph, state);
    window.__DS_MISSIONS.renderHud(state.mission);
    window.__DS_MISSIONS.syncWaypoints(state, state.mission, graph);
    window.__DS_MISSIONS.renderBriefing(state.mission, () => {
      window.__DS_MISSIONS.syncWaypoints(state, state.mission, graph);
      setStatus("Pick a device below or tap a connected link to walk your diagram");
      window.__DS_WALK_AUDIO?.sfx?.missionStart?.();
      window.__DS_WALK_AUDIO?.start?.();
    });
    window.__DS_FIELD_PANEL?.bindWalk?.(state);
  }

  function applyCamera() {
    const cam = state.camera;
    if (!cam) return;
    const spd = Math.hypot(state.vel.x, state.vel.z);
    if (spd > 0.25) state.bobPhase += 0.016 * 9;
    const bob = spd > 0.25 ? Math.sin(state.bobPhase) * 0.038 : 0;
    cam.position.set(state.pos.x, state.pos.y + bob, state.pos.z);
    cam.lookAt(
      state.pos.x + Math.sin(state.yaw) * Math.cos(state.pitch),
      state.pos.y + bob + Math.sin(state.pitch),
      state.pos.z + Math.cos(state.yaw) * Math.cos(state.pitch)
    );
    if (state.viewmodel) {
      const sway = spd > 0.25 ? Math.sin(state.bobPhase * 1.2) * 0.02 : 0;
      state.viewmodel.position.set(sway, 0, 0);
    }
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
    updateReticleFocus();
  }

  function worldToDiagram(wx, wz) {
    const d = state.graph?.layoutDiagram;
    if (!d?.scale) return null;
    return { x: wx / d.scale + d.cx, y: wz / d.scale + d.cy };
  }

  function drawMinimap() {
    const mm = document.getElementById("ds-walk-minimap");
    if (!mm) return;
    const ctx = mm.getContext("2d");
    const W = mm.width = 200, H = mm.height = 140;
    ctx.fillStyle = "rgba(4,16,31,0.94)";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(2,200,255,0.35)";
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    ctx.font = "8px system-ui,sans-serif";
    ctx.fillStyle = "rgba(158,192,220,0.85)";
    ctx.fillText("Diagram links", 6, 11);

    if (!state.chambers?.length) return;

    const pad = 8;
    const rw = W - pad * 2, rh = H - pad * 2 - 8;
    const hasDiagram = state.chambers.every(ch => Number.isFinite(ch.pos?.diagramX));

    let toX, toY;
    if (hasDiagram) {
      const dxs = state.chambers.map(ch => ch.pos.diagramX);
      const dys = state.chambers.map(ch => ch.pos.diagramY);
      const minDX = Math.min(...dxs) - 20, maxDX = Math.max(...dxs) + 20;
      const minDY = Math.min(...dys) - 20, maxDY = Math.max(...dys) + 20;
      const scale = Math.min(rw / (maxDX - minDX || 1), rh / (maxDY - minDY || 1));
      const ox = pad + (rw - (maxDX - minDX) * scale) / 2;
      const oy = pad + 10 + (rh - (maxDY - minDY) * scale) / 2;
      toX = x => ox + (x - minDX) * scale;
      toY = y => oy + (y - minDY) * scale;
    } else if (state.bounds) {
      const b = state.bounds;
      const scale = Math.min(rw / (b.maxX - b.minX), rh / (b.maxZ - b.minZ));
      const ox = pad + (rw - (b.maxX - b.minX) * scale) / 2;
      const oy = pad + 10 + (rh - (b.maxZ - b.minZ) * scale) / 2;
      toX = x => ox + (x - b.minX) * scale;
      toY = z => oy + (z - b.minZ) * scale;
    } else return;

    const corridors = state.graph?.corridors || [];
    corridors.forEach(cor => {
      const a = cor.from.pos, b = cor.to.pos;
      const ax = hasDiagram ? a.diagramX : a.x;
      const ay = hasDiagram ? a.diagramY : a.z;
      const bx = hasDiagram ? b.diagramX : b.x;
      const by = hasDiagram ? b.diagramY : b.z;
      if (![ax, ay, bx, by].every(Number.isFinite)) return;
      const col = cor.color ?? 0xd4a060;
      ctx.strokeStyle = "#" + col.toString(16).padStart(6, "0");
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = cor.media === "hdmi" || cor.media === "usb" ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(toX(ax), toY(ay));
      ctx.lineTo(toX(bx), toY(by));
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    state.chambers.forEach(ch => {
      const px = hasDiagram ? ch.pos.diagramX : ch.pos.x;
      const py = hasDiagram ? ch.pos.diagramY : ch.pos.z;
      if (!Number.isFinite(px) || !Number.isFinite(py)) return;
      const theme = zoneTheme(ch.zone);
      const active = ch.id === state.focusId;
      ctx.fillStyle = "#" + theme.accent.toString(16).padStart(6, "0");
      ctx.beginPath();
      ctx.arc(toX(px), toY(py), active ? 5.5 : 4, 0, Math.PI * 2);
      ctx.fill();
      if (active) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });

    const diag = worldToDiagram(state.pos.x, state.pos.z);
    let plx, ply;
    if (diag && hasDiagram) {
      plx = toX(diag.x);
      ply = toY(diag.y);
    } else {
      plx = toX(state.pos.x);
      ply = toY(state.pos.z);
    }
    drawMinimapPlayer(ctx, plx, ply);
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

  function animateDust(dt) {
    const pts = state.dustParticles;
    if (!pts?.geometry?.attributes?.position) return;
    const arr = pts.geometry.attributes.position.array;
    for (let i = 0; i < arr.length / 3; i++) {
      arr[i * 3 + 1] += dt * (0.12 + (i % 7) * 0.015);
      if (arr[i * 3 + 1] > 9.5) arr[i * 3 + 1] = 0.6 + Math.random() * 0.5;
    }
    pts.geometry.attributes.position.needsUpdate = true;
    pts.rotation.y += dt * 0.015;
  }

  function loop(now) {
    if (!state.renderer || !state.scene || !state.camera) return;
    const t = (now || performance.now()) / 1000;
    const dt = Math.min(0.05, state.lastFrame ? t - state.lastFrame : 0.016);
    state.lastFrame = t;
    state.clock += dt;
    updatePlayer(dt);
    animateCables(state.clock);
    animateDust(dt);
    updateReticleFocus();
    window.__DS_MISSIONS?.animateWaypoints?.(state, state.clock);
    if (state.mission && !state.mission.complete) window.__DS_MISSIONS?.renderHud?.(state.mission);
    drawMinimap();
    state.renderer.render(state.scene, state.camera);
    state.animId = requestAnimationFrame(loop);
  }

  function hudHtml(mode, tab) {
    const title = mode === "retro" ? "CABLE PATHS" : "TOPOLOGY TOUR";
    const showPaths = tab !== "network";
    return `<div class="ds-walk-hud">
      <div class="ds-walk-hud-top">
        <strong class="ds-walk-title">${title}</strong>
        <span class="ds-walk-hint">Tap devices below · follow link buttons · drag to look · minimap to jump</span>
        <button type="button" class="ds-walk-btn ds-walk-audio-btn" data-action="audio-toggle" title="Toggle music">♫</button>
        <button type="button" class="ds-walk-close" title="Exit walkthrough">✕</button>
      </div>
      <div class="ds-walk-xp-track"><div class="ds-walk-xp-bar" id="ds-walk-xp-bar"></div></div>
      <div class="ds-walk-hud-mid">
        <button type="button" class="ds-walk-btn" data-action="trace-av">Trace AV link</button>
        <button type="button" class="ds-walk-btn" data-action="trace-poe">Trace PoE link</button>
        <button type="button" class="ds-walk-btn" data-action="prev-dev" title="Previous device">‹ Prev</button>
        <button type="button" class="ds-walk-btn" data-action="next-dev" title="Next device">Next ›</button>
        <button type="button" class="ds-walk-btn primary" data-action="inspect" title="Open device details">Inspect</button>
        ${showPaths ? `<button type="button" class="ds-walk-btn${mode === "retro" ? " active" : ""}" data-action="mode-retro" title="Walk walled paths along your diagram links">Cable paths</button>` : ""}
        <button type="button" class="ds-walk-btn${mode === "corridor" ? " active" : ""}" data-action="mode-corridor" title="Open floor tour matching your diagram">Open tour</button>
      </div>
      <div class="ds-walk-links" id="ds-walk-links" hidden></div>
      <div class="ds-walk-mission" id="ds-walk-mission"></div>
      <div class="ds-walk-devices" id="ds-walk-devices"></div>
      <div class="ds-walk-focus" id="ds-walk-focus" hidden></div>
      <div class="ds-walk-status" id="ds-walk-status">Mission briefing loading…</div>
    </div>`;
  }

  function bindDpad() {
    const map = { fwd: "w", back: "s", left: "a", right: "d" };
    state.overlay?.querySelectorAll("[data-move]").forEach(btn => {
      const key = map[btn.dataset.move];
      if (!key) return;
      const down = e => { e.preventDefault(); state.keys[key] = true; };
      const up = () => { state.keys[key] = false; };
      btn.addEventListener("pointerdown", down);
      btn.addEventListener("pointerup", up);
      btn.addEventListener("pointerleave", up);
      btn.addEventListener("pointercancel", up);
    });
  }

  function bindHud() {
    bindDpad();
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
      else if (a === "inspect") interactNearby();
      else if (a === "mission-start") {
        e.preventDefault();
        e.stopPropagation();
        window.__DS_MISSIONS?.dismissBriefing?.(state.mission, state.mission?._briefingStart);
        window.__DS_WALK_AUDIO?.sfx?.missionStart?.();
        window.__DS_WALK_AUDIO?.start?.();
        setStatus("Mission active — deploy to the floor");
      }
      else if (a === "mission-replay") {
        if (state.graph) {
          state.mission = window.__DS_MISSIONS?.startCampaign(state.graph, state);
          state.overlay?.classList.remove("ds-walk-victory");
          window.__DS_MISSIONS?.renderHud?.(state.mission);
          window.__DS_MISSIONS?.syncWaypoints?.(state, state.mission, state.graph);
          window.__DS_MISSIONS?.renderBriefing?.(state.mission, () => {
            window.__DS_MISSIONS?.syncWaypoints?.(state, state.mission, state.graph);
            setStatus("Mission active — follow the glowing waypoints");
          });
        }
      }
      else if (a === "fp-close") window.__DS_FIELD_PANEL?.close?.();
      else if (a === "fp-fly") {
        const id = document.getElementById("ds-field-panel")?.dataset?.chamberId;
        const ch = state.chambers.find(c => c.id === id);
        if (ch) teleportToChamber(ch, false);
      }
      else if (a === "fp-trace-poe") startTrace("poe");
      else if (a === "fp-trace-av") startTrace("av");
      else if (a === "audio-toggle") {
        const muted = window.__DS_WALK_AUDIO?.toggleMute?.();
        btn.textContent = muted ? "♪̸" : "♫";
        btn.classList.toggle("muted", !!muted);
        if (!muted && !window.__DS_WALK_AUDIO?.isRunning?.()) window.__DS_WALK_AUDIO?.start?.();
      }
    });
  }

  function startMissionFromBriefing() {
    if (!state.mission || state.mission.briefingSeen) return false;
    window.__DS_MISSIONS?.dismissBriefing?.(state.mission, state.mission._briefingStart);
    setStatus("Mission active — follow the glowing waypoints");
    return true;
  }

  function setStatus(msg) {
    const el = document.getElementById("ds-walk-status");
    if (el) { el.textContent = msg; el.classList.remove("ds-walk-error"); }
  }

  function chamberWorldPos(ch) {
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
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      state.keys[k] = e.type === "keydown";
      if (e.type === "keydown") {
        if (e.key === "Escape") {
          e.preventDefault();
          const panel = document.getElementById("ds-field-panel");
          if (panel && !panel.hidden) {
            window.__DS_FIELD_PANEL?.close?.();
            return;
          }
          close();
          return;
        }
        if (e.key === "[" || e.key === "{") { e.preventDefault(); cycleDevice(-1); return; }
        if (e.key === "]" || e.key === "}") { e.preventDefault(); cycleDevice(1); return; }
        if (e.key === "Tab") { e.preventDefault(); cycleDevice(e.shiftKey ? -1 : 1); return; }
        if (e.key === "e" || e.key === "E") { e.preventDefault(); interactNearby(); return; }
        if (e.key === "Enter" && startMissionFromBriefing()) { e.preventDefault(); return; }
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
      window.__DS_WALK_AUDIO?.start?.();
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
          const ch = pickDeviceAt(e.clientX, e.clientY, canvas) || state.reticleChamber;
          if (ch) openFieldPanel(ch);
          else if (state.overlay?.classList.contains("ds-field-panel-open"))
            window.__DS_FIELD_PANEL?.close?.();
        }
      }
      state.lookDrag = false;
      downPos = null;
    };
    const onDbl = () => safePointerLock(canvas);
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
    if (state.viewmodel && state.camera) state.camera.remove(state.viewmodel);
    state.viewmodel = null;
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
    state.dustParticles = null;
    state.renderer?.dispose?.();
    state.renderer = null;
    state.scene = null;
    state.camera = null;
    state.maze = null;
    state.topology = null;
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
    overlay.className = `ds-walk-overlay ds-walk-epic ds-walk-${mode}`;
    overlay.innerHTML = `${hudHtml(mode, studio.tab)}
      <div class="ds-walk-stage">
        <div class="ds-walk-vignette" aria-hidden="true"></div>
        <div class="ds-walk-panel-backdrop" id="ds-walk-panel-backdrop" hidden data-action="fp-close" title="Click to keep walking" aria-label="Close panel"></div>
        <div class="ds-walk-letterbox ds-walk-letterbox-top" aria-hidden="true"></div>
        <div class="ds-walk-letterbox ds-walk-letterbox-bottom" aria-hidden="true"></div>
        <div class="ds-walk-crosshair" aria-hidden="true"></div>
        <div class="ds-walk-prompt" id="ds-walk-prompt" hidden>Press E to inspect</div>
        <div class="ds-walk-inspect" id="ds-walk-inspect" hidden></div>
        <div class="ds-walk-toast" id="ds-walk-toast"></div>
        <div class="ds-walk-compass" id="ds-walk-compass" aria-hidden="true"><span>N</span></div>
        <canvas id="ds-walk-minimap" class="ds-walk-minimap" title="Click a device to jump there"></canvas>
        <div class="ds-walk-dpad" id="ds-walk-dpad" aria-label="Move">
          <button type="button" class="ds-walk-dpad-btn" data-move="fwd" aria-label="Forward">▲</button>
          <button type="button" class="ds-walk-dpad-btn ds-walk-dpad-mid" data-move="left" aria-label="Left">◀</button>
          <button type="button" class="ds-walk-dpad-btn ds-walk-dpad-mid" data-move="right" aria-label="Right">▶</button>
          <button type="button" class="ds-walk-dpad-btn" data-move="back" aria-label="Back">▼</button>
        </div>
        <div class="ds-walk-canvas-wrap">
          <canvas id="ds-walk-canvas"></canvas>
        </div>
        <aside class="ds-field-panel" id="ds-field-panel" hidden aria-label="Device inspect"></aside>
      </div>`;
    bindHud();

    const canvas = overlay.querySelector("#ds-walk-canvas");
    bindInput(canvas);
    setStatus("Loading walkthrough…");
    await waitForCanvasSize(canvas);

    try {
      state.overlay?.classList.add("ds-walk-loading");
      if (mode === "retro") await initRetroMaze(studio, canvas, graph);
      else await initCorridor(studio, canvas, graph);
      initMissionSystem(graph);
      loop();
      state.overlay?.classList.remove("ds-walk-loading");
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

  async function rebuild(studio) {
    if (!state.mode || !studio) return;
    if (studio.tab !== "room" && studio.tab !== "network") return;
    const graph = buildGraph(studio);
    if (!graph?.chambers.length) {
      setStatus(studio.tab === "room" ? "No room devices to walk" : "No network devices to walk");
      return;
    }
    const mode = state.mode;
    const canvas = state.overlay?.querySelector("#ds-walk-canvas");
    if (!canvas) return;
    const briefingSeen = !!state.mission?.briefingSeen;
    window.__DS_FIELD_PANEL?.close?.();
    cancelAnimationFrame(state.animId);
    state.animId = 0;
    disposeScene();
    state.studio = studio;
    try {
      if (mode === "retro") await initRetroMaze(studio, canvas, graph);
      else await initCorridor(studio, canvas, graph);
      if (window.__DS_MISSIONS) {
        state.mission = window.__DS_MISSIONS.startCampaign(graph, state);
        if (briefingSeen) {
          state.mission.briefingSeen = true;
          window.__DS_MISSIONS.dismissBriefing?.(state.mission);
        }
        window.__DS_MISSIONS.renderHud(state.mission);
        window.__DS_MISSIONS.syncWaypoints(state, state.mission, graph);
        if (!briefingSeen) {
          window.__DS_MISSIONS.renderBriefing(state.mission, () => {
            window.__DS_MISSIONS.syncWaypoints(state, state.mission, graph);
            setStatus("Mission active — follow the glowing waypoints");
            safePointerLock(canvas);
          });
        } else setStatus(`Switched to ${graph.kind} layout`);
      }
      window.__DS_FIELD_PANEL?.bindWalk?.(state);
      loop();
    } catch (err) {
      console.error("[DS Walk rebuild]", err);
      showWalkError(`Rebuild failed: ${err.message}`);
    }
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
    window.__DS_MISSIONS?.cleanupBriefing?.();
    window.__DS_FIELD_PANEL?.close?.();
    window.__DS_WALK_AUDIO?.stop?.();
    state.mode = null;
    if (!silent) state.studio = null;
  }

  function debugStats() {
    return {
      mode: state.mode,
      pos: { x: state.pos.x, z: state.pos.z },
      pods: state.devicePods.length,
      cables: state.cables.length,
      hasRenderer: !!state.renderer,
      photos: state.devicePods.filter(p => p.userData?.chamber?.photoUrl).length,
      mission: !!state.mission,
      missionComplete: !!state.mission?.complete
    };
  }

  window.__DS_WALK = { open, close, rebuild, toggle: (s, m) => state.mode ? close(true) : open(s, m), isOpen: () => !!state.mode, debugStats };
})();

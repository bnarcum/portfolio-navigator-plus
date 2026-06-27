/**
 * Design Studio Walk — Minecraft / Roblox voxel world helpers
 */
(function () {
  "use strict";

  const BLOCK = 1;
  const WOOL = {
    cat6: 0xc2a060, cat6a: 0xd4b878, hdmi: 0x3eb489, usb: 0x44bb88,
    "fiber-sm": 0x5ca8e8, "fiber-mm": 0x6eb8ff, speaker: 0xb888e8, control: 0xd8a0ff,
    default: 0x9aa0a8
  };

  function makePixelTexture(THREE, drawFn, size = 16) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    drawFn(canvas.getContext("2d"), size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function grassTop(THREE) {
    return makePixelTexture(THREE, (ctx, s) => {
      ctx.fillStyle = "#5a9e3a";
      ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 28; i++) {
        ctx.fillStyle = i % 2 ? "#4d8f32" : "#6bb048";
        ctx.fillRect((Math.random() * s) | 0, (Math.random() * s) | 0, 1, 1);
      }
    });
  }

  function grassSide(THREE) {
    return makePixelTexture(THREE, (ctx, s) => {
      ctx.fillStyle = "#6b4f2a";
      ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = "#5a9e3a";
      ctx.fillRect(0, 0, s, (s * 0.35) | 0);
    });
  }

  function stoneTex(THREE) {
    return makePixelTexture(THREE, (ctx, s) => {
      ctx.fillStyle = "#8a8a8a";
      ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 20; i++) {
        const g = 110 + ((Math.random() * 40) | 0);
        ctx.fillStyle = `rgb(${g},${g},${g})`;
        ctx.fillRect((Math.random() * s) | 0, (Math.random() * s) | 0, 2, 2);
      }
    });
  }

  function dirtTex(THREE) {
    return makePixelTexture(THREE, (ctx, s) => {
      ctx.fillStyle = "#6b4f2a";
      ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 16; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? "#5c4324" : "#7a5c34";
        ctx.fillRect((Math.random() * s) | 0, (Math.random() * s) | 0, 2, 1);
      }
    });
  }

  function blockMat(THREE, tex, color) {
    return new THREE.MeshLambertMaterial({
      map: tex || null,
      color: color ?? 0xffffff
    });
  }

  function woolMat(THREE, media) {
    const c = WOOL[media] || WOOL.default;
    return blockMat(THREE, null, c);
  }

  function sampleSegment(ax, az, bx, bz, step) {
    const pts = [];
    const len = Math.hypot(bx - ax, bz - az) || 0.1;
    const n = Math.min(120, Math.max(2, Math.ceil(len / step)));
    const perpX = -(bz - az) / len;
    const perpZ = (bx - ax) / len;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const cx = ax + (bx - ax) * t;
      const cz = az + (bz - az) * t;
      for (const off of [-1, 0, 1]) {
        pts.push({ x: cx + perpX * off * BLOCK, z: cz + perpZ * off * BLOCK });
      }
    }
    return pts;
  }

  function addInstancedBlocks(THREE, scene, points, mat, y = 0.5, sx = BLOCK, sy = BLOCK, sz = BLOCK) {
    if (!points.length) return null;
    const geo = new THREE.BoxGeometry(sx, sy, sz);
    const mesh = new THREE.InstancedMesh(geo, mat, points.length);
    const m = new THREE.Matrix4();
    points.forEach((p, i) => {
      m.makeTranslation(p.x, y, p.z);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    scene.add(mesh);
    return mesh;
  }

  function addVoxelWorld(THREE, scene, bounds, graph, disposables, colliders) {
    const grass = grassTop(THREE);
    const side = grassSide(THREE);
    const stone = stoneTex(THREE);
    const dirt = dirtTex(THREE);
    [grass, side, stone, dirt].forEach(t => disposables.push(t));

    const w = Math.max(bounds.maxX - bounds.minX + 20, 28);
    const d = Math.max(bounds.maxZ - bounds.minZ + 20, 28);
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cz = (bounds.minZ + bounds.maxZ) / 2;

    const materials = blockMat(THREE, grass);
    const floorGeo = new THREE.BoxGeometry(w, BLOCK, d);
    const floor = new THREE.Mesh(floorGeo, materials);
    floor.position.set(cx, -0.5, cz);
    scene.add(floor);

    const pathPts = [];
    (graph?.corridors || []).forEach(cor => {
      const ax = cor.from.pos.x, az = cor.from.pos.z;
      const bx = cor.to.pos.x, bz = cor.to.pos.z;
      pathPts.push(...sampleSegment(ax, az, bx, bz, BLOCK * 0.85));
    });
    if (pathPts.length) {
      addInstancedBlocks(THREE, scene, pathPts, blockMat(THREE, stone), 0.5);
    }

    (graph?.chambers || []).forEach(ch => {
      const px = ch.pos.x, pz = ch.pos.z;
      const pedestal = new THREE.Mesh(
        new THREE.BoxGeometry(BLOCK * 1.4, BLOCK * 1.2, BLOCK * 1.4),
        blockMat(THREE, stone)
      );
      pedestal.position.set(px, 0.1, pz);
      scene.add(pedestal);
      if (colliders) colliders.push({ x: px, z: pz, r: 1.05, kind: "pedestal", id: ch.id });
    });

    const pillarMat = blockMat(THREE, stone);
    const ph = 6;
    const corners = [
      [bounds.minX - 4, bounds.minZ - 4],
      [bounds.maxX + 4, bounds.minZ - 4],
      [bounds.minX - 4, bounds.maxZ + 4],
      [bounds.maxX + 4, bounds.maxZ + 4]
    ];
    corners.forEach(([x, z]) => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(BLOCK, ph, BLOCK), pillarMat);
      col.position.set(x, ph / 2 - 0.5, z);
      scene.add(col);
      if (colliders) colliders.push({ x, z, r: 0.72, kind: "pillar" });
    });

    return { grass, stone, materials };
  }

  function setBlockSky(THREE, scene) {
    const tex = makePixelTexture(THREE, (ctx, s) => {
      for (let y = 0; y < s; y++) {
        const t = y / s;
        const r = (80 + t * 40) | 0;
        const g = (160 + t * 60) | 0;
        const b = (255 - t * 20) | 0;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(0, y, s, 1);
      }
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 6; i++) {
        const cx = 4 + i * 2 + (i % 2);
        const cy = 3 + (i % 3);
        ctx.fillRect(cx, cy, 2, 1);
        ctx.fillRect(cx + 1, cy - 1, 1, 3);
      }
    }, 32);
    scene.background = tex;
    scene.fog = new THREE.Fog(0x8ec8f8, 35, 95);
    return tex;
  }

  function makeAvatar(THREE) {
    const g = new THREE.Group();
    g.userData.kind = "avatar";
    const skin = blockMat(THREE, null, 0xd4a574);
    const shirt = blockMat(THREE, null, 0x2b6cb8);
    const pants = blockMat(THREE, null, 0x2d3748);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.72, 0.72), skin);
    head.position.y = 1.62;
    g.add(head);
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.9, 0.42), shirt);
    torso.position.y = 0.86;
    g.add(torso);
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.72, 0.36), pants);
    legL.position.set(-0.2, 0.36, 0);
    g.add(legL);
    const legR = legL.clone();
    legR.position.x = 0.2;
    g.add(legR);
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.72, 0.32), shirt);
    armL.position.set(-0.58, 0.9, 0);
    g.add(armL);
    const armR = armL.clone();
    armR.position.x = 0.58;
    g.add(armR);
    return g;
  }

  function makeBlockViewmodel(THREE, camera) {
    const g = new THREE.Group();
    g.userData.kind = "viewmodel";
    const skin = blockMat(THREE, null, 0xd4a574);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.72, 0.22), skin);
    arm.position.set(0.28, -0.2, -0.45);
    g.add(arm);
    const item = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, 0.18), blockMat(THREE, null, 0x02c8ff));
    item.position.set(0.12, -0.05, -0.55);
    g.add(item);
    camera.add(g);
    return g;
  }

  window.__DS_WALK_VOXEL = {
    BLOCK, WOOL, woolMat, addVoxelWorld, setBlockSky, makeAvatar, makeBlockViewmodel, sampleSegment
  };
})();

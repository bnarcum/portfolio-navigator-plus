/**
 * Design Studio Walk — 3D floor built only from diagram node + link positions
 */
(function () {
  "use strict";

  const WOOL = {
    cat6: 0xc2a060, cat6a: 0xd4b878, hdmi: 0x3eb489, usb: 0x44bb88,
    "fiber-sm": 0x5ca8e8, "fiber-mm": 0x6eb8ff, speaker: 0xb888e8, control: 0xd8a0ff,
    default: 0x9aa0a8
  };

  const ZONE_PAD = {
    rack: 0x4ab8d8, ceiling: 0x9b7bd4, display: 0x5a9e3a, table: 0xc8a060,
    wall: 0x7a8a9a, default: 0x6a8a72
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
      for (let i = 0; i < 24; i++) {
        ctx.fillStyle = i % 2 ? "#4d8f32" : "#6bb048";
        ctx.fillRect((Math.random() * s) | 0, (Math.random() * s) | 0, 1, 1);
      }
    });
  }

  function blockMat(THREE, tex, color) {
    return new THREE.MeshLambertMaterial({ map: tex || null, color: color ?? 0xffffff });
  }

  function woolMat(THREE, media) {
    return blockMat(THREE, null, WOOL[media] || WOOL.default);
  }

  /** Flat strip along one diagram link (exact from → to). */
  function addLinkPath(THREE, scene, ax, az, bx, bz, mat, width = 1.5, lift = 0.14) {
    const dx = bx - ax, dz = bz - az;
    const len = Math.hypot(dx, dz) || 0.1;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(len, 0.08, width),
      mat
    );
    mesh.position.set((ax + bx) / 2, lift, (az + bz) / 2);
    mesh.rotation.y = Math.atan2(dx, dz);
    scene.add(mesh);
    return mesh;
  }

  /**
   * Floor + link strips + device pads — positions come from diagram layout only.
   * No corner pillars or decorative geometry.
   */
  function addDiagramWorld(THREE, scene, bounds, graph, disposables) {
    const grass = grassTop(THREE);
    disposables.push(grass);

    const pad = 6;
    const w = Math.max(bounds.maxX - bounds.minX + pad * 2, 16);
    const d = Math.max(bounds.maxZ - bounds.minZ + pad * 2, 16);
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cz = (bounds.minZ + bounds.maxZ) / 2;

    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.5, d),
      blockMat(THREE, grass)
    );
    floor.position.set(cx, -0.25, cz);
    scene.add(floor);

    (graph?.corridors || []).forEach(cor => {
      const ax = cor.from.pos.x, az = cor.from.pos.z;
      const bx = cor.to.pos.x, bz = cor.to.pos.z;
      if (![ax, az, bx, bz].every(Number.isFinite)) return;
      addLinkPath(THREE, scene, ax, az, bx, bz, woolMat(THREE, cor.media), 1.55, 0.12);
    });

    (graph?.chambers || []).forEach(ch => {
      const px = ch.pos.x, pz = ch.pos.z;
      if (!Number.isFinite(px) || !Number.isFinite(pz)) return;
      const accent = ZONE_PAD[ch.zone] || ZONE_PAD.default;
      const padMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(2.15, 2.15, 0.1, 20),
        blockMat(THREE, null, accent)
      );
      padMesh.position.set(px, 0.18, pz);
      scene.add(padMesh);
    });
  }

  function setBlockSky(THREE, scene) {
    const tex = makePixelTexture(THREE, (ctx, s) => {
      for (let y = 0; y < s; y++) {
        const t = y / s;
        ctx.fillStyle = `rgb(${80 + t * 40 | 0},${160 + t * 60 | 0},${255 - t * 20 | 0})`;
        ctx.fillRect(0, y, s, 1);
      }
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 5; i++) {
        const cx = 3 + i * 3;
        ctx.fillRect(cx, 3 + (i % 2), 3, 1);
      }
    }, 32);
    scene.background = tex;
    scene.fog = new THREE.Fog(0x9ec8f0, 48, 110);
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
    WOOL, woolMat, addDiagramWorld, setBlockSky, makeAvatar, makeBlockViewmodel
  };
})();

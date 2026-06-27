/**
 * Design Studio — diagram layout → 3D world coordinates (single source of truth)
 */
(function () {
  "use strict";

  const NET_SCALE = 0.034;
  const ROOM_SCALE = 0.038;

  function nodeCenter(n) {
    return { x: n.x + (n.w || 76) / 2, y: n.y + (n.h || 46) / 2 };
  }

  function diagramToWorld(nodes, kind) {
    if (!nodes?.length) return { positions: {}, bounds: null };
    const centers = nodes.map(n => ({ id: n.id, ...nodeCenter(n) }));
    const xs = centers.map(c => c.x);
    const ys = centers.map(c => c.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const scale = kind === "room" ? ROOM_SCALE : NET_SCALE;
    const positions = {};
    nodes.forEach(n => {
      const c = nodeCenter(n);
      const layer = n.layer || "access";
      const yLift = kind === "room" && /ceiling|mic/i.test(n.stencilId || n.label || "") ? 2.5 : 3;
      positions[n.id] = {
        x: (c.x - cx) * scale,
        y: yLift,
        z: (c.y - cy) * scale,
        diagramX: c.x,
        diagramY: c.y
      };
    });
    const wx = Object.values(positions).map(p => p.x);
    const wz = Object.values(positions).map(p => p.z);
    const pad = kind === "network" ? 10 : 8;
    const bounds = {
      minX: Math.min(...wx) - pad,
      maxX: Math.max(...wx) + pad,
      minZ: Math.min(...wz) - pad,
      maxZ: Math.max(...wz) + pad
    };
    return { positions, bounds, center: { cx, cy }, scale };
  }

  function layerAisles(chambers) {
    const byLayer = {};
    chambers.forEach(ch => {
      const layer = ch.zone || "default";
      if (!byLayer[layer]) byLayer[layer] = [];
      byLayer[layer].push(ch);
    });
    return Object.entries(byLayer).map(([layer, list]) => {
      const xs = list.map(c => c.pos.x);
      const zs = list.map(c => c.pos.z);
      return {
        layer,
        minX: Math.min(...xs) - 3,
        maxX: Math.max(...xs) + 3,
        minZ: Math.min(...zs) - 3,
        maxZ: Math.max(...zs) + 3,
        cx: (Math.min(...xs) + Math.max(...xs)) / 2,
        cz: (Math.min(...zs) + Math.max(...zs)) / 2
      };
    });
  }

  function roomZones(studio, roomId) {
    const room = studio?.design?.rooms?.find(r => r.id === roomId);
    if (!room?.computedZones) return [];
    return Object.entries(room.computedZones).map(([zone, rect]) => ({
      zone,
      x: (rect.x + rect.w / 2 - room.layoutOrigin?.x || 0) * ROOM_SCALE * 0.02,
      z: (rect.y + rect.h / 2 - room.layoutOrigin?.y || 0) * ROOM_SCALE * 0.02,
      w: rect.w * ROOM_SCALE * 0.02,
      h: rect.h * ROOM_SCALE * 0.02
    }));
  }

  function distToSegment(px, pz, ax, az, bx, bz) {
    const dx = bx - ax, dz = bz - az;
    const len2 = dx * dx + dz * dz || 1e-6;
    let t = ((px - ax) * dx + (pz - az) * dz) / len2;
    t = Math.max(0, Math.min(1, t));
    const qx = ax + t * dx, qz = az + t * dz;
    return { dist: Math.hypot(px - qx, pz - qz), t, qx, qz };
  }

  /** Walkable pads + link segments aligned to diagram positions (single source of truth). */
  function buildWalkTopology(chambers, corridors, opts = {}) {
    if (!chambers?.length) return null;
    const padR = opts.padR ?? 2.35;
    const pathW = opts.pathWidth ?? 1.4;
    const cellSize = opts.cellSize ?? 2.15;

    const pads = chambers.map(ch => ({
      id: ch.id, x: ch.pos.x, z: ch.pos.z, r: padR, chamber: ch
    }));

    const segments = (corridors || []).map(cor => ({
      id: cor.id, cor,
      ax: cor.from.pos.x, az: cor.from.pos.z,
      bx: cor.to.pos.x, bz: cor.to.pos.z,
      width: pathW
    }));

    const xs = chambers.map(c => c.pos.x), zs = chambers.map(c => c.pos.z);
    const minX = Math.min(...xs) - 8, maxX = Math.max(...xs) + 8;
    const minZ = Math.min(...zs) - 8, maxZ = Math.max(...zs) + 8;
    const cols = Math.max(8, Math.ceil((maxX - minX) / cellSize) + 6);
    const rows = Math.max(8, Math.ceil((maxZ - minZ) / cellSize) + 6);
    const origin = { x: minX - 3 * cellSize, z: minZ - 3 * cellSize };

    const grid = Array.from({ length: rows }, () => Array(cols).fill(1));

    const toCell = (wx, wz) => ({
      c: Math.round((wx - origin.x) / cellSize),
      r: Math.round((wz - origin.z) / cellSize)
    });

    const cellToWorld = (r, c) => ({
      x: origin.x + c * cellSize,
      z: origin.z + r * cellSize
    });

    const carve = (r, c, rad = 1) => {
      for (let dr = -rad; dr <= rad; dr++) {
        for (let dc = -rad; dc <= rad; dc++) {
          const rr = r + dr, cc = c + dc;
          if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) grid[rr][cc] = 0;
        }
      }
    };

    const bresenham = (r0, c0, r1, c1, rad) => {
      let r = r0, c = c0;
      const dr = Math.abs(r1 - r0), dc = Math.abs(c1 - c0);
      const sr = r0 < r1 ? 1 : -1, sc = c0 < c1 ? 1 : -1;
      let err = dc - dr;
      for (;;) {
        carve(r, c, rad);
        if (r === r1 && c === c1) break;
        const e2 = 2 * err;
        if (e2 > -dr) { err -= dc; r += sr; }
        if (e2 < dc) { err += dr; c += sc; }
      }
    };

    pads.forEach(p => {
      const cell = toCell(p.x, p.z);
      p.gr = cell.r;
      p.gc = cell.c;
      carve(cell.r, cell.c, 2);
    });

    segments.forEach(s => {
      const a = toCell(s.ax, s.az), b = toCell(s.bx, s.bz);
      bresenham(a.r, a.c, b.r, b.c, 1);
    });

    const adj = {};
    chambers.forEach(ch => { adj[ch.id] = []; });
    segments.forEach(s => {
      const a = s.cor.from.id, b = s.cor.to.id;
      if (!adj[a]) adj[a] = [];
      if (!adj[b]) adj[b] = [];
      adj[a].push({ id: b, seg: s });
      adj[b].push({ id: a, seg: s });
    });

    function isWalkable(x, z) {
      for (const p of pads) {
        const dx = x - p.x, dz = z - p.z;
        if (dx * dx + dz * dz <= p.r * p.r) return true;
      }
      for (const s of segments) {
        if (distToSegment(x, z, s.ax, s.az, s.bx, s.bz).dist <= s.width * 0.55) return true;
      }
      return false;
    }

    function findPath(fromId, toId) {
      if (fromId === toId) return [];
      const q = [fromId];
      const prev = { [fromId]: null };
      const via = {};
      while (q.length) {
        const id = q.shift();
        if (id === toId) {
          const segs = [];
          let cur = toId;
          while (prev[cur]) {
            segs.unshift(via[cur]);
            cur = prev[cur];
          }
          return segs;
        }
        for (const n of adj[id] || []) {
          if (prev[n.id] !== undefined) continue;
          prev[n.id] = id;
          via[n.id] = n.seg;
          q.push(n.id);
        }
      }
      return null;
    }

    function pathWaypoints(fromId, toId) {
      const segs = findPath(fromId, toId);
      if (!segs?.length) return null;
      return segs.map(s => ({ x: (s.ax + s.bx) / 2, z: (s.az + s.bz) / 2 }));
    }

    const spawnPad = pads[0];
    return {
      pads, segments, grid, origin, cellSize, rows, cols,
      toCell, cellToWorld, isWalkable, findPath, pathWaypoints,
      spawn: spawnPad ? { r: spawnPad.gr, c: spawnPad.gc } : { r: 2, c: 2 },
      corridors
    };
  }

  window.__DS_WALK_LAYOUT = {
    diagramToWorld, layerAisles, roomZones, nodeCenter,
    buildWalkTopology, distToSegment
  };
})();

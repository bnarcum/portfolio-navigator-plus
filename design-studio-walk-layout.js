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

  window.__DS_WALK_LAYOUT = { diagramToWorld, layerAisles, roomZones, nodeCenter };
})();

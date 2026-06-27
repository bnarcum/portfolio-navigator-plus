/**
 * Design Studio — product photos (transparent heroes + Device Matrix) with room polish
 */
(function () {
  "use strict";

  const VW = 100;
  const VH = 56;
  const SELECT_RING = "#00d4ff";
  const PHOTO_PLATE = "#eef2f7";
  const PHOTO_PLATE_EDGE = "rgba(15,23,42,0.1)";

  /** Prefer matrix product shots (collaboration hardware) */
  const STENCIL_MATRIX = {
    "room-kit-eq": "room-kit-eq",
    "room-kit-pro": "room-kit-pro",
    "room-bar": "room-bar",
    "board-pro": "board-pro-75",
    "desk-pro": "desk-pro",
    "quad-cam": "quad-camera",
    "room-navigator": "room-navigator",
    "touch-10": "room-navigator"
  };

  /** Network / infra — Cisco brand family heroes (transparent PNGs) */
  const STENCIL_FAMILY = {
    "c9500-core": "catalyst-core",
    "c9500-core-2": "catalyst-core",
    "c9400-dist": "catalyst-core",
    "c9300-access": "catalyst-access",
    "c9200-access": "catalyst-access",
    "c9200-collab": "catalyst-access",
    "cw9179f": "catalyst-wireless",
    "mr57": "meraki-wireless",
    "c8200-sdwan": "sdwan",
    "c8200-sdwan-2": "sdwan",
    "mx85": "meraki-mx",
    "ms250": "meraki-switches",
    "n9k-spine": "nexus-one",
    "n9k-leaf": "nexus",
    "fpr-2130": "sf-enterprise",
    "fpr-1120": "sf-branch",
    "ucs-x": "ucs",
    "cat-center": "catalyst-center",
    "apic": "nexus",
    "ise-psn": "catalyst-center",
    "ise-pan": "catalyst-center",
    "vmanage": "sdwan"
  };

  /** Icons only — wrong or missing photo assets */
  const PHOTO_SKIP_STENCILS = new Set([
    "ceiling-mic", "table-mic",
    "display-75", "display-86",
    "conf-table-12", "conf-table-8", "credenza-rack",
    "internet", "mpls", "users-vlan", "umbrella-va"
  ]);

  const PHOTO_SKIP_SHAPES = new Set(["cloud", "user", "table", "rack"]);

  function isRoomStencil(stencilId) {
    return !!(window.__DS_STENCILS?.ROOM_DEVICES?.[stencilId]);
  }

  function matrixUrl(productId) {
    if (typeof window.matrixImageUrl === "function") return window.matrixImageUrl(productId);
    const e = window.MATRIX_BRIDGE?.products?.[productId];
    if (!e) return null;
    if (e.image) return e.image;
    const base = window.MATRIX_BRIDGE?.imageBase || "https://bnarcum.github.io/collaboration-device-matrix/devices/";
    return e.hash ? `${base}img-${e.hash}.webp` : null;
  }

  function familyUrl(familyId) {
    return (window.CPN_FAMILY_HERO_IMAGES || {})[familyId] || null;
  }

  function resolveUrl(stencilId, def) {
    if (!stencilId || !def) return null;
    if (def.decorative || PHOTO_SKIP_SHAPES.has(def.shape) || PHOTO_SKIP_STENCILS.has(stencilId)) return null;

    const matrixId = STENCIL_MATRIX[stencilId];
    if (matrixId) {
      const u = matrixUrl(matrixId);
      if (u) return u;
    }

    let familyId = STENCIL_FAMILY[stencilId];
    if (!familyId) {
      const famMap = window.__DS_STENCILS?.FAMILY_TO_STENCIL || {};
      for (const [fam, sid] of Object.entries(famMap)) {
        if (sid === stencilId) { familyId = fam; break; }
      }
    }
    if (familyId) return familyUrl(familyId);
    return null;
  }

  function renderDeviceSvg(def, w, h, selected, stencilId, photoUrl) {
    const shape = def?.shape || "switch";
    const room = isRoomStencil(stencilId);
    const sx = w / VW;
    const sy = h / VH;
    const scale = Math.min(sx, sy);
    const padX = (w - VW * scale) / 2;
    const padY = (h - VH * scale) / 2;
    const xform = `translate(${padX},${padY}) scale(${scale})`;
    const accent = room ? "#5a8ab0" : (window.__DS_STENCILS?.resolveAccent?.(def) || "#02C8FF");
    const ring = selected ? SELECT_RING : accent;
    const gid = "dsp-" + String(stencilId || shape).replace(/[^a-z0-9]/gi, "").slice(0, 10);
    const sel = selected ? " ds-node-selected" : "";
    const isCeilingMic = shape === "ceiling-mic";
    const isRound = isCeilingMic;
    const imgPad = isRound ? 8 : 4;
    const imgX = imgPad;
    const imgY = isRound ? 4 : 3;
    const imgW = VW - imgPad * 2;
    const imgH = isRound ? 48 : VH - 6;

    const plate = isRound
      ? `<ellipse class="ds-photo-plate" cx="50" cy="28" rx="${44}" ry="${21}" fill="${PHOTO_PLATE}" stroke="${PHOTO_PLATE_EDGE}" stroke-width="0.5"/>`
      : `<rect class="ds-photo-plate" x="4" y="3" width="${VW - 8}" height="${VH - 6}" rx="6" fill="${PHOTO_PLATE}" stroke="${PHOTO_PLATE_EDGE}" stroke-width="0.5"/>`;

    const frame = isRound
      ? `<ellipse class="ds-photo-frame" cx="50" cy="28" rx="46" ry="24" fill="none" stroke="${accent}" stroke-width="1"/>`
      : `<rect class="ds-photo-frame" x="1" y="1" width="${VW - 2}" height="${VH - 2}" rx="8" fill="none" stroke="${accent}" stroke-width="1"/>`;

    const clip = isRound
      ? `<clipPath id="${gid}-clip"><ellipse cx="50" cy="28" rx="40" ry="19"/></clipPath>`
      : `<clipPath id="${gid}-clip"><rect x="${imgX}" y="${imgY}" width="${imgW}" height="${imgH}" rx="4"/></clipPath>`;

    const selRing = selected
      ? (isRound
        ? `<ellipse cx="50" cy="28" rx="47" ry="25" fill="none" stroke="${ring}" stroke-width="2" opacity="0.9"/>`
        : `<rect x="0.5" y="0.5" width="${VW - 1}" height="${VH - 1}" rx="9" fill="none" stroke="${ring}" stroke-width="2" opacity="0.9"/>`)
      : "";

    return `<g class="ds-device ds-device-photo${sel}" transform="${xform}">
      <defs>${clip}</defs>
      ${plate}
      ${frame}
      <image class="ds-photo-img" href="${photoUrl}" xlink:href="${photoUrl}"
        x="${imgX}" y="${imgY}" width="${imgW}" height="${imgH}"
        clip-path="url(#${gid}-clip)" preserveAspectRatio="xMidYMid meet"/>
      ${selRing}
    </g>`;
  }

  function renderPreview(stencilId, def, accent, size) {
    const url = resolveUrl(stencilId, def);
    const sz = size || 22;
    if (url) {
      return `<span class="ds-st-photo-wrap"><img class="ds-st-photo" src="${url.replace(/"/g, "&quot;")}" width="${sz}" height="${sz}" alt="" loading="lazy"/></span>`;
    }
    return window.__DS_STENCILS?.renderSymbolPreview?.(
      window.__DS_STENCILS.resolveSymbolId(def, stencilId),
      accent,
      sz
    ) || "▣";
  }

  window.__DS_PHOTOS = {
    resolveUrl, renderDeviceSvg, renderPreview,
    PHOTO_SKIP_STENCILS, STENCIL_MATRIX, STENCIL_FAMILY, isRoomStencil
  };
})();

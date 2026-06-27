/**
 * Design Studio — product photos: matrix webp only when asset matches stencil semantics
 */
(function () {
  "use strict";

  const VW = 100;
  const VH = 62;
  const SELECT_GLOW = "#02C8FF";

  /**
   * Stencil → matrix bridge key. Each value MUST be the correct Cisco product photo.
   * Generic / third-party / logical nodes are omitted — they use vector stencils only.
   */
  const STENCIL_MATRIX = {
    "room-kit-eq": "room-kit-eq",
    "room-kit-pro": "room-kit-pro",
    "room-bar": "room-bar",
    "board-pro": "board-pro-75",
    "desk-pro": "desk-pro-g2",
    "quad-cam": "quad-camera",
    "room-navigator": "room-navigator",
    "touch-10": "touch-10",
    "ceiling-mic": "ceiling-mic-pro",
    "table-mic": "table-mic-pro"
  };

  /** Network gear — family hero PNGs (product family accurate) */
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
    "c8200-sdwan-2": "wan-routers",
    "mx85": "meraki-mx",
    "ms250": "meraki-switches",
    "n9k-spine": "nexus-one",
    "n9k-leaf": "nexus",
    "fpr-2130": "sf-enterprise",
    "fpr-1120": "sf-branch",
    "ucs-x": "ucs",
    "cat-center": "catalyst-center",
    "vmanage": "sdwan"
  };

  /** Never substitute a photo — vector stencil only */
  const PHOTO_SKIP_STENCILS = new Set([
    "display-75", "display-86",
    "conf-table-12", "conf-table-8", "credenza-rack",
    "internet", "mpls", "umbrella-va",
    "users-vlan", "ise-psn", "ise-pan", "apic"
  ]);

  const PHOTO_SKIP_SHAPES = new Set(["cloud", "user", "table", "rack", "display"]);

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
    if (PHOTO_SKIP_SHAPES.has(def.shape) || PHOTO_SKIP_STENCILS.has(stencilId)) return null;
    if (def.decorative) return null;

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
    const accent = room ? "#44a8e8" : (window.__DS_STENCILS?.resolveAccent?.(def) || "#02C8FF");
    const gid = "dsp-" + String(stencilId || shape).replace(/[^a-z0-9]/gi, "").slice(0, 10);
    const sel = selected ? " ds-node-selected" : "";
    const isCeilingMic = shape === "ceiling-mic";
    const isRound = isCeilingMic;
    const imgX = isRound ? 10 : 8;
    const imgY = isRound ? 6 : 6;
    const imgW = VW - imgX * 2;
    const imgH = isRound ? 44 : VH - 14;

    const chassis = isRound
      ? `<ellipse class="ds-photo-chassis" cx="50" cy="30" rx="48" ry="27" fill="url(#${gid}-glass)" stroke="url(#${gid}-rim)" stroke-width="1.25"/>`
      : `<rect class="ds-photo-chassis" x="1" y="1" width="${VW - 2}" height="${VH - 2}" rx="10"
          fill="url(#${gid}-glass)" stroke="url(#${gid}-rim)" stroke-width="1.25"/>`;

    const stage = isRound
      ? `<ellipse class="ds-photo-stage" cx="50" cy="28" rx="42" ry="20" fill="url(#${gid}-stage)"/>`
      : `<rect class="ds-photo-stage" x="${imgX - 2}" y="${imgY - 2}" width="${imgW + 4}" height="${imgH + 4}" rx="7" fill="url(#${gid}-stage)"/>`;

    const clip = isRound
      ? `<clipPath id="${gid}-clip"><ellipse cx="50" cy="28" rx="38" ry="18"/></clipPath>`
      : `<clipPath id="${gid}-clip"><rect x="${imgX}" y="${imgY}" width="${imgW}" height="${imgH}" rx="6"/></clipPath>`;

    const selRing = selected
      ? (isRound
        ? `<ellipse class="ds-photo-sel" cx="50" cy="30" rx="49" ry="28" fill="none" stroke="${SELECT_GLOW}" stroke-width="2"/>`
        : `<rect class="ds-photo-sel" x="0" y="0" width="${VW}" height="${VH}" rx="11" fill="none" stroke="${SELECT_GLOW}" stroke-width="2"/>`)
      : "";

    const accentBar = isRound ? "" : `<rect x="12" y="${VH - 8}" width="${VW - 24}" height="2" rx="1" fill="${accent}" opacity="0.45"/>`;

    return `<g class="ds-device ds-device-photo${sel}" transform="${xform}">
      <defs>
        <linearGradient id="${gid}-glass" x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0%" stop-color="${accent}" stop-opacity="0.28"/>
          <stop offset="35%" stop-color="#163a5c" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="#07182d"/>
        </linearGradient>
        <linearGradient id="${gid}-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${accent}" stop-opacity="0.85"/>
          <stop offset="50%" stop-color="#ffffff" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="${accent}" stop-opacity="0.55"/>
        </linearGradient>
        <radialGradient id="${gid}-stage" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#2a4a6a" stop-opacity="0.9"/>
          <stop offset="100%" stop-color="#0a1828" stop-opacity="0.95"/>
        </radialGradient>
        <filter id="${gid}-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.45"/>
          <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="${accent}" flood-opacity="${selected ? "0.35" : "0.12"}"/>
        </filter>
        <linearGradient id="${gid}-shine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#fff" stop-opacity="0.1"/>
          <stop offset="40%" stop-color="#fff" stop-opacity="0"/>
        </linearGradient>
        ${clip}
      </defs>
      <g filter="url(#${gid}-glow)">
        ${chassis}
        ${stage}
        <image class="ds-photo-img" href="${photoUrl}" xlink:href="${photoUrl}"
          x="${imgX}" y="${imgY}" width="${imgW}" height="${imgH}"
          clip-path="url(#${gid}-clip)" preserveAspectRatio="xMidYMid meet"/>
        ${!isRound ? `<rect x="1" y="1" width="${VW - 2}" height="${VH - 2}" rx="10" fill="url(#${gid}-shine)" pointer-events="none"/>` : ""}
      </g>
      ${accentBar}
      ${selRing}
    </g>`;
  }

  function renderPreview(stencilId, def, accent, size) {
    const url = resolveUrl(stencilId, def);
    const sz = size || 22;
    if (url) {
      return `<span class="ds-st-photo-wrap"><img class="ds-st-photo" src="${url.replace(/"/g, "&quot;")}" width="${sz}" height="${sz}" alt="" loading="lazy"/></span>`;
    }
    const sym = window.__DS_STENCILS?.resolveSymbolId?.(def, stencilId) || "switch";
    const color = accent || "#02C8FF";
    return `<svg class="ds-st-icon-svg" viewBox="0 0 80 80" width="${sz}" height="${sz}" aria-hidden="true" style="color:${color}">
      <use href="#icon-${sym}"/></svg>`;
  }

  window.__DS_PHOTOS = {
    resolveUrl, renderDeviceSvg, renderPreview,
    PHOTO_SKIP_STENCILS, STENCIL_MATRIX, STENCIL_FAMILY, isRoomStencil
  };
})();

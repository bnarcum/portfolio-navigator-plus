/**
 * Design Studio — real product photos on canvas (family heroes + Device Matrix)
 */
(function () {
  "use strict";

  const VW = 100;
  const VH = 56;

  /** matrix-bridge product id → used for collaboration hardware photos */
  const STENCIL_MATRIX = {
    "room-kit-eq": "room-kit-eq",
    "room-kit-pro": "room-kit-pro",
    "room-bar": "room-bar",
    "board-pro": "board-pro-75",
    "display-75": "board-pro-75",
    "display-86": "board-pro-75",
    "desk-pro": "desk-pro",
    "quad-cam": "quad-camera",
    "room-navigator": "room-navigator",
    "touch-10": "room-navigator"
  };

  /** stencil id → portfolio family hero (network + infra) */
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
    "vmanage": "sdwan",
    "ceiling-mic": "cisco-headsets",
    "table-mic": "cisco-headsets"
  };

  const SKIP_PHOTO_SHAPES = new Set(["cloud", "user", "table", "rack"]);

  function matrixUrl(productId) {
    if (typeof window.matrixImageUrl === "function") return window.matrixImageUrl(productId);
    const e = window.MATRIX_BRIDGE?.products?.[productId];
    if (!e) return null;
    if (e.image) return e.image;
    const base = window.MATRIX_BRIDGE?.imageBase || "https://bnarcum.github.io/collaboration-device-matrix/devices/";
    return e.hash ? `${base}img-${e.hash}.webp` : null;
  }

  function familyUrl(familyId) {
    const map = window.CPN_FAMILY_HERO_IMAGES || {};
    return map[familyId] || null;
  }

  function resolveUrl(stencilId, def) {
    if (!stencilId || !def) return null;
    if (def.decorative || SKIP_PHOTO_SHAPES.has(def.shape)) return null;

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
    if (familyId) {
      const u = familyUrl(familyId);
      if (u) return u;
    }
    return null;
  }

  function photoBlendMode(url) {
    if (!url) return "normal";
    if (/family-heroes\//i.test(url)) return "normal";
    return "darken";
  }

  function renderDeviceSvg(def, w, h, selected, stencilId, photoUrl) {
    const shape = def?.shape || "switch";
    const sx = w / VW;
    const sy = h / VH;
    const scale = Math.min(sx, sy);
    const padX = (w - VW * scale) / 2;
    const padY = (h - VH * scale) / 2;
    const xform = `translate(${padX},${padY}) scale(${scale})`;
    const accent = window.__DS_STENCILS?.resolveAccent?.(def) || "#02C8FF";
    const gid = "dsp-" + String(stencilId || shape).replace(/[^a-z0-9]/gi, "").slice(0, 10);
    const sel = selected ? " ds-node-selected" : "";
    const isCeilingMic = shape === "ceiling-mic";
    const isRound = isCeilingMic;
    const imgPad = isRound ? 8 : 4;
    const imgX = imgPad;
    const imgY = isRound ? 4 : 2;
    const imgW = VW - imgPad * 2;
    const imgH = isRound ? 48 : VH - 4;
    const blend = photoBlendMode(photoUrl);

    const chassis = isRound
      ? `<ellipse class="ds-photo-frame" cx="50" cy="28" rx="46" ry="24" fill="rgba(4,16,31,0.25)" stroke="${accent}" stroke-width="1.25"/>`
      : `<rect class="ds-photo-frame" x="1" y="1" width="${VW - 2}" height="${VH - 2}" rx="8" fill="rgba(4,16,31,0.2)" stroke="${accent}" stroke-width="1.15"/>
         <rect x="0" y="9" width="4" height="${VH - 18}" rx="2" fill="${accent}" opacity="0.85"/>`;

    const clip = isRound
      ? `<clipPath id="${gid}-clip"><ellipse cx="50" cy="28" rx="44" ry="22"/></clipPath>`
      : `<clipPath id="${gid}-clip"><rect x="2" y="2" width="${VW - 4}" height="${VH - 4}" rx="7"/></clipPath>`;

    const selRing = selected
      ? (isRound
        ? `<ellipse cx="50" cy="28" rx="47" ry="25" fill="none" stroke="${accent}" stroke-width="1.75" opacity="0.65"/>`
        : `<rect x="0.5" y="0.5" width="${VW - 1}" height="${VH - 1}" rx="9" fill="none" stroke="${accent}" stroke-width="1.75" opacity="0.65"/>`)
      : "";

    return `<g class="ds-device ds-device-photo${sel}" transform="${xform}">
      <defs>${clip}</defs>
      ${chassis}
      <image class="ds-photo-img" href="${photoUrl}" xlink:href="${photoUrl}"
        x="${imgX}" y="${imgY}" width="${imgW}" height="${imgH}"
        clip-path="url(#${gid}-clip)" preserveAspectRatio="xMidYMid meet"
        style="mix-blend-mode:${blend}"/>
      ${selRing}
    </g>`;
  }

  function renderPreview(stencilId, def, accent, size) {
    const url = resolveUrl(stencilId, def);
    const sz = size || 22;
    if (url) {
      const blend = photoBlendMode(url);
      return `<img class="ds-st-photo" src="${url.replace(/"/g, "&quot;")}" width="${sz}" height="${sz}" alt="" loading="lazy" style="mix-blend-mode:${blend}"/>`;
    }
    return window.__DS_STENCILS?.renderSymbolPreview?.(
      window.__DS_STENCILS.resolveSymbolId(def, stencilId),
      accent,
      sz
    ) || "▣";
  }

  window.__DS_PHOTOS = { resolveUrl, renderDeviceSvg, renderPreview, STENCIL_MATRIX, STENCIL_FAMILY };
})();

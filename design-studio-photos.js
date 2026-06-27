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


  const PHOTO_PLATE = "#f0f4f8";
  const PHOTO_PLATE_EDGE = "rgba(15,23,42,0.12)";

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
    const platePad = isRound ? 6 : 3;
    const imgPad = isRound ? 8 : 5;
    const imgX = imgPad;
    const imgY = isRound ? 4 : 3;
    const imgW = VW - imgPad * 2;
    const imgH = isRound ? 48 : VH - 6;

    const plate = isRound
      ? `<ellipse class="ds-photo-plate" cx="50" cy="28" rx="${46 - platePad}" ry="${24 - platePad}" fill="${PHOTO_PLATE}" stroke="${PHOTO_PLATE_EDGE}" stroke-width="0.75"/>`
      : `<rect class="ds-photo-plate" x="${1 + platePad}" y="${1 + platePad}" width="${VW - 2 - platePad * 2}" height="${VH - 2 - platePad * 2}" rx="6" fill="${PHOTO_PLATE}" stroke="${PHOTO_PLATE_EDGE}" stroke-width="0.75"/>`;

    const chassis = isRound
      ? `<ellipse class="ds-photo-frame" cx="50" cy="28" rx="46" ry="24" fill="none" stroke="${accent}" stroke-width="1.25"/>`
      : `<rect class="ds-photo-frame" x="1" y="1" width="${VW - 2}" height="${VH - 2}" rx="8" fill="none" stroke="${accent}" stroke-width="1.15"/>
         <rect x="0" y="9" width="4" height="${VH - 18}" rx="2" fill="${accent}" opacity="0.85"/>`;

    const clip = isRound
      ? `<clipPath id="${gid}-clip"><ellipse cx="50" cy="28" rx="42" ry="20"/></clipPath>`
      : `<clipPath id="${gid}-clip"><rect x="${imgPad - 1}" y="${imgPad - 1}" width="${imgW + 2}" height="${imgH + 2}" rx="5"/></clipPath>`;

    const selRing = selected
      ? (isRound
        ? `<ellipse cx="50" cy="28" rx="47" ry="25" fill="none" stroke="${accent}" stroke-width="1.75" opacity="0.65"/>`
        : `<rect x="0.5" y="0.5" width="${VW - 1}" height="${VH - 1}" rx="9" fill="none" stroke="${accent}" stroke-width="1.75" opacity="0.65"/>`)
      : "";

    return `<g class="ds-device ds-device-photo${sel}" transform="${xform}">
      <defs>${clip}</defs>
      ${plate}
      ${chassis}
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

  window.__DS_PHOTOS = { resolveUrl, renderDeviceSvg, renderPreview, STENCIL_MATRIX, STENCIL_FAMILY };
})();

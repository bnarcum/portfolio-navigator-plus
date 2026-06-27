/**
 * Design Studio — Field Tech inspect side panel (walk mode)
 */
(function () {
  "use strict";

  function esc(s) {
    return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  }

  function linksForChamber(ch, graph) {
    if (!graph?.corridors) return [];
    return graph.corridors.filter(c => c.from?.id === ch.id || c.to?.id === ch.id);
  }

  function cablesForChamber(ch, studio) {
    const all = studio?.design ? window.DesignStudio?.computeCables?.(studio.design) : [];
    if (!all?.length && typeof computeCables !== "undefined") {
      try { return []; } catch (_) { /* noop */ }
    }
    return (all || []).filter(c => c.fromId === ch.id || c.toId === ch.id || c.from === ch.label || c.to === ch.label);
  }

  function render(ch, studio, graph) {
    const panel = document.getElementById("ds-field-panel");
    if (!panel || !ch) return;
    const mode = graph?.kind === "room" ? "room" : "network";
    const def = window.__DS_STENCILS?.getDef?.(ch.stencilId, mode);
    const tip = window.__DS_MISSIONS?.tipFor?.(ch) || "";
    const links = linksForChamber(ch, graph);
    const linkRows = links.map(l => {
      const other = l.from?.id === ch.id ? l.to : l.from;
      return `<li><span class="ds-fp-media">${esc((l.media || "link").toUpperCase())}</span> ${esc(other?.label || "?")}${l.fromPort ? ` · ${esc(l.fromPort)}→${esc(l.toPort || "")}` : ""}</li>`;
    }).join("") || "<li class='muted'>No links from diagram</li>";

    const ports = (def?.ports || []).slice(0, 8).map(p => `<span class="ds-fp-port">${esc(p)}</span>`).join("");
    const pid = ch.pid || def?.pid || "";
    const ciscoUrl = pid && !/^N\/A/i.test(pid)
      ? `https://www.cisco.com/c/en/us/search.html?q=${encodeURIComponent(pid)}` : "";

    const exploreCtx = studio ? window.__DS_EXPLORE?.resolveContext?.(studio) : null;
    const docLink = exploreCtx?.docs?.[0];

    panel.hidden = false;
    panel.innerHTML = `
      <header class="ds-fp-head">
        <button type="button" class="ds-fp-close" data-action="fp-close" aria-label="Close">✕</button>
        <div class="ds-fp-title">
          <strong>${esc(ch.label)}</strong>
          ${pid ? `<span class="ds-fp-pid">${esc(pid)}</span>` : ""}
          <span class="ds-fp-zone">${esc((ch.zone || "device").toUpperCase())}</span>
        </div>
      </header>
      <div class="ds-fp-body">
        ${ch.photoUrl ? `<div class="ds-fp-photo"><img src="${esc(ch.photoUrl)}" alt="" loading="lazy"/></div>` : ""}
        <section class="ds-fp-section">
          <h4>Field note</h4>
          <p>${esc(tip)}</p>
        </section>
        ${ports ? `<section class="ds-fp-section"><h4>Ports</h4><div class="ds-fp-ports">${ports}</div></section>` : ""}
        <section class="ds-fp-section">
          <h4>Connections</h4>
          <ul class="ds-fp-links">${linkRows}</ul>
        </section>
        <section class="ds-fp-actions">
          <button type="button" class="ds-walk-btn" data-action="fp-fly">Fly here</button>
          <button type="button" class="ds-walk-btn" data-action="fp-trace-poe">Trace PoE</button>
          <button type="button" class="ds-walk-btn" data-action="fp-trace-av">Trace AV</button>
          ${pid ? `<button type="button" class="ds-walk-btn" data-action="fp-copy-pid">Copy PID</button>` : ""}
          ${ciscoUrl ? `<a class="ds-walk-btn ds-btn-link" href="${ciscoUrl}" target="_blank" rel="noopener noreferrer">Cisco.com ↗</a>` : ""}
          ${docLink ? `<a class="ds-walk-btn ds-btn-link" href="${docLink.url}" target="_blank" rel="noopener noreferrer">${esc(docLink.label || "Design guide")} ↗</a>` : ""}
        </section>
      </div>`;

    panel.dataset.chamberId = ch.id;
    panel.querySelector("[data-action=fp-close]")?.addEventListener("click", () => close());
    panel.querySelector("[data-action=fp-copy-pid]")?.addEventListener("click", () => {
      window.__DS_EXPERT?.copyText?.(pid).then?.(() => studio?.toast?.("PID copied"));
    });
  }

  function close() {
    const panel = document.getElementById("ds-field-panel");
    if (panel) { panel.hidden = true; panel.innerHTML = ""; delete panel.dataset.chamberId; }
    state?.overlay?.classList?.remove("ds-field-panel-open");
  }

  let state = null;
  function bindWalk(walkState) { state = walkState; }

  window.__DS_FIELD_PANEL = { render, close, bindWalk };
})();

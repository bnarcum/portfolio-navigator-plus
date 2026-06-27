/**
 * Design Studio — Deterministic intent engine (no AI).
 * Parses briefs → scores CVD/CVP/CT templates → generates cited design plans.
 */
(function DesignStudioIntentModule() {
  "use strict";

  const PILLARS = {
    "ai-dc": {
      label: "AI-Ready Data Centers",
      url: "https://www.cisco.com/c/en/us/solutions/data-center-virtualization/artificial-intelligence-machine-learning/index.html"
    },
    workplaces: {
      label: "Future-Proofed Workplaces",
      url: "https://www.cisco.com/c/en/us/solutions/collaboration/workplace-transformation/hybrid-work-design-guides.html"
    },
    resilience: {
      label: "Digital Resilience",
      url: "https://www.cisco.com/c/en/us/solutions/collateral/enterprise/design-zone-zero-trust.html"
    }
  };

  const ROOM_ALIASES = {
    huddle: /\bhuddle|small room\b/i,
    conference: /\bconference|medium collab|room kit eq\b/i,
    boardroom: /\bboardroom|board pro|executive board|large room|20 seat\b/i,
    training: /\btraining|classroom\b/i,
    executive: /\bexecutive office|exec office\b/i,
    teamsRoom: /\bteams room|microsoft teams|mtr\b/i,
    zoomRoom: /\bzoom room|\bzoom\b/i,
    divisible: /\bdivisible|all-hands\b/i,
    ctSmallCollab: /\bsmall collab|small collaboration\b/i,
    ctMediumDualDisplay: /\bdual display|video centric\b/i
  };

  const DEFAULT_CVD = {
    label: "Cisco Validated Designs",
    url: "https://www.cisco.com/go/cvd"
  };

  const DEFAULT_CT = {
    label: "Cisco hybrid work design guides",
    url: "https://www.cisco.com/c/en/us/solutions/collaboration/workplace-transformation/hybrid-work-design-guides.html"
  };

  /** Per-template scoring: keywords (+pts), pillar boost */
  const NET_SCORE_RULES = {
    snraCampus: { kw: [/snra|secure network reference/i, /zero.?trust campus/i, /enterprise campus/i], pillar: "resilience", pillarPts: 4 },
    campus3tierRedundant: { kw: [/3.?tier|redundant core|enterprise campus/i, /hospital|hq\b/i], pillar: "workplaces", pillarPts: 3 },
    campusCollapsed: { kw: [/collapsed core|small campus|500 user|smb/i], pillar: "workplaces", pillarPts: 4 },
    sdwanFull: { kw: [/sd-?wan|vmanage|multi-?site/i, /hq.*branch|8 branch|headquarter/i], pillar: "resilience", pillarPts: 5 },
    branchStandard: { kw: [/\bbranch\b/i, /remote office/i], pillar: "resilience", pillarPts: 3 },
    unifiedBranchMed: { kw: [/unified branch/i], pillar: "resilience", pillarPts: 6 },
    retailMeraki: { kw: [/retail|store|meraki/i], pillar: "workplaces", pillarPts: 4 },
    dcSpineLeaf: { kw: [/spine.?leaf|vxlan|nexus|data center|datacenter/i], pillar: "ai-dc", pillarPts: 5 },
    dcAciPod: { kw: [/aci pod|\baci\b/i], pillar: "ai-dc", pillarPts: 6 },
    dcAiMlFabric: { kw: [/ai\/?ml|gpu|inference|training cluster|llm/i], pillar: "ai-dc", pillarPts: 8 },
    k12District: { kw: [/k-?12|school|district/i], pillar: "workplaces", pillarPts: 5 },
    healthcareCampus: { kw: [/hospital|healthcare|clinical|medical/i], pillar: "workplaces", pillarPts: 6 },
    zeroTrustEdge: { kw: [/zero trust|sase|umbrella|duo/i], pillar: "resilience", pillarPts: 7 },
    hyperflexEdge: { kw: [/hyperflex|\bhx\b/i], pillar: "ai-dc", pillarPts: 4 },
    universityCampus: { kw: [/university|higher.?ed|college campus/i], pillar: "workplaces", pillarPts: 6 },
    manufacturingPlant: { kw: [/manufacturing|factory|plant|\bot\b|industrial/i], pillar: "resilience", pillarPts: 5 },
    sdAccessFabric: { kw: [/sd-?access|\bsda\b|fabric lan/i], pillar: "workplaces", pillarPts: 6 }
  };

  const PILLAR_DEFAULT_NET = {
    "ai-dc": "dcAiMlFabric",
    workplaces: "snraCampus",
    resilience: "zeroTrustEdge"
  };

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function isCiscoUrl(url) {
    if (!url || typeof url !== "string") return false;
    try {
      const h = new URL(url).hostname.toLowerCase();
      return h === "cisco.com" || h.endsWith(".cisco.com") || h === "webex.com" || h.endsWith(".webex.com");
    } catch { return false; }
  }

  function citeMeta(meta, fallback) {
    const label = meta?.cvd || meta?.ct || meta?.label || fallback?.label || "Reference";
    const url = meta?.cvdUrl || meta?.ctUrl || fallback?.url;
    if (!url || !isCiscoUrl(url)) return { label, url: fallback?.url || DEFAULT_CVD.url };
    return { label, url };
  }

  function detectPillar(t) {
    const scores = { "ai-dc": 0, workplaces: 0, resilience: 0 };
    if (/ai-?ready|gpu|nexus|spine|leaf|data center|datacenter|ucs|hyperflex|\baci\b|ml fabric|ndfc/i.test(t)) scores["ai-dc"] += 3;
    if (/webex|room kit|board pro|collab|hybrid|campus|wireless|catalyst center|workplace/i.test(t)) scores.workplaces += 3;
    if (/sd-?wan|zero trust|sase|firewall|ise|umbrella|resilien|thousandeyes|secure/i.test(t)) scores.resilience += 3;
    if (/future-?proofed workplace/i.test(t)) scores.workplaces += 5;
    if (/digital resilience/i.test(t)) scores.resilience += 5;
    if (/ai-?ready data center/i.test(t)) scores["ai-dc"] += 5;
    const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    return best[1] > 0 ? best[0] : null;
  }

  function parseNumbers(t) {
    const branches = parseInt(t.match(/(\d+)\s*(branch|site|location)s?\b/i)?.[1] || "0", 10);
    const stores = parseInt(t.match(/(\d+)\s*(store|retail)s?\b/i)?.[1] || "0", 10);
    const users = parseInt(t.match(/(\d[\d,]*)\s*users?\b/i)?.[1]?.replace(/,/g, "") || "0", 10);
    const roomsTotal = parseInt(t.match(/(\d+)\s*(room|conference|huddle|boardroom|meeting)s?\b/i)?.[1] || "0", 10);
    return { branches, stores, users, roomsTotal };
  }

  function parseRoomMix(t) {
    const mix = [];
    const re = /(\d+)\s*(conference|huddle|boardroom|training|executive|teams|zoom|divisible|small collab|dual display|classroom|meeting)\s*(room|rooms)?/gi;
    let m;
    while ((m = re.exec(t)) !== null) {
      const phrase = (m[2] + " " + (m[3] || "")).toLowerCase();
      let key = "conference";
      if (/huddle|small/.test(phrase)) key = "huddle";
      else if (/boardroom|board/.test(phrase)) key = "boardroom";
      else if (/training|classroom/.test(phrase)) key = "training";
      else if (/executive/.test(phrase)) key = "executive";
      else if (/teams/.test(phrase)) key = "teamsRoom";
      else if (/zoom/.test(phrase)) key = "zoomRoom";
      else if (/divisible|all-hands/.test(phrase)) key = "divisible";
      else if (/dual display/.test(phrase)) key = "ctMediumDualDisplay";
      else if (/small collab/.test(phrase)) key = "ctSmallCollab";
      mix.push({ key, count: Math.min(parseInt(m[1], 10), 24) });
    }
    if (mix.length) return mix;

    const nums = parseNumbers(t);
    const hasCollab = /room|webex|collab|hybrid|meeting|video|board|kit/i.test(t);
    if (!hasCollab && nums.roomsTotal === 0) return [];

    let singleKey = "conference";
    for (const [key, rx] of Object.entries(ROOM_ALIASES)) {
      if (rx.test(t)) { singleKey = key; break; }
    }
    const count = nums.roomsTotal || (hasCollab ? 1 : 0);
    if (count > 0) mix.push({ key: singleKey, count: Math.min(count, 24) });
    return mix;
  }

  function intentNeedsNetwork(t, roomMix, nums) {
    const totalRooms = roomMix.reduce((s, r) => s + r.count, 0);
    return /campus|sd-wan|sdwan|hospital|healthcare|k-12|k12|data center|datacenter|branch|retail|zero trust|sase|firewall|core|distrib|nexus|spine|hyperflex|aci|meraki|vmanage|gpu|fabric|snra|manufacturing|university/i.test(t)
      || nums.branches > 1 || nums.stores > 1 || totalRooms > 1
      || /ai-?ready data center|digital resilience|future-?proofed/i.test(t);
  }

  function parseIntent(text) {
    const raw = String(text || "").trim();
    const t = raw.toLowerCase();
    const pillar = detectPillar(t);
    const nums = parseNumbers(t);
    const roomMix = parseRoomMix(t);
    const signals = [];

    if (pillar) signals.push({ id: "pillar", label: PILLARS[pillar].label, value: pillar });
    if (nums.users) signals.push({ id: "users", label: "Users", value: String(nums.users) });
    if (nums.branches) signals.push({ id: "branches", label: "Branches", value: String(nums.branches) });
    if (nums.stores) signals.push({ id: "stores", label: "Stores", value: String(nums.stores) });
    roomMix.forEach(r => {
      const tpl = window.__DS_TEMPLATES?.ROOM_TEMPLATES?.[r.key];
      signals.push({ id: "room-" + r.key, label: tpl?.name || r.key, value: "×" + r.count });
    });

    return {
      raw, t, pillar, nums, roomMix,
      wantsNetwork: intentNeedsNetwork(t, roomMix, nums),
      signals
    };
  }

  function scoreNetworkTemplates(parsed) {
    const nets = window.__DS_TEMPLATES?.NETWORK_TEMPLATES || {};
    const ranked = [];

    for (const [key, tpl] of Object.entries(nets)) {
      let score = 0;
      const reasons = [];
      const rules = NET_SCORE_RULES[key] || { kw: [], pillar: null, pillarPts: 0 };

      (tpl.tags || []).forEach(tag => {
        if (parsed.t.includes(tag.replace(/-/g, " ")) || parsed.t.includes(tag)) {
          score += 3;
          reasons.push(`tag:${tag}`);
        }
      });

      rules.kw.forEach(rx => {
        if (rx.test(parsed.raw)) {
          score += 5;
          reasons.push(`kw:${rx.source.slice(0, 24)}`);
        }
      });

      if (parsed.pillar && rules.pillar === parsed.pillar) {
        score += rules.pillarPts || 3;
        reasons.push(`pillar:${parsed.pillar}`);
      }

      if (parsed.nums.stores > 0 && key === "retailMeraki") { score += 8; reasons.push("retail-count"); }
      if (parsed.nums.branches >= 3 && (key === "sdwanFull" || key === "unifiedBranchMed")) { score += 6; reasons.push("multi-branch"); }

      ranked.push({ key, tpl, score, reasons });
    }

    ranked.sort((a, b) => b.score - a.score);
    return ranked;
  }

  function pickNetworkKey(parsed, ranked) {
    if (!parsed.wantsNetwork) return null;
    const top = ranked[0];
    if (top && top.score >= 5) return top.key;
    if (parsed.pillar && PILLAR_DEFAULT_NET[parsed.pillar]) return PILLAR_DEFAULT_NET[parsed.pillar];
    if (/retail|store|meraki/i.test(parsed.t)) return "retailMeraki";
    if (parsed.nums.branches > 0) return parsed.nums.branches >= 3 ? "sdwanFull" : "branchStandard";
    return "campus3tierRedundant";
  }

  function buildPlan(parsed) {
    const ranked = scoreNetworkTemplates(parsed);
    const netKey = pickNetworkKey(parsed, ranked);
    const nets = window.__DS_TEMPLATES?.NETWORK_TEMPLATES || {};
    const rooms = window.__DS_TEMPLATES?.ROOM_TEMPLATES || {};
    const citations = [];
    const choices = [];

    let netRank = ranked.find(r => r.key === netKey) || null;
    if (netKey && nets[netKey]) {
      const cite = citeMeta(nets[netKey], DEFAULT_CVD);
      citations.push({ type: "network", key: netKey, ...cite });
      choices.push({
        kind: "network",
        key: netKey,
        label: nets[netKey].label,
        score: netRank?.score || 0,
        reasons: netRank?.reasons || ["default-for-brief"],
        cite
      });
    }

    const roomPlan = [];
    parsed.roomMix.forEach(spec => {
      const tpl = rooms[spec.key];
      if (!tpl) return;
      const cite = citeMeta(tpl, DEFAULT_CT);
      citations.push({ type: "room", key: spec.key, ...cite });
      roomPlan.push({ key: spec.key, count: spec.count, tpl, cite });
      choices.push({
        kind: "room",
        key: spec.key,
        label: tpl.name,
        count: spec.count,
        cite
      });
    });

    if (parsed.pillar && PILLARS[parsed.pillar]) {
      citations.unshift({
        type: "pillar",
        key: parsed.pillar,
        label: PILLARS[parsed.pillar].label,
        url: PILLARS[parsed.pillar].url
      });
    }

    const clarifications = [];
    if (parsed.wantsNetwork && netRank && netRank.score < 5)
      clarifications.push("Network template chosen from One Cisco pillar default — add SNRA, SD-WAN, or vertical keywords for a tighter CVD match.");
    if (/room|webex|collab/i.test(parsed.t) && !roomPlan.length)
      clarifications.push("Collaboration detected but no room count — add e.g. “18 conference rooms” or “6 huddles”.");

    return {
      parsed, netKey, netRank, ranked: ranked.slice(0, 3),
      roomPlan, citations, choices, clarifications
    };
  }

  function cloneBranchSites(design, branchCount) {
    if (branchCount <= 1) return 0;
    const extra = Math.min(branchCount - 1, 6);
    const seeds = design.nodes.filter(n => n.canvas !== "room" && /branch/i.test(n.label));
    if (!seeds.length) return 0;
    const seedIds = new Set(seeds.map(n => n.id));
    const seedLinks = design.links.filter(l => seedIds.has(l.from) && seedIds.has(l.to));
    let added = 0;
    for (let b = 2; b <= extra + 1; b++) {
      const dx = (b - 1) * 220;
      const idMap = new Map();
      seeds.forEach(n => {
        const id = "ds-" + Math.random().toString(36).slice(2, 10);
        idMap.set(n.id, id);
        const label = n.label.replace(/Branch-(\d+)/, "Branch-" + b).replace(/^Branch ([A-Z])/, "Branch-" + b + " $1");
        design.nodes.push({ ...n, id, label, x: n.x + dx });
      });
      seedLinks.forEach(l => {
        design.links.push({
          ...l,
          id: "ds-" + Math.random().toString(36).slice(2, 10),
          from: idMap.get(l.from),
          to: idMap.get(l.to),
          label: (l.label || "Link") + " · site " + b
        });
      });
      added++;
    }
    return added;
  }

  function executePlan(plan, design, deps) {
    const { applyNetworkTemplate, applyRoomTemplate, ROOM_TEMPLATES } = deps.templates;
    const STN = deps.stencils;
    const uid = deps.uid;
    const ROOM_LAYOUT_OX = deps.ROOM_LAYOUT_OX ?? 40;
    const ROOM_LAYOUT_OY = deps.ROOM_LAYOUT_OY ?? 40;
    const autoLayoutRoom = deps.autoLayoutRoom;

    design.nodes = [];
    design.links = [];
    design.rooms = [];

    if (plan.netKey) {
      applyNetworkTemplate(design, plan.netKey, 80, 80, STN);
      const branches = plan.parsed.nums.branches;
      if (branches > 1) cloneBranchSites(design, branches);
    }

    plan.roomPlan.forEach(spec => {
      for (let i = 0; i < spec.count; i++) {
        const roomId = uid();
        const rtpl = ROOM_TEMPLATES[spec.key];
        const roomName = spec.count > 1 ? `${rtpl?.name || "Room"} ${i + 1}` : (rtpl?.name || "Room 1");
        design.rooms.push({
          id: roomId, name: roomName, template: spec.key,
          width: rtpl?.w || 480, height: rtpl?.h || 360
        });
        applyRoomTemplate(design, spec.key, roomId, roomName, ROOM_LAYOUT_OX, ROOM_LAYOUT_OY, design.nodes, design.links, STN);
        autoLayoutRoom(design, roomId);
      }
    });

    if (design.rooms.length) design.activeRoomId = design.rooms[0].id;
    design.requirements = design.requirements || {};
    design.requirements.notes = plan.parsed.raw.slice(0, 2000);
    design.intentPlan = {
      at: new Date().toISOString(),
      netKey: plan.netKey,
      roomPlan: plan.roomPlan.map(r => ({ key: r.key, count: r.count })),
      pillar: plan.parsed.pillar,
      citations: plan.citations
    };
    return design;
  }

  function autoRemediate(design, rules, uid, STN, maxRounds = 3) {
    const applied = [];
    if (!rules?.validateDesign || !rules?.getSuggestions || !rules?.applyFix) return applied;

    for (let round = 0; round < maxRounds; round++) {
      const val = rules.validateDesign(design);
      const errors = (val.warnings || []).filter(w => w.severity === "error");
      if (!errors.length) break;

      const suggestions = rules.getSuggestions(design) || [];
      const fix = suggestions.find(s => /codec|PoE|orphan|Uplink|switch/i.test(s.label));
      if (!fix) break;
      if (rules.applyFix(design, fix, uid, STN)) applied.push(fix.label);
    }
    return applied;
  }

  function renderChipsHtml(signals) {
    if (!signals?.length) return '<div class="ds-intent-chips ds-intent-chips--empty"><span class="ds-intent-chip-hint">Parsed signals appear as you type</span></div>';
    return `<div class="ds-intent-chips" aria-live="polite">${signals.map(s =>
      `<span class="ds-intent-chip" data-signal="${escapeHtml(s.id)}"><strong>${escapeHtml(s.label)}</strong> ${escapeHtml(s.value)}</span>`
    ).join("")}</div>`;
  }

  function renderRationaleHtml(plan, score, fixes) {
    const lines = [];
    if (plan.parsed.pillar && PILLARS[plan.parsed.pillar]) {
      const p = PILLARS[plan.parsed.pillar];
      lines.push(`<li><span class="ds-rat-kind">Pillar</span> <a href="${escapeHtml(p.url)}" target="_blank" rel="noopener">${escapeHtml(p.label)}</a></li>`);
    }
    plan.choices.forEach(c => {
      const cite = c.cite;
      const extra = c.count ? ` <em>×${c.count}</em>` : (c.score ? ` <span class="ds-rat-score">fit ${c.score}</span>` : "");
      lines.push(`<li><span class="ds-rat-kind">${c.kind === "network" ? "CVD" : "Room"}</span> <strong>${escapeHtml(c.label)}</strong>${extra} — <a href="${escapeHtml(cite.url)}" target="_blank" rel="noopener">${escapeHtml(cite.label)}</a></li>`);
    });
    if (plan.clarifications.length)
      plan.clarifications.forEach(c => lines.push(`<li class="ds-rat-tip">💡 ${escapeHtml(c)}</li>`));
    if (fixes?.length)
      fixes.forEach(f => lines.push(`<li class="ds-rat-fix">✓ Auto-fix: ${escapeHtml(f)}</li>`));

    return `<section class="ds-intent-rationale" aria-labelledby="ds-rat-title">
      <h3 id="ds-rat-title">Design rationale <span class="ds-rat-score-badge">Score ${score}/100</span></h3>
      <p class="ds-rat-lede">Every topology choice maps to a Cisco or Webex validated reference — no fabricated products.</p>
      <ul class="ds-rat-list">${lines.join("")}</ul>
    </section>`;
  }

  function generateFromIntent(text, design, deps) {
    const plan = buildPlan(parseIntent(text));
    executePlan(plan, design, deps);
    const fixes = autoRemediate(design, deps.rules, deps.uid, deps.stencils);
    const score = deps.rules?.computeScore?.(design) ?? 0;
    return { plan, score, fixes };
  }

  window.__DS_INTENT = {
    PILLARS, parseIntent, buildPlan, executePlan, generateFromIntent,
    autoRemediate, renderChipsHtml, renderRationaleHtml, scoreNetworkTemplates,
    isCiscoUrl, citeMeta
  };
})();

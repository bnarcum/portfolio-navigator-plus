# Design Studio v3

Netformx-style presales design for Portfolio Navigator Plus.

## What's new in v3

- **SVG device silhouettes** — switches, routers, firewalls, APs, codecs, displays (not emoji boxes)
- **Port-based linking** — click source port → target port; auto media/PID suggestions
- **17 Cisco Validated network templates** — SNRA campus, Unified Branch, SD-Access fabric, university/manufacturing CVPs, AI/ML DC fabric, plus campus, SD-WAN, ACI, K-12, healthcare, retail Meraki, zero trust, HyperFlex, etc. Each links to official CVD docs (`cvd` / `cvdUrl` in gallery).
- **10 room floor plans** — Cisco Tested hybrid-work guides (CT): small/medium collaboration, dual-display video-centric, huddle, conference, boardroom, training, Teams/Zoom, divisible
- **Template Gallery** — browse and insert any template from header **Gallery**
- **Design score (0–100)** — completeness badge in header
- **Suggest panel** — one-click fixes (add core, wire APs, PoE budget, auto-wire)
- **PoE budget tracking** — load vs switch capacity
- **Presentation mode** — `P` key hides chrome for customer calls
- **Snapshots** — named design checkpoints
- **Minimap** — bottom-left canvas overview
- **Customer narrative export** — Markdown solution overview in Export Pack

## Surfaces

| Tab | Purpose |
|-----|---------|
| **Intent** | Natural language → picks best template + rooms |
| **Network** | Logical topology with layer bands & port links |
| **Room** | Collab floor plans with zone labels |

## Shortcuts

| Key | Action |
|-----|--------|
| `L` | Link mode (port-to-port) |
| `F` | Fit view |
| `P` | Presentation mode |
| `/` | Focus stencil search |
| `⌘Z` / `⌘⇧Z` | Undo / redo |
| `⌘D` | Duplicate |
| `Del` | Delete selection |
| `Esc` | Close / dismiss gallery |

## Workflow

1. **Gallery** or **Generate Draft** from Intent
2. Review **Validate** + **Suggest** panels — apply fixes
3. Tune PIDs in **Inspector**; adjust links/cables
4. **Export Pack** → CCW CSV, cable schedule, narrative MD, JSON, SVG

## Files

| File | Role |
|------|------|
| `design-studio-stencils.js` | Device defs, SVG shapes, port anchors |
| `design-studio-templates.js` | Network + room template library |
| `design-studio-rules.js` | Score, validation, suggestions, PoE |
| `design-studio.js` | UI shell, canvas, export |
| `design-studio.css` | Styles |

## CCW note

Exports are **CCW prep** drafts — verify PIDs and quantities before import.

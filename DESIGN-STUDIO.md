# Design Studio v2

Presales design mode for Portfolio Navigator Plus.

## Surfaces

| Tab | Purpose |
|-----|---------|
| **Intent** | Natural language + templates + reference architectures + AI JSON import |
| **Network** | Logical topology canvas with layer bands, 48+ family stencils from portfolio catalog |
| **Room** | Collab floor plan with huddle / conference / boardroom templates |

## Features

- **Inspector** — edit label, PID, qty, layer, ports, cable length for selected device/link
- **Live BOM** — hardware, DNA/ISE/Webex licenses, cables, SMARTnet/PS placeholders
- **Cable schedule** — from/to ports, media, length, cable PID
- **Validation** — blocking warnings + tips
- **Undo/redo** — ⌘Z / ⌘⇧Z (40 steps)
- **Auto layout** — layer-based network layout
- **Orthogonal links** with arrows and media labels
- **Snap to grid** — toggle in toolbar
- **Floor plan** — upload background image (Room tab)
- **Import stack** — from Account Planner
- **Export pack** — CCW prep CSV, cable CSV, design summary MD, JSON
- **SVG export** — topology diagram

## Shortcuts (canvas focused)

| Key | Action |
|-----|--------|
| `L` | Toggle link mode |
| `Delete` | Delete selection |
| `⌘D` | Duplicate device |
| `⌘Z` / `⌘⇧Z` | Undo / redo |
| `Esc` | Close Design Studio |

## AI workflow

1. **Ask AI** — sends structured JSON prompt
2. Paste response into **Apply AI JSON** textarea
3. Click **Apply AI JSON**

Or use **Generate Draft** for rule-based designs without AI.

## CCW note

Exports are **CCW prep** drafts — verify PIDs before import into Cisco Commerce Workspace.

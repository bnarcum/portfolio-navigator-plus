# Design Studio

Presales design mode for Portfolio Navigator Plus — Intent Studio, Network Canvas, Room Canvas, live BOM, and CCW prep export.

## Open

Click **Design Studio** in the action bar (or `window.DesignStudio.open()` in the console).

## Workflow

1. **Intent tab** — describe the deal or pick a template → **Generate Draft Design**
2. **Network tab** — edit logical topology; drag stencils, use **Link mode** to connect devices
3. **Room tab** — place collab gear on the floor-plan grid; HDMI/PoE links roll into cable schedule
4. Review **BOM**, **Cables**, and **Validate** panels on the right
5. **Export Pack** — downloads `CCW_Prep_*.csv`, `Cable_Schedule_*.csv`, `Design_*.json`

## Tips

- **Import Stack** pulls the current Account Planner stack onto the network canvas
- **Ask AI** sends a structured design prompt to the built-in AI assistant (BYOK)
- Pan: drag empty canvas · Zoom: scroll wheel · Delete: select node/link → Delete selected
- Designs persist in `localStorage` under `cpn-design-studio-v1`

## CCW note

Export files are **CCW prep** drafts — verify PIDs and quantities before importing into Cisco Commerce Workspace. No live CCW API integration in this release.

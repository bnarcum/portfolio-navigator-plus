# Portfolio Navigator Plus

<p align="center">
  <img src="docs/hero.png" alt="Portfolio Navigator Plus — interactive portfolio graph and Account Planner" width="100%">
</p>

**Separate project and repository** — not a shared branch or preview of production. Plus started from the Cisco Portfolio Navigator codebase but has its own git history, roadmap, and deployment. All new development (including Design Studio) happens **here only**.

**Live (Plus):** https://bnarcum.github.io/portfolio-navigator-plus/

**Production (different repo — do not push here):** https://bnarcum.github.io/cisco-portfolio-navigator/

→ **[PROJECT.md](PROJECT.md)** — folder paths, git remotes, and rules so the two projects stay separate.

## What it does

Same core capabilities as Cisco Portfolio Navigator — guided planning, portfolio graph views, account planner, AI assistant (BYOK), exports, and more. See the [upstream README](https://github.com/bnarcum/cisco-portfolio-navigator) for the full feature list.

### Design Studio (Plus) — v2

Open **Design Studio** from the action bar. See [DESIGN-STUDIO.md](DESIGN-STUDIO.md) for full details.

Highlights: intent-driven topology, 48+ Cisco family stencils, room templates, inspector, undo/redo, live BOM/cables, CCW prep export, SVG diagram export.

## Local development

```bash
cd "/Users/bnarcum/Projects/Portfolio Navigator Plus"
open cisco-portfolio-navigator.html
# or
python3 -m http.server 8765
# → http://localhost:8765/cisco-portfolio-navigator.html
```

Optional tests: `npm install && npm test`

## Git

Single remote for day-to-day work:

```bash
git remote -v
# origin → https://github.com/bnarcum/portfolio-navigator-plus.git
git push origin main
```

Optional one-way pull from production is documented in **[PROJECT.md](PROJECT.md)** — not required.

## License

Personal / educational use. Cisco product names, descriptions, and trademarks are property of Cisco Systems, Inc.

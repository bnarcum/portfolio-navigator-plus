# Portfolio Navigator Plus — project boundaries

**Portfolio Navigator Plus is a separate product and git repository.** It is not a deployment branch, preview environment, or shared workspace with [Cisco Portfolio Navigator](https://github.com/bnarcum/cisco-portfolio-navigator).

Use this document (and share it with anyone—or any AI assistant—working in the repo) so the two codebases stay isolated.

---

## Two projects — do not mix

| | **Portfolio Navigator Plus** (this repo) | **Cisco Portfolio Navigator** (production) |
|---|---|---|
| **Purpose** | Experimentation, Design Studio, SE workflow extensions | Stable public production tool |
| **Local folder** | `/Users/bnarcum/Projects/Portfolio Navigator Plus` | `/Users/bnarcum/Projects/Cursor Portfolio` |
| **GitHub** | [bnarcum/portfolio-navigator-plus](https://github.com/bnarcum/portfolio-navigator-plus) | [bnarcum/cisco-portfolio-navigator](https://github.com/bnarcum/cisco-portfolio-navigator) |
| **GitHub Pages** | https://bnarcum.github.io/portfolio-navigator-plus/ | https://bnarcum.github.io/cisco-portfolio-navigator/ |
| **Default branch** | `main` | `main` |
| **Where new work goes** | **Always here** | Only when intentionally maintaining production |

There is **no** required sync, shared `dev` branch, or preview remote for Plus. The old `cisco-portfolio-navigator-preview` repo is obsolete for Plus workflow—ignore it.

---

## Rules for contributors (including Cursor / agents)

1. **Open this folder as the workspace** — `Portfolio Navigator Plus`, not home and not `Cursor Portfolio`.
2. **Commit and push only to this repo:**

   ```bash
   cd "/Users/bnarcum/Projects/Portfolio Navigator Plus"
   git add -A
   git commit -m "Describe your change"
   git push origin main
   ```

3. **Do not** commit Plus features to `cisco-portfolio-navigator` unless you deliberately run a separate production release.
4. **Do not** add a `preview` remote or dual-push workflow to Plus.
5. **Branding** stays Plus-specific (app title, README, export footers, new docs).

---

## Relationship to production (optional, one-way only)

Plus began as a **snapshot** of production at import time. Histories diverged immediately. Treat production as **read-only inspiration**, not a parent branch.

If you want a specific fix from production **once in a while** (manual, optional):

```bash
git remote add upstream https://github.com/bnarcum/cisco-portfolio-navigator.git   # once
git fetch upstream
git merge upstream/main   # resolve conflicts; Plus wins for Plus-only files
```

Never merge Plus → production automatically. Promoting a feature to production is a **separate, intentional** copy or port in the other repo.

---

## Checklist before pushing

- [ ] Working directory is `Portfolio Navigator Plus`
- [ ] `git remote -v` shows only `origin` → `portfolio-navigator-plus.git` (plus optional `upstream` for reads)
- [ ] Changes are committed on `main` (or a Plus feature branch merged to `main`)
- [ ] `git push origin main` — not `cisco-portfolio-navigator`

---

## Live sites

After `git push origin main`, GitHub Pages for **this** repo updates at:

https://bnarcum.github.io/portfolio-navigator-plus/

Production URL is unrelated and does not update when you push here.

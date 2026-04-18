# Deployment

GitHub Pages, branch-based (Pages source = `gh-pages`). No build files committed to `main` or feature branches.

## Main deploy

`.github/workflows/pages-deploy.yml` runs on every push to `main`:

1. Detect stack: `package.json` with `"vite"` → React; else → vanilla static files
2. Build if React, else copy root HTML/CSS/JS into `_site/`
3. Push to `gh-pages` root via `peaceiris/actions-gh-pages@v4` with `keep_files: true` (so `pr-preview/` subfolders survive)

Same workflow works today (vanilla on main) AND after the big-bang merges (Vite on main). No workflow change needed at merge time.

Live URL: `https://ethanlookpotts.github.io/super-effective/`

## PR preview

`.github/workflows/pages-preview.yml` runs on `pull_request` (opened / reopened / synchronize / closed):

1. Same stack detection as above
2. If React: `npm run build -- --base="/super-effective/pr-preview/pr-<N>/"` so asset URLs resolve
3. Publish to `gh-pages/pr-preview/pr-<N>/` via `rossjrw/pr-preview-action@v1`
4. Action auto-comments the preview URL on the PR
5. On `closed`: action removes the preview directory

Preview URL: `https://ethanlookpotts.github.io/super-effective/pr-preview/pr-<N>/`

Forks are skipped (`if: github.event.pull_request.head.repo.full_name == github.repository`).

## Repo settings (already configured)

- Settings → Actions → General → Workflow permissions: **Read and write**
- Settings → Pages → Source: **Deploy from a branch** → `gh-pages`, folder `/ (root)`

## Long-lived branch flow

This branch (`refactor/react-tailwind`) opens a **tracking PR** against `main`. That PR:
- Triggers `pages-preview.yml` on every push → fresh preview URL
- Does NOT get merged until every phase in [03-phases.md](./03-phases.md) is `DONE`
- May sit open for weeks or months — that's the point

Main deploys keep working the whole time because `keep_files: true`.

## What happens on merge

1. Squash-merge (or merge commit — doesn't matter, `gh-pages` is regenerated from source)
2. `pages-deploy.yml` runs on the main push
3. Detects Vite, builds, publishes to `gh-pages` root — replaces the vanilla site with the React build
4. `pages-preview.yml` closed-PR cleanup removes the preview directory
5. Live site is now the React app at `https://ethanlookpotts.github.io/super-effective/`

Rollback: revert the merge commit on `main`; next push runs `pages-deploy.yml` again and the old vanilla site ships automatically (since the detection prefers `package.json` with `"vite"` — if we revert the delete of `index.html` + `js/`, the workflow picks the static path).

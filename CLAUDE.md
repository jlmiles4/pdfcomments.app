# CLAUDE.md

Operator manual for Claude Code sessions in this repo. Human-facing architecture docs live in `docs/README.md` — read them if you need architecture detail; don't duplicate them here.

## What this project is

Static-exported Next.js app that extracts PDF annotations **entirely in the browser**. No backend, no file uploads. Deployed as static HTML/JS to S3 + CloudFront at pdfcomments.app.

## Commands

```bash
pnpm dev              # local dev server on :3000
pnpm lint             # eslint src/
pnpm exec tsc --noEmit   # typecheck
pnpm build            # static export → /out, also copies worker
pnpm audit --prod     # security audit

# Deploy (requires .env: S3_BUCKET, CLOUDFRONT_DISTRIBUTION_ID, AWS creds)
pnpm send-it          # build + s3 sync + cloudfront invalidate
```

**Before finishing any task that touches source**, run `pnpm lint && pnpm exec tsc --noEmit && pnpm build`. There is no test suite — the build is the test.

**Never run `pnpm send-it`, `pnpm deploy:s3`, or `pnpm invalidate` without explicit user confirmation.** They push to production.

## Non-obvious constraints

These will bite you without warning. Read before editing the corresponding areas.

**Never top-level-import `pdfjs-dist`.** It references `DOMMatrix` at module load, which crashes Next's static prerender (no DOM on the server). Only `src/lib/pdf-loader.ts` imports it, via `await import('pdfjs-dist')` behind a cached promise. Use `import type { ... } from 'pdfjs-dist'` freely — type imports are erased.

**Keep both `canvas` aliases in `next.config.mjs`.** Next 16 defaults to Turbopack but `--webpack` still works. `pdfjs-dist` optionally depends on Node's `canvas` package, which we stub out in both bundlers:
- `turbopack.resolveAlias.canvas` → `./empty-module.mjs`
- `webpack.config.resolve.alias.canvas = false`

Removing either breaks the corresponding bundler.

**After `pnpm update pdfjs-dist`, re-copy the worker to `public/`.** `postinstall` copies `pdf.worker.min.mjs` to `public/` on every install; `build` copies it to `out/`. If `public/` ever falls out of sync with the installed `pdfjs-dist`, dev hits silent parse failures. Re-copy manually: `cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/`.

**Do not upgrade ESLint past 9.x.** `eslint-plugin-react` 7.37.5 declares `eslint ^9.7` as its peer range. Bumping past that triggers a peer-dep warning and unpredictable behavior. Revisit only once `eslint-plugin-react` widens its range.

## Code conventions

**Use CSS custom properties for theme colors, not Tailwind color classes.** The design system is `src/app/globals.css` — an import-only index over partials in `src/app/styles/` (`theme.css` tokens, `base.css` `:root`/`.dark` vars, `components.css` button/badge/dropzone classes, `animations.css`, `utilities.css`). Write `style={{ color: 'var(--color-ink)' }}`, not `className="text-stone-900"`. Tailwind is still used for layout, spacing, and typography.

**Put `'use client'` at the top of any component that uses hooks or browser APIs.** `app/layout.tsx` and `app/not-found.tsx` are server components — leave them that way.

**Add new home-page views as components under `src/components/states/`.** `app/page.tsx` is a thin state-machine orchestrator (`upload | processing | results | error`). Do not grow `page.tsx` with inline JSX blocks.

**Add JSDoc to every `lib/` export and every non-trivial helper.** Follow the existing format: summary, `@param`, `@returns`, `@example` when useful. Components get only a file-level doc block.

## Adding a new annotation type

See `src/lib/CLAUDE.md` for the full checklist — that lib-level file auto-loads when you touch `src/lib/`.

## References

Plain pointers — read on demand, don't duplicate here.

- Architecture and the dynamic-import constraint: `docs/architecture/overview.md`
- Deploy mechanics, the `s3 sync --delete` footgun, and rollback: `docs/runbooks/deploy.md`
- Add a new annotation type (full worked example): `docs/guides/add-annotation-type.md`

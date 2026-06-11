---
name: preflight
description: Run the project's build gate — lint, typecheck, then static build — and summarize any failures. Use before finishing a source change, before deploying, or whenever the user asks to verify/check/validate the build. There is no test suite; the build is the test.
---

# Preflight (the build gate)

Run all three in order. Report pass/fail with the first actionable errors; stop on the first failure.

```bash
pnpm lint              # eslint over src/
pnpm exec tsc --noEmit # typecheck only
pnpm build             # Next static export → out/ (also copies the pdfjs worker)
```

## Notes
- All three must pass before finishing a source change or deploying.
- If `pnpm build` fails right after a `pdfjs-dist` change, the `public/` worker may be stale — re-copy it: `cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/` (see root `CLAUDE.md`).
- Do not proceed to `/deploy` until preflight is green.

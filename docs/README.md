# PDF Comments

Extracts annotations from PDFs entirely in the browser and exports them to Markdown, GFM checklists, or rich HTML. No backend, no uploads — the file never leaves the page. Deployed as a static site to S3 + CloudFront at [pdfcomments.app](https://pdfcomments.app).

## Quick start

```bash
pnpm install      # also copies the pdfjs worker into public/
pnpm dev          # localhost:3000
```

Production-style build:

```bash
pnpm build        # static export to /out, also copies the worker to /out
```

Before finishing any source change, run `pnpm lint && pnpm exec tsc --noEmit && pnpm build`. There is no test suite — the build is the test.

## Documentation

- [Architecture](architecture/overview.md) — system shape, data flow, and the constraints that drive the design
  - [Extraction pipeline](architecture/extraction-pipeline.md) — how PDF annotations turn into export-ready data
  - [Design system](architecture/design-system.md) — color tokens, typography, component conventions
- [Guides](guides/add-annotation-type.md)
  - [Add a new annotation type](guides/add-annotation-type.md) — the five-step checklist
- [Runbooks](runbooks/deploy.md)
  - [Deploy to production](runbooks/deploy.md) — `pnpm send-it` flow and prerequisites

## Repository layout

```
src/
  app/              Next.js App Router pages (layout, home, about, privacy, 404)
  components/       React UI — Header, Footer, DropZone, AnnotationList
    states/         Home-page state views (upload/processing/results/error/sidebar)
  lib/              Pure TS extraction core (no React, no DOM except pdf-loader)
  types/            Shared type definitions
public/             Static assets, including pdf.worker.min.mjs
out/                Build output (gitignored) — what gets synced to S3
```

## License

MIT — see [LICENSE](../LICENSE).

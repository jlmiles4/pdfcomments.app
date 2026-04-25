# Architecture overview

A static-exported Next.js 16 app that parses PDFs in the browser using `pdfjs-dist` and renders the extracted annotations as exportable Markdown/HTML. The runtime has no backend — everything from file read to export is JavaScript running on the user's machine.

## Tech stack

- **Next.js 16** with App Router, configured for static export (`output: 'export'` in [next.config.mjs](../../next.config.mjs)).
- **React 19** for the UI; Tailwind CSS 4 for layout/typography; CSS custom properties for theme colors.
- **TypeScript 6**, strict.
- **pdfjs-dist 5** for PDF parsing, loaded dynamically only on the client.
- **lucide-react** for icons.
- **Build/deploy**: `next build` produces `/out/`, which is synced to S3 and invalidated on CloudFront via `aws-cli`.

## High-level data flow

```
File (drag/drop)
    │
    ▼
loadPdf(file)                       src/lib/pdf-loader.ts
    │                               (dynamic import of pdfjs-dist)
    ▼
PDFDocumentProxy
    │
    ▼
extractAnnotations(pdf, onProgress) src/lib/extract-annotations.ts
    │   per page: page.getAnnotations() + page.getTextContent()
    │   classify by subtype, find text under quadPoints, capture comment
    ▼
ExtractedAnnotation[]
    │
    ▼
groupAnnotations(extracted)         src/lib/group-annotations.ts
    │   link sticky notes (Text) to nearby markup by center distance
    ▼
GroupedAnnotation[]
    │
    ▼
ExportSidebar  ──► toMarkdownTable / toMarkdownChecklist / toHtmlChecklist
                                    src/lib/export-markdown.ts
```

The home page at [src/app/page.tsx](../../src/app/page.tsx) drives a four-state machine (`upload | processing | results | error`) and delegates rendering to components under [src/components/states/](../../src/components/states/). The page itself doesn't render JSX for the annotation list — that lives in [AnnotationList.tsx](../../src/components/AnnotationList.tsx).

For the parsing details (coordinate system, quad-point handling, proximity grouping, export shapes), see [extraction-pipeline.md](extraction-pipeline.md).

## Key constraints that shape the code

These are non-obvious. If you change the corresponding area, read this first.

### pdfjs-dist must be dynamically imported

`pdfjs-dist` 5 calls `new DOMMatrix()` at module evaluation. Next's static export prerenders every route on the server (no DOM), so any synchronous `import 'pdfjs-dist'` in the module graph kills the build. [src/lib/pdf-loader.ts](../../src/lib/pdf-loader.ts) is the only file that loads it — via `await import('pdfjs-dist')` behind a cached promise (`getPdfjs()`). Type-only imports (`import type { ... } from 'pdfjs-dist'`) are erased at compile time and are safe to use anywhere.

### The PDF.js worker is a separate file in `public/` and `out/`

`postinstall` copies `node_modules/pdfjs-dist/build/pdf.worker.min.mjs` into `public/`. `pnpm build` copies it again into `out/`. After upgrading pdfjs-dist, re-run the copy so the worker version matches the library, otherwise parsing silently fails:

```bash
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/
```

`pdf-loader.ts` points the worker at `/pdf.worker.min.mjs` via `GlobalWorkerOptions.workerSrc`.

### Both `canvas` aliases in `next.config.mjs` are load-bearing

`pdfjs-dist` optionally depends on Node's `canvas` package. Since the app only runs in browsers, both bundlers are configured to stub it out:

- Turbopack (the default): `turbopack.resolveAlias.canvas` → [`./empty-module.mjs`](../../empty-module.mjs)
- Webpack (`next build --webpack`): `webpack.config.resolve.alias.canvas = false`

Removing either alias breaks the corresponding bundler.

### Static export means no server-rendered data

There is no API, no `getServerSideProps`, no Route Handlers used at runtime. Anything dynamic happens in the browser after hydration. `app/layout.tsx` and `app/not-found.tsx` are server components and stay that way; everything that touches hooks or browser APIs has `'use client'` at the top.

## Adjacent docs

- [Extraction pipeline](extraction-pipeline.md) — coordinate system, quad-point handling, grouping algorithm, export shapes.
- [Design system](design-system.md) — theme tokens, typography, component conventions.
- [Add a new annotation type](../guides/add-annotation-type.md) — five-step checklist.
- [Deploy to production](../runbooks/deploy.md) — `pnpm send-it` flow.

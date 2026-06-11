# src/lib/ — PDF extraction core

Pure TypeScript. No React. DOM access is confined to `pdf-loader.ts` (and only inside an `await import()`).

Repo-wide rules are in the root `CLAUDE.md` (always loaded). Type definitions live in `src/types/index.ts`.

## PDF coordinate system

**Origin is bottom-left; y increases upward.** Higher y = visually higher on the page. The sort in `group-annotations.ts` (`b.rect.y - a.rect.y`) and the top/middle/bottom bucketing in `export-markdown.ts` both depend on this. Do not "fix" them by flipping the axis.

Page height is hard-coded to 792 points (standard US letter, 1 pt = 1/72 inch) for position labels. It's rough bucketing, not precise layout.

## QuadPoint layout

PDF markup annotations encode geometry as `quadPoints`: 8 numbers per quad, ordered **top-left, top-right, bottom-left, bottom-right**. `quadPointsToRects` converts each 8-tuple into an axis-aligned bounding rect. Multi-line highlights produce multiple quads — merge them for the annotation's bounding rect, but test text intersection per-quad so each line is checked independently.

## Annotation types

| PDF subtype | `AnnotationType` | Extracted? | Notes |
|-------------|------------------|------------|-------|
| Highlight, StrikeOut, Underline | same | yes | Markup — has underlying text, uses quadPoints |
| Circle, Square | same | yes | Shape — rect only, no text |
| Text | `Text` | yes | Sticky note — dropped if comment is empty |
| FreeText | `FreeText` | yes | Inline text box — dropped if comment is empty |
| Ink | `Ink` | **no** | Type exists but no extractor wired up |

### Adding a new annotation type

Do these five things in order:

1. Extend the `AnnotationType` union in `src/types/index.ts`.
2. Add an `extract<Type>Annotation` helper in `extract-annotations.ts` and wire it into the `subtype` switch.
3. Add a `TYPE_ACTIONS` entry in `export-markdown.ts`.
4. Add a `TYPE_CONFIG` entry in `src/components/AnnotationList.tsx` (icon, badge class, label), and add the type to `typeOrder` so it can surface in the summary grid.
5. Add a `.badge-<type>` CSS class in `src/app/styles/components.css` (follow the existing `.badge-*` block), and define its `--color-*` tokens in `src/app/styles/base.css` (both `:root` and `.dark`). `src/app/globals.css` is just the import index.

Skipping any one of these will either break the build or silently hide the new type from exports. Full worked example (using a `Caret` type): `docs/guides/add-annotation-type.md`.

## Proximity grouping

`group-annotations.ts` links sticky notes (`Text`) to their associated markup by center-to-center Euclidean distance. Threshold: **50 PDF points (~0.7 inch)**. A note links to at most one annotation — once matched, it's removed from the pool. Notes on pages with no other annotations pass through as standalone entries.

If grouping feels wrong, tune the threshold with a concrete failing PDF. Do not rewrite the algorithm.

## Why `pdf-loader.ts` uses dynamic import

`pdfjs-dist` 5 calls `new DOMMatrix()` at module evaluation. Next 16's static export prerenders every route on the server (no DOM), so any synchronous `import 'pdfjs-dist'` in the module graph kills the build. `getPdfjs()` defers evaluation to the first browser call and caches the promise.

Type-only imports (`import type { ... } from 'pdfjs-dist'`) are safe — they're erased at compile time.

## Export formats

Three functions in `export-markdown.ts`, all consumed by `src/components/states/ExportSidebar.tsx`:

- **`toMarkdownTable`** — detailed, page-grouped, with action hints. Powers "Copy Markdown" and "Download .md".
- **`toMarkdownChecklist`** — GFM checkboxes. The `text/plain` half of "Copy Checklist".
- **`toHtmlChecklist`** — semantic `<ul>`. The `text/html` half of "Copy Checklist" so Google Docs and Word render a formatted list on paste.

Do not add a fourth exported format without wiring it into `ExportSidebar` — unreferenced exports are treated as dead code and pruned.

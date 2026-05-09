# Extraction pipeline

How a PDF's annotation dictionaries become the `GroupedAnnotation[]` rendered in the UI and serialized by the exporters. The code lives in [src/lib/](../../src/lib/) — the modules referenced below are pure TypeScript with no React or DOM dependencies (except [pdf-loader.ts](../../src/lib/pdf-loader.ts), which dynamically imports `pdfjs-dist`).

## PDF coordinate system

**Origin is bottom-left; y increases upward.** A higher y value is visually higher on the page. Two pieces of code rely on this:

- The sort in [group-annotations.ts](../../src/lib/group-annotations.ts) (`b.rect.y - a.rect.y`) puts top-of-page annotations first.
- The `describePosition` bucketing in [export-markdown.ts](../../src/lib/export-markdown.ts) treats `relativePosition > 0.66` as `"top"`.

If you ever feel tempted to "fix" either by flipping the axis, don't — they're correct as written.

For position labels, page height is hard-coded to **792 points** (US letter, 1 pt = 1/72 inch). It's coarse top/middle/bottom bucketing, not precise layout.

## QuadPoint layout

Markup annotations (Highlight, StrikeOut, Underline) encode their geometry as `quadPoints`: 8 numbers per quad, ordered **top-left, top-right, bottom-left, bottom-right**. [`quadPointsToRects`](../../src/lib/geometry.ts) walks the array in groups of 8 and returns one axis-aligned bounding rect per quad.

Multi-line highlights produce multiple quads. The extractor:

1. Calls `quadPointsToRects(annot.quadPoints)` to get one rect per line.
2. Calls `mergeRects(rects)` for the annotation's overall bounding box (used for proximity grouping and rendering position).
3. Tests text intersection **per quad**, so each line is matched independently and broken text reflows correctly.

Annotations without `quadPoints` (rare in practice) fall back to the annotation's `rect`.

## Annotation types

The classifier in [extract-annotations.ts](../../src/lib/extract-annotations.ts) routes by PDF subtype. The `AnnotationType` union in [types/index.ts](../../src/types/index.ts) is the source of truth for what's allowed downstream.

| PDF subtype                       | `AnnotationType` | Extracted | Notes                                              |
| --------------------------------- | ---------------- | --------- | -------------------------------------------------- |
| Highlight, StrikeOut, Underline   | same             | yes       | Markup. Has underlying text. Uses `quadPoints`.    |
| Circle, Square                    | same             | yes       | Shape. Rect only, no text content.                 |
| Text                              | `Text`           | yes       | Sticky note. Dropped if comment is empty.          |
| FreeText                          | `FreeText`       | yes       | Inline text box. Dropped if comment is empty.      |
| Ink                               | `Ink`            | **no**    | Type exists in the union but no extractor wired up.|

Anything else falls through and is silently skipped.

### Per-page resilience

`extractAnnotations` wraps each page in a try/catch. A single corrupt page logs `console.warn` and moves on instead of aborting the whole document — users get partial results plus a warning they can report.

## Finding text under a markup

`findTextUnderRects` in [extract-annotations.ts](../../src/lib/extract-annotations.ts):

1. Pulls `page.getTextContent()` once per page (text items have a `transform` matrix and width).
2. Treats each text item as a rect at `(transform[4], transform[5])` with height `Math.abs(transform[0]) || 12`.
3. Calls [`rectsIntersect`](../../src/lib/geometry.ts) (separating-axis check) against each annotation rect.
4. Collects matches in iteration order — `getTextContent` already returns items in document order, so the extracted text reads naturally.
5. Joins items with single spaces, avoiding double-spacing when an item already ends with whitespace.

Text recovery is geometry-based, not based on PDF.js's structure tree, so it works on PDFs that lack tagged content.

## Comment extraction

`extractCommentText` in [extract-annotations.ts](../../src/lib/extract-annotations.ts) handles two forms PDF.js produces:

- `annot.contentsObj.str` — preferred when present (has decoded text).
- `annot.contents` — string fallback.

Returns `''` when neither is present. Sticky notes and free text with empty comments are dropped at the extractor; markup with no comment is kept (the marked text itself is the signal).

## Color extraction

`extractColor` reads the annotation's RGB color array (PDF stores components in 0–1) and returns a CSS `rgb(r, g, b)` string with values rounded to 0–255. Currently this color is captured but not consumed by the UI — annotation type drives presentation, not the source PDF's color.

## Proximity grouping

[group-annotations.ts](../../src/lib/group-annotations.ts) links sticky notes (`Text`) to nearby markup so a reviewer's note shows up under the highlight it belongs to.

- **Threshold:** 50 PDF points (~0.7 inch), defined as `PROXIMITY_THRESHOLD`.
- **Distance:** Euclidean center-to-center, via [`distance`](../../src/lib/geometry.ts) and [`rectCenter`](../../src/lib/geometry.ts).
- **One-shot match:** once a note is linked to an annotation, it's spliced out of the page's note pool so it can't be re-linked.
- **Orphans:** notes on pages with no other annotations pass through as standalone entries.
- **Sort order:** by page ascending, then by `b.rect.y - a.rect.y` so top-of-page comes first.

If grouping feels wrong on a specific document, tune `PROXIMITY_THRESHOLD` against that PDF. Don't rewrite the algorithm.

## Export shapes

Three exporters in [export-markdown.ts](../../src/lib/export-markdown.ts), all consumed by [ExportSidebar.tsx](../../src/components/states/ExportSidebar.tsx):

- **`toMarkdownTable(annotations, documentName?)`** — detailed page-grouped Markdown with action hints (`TYPE_ACTIONS` per type) and top/middle/bottom position labels. Used by both "Copy Markdown" and "Download .md".
- **`toMarkdownChecklist(annotations)`** — GFM checkboxes (`- [ ]`). Renders interactively in GitHub and Notion. Carried as the `text/plain` half of "Copy Checklist".
- **`toHtmlChecklist(annotations)`** — semantic `<ul>`/`<li>`. Carried as the `text/html` half of "Copy Checklist" so Google Docs and Word receive a formatted list on paste. User text is escaped via `escapeHtml`.

"Copy Checklist" writes a single `ClipboardItem` containing both formats — receiving apps pick whichever they understand. Fallback handling lives in `ExportSidebar.handleCopyChecklist` (toast on success, error banner on failure pointing the user at the download button).

Adding a fourth exporter without wiring it into `ExportSidebar` will leave it dead — TypeScript doesn't flag unused exports, but the build's tree-shaking will drop them anyway.

## Lifecycle and cleanup

[src/app/page.tsx](../../src/app/page.tsx) calls `pdf.destroy()` in a `finally` block so the pdfjs worker releases its resources. The grouped annotations kept in state are plain data and don't reference the PDF document.

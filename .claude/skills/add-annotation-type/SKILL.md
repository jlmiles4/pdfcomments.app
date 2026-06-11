---
name: add-annotation-type
description: Add support for a new PDF annotation type (e.g. Caret, Polygon, Ink) end-to-end. Use when the user wants the extractor to recognize, display, or export a PDF annotation subtype it currently ignores. Walks the required five-file change and runs the build gate.
---

# Add a new annotation type

Adding a type touches five files in order. Skip one and the build breaks or the type is silently hidden from the UI and exports. Lib-level rules: `src/lib/CLAUDE.md`. Full worked example (a `Caret` type): `docs/guides/add-annotation-type.md`.

## The five edits
1. **`src/types/index.ts`** — add the PDF subtype string to the `AnnotationType` union. `tsc` then flags every site that needs a new branch (`pnpm exec tsc --noEmit`).
2. **`src/lib/extract-annotations.ts`** — classify it: add to `MARKUP_TYPES` (has underlying text + `quadPoints`) or `SHAPE_TYPES` (rect only), or write an `extract<Type>Annotation` helper and add a branch to the `subtype` switch in `extractPageAnnotations`. Decide the empty-comment policy — note-style types drop empty comments, markup types keep them.
3. **`src/lib/export-markdown.ts`** — add a `TYPE_ACTIONS` entry. The `Record<AnnotationType, …>` type makes this a compile error until filled in.
4. **`src/components/AnnotationList.tsx`** — add a `TYPE_CONFIG` entry (lucide-react icon, badge class, label) **and** add the type to `typeOrder` so it can surface in the summary grid.
5. **`src/app/styles/components.css`** — add a `.badge-<type>` class next to the existing `.badge-*` block. Define its `--color-*` tokens in **`src/app/styles/base.css`** (both `:root` and `.dark`). (`src/app/globals.css` is only the import index; the partials live in `src/app/styles/`.)

## Conventions to respect
- Theme colors use CSS custom properties, not Tailwind color classes.
- PDF coordinate origin is bottom-left (y increases upward); don't flip the y-axis sorts in `group-annotations.ts` / `export-markdown.ts`.

## Finish
Run `/preflight` (or `pnpm lint && pnpm exec tsc --noEmit && pnpm build`). Then load a PDF containing the new annotation type and confirm it appears with the right badge and survives the round-trip through Copy Markdown, Copy Checklist, and Download .md.

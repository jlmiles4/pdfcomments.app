# Add a new annotation type

Five files, in this order. Skipping any one of them either breaks the build or silently hides the new type from the UI and exports.

The example below adds a hypothetical `Caret` type (PDF subtype `Caret` — a small "insert here" mark). Substitute your own type name.

## 1. Extend the `AnnotationType` union

[src/types/index.ts](../../src/types/index.ts):

```ts
export type AnnotationType =
  | 'Highlight'
  | 'StrikeOut'
  | 'Underline'
  | 'Circle'
  | 'Square'
  | 'Text'
  | 'FreeText'
  | 'Ink'
  | 'Caret'; // ← new
```

`tsc` will now flag every place that needs a new branch — use `pnpm exec tsc --noEmit` to find them all.

## 2. Wire it into the extractor

[src/lib/extract-annotations.ts](../../src/lib/extract-annotations.ts):

- Add the PDF subtype string to the right constant if it behaves like an existing category:
  - `MARKUP_TYPES` if it has underlying text and `quadPoints` (Highlight/StrikeOut/Underline-like).
  - `SHAPE_TYPES` if it's just a rect with no text (Circle/Square-like).
- Otherwise, write a dedicated `extract<Type>Annotation` helper modeled on `extractTextAnnotation` or `extractFreeTextAnnotation` and add a branch to the `subtype` switch in `extractPageAnnotations`.

For the `Caret` example (it's a marker — no quadPoints, no text):

```ts
function extractCaretAnnotation(
  annot: Record<string, unknown>,
  page: number
): ExtractedAnnotation | null {
  const comment = extractCommentText(annot);
  if (!comment) return null;
  // ...build rect from annot.rect, return ExtractedAnnotation
}
```

```ts
} else if (subtype === 'Caret') {
  const extracted = extractCaretAnnotation(annot, pageNum);
  if (extracted) annotations.push(extracted);
}
```

Decide the empty-comment policy: markup types (text-bearing) keep zero-comment instances; note-style types drop them.

## 3. Add an action hint for exports

[src/lib/export-markdown.ts](../../src/lib/export-markdown.ts):

```ts
const TYPE_ACTIONS: Record<AnnotationType, string> = {
  // existing entries...
  Caret: 'Insert content at marker',
};
```

This appears as the `**Action:**` line in the Markdown export. `Record<AnnotationType, ...>` makes this a hard requirement — TypeScript will refuse to compile until it's filled in.

## 4. Add UI configuration

[src/components/AnnotationList.tsx](../../src/components/AnnotationList.tsx):

```ts
import { /* existing icons */, ChevronUp } from 'lucide-react';

const TYPE_CONFIG: Record<AnnotationType, { icon: typeof Highlighter; badge: string; label: string }> = {
  // existing entries...
  Caret: { icon: ChevronUp, badge: 'badge-caret', label: 'Caret' },
};
```

If you want this type to appear in the four-up summary grid at the top of the results view, add it to `typeOrder` so it's picked up when the user has fewer than four other types present.

Pick the icon from [lucide-react](https://lucide.dev) — keep it consistent in stroke weight with the existing icon set.

## 5. Add a badge style

[src/app/styles/components.css](../../src/app/styles/components.css) (a partial imported by `src/app/globals.css`):

```css
.badge-caret {
  background-color: var(--color-caret-bg);
  color: var(--color-caret);
}
```

You'll also need to define `--color-caret` and `--color-caret-bg` in both the `:root` and `.dark` blocks of [src/app/styles/base.css](../../src/app/styles/base.css). Pick values that fit the existing warm/muted palette — see [design-system.md](../architecture/design-system.md) for guidance on which tokens already exist.

## Verify

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

All three must pass — the build is the only test suite this project has. Then load a PDF that contains an annotation of the new type and confirm:

- It appears in the results list with the correct badge and icon.
- It survives the round-trip through "Copy Markdown", "Copy Checklist", and "Download .md".
- The summary count at the top of the results page increments correctly.

## Adjacent docs

- [Extraction pipeline](../architecture/extraction-pipeline.md) for the full type table and how the classifier routes by subtype.
- [Design system](../architecture/design-system.md) for the color-token conventions referenced in step 5.

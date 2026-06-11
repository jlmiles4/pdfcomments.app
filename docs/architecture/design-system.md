# Design system

Theme tokens, typography, and the conventions that keep `src/components/` consistent. The canonical values live in the CSS: [src/app/globals.css](../../src/app/globals.css) is an import-only index over partials in [src/app/styles/](../../src/app/styles/) — `theme.css` (`@theme` tokens), `base.css` (`:root`/`.dark` vars + element styling), `components.css` (button/badge/dropzone classes), `animations.css`, and `utilities.css`. This page documents how to use them, not what they are. When the two disagree, the CSS wins.

## Color tokens

All theme colors are CSS custom properties on `:root` (and overridden under `.dark`). The set splits into:

- **Surface and ink**: `--color-paper`, `--color-paper-warm`, `--color-ink`, `--color-ink-light`, `--color-muted`, `--color-border`, `--color-border-strong`.
- **Brand**: `--color-accent`, `--color-accent-soft`, `--color-accent-hover` (terracotta).
- **Per-annotation pairs**: `--color-<type>` and `--color-<type>-bg` for `highlight`, `strikeout`, `underline`, `circle`, `square`, `note`. The non-`-bg` token is the foreground/icon tint; the `-bg` token is the soft chip background.

Dark mode is gated on a `.dark` class via the `@custom-variant dark` declaration in `styles/theme.css`. The `.dark` class isn't toggled anywhere in the app today — the variant exists so colors are ready when a toggle is added.

## Using colors in components

**Use CSS custom properties for theme colors. Do not use Tailwind color classes.**

```tsx
// ✅ correct
<p style={{ color: 'var(--color-ink)' }}>...</p>
<div style={{ borderColor: 'var(--color-border)' }}>...</div>

// ❌ wrong
<p className="text-stone-900">...</p>
<div className="border-gray-200">...</div>
```

Tailwind utilities are fine — and preferred — for layout, spacing, sizing, flex/grid, and typography. Just keep colors out of the className.

The per-annotation color pairs are used by `.badge-<type>` classes (defined in `styles/components.css`) and consumed via the `TYPE_CONFIG` map in [AnnotationList.tsx](../../src/components/AnnotationList.tsx). When you add a new annotation type, both ends need new entries — see [Add a new annotation type](../guides/add-annotation-type.md).

## Typography

Loaded via Google Fonts in `globals.css`:

- **IBM Plex Sans** (weights 400/500/600) — headings and body.
- **IBM Plex Mono** (weights 400/500) — code, marked-text quotes, exporter previews.

The `--font-sans` token in `@theme` is currently set to `'Inter', system-ui, sans-serif`. If you want IBM Plex Sans to be the actual default sans, update that token.

## Component conventions

### Server vs. client components

- `src/app/layout.tsx` and `src/app/not-found.tsx` are **server components**. Don't add hooks or browser APIs to them.
- Anything that uses hooks, event handlers, or browser APIs starts with `'use client'` at the top of the file. The home page, every component under `components/states/`, and the PDF-touching utilities all need it.

### Where home-page UI lives

[src/app/page.tsx](../../src/app/page.tsx) is a thin state-machine orchestrator over `upload | processing | results | error`. It does not render inline JSX for any state — each one is a component under [src/components/states/](../../src/components/states/):

- `UploadState.tsx` — landing view with the dropzone.
- `ProcessingState.tsx` — progress bar with page count.
- `ErrorState.tsx` — failure view with retry.
- `ResultsState.tsx` — annotation list plus the sticky export sidebar.
- `ExportSidebar.tsx` — copy/download actions.

When you add a new home-page view, drop it under `components/states/` and wire it into the switch in `page.tsx`. Don't grow `page.tsx` with inline JSX.

### Documentation in source

- Every export from `src/lib/` and every non-trivial helper gets a JSDoc block (summary, `@param`, `@returns`, `@example` when it adds value). Match the format of the existing `lib/` exports.
- Components get a single file-level JSDoc block describing the component's responsibility. Inline prop docs are unnecessary — the TypeScript types carry the contract.

### Utility classes that exist

These are defined in `styles/components.css` and worth knowing before you reinvent them:

- `.card` — rounded container with subtle border on a warm background.
- `.btn-primary` / `.btn-secondary` — terracotta accent and outlined button.
- `.badge` plus `.badge-<type>` — color-coded annotation chips.

## Adjacent docs

- [Add a new annotation type](../guides/add-annotation-type.md) covers exactly which color tokens and badge classes need new entries.
- [Architecture overview](overview.md) for where the design system sits in the larger system.

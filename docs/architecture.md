# Architecture

Internal documentation for [pdfcomments.app](https://pdfcomments.app).

## Tech Stack

- **Framework**: Next.js 16 with App Router (Turbopack)
- **Deployment**: Static export (`output: 'export'`) to S3/CloudFront
- **PDF Processing**: `pdfjs-dist` 5.x, dynamically imported (client-side only)
- **Language**: TypeScript 6
- **UI**: React 19
- **Styling**: Tailwind CSS 4 with CSS custom properties
- **Typography**: IBM Plex Sans / IBM Plex Mono (Google Fonts)
- **Icons**: Lucide React

## Features

- **Drag-and-drop PDF upload** - Client-side file handling, entirely in-browser
- **100% private** - Files never leave the browser, no server processing
- **Annotation extraction** - Highlights, strikethroughs, underlines, circles, squares, sticky notes, free-text notes
- **Text detection** - Geometry-based intersection to find text under annotations
- **Proximity grouping** - Links nearby sticky notes to their associated markup
- **Three export formats** - Detailed Markdown (AI-ready, with page locations), GFM checklist (task tracking), and rich HTML (for Google Docs / Word paste)
- **AI-ready output** - Page locations and action hints included in the detailed Markdown format

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with SEO meta tags and JSON-LD
│   ├── page.tsx            # Home-page state orchestrator (upload/processing/results/error)
│   ├── about/page.tsx      # About page with licensing info
│   ├── privacy/page.tsx    # Privacy policy
│   ├── not-found.tsx       # 404 page
│   └── globals.css         # Design system with CSS variables
├── components/
│   ├── Header.tsx          # Shared site header with navigation
│   ├── Footer.tsx          # Shared footer with copyright and links
│   ├── DropZone.tsx        # Drag-and-drop file upload UI
│   ├── AnnotationList.tsx  # Extracted annotations display
│   └── states/             # Home-page state views
│       ├── UploadState.tsx      # Landing view with dropzone
│       ├── ProcessingState.tsx  # Progress bar while parsing
│       ├── ErrorState.tsx       # Failure view with retry
│       ├── ResultsState.tsx     # Annotation list + sidebar
│       └── ExportSidebar.tsx    # Copy/download actions
├── lib/
│   ├── pdf-loader.ts       # PDF.js dynamic loader (browser-only)
│   ├── extract-annotations.ts   # Core extraction logic
│   ├── geometry.ts         # QuadPoint intersection math
│   ├── group-annotations.ts     # Proximity grouping
│   └── export-markdown.ts       # Markdown / HTML / checklist formatters
└── types/
    └── index.ts            # Shared type definitions
public/
├── pdf.worker.min.mjs      # PDF.js worker (copied at build)
├── favicon.svg             # Document icon in terracotta
├── robots.txt              # Search engine directives
└── sitemap.xml             # Site map for SEO
```

## Design System

### Colors (CSS Variables)

```css
:root {
  --color-ink: #1a1918;           /* Primary text */
  --color-ink-light: #3d3a37;     /* Secondary text */
  --color-paper: #ffffff;          /* Background */
  --color-paper-warm: #f9f9f9;     /* Card backgrounds */
  --color-accent: #c45d35;         /* Terracotta accent */
  --color-accent-soft: #fdf0eb;    /* Light accent */
  --color-muted: #6b7280;          /* Muted text */
  --color-border: #e5e7eb;         /* Borders */

  /* Annotation type colors */
  --color-highlight: #fbbf24;
  --color-strikeout: #ef4444;
  --color-underline: #f97316;
  --color-circle: #a855f7;
  --color-square: #3b82f6;
  --color-note: #22c55e;
}
```

### Typography

- **Headings**: IBM Plex Sans, semibold
- **Body**: IBM Plex Sans, regular
- **Code/Output**: IBM Plex Mono

### Components

- `.card` - Rounded containers with subtle border
- `.btn-primary` - Terracotta accent button
- `.btn-secondary` - Outlined secondary button
- `.badge-*` - Color-coded annotation type badges

## Pages

### Home (`/`)
- Upload state: Centered dropzone with feature info cards
- Processing state: Progress bar with page count
- Results state: Annotation list with sticky export sidebar

### About (`/about`)
- Product description
- Feature highlights (Private, AI-Ready, Multiple Formats)
- Use cases
- Licensing information with contact email
- Built by credit with link

### Privacy (`/privacy`)
- Summary of data handling
- Technical explanation of client-side processing
- Data collection disclosure
- Contact reference

## SEO & Discoverability

- Open Graph meta tags for social sharing
- Twitter card meta tags
- JSON-LD structured data (WebApplication schema)
- robots.txt allowing all crawlers
- sitemap.xml with all pages
- Semantic HTML with proper heading hierarchy (h1 > h2)

## Build & Deploy

```bash
# Install dependencies
pnpm install

# Development
pnpm dev

# Production build (outputs to /out)
pnpm build

# Deploy to S3 (set S3_BUCKET in .env first)
pnpm deploy:s3
```

### S3 Configuration

1. Enable static website hosting
2. Set index document: `index.html`
3. Set error document: `404.html`
4. Add public read bucket policy
5. Configure CloudFront for HTTPS (required for .app domain)

## For Contributors

Working on this repo with Claude Code? See [../CLAUDE.md](../CLAUDE.md) for the operator manual — non-obvious constraints (pdfjs dynamic-import requirement, canvas-alias gotcha, worker-copy steps), code conventions, and the add-a-new-annotation-type checklist live there.

## Contact

- **Licensing**: info@pdfcomments.app
- **Built by**: [Landon Miles](https://landonmiles.com)

## License

MIT - see [LICENSE](../LICENSE)

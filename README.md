# PDF Comments

Extract annotations from PDFs and export to Markdown.

**[Try it live →](https://pdfcomments.app)**

![PDF Comments Screenshot](docs/screenshot.png)

## Features

- **Drag-and-drop** - Upload PDFs directly in the browser
- **100% private** - Files never leave your browser, no server processing
- **Annotation types** - Highlights, strikeouts, underlines, circles, and sticky notes
- **Smart grouping** - Links sticky notes to their associated markup
- **Export formats** - Markdown tables and plain text

## Quick Start

```bash
pnpm install
pnpm dev
```

Open [localhost:3000](http://localhost:3000)

## Deploy

Static export to S3/CloudFront:

```bash
pnpm build           # outputs to /out
pnpm deploy:s3       # requires S3_BUCKET in .env
```

See [.env.example](.env.example) for configuration.

## Tech Stack

- Next.js 14 (static export)
- pdfjs-dist (client-side PDF parsing)
- TypeScript
- Tailwind CSS

## License

MIT - see [LICENSE](LICENSE)

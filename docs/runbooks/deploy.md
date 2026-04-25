# Deploy to production

Pushes the static export to S3 and invalidates CloudFront. Production is [pdfcomments.app](https://pdfcomments.app).

## TL;DR

```bash
pnpm send-it
```

Runs build → S3 sync → CloudFront invalidation as a single sequence. Don't run any of these without explicit intent — they push to production.

## Prerequisites

A `.env` file at the repo root with these variables (see [`.env.example`](../../.env.example)):

```bash
S3_BUCKET=your-bucket/path/             # required
CLOUDFRONT_DISTRIBUTION_ID=ABC123       # optional but used by `invalidate`
```

The deploy scripts source `.env` directly (`set -a && source .env`), so the variables don't need to be exported in your shell.

AWS credentials must be available to `aws-cli` — typically through `~/.aws/credentials`, `AWS_PROFILE`, or environment variables. The IAM identity needs:

- `s3:PutObject`, `s3:DeleteObject`, `s3:ListBucket` on the destination bucket.
- `cloudfront:CreateInvalidation` on the distribution.

## What `pnpm send-it` does

Defined in [package.json](../../package.json):

```
pnpm send-it
  ├── pnpm build           # next build && cp pdf.worker.min.mjs out/
  ├── pnpm deploy:s3       # aws s3 sync out/ s3://$S3_BUCKET --delete
  └── pnpm invalidate      # aws cloudfront create-invalidation --paths "/*"
```

1. **Build**: produces `/out/` and copies the pdfjs worker into it. Static export — no Node runtime needed in production.
2. **Sync**: `aws s3 sync` with `--delete`, so files removed from `out/` are also removed from the bucket. Anything in `S3_BUCKET` that isn't in `out/` will be deleted.
3. **Invalidate**: a single `/*` invalidation. CloudFront bills per path beyond the free tier — `/*` counts as one path.

## Pre-flight checklist

Before running `pnpm send-it`:

- [ ] `pnpm lint && pnpm exec tsc --noEmit && pnpm build` passes locally.
- [ ] Loaded a real PDF in `pnpm dev` and confirmed the feature you changed works end-to-end. There is no automated test suite — manual verification is the test.
- [ ] If you bumped `pdfjs-dist`, confirm `public/pdf.worker.min.mjs` matches the new version (re-run `cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/`). An out-of-date worker causes silent parse failures.
- [ ] No uncommitted secret material in `out/` — the bucket is publicly readable.
- [ ] `.env` is populated and points at the production bucket, not a staging one.

## Running the individual scripts

Sometimes you want one phase, not the whole pipeline:

- **`pnpm build`** — safe, local. No production side effects.
- **`pnpm deploy:s3`** — pushes `out/` to S3. Skips invalidation, so users may see cached old content for up to the CloudFront TTL.
- **`pnpm invalidate`** — invalidates without pushing new code. Useful if you only need to force-refresh edge caches.

## Rollback

There is no built-in rollback. Options, in order of preference:

1. **Git revert + redeploy** — `git revert <bad-commit> && pnpm send-it`. Fastest path back to a known-good state if the bad change is committed.
2. **S3 versioning** (if enabled on the bucket) — restore previous object versions, then run `pnpm invalidate` to purge the CDN.
3. **Re-deploy from a known tag** — `git checkout <tag> && pnpm send-it && git checkout -`.

CloudFront invalidations take 5–10 minutes to propagate globally; users on edge caches that already have the new (broken) content will keep seeing it until the invalidation completes or their cache TTL expires.

## CloudFront / S3 setup notes

For reference if the bucket needs to be re-provisioned:

1. S3: enable static website hosting; index document `index.html`; error document `404.html`.
2. S3: public read bucket policy (CloudFront alone is fine if you front it with OAC instead).
3. CloudFront: required for HTTPS — `.app` is on the [HSTS preload list](https://hstspreload.org/), so insecure HTTP won't work.
4. DNS: point `pdfcomments.app` (and `www.`) at the CloudFront distribution.

## Adjacent docs

- [Architecture overview](../architecture/overview.md) for why the build needs the `canvas` aliases and the worker-copy step.

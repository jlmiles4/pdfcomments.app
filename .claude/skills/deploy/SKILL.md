---
name: deploy
description: Deploy the site to production (S3 + CloudFront) via `pnpm send-it`. Use when the user asks to deploy, ship, publish, push to prod, or release pdfcomments.app. Runs the build gate and requires explicit confirmation before the destructive `s3 sync --delete` and CloudFront invalidation.
---

# Deploy to production

Production is a static site on S3 + CloudFront (pdfcomments.app). `pnpm send-it` = `pnpm build && pnpm deploy:s3 && pnpm invalidate`. The S3 sync runs with `--delete`: anything in the bucket but not in `out/` is removed. Treat every deploy as a production change.

## Never run without explicit confirmation
Do not run `pnpm send-it`, `pnpm deploy:s3`, or `pnpm invalidate` until the user has confirmed, in this turn, that they want to deploy. The harness also gates these via the deploy guard in `.claude/settings.json`, but ask anyway — don't rely on the prompt alone.

## Preconditions
1. `.env` exists and defines `S3_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`, and AWS credentials. If AWS auth is interactive, ask the user to run it themselves (e.g. `! aws sso login`).
2. Working tree is clean, or the user has accepted deploying with uncommitted changes (`git status`).
3. The build gate passes — run `/preflight`, or `pnpm lint && pnpm exec tsc --noEmit && pnpm build`.

## Steps
1. Confirm: "Deploy current branch to production? This runs `s3 sync --delete` + a CloudFront invalidation."
2. On an explicit yes: `pnpm send-it`.
3. Report the CloudFront invalidation id and the URL. Invalidations take a few minutes to propagate.

## If it fails
- Missing/empty env → the scripts `source .env`; confirm the vars are actually set.
- S3 sync error → check AWS creds and bucket name. Nothing is invalidated until the sync succeeds.
- Rollback and the `--delete` footgun: see `docs/runbooks/deploy.md`.

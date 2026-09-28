# Build Version

This file exists ONLY to help you verify you uploaded the correct,
most recent ZIP to GitHub — nothing here affects the app itself.

**Build timestamp (UTC):** 2026-09-28T10:38:47Z
**Build tag:** finance-cockpit-v1.1-gitops

## How to use this file

1. After unzipping, open this file and note the "Build timestamp" above.
2. After uploading to GitHub, open the SAME file in your repo
   (github.com/<you>/<repo>/blob/main/VERSION.md).
3. If the timestamp and tag match exactly → you uploaded the correct
   version. If they don't match (or the file is missing entirely on
   GitHub) → you likely uploaded an older ZIP by mistake.

## Changelog reference

- v1.1-gitops: Added `.github/workflows/build-and-push.yml`,
  `deploy/pi/` (docker-compose.yml, .env.pi.example, first-time-setup.sh),
  Prisma `binaryTargets` for ARM64, GitOps section in README.
- v1.0: Initial local-first Finance Cockpit (Next.js + Prisma + SQLite,
  AES-256-GCM encryption, PriceProvider abstraction, Docker/NAS modes).

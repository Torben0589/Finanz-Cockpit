# 🔷 Finance Cockpit — Local-First Personal Finance & Portfolio Webapp

A fully self-hosted, **local-first** personal finance and portfolio tracker
inspired by modern tools like Finanzfluss Copilot — but with **no cloud
dependency, no SaaS backend, and your data never leaves your device or NAS.**

> 🇩🇪 Eine deutsche Version dieser Anleitung findest du in [README.de.md](./README.de.md).

---

## ✨ Features

- **Dashboard** — Net worth over time, cash vs. investments breakdown, asset allocation donut chart.
- **Portfolios** — Multiple portfolios, holdings with quantity/average buy price, live P/L (absolute & %).
- **Transactions Ledger** — Income / Expense / Buy / Sell / Dividend, categories, filters, cashflow analysis.
- **Market Data Layer** — Abstract `PriceProvider` interface. Ships with an offline **Mock provider** (default,
  zero internet required), a **CSV provider** for self-imported prices, and an optional **Yahoo Finance adapter**
  (isolated, fully removable, not required).
- **Investment Analytics** — Asset allocation, portfolio breakdown, mocked S&P 500 benchmark comparison, simplified ETF look-through.
- **Dividends** — Per-asset tracking, trailing-12-month yield, projected annual income.
- **Budgeting** — Monthly budgets per category, spend-vs-budget chart, income vs. expense comparison.
- **CSV Import** — Bank-agnostic column mapping (RAW CSV → normalized transaction model), works with any bank export.
- **Full Data Ownership** — Encrypted full-database backup export/restore, plus a plain JSON export for migration.

## 🔐 Security

| Concern | Implementation |
|---|---|
| Local login | Single/family local user, master password only — no external identity provider. |
| Key derivation | **PBKDF2-SHA256** (210,000 iterations, OWASP 2023 baseline), *not* Argon2 — deliberately, to avoid native-addon build failures on ARM-based NAS systems. Swappable in `src/lib/crypto.ts` if you prefer Argon2id on x86 hardware. |
| Field encryption | **AES-256-GCM** for account numbers, transaction notes, and API tokens. |
| Key handling | The derived AES key lives **only in server process memory** for the session lifetime (`src/lib/session.ts`) — it is **never written to disk** and is wiped on logout/restart. |
| Backups | Encrypted export wraps the entire DB dump in a second AES-256-GCM envelope — a stolen backup file is useless without your master password. |

> ⚠️ **Known limitation:** the in-memory session store assumes a **single Node.js process** (true for `npm run dev`, `npm start`, and the provided Dockerfile). If you ever scale to multiple workers/replicas, move the session store to a shared store (e.g. Redis) — sessions won't be shared across processes otherwise.

## 🧱 Tech Stack

- **Frontend:** Next.js 14 (App Router) · TypeScript · TailwindCSS · Recharts · Zustand · React Query
- **Backend:** Next.js Route Handlers (Node.js runtime) — a REST API co-located in the same app for a true "one-command" local deployment
- **Database:** Prisma ORM · SQLite by default (single file, `/data/finance.db`) · optional PostgreSQL for Docker/NAS multi-user setups

## 🚀 Quick Start (Local Mode)

```bash
npm install
cp .env.example .env          # adjust DATABASE_URL / SESSION_SECRET if desired
npx prisma migrate dev --name init
npm run seed                  # optional demo data (user: demo / password: demo12345)
npm run dev
```

Open `http://localhost:3000` — on first run you'll be redirected to `/setup` to create your master password (skip this if you ran the seed script and just log in with `demo` / `demo12345`).

## 🐳 Docker Mode

```bash
docker compose up -d --build
```

The SQLite file is bind-mounted at `./data/finance.db` on the host. Environment variables (session secret, PBKDF2 iterations, price provider) are set in `docker-compose.yml`.

### Optional PostgreSQL mode

```bash
docker compose --profile postgres up -d --build
```

Then update `DATABASE_URL` to `postgresql://finance:finance@postgres:5432/finance?schema=public` and re-run `npx prisma migrate deploy`.

## 🔁 GitOps Deployment (Raspberry Pi 5 / any home server)

The cleanest way to run this long-term: **the code lives entirely in this
GitHub repo (public or private), while every piece of sensitive data stays
only on your device.** Nothing personal is ever built into the Docker image
or pushed anywhere.

**How it works:**

1. You push to `main` → `.github/workflows/build-and-push.yml` builds a
   multi-arch image (`linux/amd64` + `linux/arm64`) and publishes it to
   `ghcr.io/<you>/<repo>:latest`. GHCR container image storage/bandwidth is
   currently free for both public and private repos.
2. On your Raspberry Pi (or any machine), you only ever run the files in
   `deploy/pi/` — this compose file has **no build step**, it just pulls
   the finished image.
3. Real secrets (`SESSION_SECRET`) and the SQLite database live exclusively
   in `deploy/pi/.env` and `deploy/pi/data/` — both are git-ignored and
   generated locally by `deploy/pi/first-time-setup.sh`.
4. An optional Watchtower sidecar checks nightly for new images and
   restarts the container automatically. This is safe because Prisma
   migrations run on every container start (see `Dockerfile` `CMD`), so an
   auto-update never leaves the DB schema out of sync with the code.

**First-time setup on the Pi:**

```bash
git clone https://github.com/<you>/<repo>.git
cd <repo>/deploy/pi
chmod +x first-time-setup.sh && ./first-time-setup.sh
docker compose pull
docker compose up -d
```

**Every future update** (after you push new code and CI finishes building):

```bash
cd deploy/pi
docker compose pull && docker compose up -d
# ...or just wait for Watchtower to do it automatically overnight.
```

The Pi never runs `npm install` or `next build` — all compute-heavy work
happens on GitHub's runners, keeping the Pi's 4 GB RAM free for actually
serving the app.

## 🗄️ NAS Mode (Fritz!NAS / SMB / WebDAV)

1. Mount your Fritz!NAS share on the host running Docker or Node, e.g. under `/mnt/fritznas/finance`.
2. Point the database path at the mount:
   ```
   DATABASE_URL="file:/mnt/fritznas/finance/finance.db"
   ```
   or, in `docker-compose.yml`, change the bind mount from `./data` to your mount path.
3. Everything else works identically — SQLite treats the network share like any other file path.

## 📁 Project Structure

```
prisma/schema.prisma       Data model (User, Account, Portfolio, Asset, Holding,
                           Transaction, Category, Budget, PriceHistory, Dividend, Setting)
prisma/seed.ts             Demo data seed script
src/lib/crypto.ts          PBKDF2 key derivation + AES-256-GCM field encryption
src/lib/session.ts         In-memory session store (never persists the data key)
src/lib/auth.ts            Setup / login / logout / session guard
src/lib/priceProvider/     Abstract PriceProvider interface + mock/csv/yahoo adapters
src/lib/services/          Business logic (net worth, portfolio, transactions, budget, dividends, export)
src/app/api/               REST route handlers (Next.js App Router)
src/app/(pages)/            Dashboard, Portfolio, Transactions, Budget, Dividends, Settings
src/components/            UI components, charts (Recharts), forms
```

## 🔄 Data Export / Import

- **Settings → Backup & Export → "Verschlüsseltes Backup exportieren"** downloads a `.financebackup` file (AES-256-GCM encrypted with your current master password).
- **Settings → Backup & Export → "Als JSON exportieren"** downloads a plain JSON dump for migrating to another tool (encrypted fields remain ciphertext — no plaintext secrets are ever exported unencrypted).
- Restore any `.financebackup` file via the file picker in the same section — this **replaces** all data owned by the currently logged-in user.

## 🧩 Extending the Market Data Layer

```ts
interface PriceProvider {
  getPrice(symbol: string): Promise<number>;
  getHistorical(symbol: string, fromISO?: string, toISO?: string): Promise<TimeSeries>;
}
```

Implement this interface (see `src/lib/priceProvider/`) and register it in `src/lib/priceProvider/index.ts` to plug in any data source — the rest of the app never changes.

## 🛣️ Suggested Next Steps

- Add per-day historical holding reconstruction for a fully accurate net-worth equity curve (currently uses current quantities projected backward — documented as a TODO in `netWorthService.ts`).
- Add multi-user support with per-request DB row isolation if hosting for more than one household.
- Swap PBKDF2 for Argon2id in `src/lib/crypto.ts` if deploying on x86 hardware and native addons are acceptable.
- Wire a real ETF constituents API for true look-through allocation (currently simplified per spec).

---

**License:** MIT — this is your data, your server, your rules.

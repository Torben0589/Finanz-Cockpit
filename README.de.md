# 🔷 Finance Cockpit — Local-First Personal-Finance- & Portfolio-Webapp

Eine vollständig selbst gehostete, **local-first** Personal-Finance- und
Portfolio-Tracking-Anwendung, inspiriert von modernen Tools wie Finanzfluss
Copilot — jedoch **ohne Cloud-Abhängigkeit, ohne SaaS-Backend, und deine
Daten verlassen niemals dein Gerät oder dein NAS.**

---

## ✨ Funktionen

- **Dashboard** — Gesamtvermögen über die Zeit, Cash-vs-Investments-Aufteilung, Asset-Allocation-Donut-Chart.
- **Portfolios** — Mehrere Portfolios, Holdings mit Menge/Ø Kaufpreis, live berechnetes P/L (absolut & %).
- **Transaktions-Ledger** — Einnahme / Ausgabe / Kauf / Verkauf / Dividende, Kategorien, Filter, Cashflow-Analyse.
- **Market-Data-Layer** — Abstraktes `PriceProvider`-Interface. Enthält einen offline lauffähigen **Mock-Provider**
  (Standard, keine Internetverbindung nötig), einen **CSV-Provider** für selbst importierte Kurse, sowie einen
  optionalen **Yahoo-Finance-Adapter** (isoliert, vollständig entfernbar, nicht erforderlich).
- **Investment-Analytics** — Asset Allocation, Portfolio-Aufschlüsselung, gemockter S&P-500-Benchmarkvergleich, vereinfachtes ETF-Look-Through.
- **Dividenden** — Tracking pro Asset, Trailing-12-Monats-Rendite, projiziertes Jahreseinkommen.
- **Budgeting** — Monatsbudgets pro Kategorie, Ausgaben-vs-Budget-Chart, Einnahmen-vs-Ausgaben-Vergleich.
- **CSV-Import** — Bank-unabhängiges Spalten-Mapping (RAW CSV → normalisiertes Transaktionsmodell), funktioniert mit jedem Bank-Export.
- **Volle Datenhoheit** — Verschlüsselter Komplett-Datenbank-Export/Import, plus ein Klartext-JSON-Export für Migrationen.

## 🔐 Sicherheit

| Thema | Umsetzung |
|---|---|
| Lokaler Login | Einzelner/familiärer lokaler Nutzer, nur Master-Passwort — kein externer Identity-Provider. |
| Schlüsselableitung | **PBKDF2-SHA256** (210.000 Iterationen, OWASP-2023-Baseline), *nicht* Argon2 — bewusst gewählt, um Fehlschläge beim Kompilieren nativer Module auf ARM-basierten NAS-Systemen zu vermeiden. In `src/lib/crypto.ts` austauschbar, falls du auf x86-Hardware lieber Argon2id nutzen möchtest. |
| Feldverschlüsselung | **AES-256-GCM** für Kontonummern, Transaktionsnotizen und API-Tokens. |
| Schlüsselhandhabung | Der abgeleitete AES-Schlüssel existiert **ausschließlich im Arbeitsspeicher des Server-Prozesses** für die Dauer der Sitzung (`src/lib/session.ts`) — er wird **niemals auf die Festplatte geschrieben** und beim Logout/Neustart gelöscht. |
| Backups | Der verschlüsselte Export umhüllt den kompletten DB-Dump mit einer zweiten AES-256-GCM-Schicht — eine gestohlene Backup-Datei ist ohne dein Master-Passwort nutzlos. |

> ⚠️ **Bekannte Einschränkung:** Der In-Memory-Session-Speicher geht von einem **einzelnen Node.js-Prozess** aus (zutreffend bei `npm run dev`, `npm start` und dem mitgelieferten Dockerfile). Solltest du jemals auf mehrere Worker/Replicas skalieren, verschiebe den Session-Speicher in einen gemeinsam genutzten Store (z. B. Redis) — sonst werden Sessions nicht prozessübergreifend geteilt.

## 🧱 Tech-Stack

- **Frontend:** Next.js 14 (App Router) · TypeScript · TailwindCSS · Recharts · Zustand · React Query
- **Backend:** Next.js Route Handlers (Node.js-Runtime) — eine REST-API, die in derselben App liegt, für ein echtes "Ein-Befehl"-Setup
- **Datenbank:** Prisma ORM · standardmäßig SQLite (Einzeldatei, `/data/finance.db`) · optional PostgreSQL für Docker-/NAS-Mehrbenutzer-Setups

## 🚀 Schnellstart (Lokaler Modus)

```bash
npm install
cp .env.example .env          # DATABASE_URL / SESSION_SECRET nach Bedarf anpassen
npx prisma migrate dev --name init
npm run seed                  # optionale Demo-Daten (Benutzer: demo / Passwort: demo12345)
npm run dev
```

Öffne `http://localhost:3000` — beim ersten Start wirst du zu `/setup` weitergeleitet, um dein Master-Passwort anzulegen (überspringe dies, wenn du das Seed-Script ausgeführt hast, und melde dich einfach mit `demo` / `demo12345` an).

## 🐳 Docker-Modus

```bash
docker compose up -d --build
```

Die SQLite-Datei wird als Bind-Mount unter `./data/finance.db` auf dem Host abgelegt. Umgebungsvariablen (Session-Secret, PBKDF2-Iterationen, Price-Provider) werden in `docker-compose.yml` gesetzt.

### Optionaler PostgreSQL-Modus

```bash
docker compose --profile postgres up -d --build
```

Aktualisiere anschließend `DATABASE_URL` auf `postgresql://finance:finance@postgres:5432/finance?schema=public` und führe erneut `npx prisma migrate deploy` aus.

## 🗄️ NAS-Modus (Fritz!NAS / SMB / WebDAV)

1. Mounte deine Fritz!NAS-Freigabe auf dem Host, auf dem Docker oder Node läuft, z. B. unter `/mnt/fritznas/finance`.
2. Setze den Datenbankpfad auf den Mount:
   ```
   DATABASE_URL="file:/mnt/fritznas/finance/finance.db"
   ```
   oder ändere in `docker-compose.yml` den Bind-Mount von `./data` auf deinen Mount-Pfad.
3. Alles andere funktioniert identisch — SQLite behandelt die Netzwerkfreigabe wie jeden anderen Dateipfad.

## 📁 Projektstruktur

```
prisma/schema.prisma       Datenmodell (User, Account, Portfolio, Asset, Holding,
                           Transaction, Category, Budget, PriceHistory, Dividend, Setting)
prisma/seed.ts             Demo-Daten-Seed-Script
src/lib/crypto.ts          PBKDF2-Schlüsselableitung + AES-256-GCM-Feldverschlüsselung
src/lib/session.ts         In-Memory-Session-Speicher (persistiert den Datenschlüssel nie)
src/lib/auth.ts            Setup / Login / Logout / Session-Guard
src/lib/priceProvider/     Abstraktes PriceProvider-Interface + Mock-/CSV-/Yahoo-Adapter
src/lib/services/          Business-Logik (Net Worth, Portfolio, Transaktionen, Budget, Dividenden, Export)
src/app/api/               REST-Route-Handler (Next.js App Router)
src/app/(pages)/            Dashboard, Portfolio, Transaktionen, Budget, Dividenden, Einstellungen
src/components/            UI-Komponenten, Charts (Recharts), Formulare
```

## 🔄 Datenexport / -import

- **Settings → Backup & Export → "Verschlüsseltes Backup exportieren"** lädt eine `.financebackup`-Datei herunter (AES-256-GCM verschlüsselt mit deinem aktuellen Master-Passwort).
- **Settings → Backup & Export → "Als JSON exportieren"** lädt einen Klartext-JSON-Dump für die Migration in ein anderes Tool herunter (verschlüsselte Felder bleiben als Chiffretext erhalten — es werden niemals Klartext-Geheimnisse unverschlüsselt exportiert).
- Stelle eine beliebige `.financebackup`-Datei über die Dateiauswahl im selben Bereich wieder her — dies **ersetzt** alle Daten des aktuell angemeldeten Nutzers.

## 🧩 Erweiterung des Market-Data-Layers

```ts
interface PriceProvider {
  getPrice(symbol: string): Promise<number>;
  getHistorical(symbol: string, fromISO?: string, toISO?: string): Promise<TimeSeries>;
}
```

Implementiere dieses Interface (siehe `src/lib/priceProvider/`) und registriere es in `src/lib/priceProvider/index.ts`, um eine beliebige Datenquelle einzubinden — der Rest der App muss dafür nicht angepasst werden.

## 🛣️ Empfohlene nächste Schritte

- Tägliche historische Holding-Rekonstruktion ergänzen für eine vollständig akkurate Net-Worth-Kurve (aktuell werden die aktuellen Bestandsmengen rückwirkend projiziert — als TODO in `netWorthService.ts` dokumentiert).
- Mehrbenutzer-Unterstützung mit Datenisolierung pro Anfrage ergänzen, falls du für mehr als einen Haushalt hostest.
- PBKDF2 in `src/lib/crypto.ts` gegen Argon2id tauschen, falls du auf x86-Hardware deployst und native Module akzeptabel sind.
- Eine echte ETF-Konstituenten-API anbinden für ein echtes Look-Through der Allokation (aktuell laut Spezifikation vereinfacht).

---

**Lizenz:** MIT — es sind deine Daten, dein Server, deine Regeln.

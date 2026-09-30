# Premium-Theme einbauen

Dieses Paket ist für die vorhandene Next.js-/Tailwind-Version des Finance Cockpits bestimmt.

## Enthaltene Ersatzdateien

- `tailwind.config.ts`
- `src/app/globals.css`
- `src/app/dashboard/page.tsx`
- `src/components/layout/AppShell.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/Header.tsx`
- `src/components/dashboard/SummaryCards.tsx`
- `src/components/ui/Card.tsx`
- `src/components/ui/StatCard.tsx`

## Einbau in GitHub Codespaces

1. Vorhandenen Stand sichern:

```bash
git checkout -b backup-vor-premium-design
git push -u origin backup-vor-premium-design
git checkout main
```

2. ZIP herunterladen und entpacken.
3. Den Inhalt des entpackten Ordners in das Stammverzeichnis des Repositorys kopieren. Die Verzeichnisstruktur muss erhalten bleiben.
4. Prüfen:

```bash
npm run build
```

5. Wenn der Build erfolgreich ist:

```bash
git add tailwind.config.ts src/app/globals.css src/app/dashboard/page.tsx src/components/layout/AppShell.tsx src/components/layout/Sidebar.tsx src/components/layout/Header.tsx src/components/dashboard/SummaryCards.tsx src/components/ui/Card.tsx src/components/ui/StatCard.tsx
git commit -m "Redesign Finance Cockpit with premium orange theme"
git push origin main
```

## Rückgängig machen

Wenn das Design nicht übernommen werden soll:

```bash
git restore tailwind.config.ts src/app/globals.css src/app/dashboard/page.tsx src/components/layout/AppShell.tsx src/components/layout/Sidebar.tsx src/components/layout/Header.tsx src/components/dashboard/SummaryCards.tsx src/components/ui/Card.tsx src/components/ui/StatCard.tsx
```

Hinweis: `git restore` hilft nur vor dem Commit. Nach einem Commit den zuvor angelegten Backup-Branch verwenden.

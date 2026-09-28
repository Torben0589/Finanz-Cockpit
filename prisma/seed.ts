/**
 * Seed script — populates a demo dataset so the app is fully explorable
 * immediately after `npm install && npm run dev` (spec §10 "Seed script
 * with demo data"). Uses username "demo" / master password "demo12345".
 *
 * Run with: npm run seed
 */
import { PrismaClient } from "@prisma/client";
import { generateSalt, hashPassword, deriveKey, encryptField } from "../src/lib/crypto";

const prisma = new PrismaClient();

const DEMO_USERNAME = "demo";
const DEMO_PASSWORD = "demo12345";

async function main() {
  console.log("🌱 Seeding Finance Cockpit demo data…");

  const existing = await prisma.user.findFirst();
  if (existing) {
    console.log("⚠️  A user already exists — skipping seed to avoid overwriting real data.");
    return;
  }

  const passwordSalt = generateSalt();
  const keySalt = generateSalt();
  const iterations = 210_000;
  const passwordHash = hashPassword(DEMO_PASSWORD, passwordSalt, iterations);
  const dataKey = deriveKey(DEMO_PASSWORD, keySalt, iterations);

  const user = await prisma.user.create({
    data: { username: DEMO_USERNAME, passwordHash, passwordSalt, keySalt, pbkdf2Iterations: iterations }
  });

  const checking = await prisma.account.create({
    data: {
      userId: user.id,
      name: "Girokonto",
      type: "BANK",
      currency: "EUR",
      startingBalance: 2500,
      accountNumberEncrypted: encryptField("DE00 1234 5678 9000 0000 00", dataKey)
    }
  });
  const broker = await prisma.account.create({
    data: { userId: user.id, name: "Broker-Verrechnungskonto", type: "BROKER", currency: "EUR", startingBalance: 500 }
  });

  const catGroceries = await prisma.category.create({
    data: { userId: user.id, name: "Lebensmittel", type: "EXPENSE", color: "#dc9e3d" }
  });
  const catRent = await prisma.category.create({
    data: { userId: user.id, name: "Miete", type: "EXPENSE", color: "#dc3d6e" }
  });
  const catSalary = await prisma.category.create({
    data: { userId: user.id, name: "Gehalt", type: "INCOME", color: "#3ddc97" }
  });
  const catLeisure = await prisma.category.create({
    data: { userId: user.id, name: "Freizeit", type: "EXPENSE", color: "#3d9edc" }
  });

  await prisma.budget.createMany({
    data: [
      { userId: user.id, categoryId: catGroceries.id, month: currentMonth(), amount: 400 },
      { userId: user.id, categoryId: catRent.id, month: currentMonth(), amount: 950 },
      { userId: user.id, categoryId: catLeisure.id, month: currentMonth(), amount: 150 }
    ]
  });

  const now = new Date();
  const txData: any[] = [];
  for (let i = 0; i < 6; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    txData.push({
      userId: user.id,
      accountId: checking.id,
      type: "INCOME",
      amount: 3200,
      currency: "EUR",
      date,
      categoryId: catSalary.id,
      noteEncrypted: encryptField("Monatliches Gehalt", dataKey),
      importSource: "seed"
    });
    txData.push({
      userId: user.id,
      accountId: checking.id,
      type: "EXPENSE",
      amount: -950,
      currency: "EUR",
      date: new Date(now.getFullYear(), now.getMonth() - i, 3),
      categoryId: catRent.id,
      importSource: "seed"
    });
    txData.push({
      userId: user.id,
      accountId: checking.id,
      type: "EXPENSE",
      amount: -(300 + Math.round(Math.random() * 150)),
      currency: "EUR",
      date: new Date(now.getFullYear(), now.getMonth() - i, 10),
      categoryId: catGroceries.id,
      importSource: "seed"
    });
    txData.push({
      userId: user.id,
      accountId: checking.id,
      type: "EXPENSE",
      amount: -(40 + Math.round(Math.random() * 80)),
      currency: "EUR",
      date: new Date(now.getFullYear(), now.getMonth() - i, 18),
      categoryId: catLeisure.id,
      importSource: "seed"
    });
  }
  await prisma.transaction.createMany({ data: txData });

  const portfolio = await prisma.portfolio.create({
    data: { userId: user.id, name: "Langfrist-Depot", description: "ETF- & Aktien-Sparplan" }
  });

  const assetDefs = [
    { symbol: "VWCE.DE", name: "Vanguard FTSE All-World UCITS ETF", type: "ETF", qty: 45, avg: 108.2 },
    { symbol: "AAPL", name: "Apple Inc.", type: "STOCK", qty: 12, avg: 165.5 },
    { symbol: "MSFT", name: "Microsoft Corp.", type: "STOCK", qty: 8, avg: 310.0 },
    { symbol: "BTC-EUR", name: "Bitcoin", type: "CRYPTO", qty: 0.05, avg: 42000 }
  ];

  for (const a of assetDefs) {
    const asset = await prisma.asset.create({ data: { symbol: a.symbol, name: a.name, type: a.type, currency: "EUR" } });
    await prisma.holding.create({
      data: { portfolioId: portfolio.id, assetId: asset.id, quantity: a.qty, averageBuyPrice: a.avg }
    });

    if (a.symbol !== "BTC-EUR") {
      await prisma.dividend.create({
        data: {
          assetId: asset.id,
          portfolioId: portfolio.id,
          exDate: new Date(now.getFullYear(), now.getMonth() - 2, 15),
          payDate: new Date(now.getFullYear(), now.getMonth() - 2, 20),
          amountPerShare: 0.35,
          quantityAtPay: a.qty,
          totalAmount: 0.35 * a.qty,
          currency: "EUR"
        }
      });
    }
  }

  console.log("✅ Seed complete.");
  console.log(`   Login with username "${DEMO_USERNAME}" and master password "${DEMO_PASSWORD}"`);
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

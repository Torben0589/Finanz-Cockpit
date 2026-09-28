import { redirect } from "next/navigation";
import { isFirstRun, getSessionOrNull } from "@/lib/auth";

// Force dynamic rendering: this page queries the database (isFirstRun())
// and must never be statically pre-rendered at Docker build time, when
// no real database file exists yet (DATABASE_URL at build time is a
// placeholder just for `prisma generate`). Without this, `next build`
// tries to prerender "/" and Prisma throws a connection error, failing
// the entire Docker build.
export const dynamic = "force-dynamic";

export default async function RootPage() {
  if (await isFirstRun()) redirect("/setup");
  if (!getSessionOrNull()) redirect("/login");
  redirect("/dashboard");
}

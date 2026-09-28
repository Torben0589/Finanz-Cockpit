import { redirect } from "next/navigation";
import { isFirstRun, getSessionOrNull } from "@/lib/auth";

export default async function RootPage() {
  if (await isFirstRun()) redirect("/setup");
  if (!getSessionOrNull()) redirect("/login");
  redirect("/dashboard");
}

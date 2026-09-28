import { NextResponse } from "next/server";
import { getSessionOrNull, isFirstRun } from "@/lib/auth";

export async function GET() {
  const session = getSessionOrNull();
  const firstRun = await isFirstRun();
  return NextResponse.json({
    authenticated: !!session,
    username: session?.username ?? null,
    firstRun
  });
}

import { NextResponse } from "next/server";
import { requireSession, AuthError } from "@/lib/auth";
import { getAssetAllocation } from "@/lib/services/portfolioService";

export async function GET() {
  try {
    const session = requireSession();
    const allocation = await getAssetAllocation(session.userId);
    return NextResponse.json(allocation);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    return NextResponse.json({ error: "Failed to load allocation." }, { status: 500 });
  }
}

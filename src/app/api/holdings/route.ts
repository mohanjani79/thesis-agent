import { NextResponse } from "next/server";
import { getMarketProvider } from "@/lib/market";
import { apiAccount } from "@/lib/auth";

export async function GET(req: Request) {
  if (!(await apiAccount(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const market = getMarketProvider();
  return NextResponse.json({ provider: market.name, holdings: await market.holdings() });
}

import { NextResponse } from "next/server";
import { getMarketProvider } from "@/lib/market";

export async function GET() {
  const market = getMarketProvider();
  return NextResponse.json({ provider: market.name, holdings: await market.holdings() });
}

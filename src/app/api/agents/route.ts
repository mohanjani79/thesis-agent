import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { parseAgentInput } from "@/lib/validate";
import { apiAccount } from "@/lib/auth";

export async function GET(req: Request) {
  const account = await apiAccount(req);
  if (!account) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await getStore().listAgents(account.id));
}

export async function POST(req: Request) {
  const account = await apiAccount(req);
  if (!account) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = parseAgentInput(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  return NextResponse.json(await getStore().createAgent(parsed.value, account.id), { status: 201 });
}

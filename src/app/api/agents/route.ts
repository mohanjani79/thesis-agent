import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { parseAgentInput } from "@/lib/validate";

export async function GET() {
  return NextResponse.json(await getStore().listAgents());
}

export async function POST(req: Request) {
  const parsed = parseAgentInput(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  return NextResponse.json(await getStore().createAgent(parsed.value), { status: 201 });
}

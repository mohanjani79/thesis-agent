import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { parseAgentInput } from "@/lib/validate";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const store = getStore();
  const agent = await store.getAgent(id);
  if (!agent) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ agent, checks: await store.listChecks(id) });
}

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  const parsed = parseAgentInput(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const agent = await getStore().updateAgent(id, parsed.value);
  if (!agent) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(agent);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  await getStore().deleteAgent(id);
  return new NextResponse(null, { status: 204 });
}

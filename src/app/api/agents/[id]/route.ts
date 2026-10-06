import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { parseAgentInput } from "@/lib/validate";
import { apiAccount } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

/** The agent if it belongs to the caller, else the error response to send. */
async function load(req: Request, id: string) {
  const account = await apiAccount(req);
  if (!account) return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  const agent = await getStore().getAgent(id);
  if (!agent || agent.accountId !== account.id) return { error: NextResponse.json({ error: "not found" }, { status: 404 }) };
  return { agent };
}

export async function GET(req: Request, { params }: Ctx) {
  const { id } = await params;
  const { agent, error } = await load(req, id);
  if (!agent) return error;
  return NextResponse.json({ agent, checks: await getStore().listChecks(id) });
}

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  const { agent: own, error } = await load(req, id);
  if (!own) return error;
  const parsed = parseAgentInput(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const agent = await getStore().updateAgent(id, parsed.value);
  if (!agent) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(agent);
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { id } = await params;
  const { agent, error } = await load(req, id);
  if (!agent) return error;
  await getStore().deleteAgent(id);
  return new NextResponse(null, { status: 204 });
}

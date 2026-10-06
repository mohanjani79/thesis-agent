import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { runCheck } from "@/lib/check";
import { apiAccount } from "@/lib/auth";

export const maxDuration = 120;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = await apiAccount(req);
  if (!account) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const agent = await getStore().getAgent(id);
  if (!agent || agent.accountId !== account.id) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(await runCheck(agent), { status: 201 });
}

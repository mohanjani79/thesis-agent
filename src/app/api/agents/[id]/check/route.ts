import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { runCheck } from "@/lib/check";

export const maxDuration = 120;

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = await getStore().getAgent(id);
  if (!agent) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(await runCheck(agent), { status: 201 });
}

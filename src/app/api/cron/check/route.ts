import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { runCheck } from "@/lib/check";

// Vercel Cron calls this on the schedule in vercel.json with
// "Authorization: Bearer $CRON_SECRET". Checks run one at a time so a
// single bad evaluation does not stop the others.
export const maxDuration = 300;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const agents = await getStore().listAgents();
  const results: Array<{ agentId: string; status?: string; error?: string }> = [];
  for (const agent of agents) {
    try {
      const check = await runCheck(agent);
      results.push({ agentId: agent.id, status: check.status });
    } catch (e) {
      results.push({ agentId: agent.id, error: e instanceof Error ? e.message : String(e) });
    }
  }
  return NextResponse.json({ ranAt: new Date().toISOString(), results });
}

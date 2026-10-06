import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import { requireAccount } from "@/lib/auth";
import { saveAgentAction } from "@/app/actions";
import { AgentForm } from "../../form";

export const dynamic = "force-dynamic";
/** Server actions on this page call market data and Claude, so allow more than the default function time. */
export const maxDuration = 60;

export default async function EditAgent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = await requireAccount();
  const agent = await getStore().getAgent(id);
  if (!agent || agent.accountId !== account.id) notFound();
  const action = saveAgentAction.bind(null, id);
  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Editing</span>
          <h1 style={{ marginTop: 4 }}>{agent.name}</h1>
        </div>
      </div>
      <AgentForm agent={agent} action={action} />
    </>
  );
}

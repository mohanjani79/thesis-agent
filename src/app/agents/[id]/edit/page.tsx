import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import { updateAgentAction } from "@/app/actions";
import { AgentForm } from "../../form";

export const dynamic = "force-dynamic";
/** Server actions on this page call market data and Claude, so allow more than the default function time. */
export const maxDuration = 60;

export default async function EditAgent({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { error } = await searchParams;
  const agent = await getStore().getAgent(id);
  if (!agent) notFound();
  const action = updateAgentAction.bind(null, id);
  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Editing</span>
          <h1 style={{ marginTop: 4 }}>{agent.name}</h1>
        </div>
      </div>
      <AgentForm agent={agent} action={action} error={error} />
    </>
  );
}

import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import { updateAgentAction } from "@/app/actions";
import { AgentForm } from "../../form";

export const dynamic = "force-dynamic";

export default async function EditAgent({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { error } = await searchParams;
  const agent = await getStore().getAgent(id);
  if (!agent) notFound();
  const action = updateAgentAction.bind(null, id);
  return (
    <>
      <h1>Edit {agent.name}</h1>
      <AgentForm agent={agent} action={action} error={error} />
    </>
  );
}

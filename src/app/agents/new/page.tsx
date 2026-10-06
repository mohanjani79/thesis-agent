import { createAgentAction } from "@/app/actions";
import { AgentForm } from "../form";

export default async function NewAgent({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <>
      <h1>New agent</h1>
      <p className="muted">Write down what you believe and what would prove you wrong. The agent checks the world against it.</p>
      <AgentForm action={createAgentAction} error={error} />
    </>
  );
}

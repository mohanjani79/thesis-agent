import { createAgentAction } from "@/app/actions";
import { AgentForm } from "../form";

export default async function NewAgent({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <>
      <div className="page-head">
        <div>
          <h1>New agent</h1>
          <p className="lede">Write down what you believe and what would prove you wrong. The agent checks the world against it every weekday.</p>
        </div>
      </div>
      <AgentForm action={createAgentAction} error={error} />
    </>
  );
}

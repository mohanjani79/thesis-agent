import { saveAgentAction } from "@/app/actions";
import { AgentForm } from "../form";
import { requireAccount } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NewAgent() {
  await requireAccount();
  const action = saveAgentAction.bind(null, null);
  return (
    <>
      <div className="page-head">
        <div>
          <h1>New agent</h1>
          <p className="lede">Write down what you believe and what would prove you wrong. The agent checks the world against it every weekday.</p>
        </div>
      </div>
      <AgentForm action={action} />
    </>
  );
}

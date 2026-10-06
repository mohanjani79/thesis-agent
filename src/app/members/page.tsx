import Link from "next/link";
import { getStore } from "@/lib/store";
import { requireOwner, siteOrigin } from "@/lib/auth";
import { inviteMemberAction, removeMemberAction } from "@/app/actions";
import { timeAgo } from "@/app/ui";

export const dynamic = "force-dynamic";

export default async function Members({ searchParams }: { searchParams: Promise<{ error?: string; welcome?: string }> }) {
  const { error, welcome } = await searchParams;
  const owner = await requireOwner();
  const [accounts, agents, origin] = await Promise.all([getStore().listAccounts(), getStore().listAgents(), siteOrigin()]);
  const agentCount = (id: string) => agents.filter((a) => a.accountId === id).length;
  const link = (token: string) => `${origin}/join/${token}`;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Members</h1>
          <p className="lede">Each person gets a personal link. Opening it signs them in; removing them deletes their agents.</p>
        </div>
      </div>

      {welcome && (
        <section className="panel">
          <div className="panel-head">
            <h2>You are the owner</h2>
          </div>
          <p>Save your own link somewhere safe. It is the only way back in if this browser forgets you.</p>
          <p className="mono small" style={{ wordBreak: "break-all" }}>{link(owner.token)}</p>
        </section>
      )}

      {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

      <section className="panel">
        <div className="panel-head">
          <h2>Invite a friend</h2>
        </div>
        <form action={inviteMemberAction} className="agent">
          <div className="two">
            <div className="field">
              <label htmlFor="name">Their name</label>
              <input id="name" name="name" placeholder="Priya" required />
            </div>
            <div className="actions" style={{ alignSelf: "end" }}>
              <button type="submit" className="btn">Create invite link</button>
            </div>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>People with access</h2>
        </div>
        <div className="stack">
          {accounts.map((a) => (
            <div key={a.id} className="record none">
              <div className="record-head">
                <span className="title">{a.name}</span>
                <span className="symbols">{a.role === "owner" ? "owner" : `${agentCount(a.id)} agent${agentCount(a.id) === 1 ? "" : "s"}`}</span>
                <span className="spacer" />
                {a.role !== "owner" && (
                  <form action={removeMemberAction.bind(null, a.id)}>
                    <button type="submit" className="btn danger">Remove</button>
                  </form>
                )}
              </div>
              <div className="record-body mono small" style={{ wordBreak: "break-all" }}>{link(a.token)}</div>
              <div className="record-meta">
                <span>Added {timeAgo(a.createdAt)}</span>
                <span>Send this link privately; it signs them in on any device.</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="small muted">
        <Link href="/">Back to agents</Link>
      </p>
    </>
  );
}

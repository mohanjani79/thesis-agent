import Link from "next/link";
import { getStore } from "@/lib/store";
import { createExampleAction } from "./actions";
import { StatusPill, timeAgo } from "./ui";

export const dynamic = "force-dynamic";

export default async function Home() {
  const store = getStore();
  const [agents, latest] = await Promise.all([store.listAgents(), store.latestChecks()]);
  const counts = { intact: 0, watch: 0, broken: 0 };
  for (const a of agents) {
    const s = latest[a.id]?.status;
    if (s) counts[s]++;
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Your agents</h1>
          <p className="lede">One agent per stock or theme. Each one holds your thesis and tells you when the facts stop fitting it.</p>
        </div>
      </div>

      {agents.length === 0 ? (
        <div className="empty">
          <div>
            <h2>Start with what you believe</h2>
            <p className="lede" style={{ marginTop: 6 }}>
              Write down why you own a stock and what would prove you wrong. The agent does the daily checking.
            </p>
          </div>
          <div className="steps">
            <div>
              <span className="eyebrow">1</span>
              <b>Write the thesis</b>
              <p>Your reasoning, the assumptions it rests on, and your own exit rules.</p>
            </div>
            <div>
              <span className="eyebrow">2</span>
              <b>It watches the facts</b>
              <p>Every weekday after close it reads the price and the headlines against each assumption.</p>
            </div>
            <div>
              <span className="eyebrow">3</span>
              <b>You hear when it breaks</b>
              <p>Intact, watch, or challenged. Never a buy or sell call, only how your own story is holding.</p>
            </div>
          </div>
          <div className="actions">
            <Link href="/agents/new" className="btn">
              Write your first thesis
            </Link>
            <form action={createExampleAction}>
              <button type="submit" className="btn secondary">
                Try an example (Infosys)
              </button>
            </form>
          </div>
        </div>
      ) : (
        <>
          <div className="summary-strip">
            <div className="tile intact">
              <b>{counts.intact}</b>
              <span className="muted">intact</span>
            </div>
            <div className="tile watch">
              <b>{counts.watch}</b>
              <span className="muted">on watch</span>
            </div>
            <div className="tile broken">
              <b>{counts.broken}</b>
              <span className="muted">challenged</span>
            </div>
          </div>
          <div className="stack">
            {agents.map((a) => {
              const c = latest[a.id];
              return (
                <Link key={a.id} href={`/agents/${a.id}`} className={`record ${c?.status ?? "none"}`}>
                  <div className="record-head">
                    <span className="title">{a.name}</span>
                    <span className="symbols">{a.symbols.join(" · ")}</span>
                    <span className="spacer" />
                    <StatusPill status={c?.status} />
                  </div>
                  <div className="record-body">{c ? c.summary : "No check has run yet. Open the agent and press Check now."}</div>
                  {c && (
                    <div className="record-meta">
                      <span>Checked {timeAgo(c.ranAt)}</span>
                      {c.triggeredRules.length > 0 && <span className="down">{c.triggeredRules.length} of your rules fired</span>}
                      <span>{c.newsCount} headlines read</span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

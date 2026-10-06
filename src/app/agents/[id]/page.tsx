import Link from "next/link";
import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import { checkNowAction, deleteAgentAction } from "@/app/actions";
import { StatusPill, STATUS_LABEL, inr, pct, timeAgo } from "@/app/ui";

export const dynamic = "force-dynamic";

const KIND_LABEL = { price_below: "below", price_above: "above", drop_from_entry_pct: "drop", note: "note" } as const;
const VERDICT_LABEL = { supported: "Supported", challenged: "Challenged", no_signal: "No signal" } as const;

export default async function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = getStore();
  const agent = await store.getAgent(id);
  if (!agent) notFound();
  const checks = await store.listChecks(id, 10);
  const latest = checks[0];
  const check = checkNowAction.bind(null, id);
  const del = deleteAgentAction.bind(null, id);

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">{agent.symbols.join(" · ")}</span>
          <h1 style={{ marginTop: 4 }}>{agent.name}</h1>
          <div className="actions" style={{ marginTop: 10 }}>
            <StatusPill status={latest?.status} />
            {latest && (
              <span className="small muted">
                checked {timeAgo(latest.ranAt)} · {latest.newsCount} headlines · {latest.evaluator}
              </span>
            )}
          </div>
        </div>
        <div className="actions">
          <form action={check}>
            <button type="submit" className="btn">
              Check now
            </button>
          </form>
          <Link href={`/agents/${id}/edit`} className="btn secondary">
            Edit
          </Link>
          <form action={del}>
            <button type="submit" className="btn danger">
              Delete
            </button>
          </form>
        </div>
      </div>

      {latest ? (
        <div className="grid-2">
          <div>
            <section className="panel">
              <div className="panel-head">
                <h2>How the thesis looks today</h2>
              </div>
              {latest.triggeredRules.map((r) => (
                <div key={r.ruleId} className="fired">
                  <b>Your rule fired: {r.text}</b>
                  <span>{r.observed}</span>
                </div>
              ))}
              <p className="summary-text">{latest.summary}</p>
            </section>

            {latest.pillars.length > 0 && (
              <section className="panel">
                <div className="panel-head">
                  <h2>Assumptions</h2>
                  <span className="small muted">
                    {latest.pillars.filter((p) => p.verdict === "challenged").length} challenged ·{" "}
                    {latest.pillars.filter((p) => p.verdict === "supported").length} supported
                  </span>
                </div>
                <ul className="verdict-list">
                  {latest.pillars.map((p, i) => (
                    <li key={i}>
                      <span className={`verdict-dot ${p.verdict}`} />
                      <div>
                        <span className={`verdict-label ${p.verdict}`}>{VERDICT_LABEL[p.verdict]}</span>
                        <div className="verdict-text">{p.assumption}</div>
                        <div className="verdict-evidence">{p.evidence}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <div>
            <section className="panel">
              <div className="panel-head">
                <h2>Prices</h2>
              </div>
              <table className="price-table">
                <tbody>
                  {latest.quotes.map((q) => {
                    const entry = agent.entryPrices[q.symbol];
                    const vsEntry = entry ? ((q.lastPrice - entry) / entry) * 100 : undefined;
                    return (
                      <tr key={q.symbol}>
                        <td>
                          <b>{q.symbol}</b>
                          <div className="small muted">{q.source === "mock" ? "simulated" : q.source === "yahoo" ? "Yahoo Finance" : q.source === "kite" ? "Zerodha" : ""}</div>
                        </td>
                        <td className="r num">
                          {inr(q.lastPrice)}
                          <div className={`small ${q.changePct < 0 ? "down" : "up"}`}>{pct(q.changePct)} today</div>
                        </td>
                        <td className="r num">
                          {entry ? (
                            <>
                              <span className="muted">entry {inr(entry)}</span>
                              <div className={`small ${vsEntry! < 0 ? "down" : "up"}`}>{pct(vsEntry!)}</div>
                            </>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>

            <section className="panel">
              <div className="panel-head">
                <h2>Your rules</h2>
              </div>
              <ul className="rules">
                {agent.rules.map((r) => (
                  <li key={r.id}>
                    <code>
                      {r.symbol} {KIND_LABEL[r.kind]}
                      {r.value !== undefined ? ` ${r.value}${r.kind === "drop_from_entry_pct" ? "%" : ""}` : ""}
                    </code>
                    <span>{r.text}</span>
                  </li>
                ))}
                {agent.rules.length === 0 && <li className="muted">No rules yet.</li>}
              </ul>
            </section>
          </div>
        </div>
      ) : (
        <div className="empty">
          <h2>No check has run yet</h2>
          <p className="lede">Press Check now to read today&apos;s price and headlines against this thesis. The weekday run happens after market close.</p>
        </div>
      )}

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-head">
          <h2>The thesis</h2>
          <span className="small muted">written {new Date(agent.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
        </div>
        <p className="prose ink">{agent.thesis || <span className="muted">Not written yet.</span>}</p>
        <h3 style={{ marginTop: 18, marginBottom: 6 }}>Rests on</h3>
        <ol className="assumptions">
          {agent.assumptions.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ol>
        {agent.notes && (
          <>
            <h3 style={{ marginTop: 18, marginBottom: 6 }}>Notes</h3>
            <p className="prose">{agent.notes}</p>
          </>
        )}
        {agent.tips && (
          <>
            <h3 style={{ marginTop: 18, marginBottom: 6 }}>Tips collected</h3>
            <p className="prose">{agent.tips}</p>
          </>
        )}
      </section>

      {checks.length > 1 && (
        <section className="panel" style={{ marginTop: 16 }}>
          <div className="panel-head">
            <h2>Earlier checks</h2>
          </div>
          <ul className="history">
            {checks.slice(1).map((c) => (
              <li key={c.id}>
                <StatusPill status={c.status} />
                <span className="when">{new Date(c.ranAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                <span className="what" title={c.summary}>
                  {c.summary}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

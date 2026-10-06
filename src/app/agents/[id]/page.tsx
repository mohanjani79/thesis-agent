import Link from "next/link";
import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import { checkNowAction, deleteAgentAction } from "@/app/actions";
import { StatusBadge, inr, timeAgo } from "@/app/ui";

export const dynamic = "force-dynamic";

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
      <div className="row">
        <div className="grow">
          <h1>{agent.name}</h1>
          <span className="muted">{agent.symbols.join(", ")}</span>
        </div>
        <StatusBadge status={latest?.status} />
      </div>

      <div className="row" style={{ marginTop: 12 }}>
        <form action={check}>
          <button type="submit">Check now</button>
        </form>
        <Link href={`/agents/${id}/edit`} className="btn secondary">
          Edit
        </Link>
        <form action={del}>
          <button type="submit" className="danger">
            Delete
          </button>
        </form>
      </div>

      {latest ? (
        <div className="card">
          <div className="row">
            <strong>Latest check</strong>
            <span className="muted">
              {timeAgo(latest.ranAt)} · {latest.evaluator} · {latest.newsCount} news items
            </span>
          </div>
          <p>{latest.summary}</p>

          {latest.triggeredRules.length > 0 && (
            <>
              <h2>Your rules that fired</h2>
              <ul className="plain">
                {latest.triggeredRules.map((r) => (
                  <li key={r.ruleId}>
                    <strong>{r.text}</strong>
                    <div className="muted">{r.observed}</div>
                  </li>
                ))}
              </ul>
            </>
          )}

          {latest.pillars.length > 0 && (
            <>
              <h2>Assumptions</h2>
              <ul className="plain">
                {latest.pillars.map((p, i) => (
                  <li key={i}>
                    <span className={`verdict ${p.verdict}`}>{p.verdict.replace("_", " ")}</span> · {p.assumption}
                    <div className="muted">{p.evidence}</div>
                  </li>
                ))}
              </ul>
            </>
          )}

          <h2>Prices</h2>
          <table>
            <tbody>
              {latest.quotes.map((q) => (
                <tr key={q.symbol}>
                  <td>{q.symbol}</td>
                  <td className="num">{inr(q.lastPrice)}</td>
                  <td className="num" style={{ color: q.changePct < 0 ? "var(--broken)" : "var(--intact)" }}>
                    {q.changePct >= 0 ? "+" : ""}
                    {q.changePct.toFixed(2)}%
                  </td>
                  <td className="num muted">{agent.entryPrices[q.symbol] ? `entry ${inr(agent.entryPrices[q.symbol])}` : ""}</td>
                  <td className="muted">{q.source === "mock" ? "simulated" : q.source ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card muted">Not checked yet. Press “Check now”, or wait for the daily run.</div>
      )}

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Thesis</h2>
        <p style={{ whiteSpace: "pre-wrap" }}>{agent.thesis || <span className="muted">Not written yet.</span>}</p>
        <h2>Assumptions</h2>
        <ol>{agent.assumptions.map((a, i) => <li key={i}>{a}</li>)}</ol>
        <h2>Rules</h2>
        <ul className="plain">
          {agent.rules.map((r) => (
            <li key={r.id}>
              {r.text} <span className="muted">({r.symbol} {r.kind.replace(/_/g, " ")}{r.value !== undefined ? ` ${r.value}` : ""})</span>
            </li>
          ))}
        </ul>
        {agent.notes && (
          <>
            <h2>Notes</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{agent.notes}</p>
          </>
        )}
        {agent.tips && (
          <>
            <h2>Tips collected</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{agent.tips}</p>
          </>
        )}
      </div>

      {checks.length > 1 && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>History</h2>
          <ul className="plain">
            {checks.slice(1).map((c) => (
              <li key={c.id} className="row">
                <StatusBadge status={c.status} />
                <span className="muted">{new Date(c.ranAt).toLocaleString("en-IN")}</span>
                <span className="grow">{c.summary.slice(0, 120)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

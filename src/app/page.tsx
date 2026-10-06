import Link from "next/link";
import { getStore } from "@/lib/store";
import { StatusBadge, timeAgo } from "./ui";

export const dynamic = "force-dynamic";

export default async function Home() {
  const store = getStore();
  const [agents, latest] = await Promise.all([store.listAgents(), store.latestChecks()]);

  return (
    <>
      <h1>Your agents</h1>
      <p className="muted">One agent per stock or theme. Each holds your thesis and flags when the facts stop fitting it.</p>

      {agents.length === 0 && (
        <div className="card">
          <p>No agents yet.</p>
          <Link href="/agents/new" className="btn">
            Create your first agent
          </Link>
        </div>
      )}

      {agents.map((a) => {
        const c = latest[a.id];
        return (
          <Link key={a.id} href={`/agents/${a.id}`} style={{ color: "inherit" }}>
            <div className="card">
              <div className="row">
                <strong>{a.name}</strong>
                <span className="muted">{a.symbols.join(", ")}</span>
                <span className="grow" />
                <StatusBadge status={c?.status} />
              </div>
              <div className="muted" style={{ marginTop: 6 }}>
                {c ? `${c.summary.slice(0, 160)}${c.summary.length > 160 ? "…" : ""} · checked ${timeAgo(c.ranAt)}` : "Not checked yet"}
              </div>
            </div>
          </Link>
        );
      })}
    </>
  );
}

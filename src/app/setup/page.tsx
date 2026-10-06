import { runSetupChecks } from "@/lib/setup";

export const dynamic = "force-dynamic";

const LABEL = { ok: "OK", warn: "Optional", fail: "Needs fixing" } as const;
const CLASS = { ok: "intact", warn: "watch", fail: "broken" } as const;

export default async function SetupPage() {
  const items = await runSetupChecks();
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Setup check</h1>
          <p className="lede">Each piece of the app, whether it is working, and what to do if not. Reload after changing variables and redeploying.</p>
        </div>
      </div>
      <div className="stack">
        {items.map((it) => (
          <div key={it.name} className={`record ${CLASS[it.state]}`}>
            <div className="record-head">
              <span className="title">{it.name}</span>
              <span className="spacer" />
              <span className={`pill ${CLASS[it.state]}`}>{LABEL[it.state]}</span>
            </div>
            <div style={{ marginTop: 6 }}>{it.detail}</div>
            {it.fix && (
              <div className="record-meta">
                <span>
                  <b>Fix:</b> {it.fix}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

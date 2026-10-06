import type { Agent } from "@/lib/types";

const ruleToLine = (r: Agent["rules"][number]) => {
  const kind = { price_below: "below", price_above: "above", drop_from_entry_pct: "drop", note: "note" }[r.kind];
  const val = r.value !== undefined ? ` ${r.value}${r.kind === "drop_from_entry_pct" ? "%" : ""}` : "";
  return `${r.symbol} ${kind}${val} | ${r.text}`;
};

export function AgentForm({ agent, action, error }: { agent?: Agent; action: (form: FormData) => Promise<void>; error?: string }) {
  return (
    <form className="agent card" action={action}>
      {error && (
        <p style={{ color: "var(--broken)" }}>
          Could not save: {error}
        </p>
      )}
      <label htmlFor="name">Agent name</label>
      <input id="name" name="name" required defaultValue={agent?.name} placeholder="Infosys: GenAI services rebound" />

      <label htmlFor="symbols">NSE symbols</label>
      <input id="symbols" name="symbols" required defaultValue={agent?.symbols.join(", ")} placeholder="INFY, TCS" />
      <small>Comma separated. Up to 10.</small>

      <label htmlFor="thesis">Your thesis</label>
      <textarea id="thesis" name="thesis" defaultValue={agent?.thesis} placeholder="Why you own this, in your own words." />

      <label htmlFor="assumptions">Assumptions it rests on</label>
      <textarea
        id="assumptions"
        name="assumptions"
        defaultValue={agent?.assumptions.join("\n")}
        placeholder={"One per line, e.g.\nRevenue growth stays above 5% in FY27\nOperating margin holds above 20%\nDeal wins keep TCV above $2bn a quarter"}
      />
      <small>Each line is checked separately against news and results.</small>

      <label htmlFor="rules">Your own rules</label>
      <textarea
        id="rules"
        name="rules"
        defaultValue={agent?.rules.map(ruleToLine).join("\n")}
        placeholder={"One per line:\nINFY below 1400 | My exit level if the story breaks\nINFY above 2000 | Re-check valuation\nINFY drop 10% | Rethink after a 10% fall from my entry\nINFY note | Watch BFSI commentary each quarter"}
      />
      <small>
        Format: <code>SYMBOL below|above PRICE</code>, <code>SYMBOL drop PERCENT%</code>, or <code>SYMBOL note</code>, then <code>|</code> and your
        words. These are your rules; the app only tells you when they fire.
      </small>

      <label htmlFor="entryPrices">Entry prices (for drop rules)</label>
      <textarea id="entryPrices" name="entryPrices" defaultValue={Object.entries(agent?.entryPrices ?? {}).map(([s, p]) => `${s} ${p}`).join("\n")} placeholder={"INFY 1620"} />

      <label htmlFor="notes">Notes</label>
      <textarea id="notes" name="notes" defaultValue={agent?.notes} placeholder="Anything you want the agent to keep in mind." />

      <label htmlFor="tips">Tips you collected</label>
      <textarea id="tips" name="tips" defaultValue={agent?.tips} placeholder="Things others told you, with who said it. Tracked, not trusted." />

      <div className="row" style={{ marginTop: 18 }}>
        <button type="submit">{agent ? "Save changes" : "Create agent"}</button>
      </div>
    </form>
  );
}

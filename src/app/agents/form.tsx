import type { Agent } from "@/lib/types";

const ruleToLine = (r: Agent["rules"][number]) => {
  const kind = { price_below: "below", price_above: "above", drop_from_entry_pct: "drop", note: "note" }[r.kind];
  const val = r.value !== undefined ? ` ${r.value}${r.kind === "drop_from_entry_pct" ? "%" : ""}` : "";
  return `${r.symbol} ${kind}${val} | ${r.text}`;
};

export function AgentForm({ agent, action, error }: { agent?: Agent; action: (form: FormData) => Promise<void>; error?: string }) {
  return (
    <form className="agent" action={action}>
      {error && <div className="form-error">Could not save: {error}</div>}

      <fieldset>
        <legend>What you believe</legend>
        <div className="two">
          <div className="field">
            <label htmlFor="name">Agent name</label>
            <input id="name" name="name" required defaultValue={agent?.name} placeholder="Infosys: services growth comes back" />
          </div>
          <div className="field">
            <label htmlFor="symbols">NSE symbols</label>
            <input id="symbols" name="symbols" required defaultValue={agent?.symbols.join(", ")} placeholder="INFY" />
            <small>Comma separated, up to 10. Use the NSE trading symbol.</small>
          </div>
        </div>
        <div className="field">
          <label htmlFor="thesis">Your thesis</label>
          <textarea id="thesis" name="thesis" defaultValue={agent?.thesis} placeholder="Why you own this, in your own words. Two or three sentences is plenty." />
        </div>
        <div className="field">
          <label htmlFor="assumptions">The assumptions it rests on</label>
          <textarea
            id="assumptions"
            name="assumptions"
            defaultValue={agent?.assumptions.join("\n")}
            placeholder={"One per line, each something the news or results can confirm or deny:\nFY27 growth guidance stays at or above 5%\nOperating margin holds above 20%\nLarge deal wins stay above $2bn a quarter"}
          />
          <small>Each line is checked separately against the headlines. Specific numbers work better than feelings.</small>
        </div>
      </fieldset>

      <fieldset>
        <legend>What would prove you wrong</legend>
        <p className="hint">Your own rules. The agent only tells you when one fires; what you do about it stays with you.</p>
        <div className="field">
          <label htmlFor="rules">Rules</label>
          <textarea
            id="rules"
            name="rules"
            className="mono"
            defaultValue={agent?.rules.map(ruleToLine).join("\n")}
            placeholder={"INFY below 1350 | Re-read the thesis if the market disagrees this hard\nINFY drop 12% | A 12% fall from entry means something I did not predict\nINFY note | Watch BFSI commentary on each results call"}
          />
          <small>
            One per line: <code>SYMBOL below PRICE</code>, <code>SYMBOL above PRICE</code>, <code>SYMBOL drop PERCENT%</code> or <code>SYMBOL note</code>, then{" "}
            <code>|</code> and your words.
          </small>
        </div>
        <div className="field">
          <label htmlFor="entryPrices">Entry prices</label>
          <textarea
            id="entryPrices"
            name="entryPrices"
            className="mono"
            defaultValue={Object.entries(agent?.entryPrices ?? {})
              .map(([s, p]) => `${s} ${p}`)
              .join("\n")}
            placeholder={"INFY 1540"}
            style={{ minHeight: 56 }}
          />
          <small>Needed for drop rules. One per line, symbol then average price.</small>
        </div>
      </fieldset>

      <fieldset>
        <legend>Context</legend>
        <div className="two">
          <div className="field">
            <label htmlFor="notes">Notes</label>
            <textarea id="notes" name="notes" defaultValue={agent?.notes} placeholder="Anything the agent should keep in mind. When you bought, what you want to re-check each quarter." />
          </div>
          <div className="field">
            <label htmlFor="tips">Tips you collected</label>
            <textarea id="tips" name="tips" defaultValue={agent?.tips} placeholder="Things others told you, with who said it. Tracked, not trusted." />
          </div>
        </div>
      </fieldset>

      <div className="actions">
        <button type="submit" className="btn">
          {agent ? "Save changes" : "Create agent"}
        </button>
        <span className="small muted">You can edit everything later.</span>
      </div>
    </form>
  );
}

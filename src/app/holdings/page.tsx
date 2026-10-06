import { getMarketProvider } from "@/lib/market";
import { inr } from "../ui";

export const dynamic = "force-dynamic";

export default async function Holdings() {
  const market = getMarketProvider();
  const holdings = await market.holdings();
  return (
    <>
      <h1>Holdings</h1>
      <p className="muted">
        {market.name === "kite" && "Read-only view from Zerodha Kite."}
        {market.name === "mock" && "Simulated holdings. Connect Zerodha to see your own."}
        {market.name === "free" && "No broker connected. Add Zerodha Kite keys to see your holdings here (read-only)."}
      </p>
      {holdings.length === 0 && <div className="card muted">Nothing to show yet.</div>}
      {holdings.length > 0 && (
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Symbol</th>
              <th className="num">Qty</th>
              <th className="num">Avg price</th>
              <th className="num">Last</th>
              <th className="num">P&amp;L</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h) => {
              const pnl = (h.lastPrice - h.averagePrice) * h.quantity;
              return (
                <tr key={h.symbol}>
                  <td>{h.symbol}</td>
                  <td className="num">{h.quantity}</td>
                  <td className="num">{inr(h.averagePrice)}</td>
                  <td className="num">{inr(h.lastPrice)}</td>
                  <td className="num" style={{ color: pnl < 0 ? "var(--broken)" : "var(--intact)" }}>
                    {inr(pnl)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}
    </>
  );
}

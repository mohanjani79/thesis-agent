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
        Read-only view from {market.name === "kite" ? "Zerodha Kite" : "simulated data (connect Zerodha to see your own)"}.
      </p>
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
    </>
  );
}

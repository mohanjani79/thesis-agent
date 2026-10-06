import { getMarketProvider } from "@/lib/market";
import { inr, pct } from "../ui";

export const dynamic = "force-dynamic";

export default async function Holdings() {
  const market = getMarketProvider();
  const holdings = await market.holdings();
  const note =
    market.name === "kite"
      ? "Read-only view from Zerodha Kite."
      : market.name === "mock"
        ? "Simulated holdings. Connect Zerodha to see your own."
        : "No broker connected. Add Zerodha Kite keys to see your holdings here, read-only.";

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Holdings</h1>
          <p className="lede">{note}</p>
        </div>
      </div>
      {holdings.length === 0 ? (
        <div className="empty">
          <h2>Nothing to show yet</h2>
          <p className="lede">Holdings appear here once a broker is connected. The app never places orders; it only reads.</p>
        </div>
      ) : (
        <section className="panel">
          <table className="price-table">
            <thead>
              <tr className="small muted">
                <td>Symbol</td>
                <td className="r">Qty</td>
                <td className="r">Avg price</td>
                <td className="r">Last</td>
                <td className="r">P&amp;L</td>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => {
                const pnl = (h.lastPrice - h.averagePrice) * h.quantity;
                const pnlPct = ((h.lastPrice - h.averagePrice) / h.averagePrice) * 100;
                return (
                  <tr key={h.symbol}>
                    <td>
                      <b>{h.symbol}</b>
                    </td>
                    <td className="r num">{h.quantity}</td>
                    <td className="r num">{inr(h.averagePrice)}</td>
                    <td className="r num">{inr(h.lastPrice)}</td>
                    <td className={`r num ${pnl < 0 ? "down" : "up"}`}>
                      {inr(pnl)}
                      <div className="small">{pct(pnlPct)}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}

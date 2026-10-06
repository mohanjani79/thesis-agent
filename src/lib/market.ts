import type { Holding, NewsItem, Quote } from "./types.ts";

// Market data comes through one interface so the mock can be swapped for
// Zerodha Kite Connect by setting KITE_API_KEY and KITE_ACCESS_TOKEN.
// Every call here is read-only: the app never places or modifies orders.

export interface MarketProvider {
  name: string;
  quotes(symbols: string[]): Promise<Quote[]>;
  holdings(): Promise<Holding[]>;
  news(symbols: string[]): Promise<NewsItem[]>;
}

const BASE_PRICES: Record<string, number> = {
  RELIANCE: 1385,
  HDFCBANK: 1712,
  INFY: 1488,
  TCS: 3050,
  ITC: 405,
  TATAMOTORS: 690,
  BAJFINANCE: 905,
};

/** Small deterministic daily drift so repeated checks on different days differ. */
function mockPrice(symbol: string, day: string): { price: number; changePct: number } {
  const base = BASE_PRICES[symbol] ?? 1000;
  let h = 0;
  for (const c of symbol + day) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const changePct = ((h % 700) - 350) / 100; // -3.5% .. +3.5%
  return { price: Math.round(base * (1 + changePct / 100) * 100) / 100, changePct };
}

const MOCK_NEWS: NewsItem[] = [
  {
    symbol: "INFY",
    title: "Infosys trims FY guidance to 3-4% constant-currency growth",
    summary: "Management cited slower discretionary spending in US financial services clients; large deal TCV stayed above $2.5bn for the quarter.",
    source: "Mock wire",
    publishedAt: "2026-10-03T10:00:00Z",
  },
  {
    symbol: "INFY",
    title: "Infosys wins multi-year GenAI modernisation deal with European bank",
    summary: "The deal is reported at around $450m over five years.",
    source: "Mock wire",
    publishedAt: "2026-10-01T08:30:00Z",
  },
  {
    symbol: "HDFCBANK",
    title: "HDFC Bank loan-to-deposit ratio eases to 96%",
    summary: "Deposit growth of 15% YoY outpaced loan growth of 9%, continuing the post-merger normalisation.",
    source: "Mock wire",
    publishedAt: "2026-10-04T06:00:00Z",
  },
  {
    symbol: "HDFCBANK",
    title: "NIM compresses 8 bps QoQ as rate cuts pass through",
    summary: "Net interest margin came in at 3.35% versus 3.43% last quarter.",
    source: "Mock wire",
    publishedAt: "2026-10-02T12:00:00Z",
  },
  {
    symbol: "RELIANCE",
    title: "Jio tariff hike of 12% announced, effective next month",
    summary: "Analysts expect ARPU to cross ₹230 within two quarters.",
    source: "Mock wire",
    publishedAt: "2026-10-03T14:00:00Z",
  },
  {
    symbol: "RELIANCE",
    title: "O2C segment EBITDA falls 9% on weak refining margins",
    summary: "Singapore GRMs averaged $3.8/bbl in the quarter.",
    source: "Mock wire",
    publishedAt: "2026-10-01T09:00:00Z",
  },
  {
    symbol: "ITC",
    title: "ITC cigarette volumes grow 4% as excise stays unchanged",
    summary: "FMCG margins improved 60 bps; hotels demerger completed.",
    source: "Mock wire",
    publishedAt: "2026-10-02T07:00:00Z",
  },
  {
    symbol: "TCS",
    title: "TCS headcount falls for third straight quarter",
    summary: "Attrition at 13.1%; BSNL deal ramp-down weighed on India revenue.",
    source: "Mock wire",
    publishedAt: "2026-10-04T11:00:00Z",
  },
];

export class MockProvider implements MarketProvider {
  name = "mock";

  async quotes(symbols: string[]): Promise<Quote[]> {
    const day = new Date().toISOString().slice(0, 10);
    return symbols.map((symbol) => {
      const { price, changePct } = mockPrice(symbol, day);
      return { symbol, lastPrice: price, changePct, asOf: new Date().toISOString() };
    });
  }

  async holdings(): Promise<Holding[]> {
    const qs = await this.quotes(["INFY", "HDFCBANK", "RELIANCE", "ITC"]);
    const qty: Record<string, [number, number]> = {
      INFY: [40, 1620],
      HDFCBANK: [30, 1580],
      RELIANCE: [25, 1290],
      ITC: [200, 430],
    };
    return qs.map((q) => ({ symbol: q.symbol, quantity: qty[q.symbol][0], averagePrice: qty[q.symbol][1], lastPrice: q.lastPrice }));
  }

  async news(symbols: string[]): Promise<NewsItem[]> {
    return MOCK_NEWS.filter((n) => symbols.includes(n.symbol));
  }
}

/**
 * Zerodha Kite Connect v3, read-only endpoints only (quote, portfolio/holdings).
 * The access token is issued by Kite's daily login flow and expires each day.
 * Kite has no news API, so news still comes from the mock until a news source is chosen.
 */
export class KiteProvider implements MarketProvider {
  name = "kite";
  private mock = new MockProvider();

  constructor(
    private apiKey: string,
    private accessToken: string,
    private exchange = "NSE",
  ) {}

  private async get<T>(path: string): Promise<T> {
    const res = await fetch(`https://api.kite.trade${path}`, {
      headers: { "X-Kite-Version": "3", Authorization: `token ${this.apiKey}:${this.accessToken}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Kite ${path} failed: ${res.status} ${await res.text()}`);
    return ((await res.json()) as { data: T }).data;
  }

  async quotes(symbols: string[]): Promise<Quote[]> {
    if (symbols.length === 0) return [];
    const qs = symbols.map((s) => `i=${encodeURIComponent(`${this.exchange}:${s}`)}`).join("&");
    const data = await this.get<Record<string, { last_price: number; net_change: number; timestamp: string; ohlc: { close: number } }>>(`/quote?${qs}`);
    return symbols.flatMap((symbol) => {
      const d = data[`${this.exchange}:${symbol}`];
      if (!d) return [];
      const prevClose = d.ohlc?.close || d.last_price;
      return [{ symbol, lastPrice: d.last_price, changePct: ((d.last_price - prevClose) / prevClose) * 100, asOf: d.timestamp }];
    });
  }

  async holdings(): Promise<Holding[]> {
    const data = await this.get<Array<{ tradingsymbol: string; quantity: number; average_price: number; last_price: number }>>("/portfolio/holdings");
    return data.map((h) => ({ symbol: h.tradingsymbol, quantity: h.quantity, averagePrice: h.average_price, lastPrice: h.last_price }));
  }

  async news(symbols: string[]): Promise<NewsItem[]> {
    return this.mock.news(symbols);
  }
}

export function getMarketProvider(): MarketProvider {
  const { KITE_API_KEY, KITE_ACCESS_TOKEN } = process.env;
  if (KITE_API_KEY && KITE_ACCESS_TOKEN) return new KiteProvider(KITE_API_KEY, KITE_ACCESS_TOKEN);
  return new MockProvider();
}

import type { Holding, NewsItem, Quote } from "./types.ts";
import type { MarketProvider } from "./market.ts";

// Keyless data sources for the prototype. Both are public but unofficial feeds
// (no SLA, no licence for resale), so they are fine for personal use and
// demos, and a licensed feed should replace them before the product is sold.
//   quotes: Yahoo Finance chart endpoint, NSE symbols as SYMBOL.NS
//   news:   Google News RSS search, India edition

const YAHOO = "https://query1.finance.yahoo.com/v8/finance/chart";
const GNEWS = "https://news.google.com/rss/search";
const UA = "Mozilla/5.0 (compatible; ThesisAgent/0.1; +https://github.com/mohanjani79/thesis-agent)";

interface YahooChart {
  chart?: {
    result?: Array<{
      meta?: { regularMarketPrice?: number; chartPreviousClose?: number; previousClose?: number; regularMarketTime?: number; symbol?: string };
    }>;
    error?: { description?: string } | null;
  };
}

/** Pulls one quote out of a Yahoo chart response. Returns null when the shape is not usable. */
export function parseYahooQuote(symbol: string, data: YahooChart): Quote | null {
  const meta = data.chart?.result?.[0]?.meta;
  const last = meta?.regularMarketPrice;
  if (typeof last !== "number" || !Number.isFinite(last)) return null;
  const prev = meta?.chartPreviousClose ?? meta?.previousClose ?? last;
  const changePct = prev ? ((last - prev) / prev) * 100 : 0;
  const asOf = meta?.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : new Date().toISOString();
  return { symbol, lastPrice: last, changePct, asOf, source: "yahoo" };
}

const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();

const tag = (xml: string, name: string) => {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1]) : "";
};

/** Parses a Google News RSS feed into NewsItems for one symbol. */
export function parseGoogleNews(symbol: string, xml: string, limit = 6): NewsItem[] {
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  return items.slice(0, limit).flatMap((item) => {
    const title = tag(item, "title");
    if (!title) return [];
    const pub = tag(item, "pubDate");
    const publishedAt = pub && !Number.isNaN(Date.parse(pub)) ? new Date(pub).toISOString() : new Date().toISOString();
    // Google puts the outlet in <source>, and the description is a link list, so the title carries the summary.
    const source = tag(item, "source") || "Google News";
    const url = tag(item, "link") || undefined;
    return [{ symbol, title, summary: title, source, url, publishedAt }];
  });
}

/** Company names make better news queries than tickers; unknown symbols fall back to the ticker. */
const QUERY_NAMES: Record<string, string> = {
  INFY: "Infosys",
  TCS: "TCS Tata Consultancy",
  RELIANCE: "Reliance Industries",
  HDFCBANK: "HDFC Bank",
  ICICIBANK: "ICICI Bank",
  ITC: "ITC Ltd",
  TATAMOTORS: "Tata Motors",
  BAJFINANCE: "Bajaj Finance",
  SBIN: "SBI State Bank of India",
  WIPRO: "Wipro",
  HCLTECH: "HCL Tech",
  LT: "Larsen & Toubro",
  BHARTIARTL: "Bharti Airtel",
  MARUTI: "Maruti Suzuki",
  SUNPHARMA: "Sun Pharma",
  ASIANPAINT: "Asian Paints",
  KOTAKBANK: "Kotak Mahindra Bank",
  AXISBANK: "Axis Bank",
  TITAN: "Titan Company",
  ULTRACEMCO: "UltraTech Cement",
};

export class FreeProvider implements MarketProvider {
  name = "free";
  private fallback?: MarketProvider;

  constructor(fallback?: MarketProvider) {
    this.fallback = fallback;
  }

  async quotes(symbols: string[]): Promise<Quote[]> {
    const results = await Promise.all(
      symbols.map(async (symbol): Promise<Quote | null> => {
        try {
          const res = await fetch(`${YAHOO}/${encodeURIComponent(symbol)}.NS?range=5d&interval=1d`, {
            headers: { "User-Agent": UA, Accept: "application/json" },
            next: { revalidate: 300 },
          });
          if (!res.ok) return null;
          return parseYahooQuote(symbol, (await res.json()) as YahooChart);
        } catch {
          return null;
        }
      }),
    );
    const got = results.filter((q): q is Quote => q !== null);
    const missing = symbols.filter((s) => !got.some((q) => q.symbol === s));
    if (missing.length && this.fallback) {
      const fb = await this.fallback.quotes(missing);
      got.push(...fb.map((q) => ({ ...q, source: "mock" as const })));
    }
    return symbols.flatMap((s) => got.filter((q) => q.symbol === s));
  }

  /** No broker is connected, so there are no holdings to read. */
  async holdings(): Promise<Holding[]> {
    return [];
  }

  async news(symbols: string[]): Promise<NewsItem[]> {
    const lists = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const q = `${QUERY_NAMES[symbol] ?? symbol} stock`;
          const res = await fetch(`${GNEWS}?q=${encodeURIComponent(q)}&hl=en-IN&gl=IN&ceid=IN:en`, {
            headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, text/xml" },
            next: { revalidate: 900 },
          });
          if (!res.ok) return [];
          return parseGoogleNews(symbol, await res.text());
        } catch {
          return [];
        }
      }),
    );
    return lists.flat().sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  }
}

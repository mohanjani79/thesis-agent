import { test } from "node:test";
import assert from "node:assert/strict";
import { parseGoogleNews, parseYahooQuote } from "./free.ts";

test("yahoo chart meta becomes a quote", () => {
  const q = parseYahooQuote("INFY", {
    chart: { result: [{ meta: { regularMarketPrice: 1510.5, chartPreviousClose: 1500, regularMarketTime: 1759744800 } }] },
  });
  assert.ok(q);
  assert.equal(q.lastPrice, 1510.5);
  assert.ok(Math.abs(q.changePct - 0.7) < 1e-9);
  assert.equal(q.source, "yahoo");
});

test("unusable yahoo payload returns null", () => {
  assert.equal(parseYahooQuote("X", { chart: { result: [], error: { description: "No data" } } }), null);
  assert.equal(parseYahooQuote("X", {}), null);
});

test("google news rss items are parsed", () => {
  const xml = `<?xml version="1.0"?><rss><channel><title>q</title>
  <item><title>Infosys trims FY guidance &amp; shares fall - Mint</title><link>https://example.com/a</link>
  <pubDate>Fri, 03 Oct 2026 10:00:00 GMT</pubDate><description>&lt;a href="x"&gt;Infosys trims&lt;/a&gt;</description>
  <source url="https://mint.example">Mint</source></item>
  <item><title><![CDATA[Infosys wins GenAI deal]]></title><link>https://example.com/b</link><pubDate>bad date</pubDate></item>
  </channel></rss>`;
  const items = parseGoogleNews("INFY", xml);
  assert.equal(items.length, 2);
  assert.equal(items[0].title, "Infosys trims FY guidance & shares fall - Mint");
  assert.equal(items[0].source, "Mint");
  assert.equal(items[0].url, "https://example.com/a");
  assert.equal(items[0].publishedAt, "2026-10-03T10:00:00.000Z");
  assert.equal(items[1].title, "Infosys wins GenAI deal");
  assert.equal(items[1].source, "Google News");
});

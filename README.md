# Thesis Agent

A personal thesis-tracking tool for Indian retail investors. You create one agent per stock or theme, write down
your thesis, the assumptions it rests on, your own rules and any tips you picked up. The agent then checks prices
and news against *your* reasoning and tells you when it stops fitting.

It is deliberately **not an advisor**: it never produces buy/sell recommendations, price targets or ratings. The
model prompt forbids it, a filter (`src/lib/guard.ts`) strips anything that slips through, and the overall status is
computed from your rules and assumption verdicts, not chosen by the model. Broker access is read-only.

## Stack

Next.js 16 (App Router) on Vercel · Supabase Postgres · Claude API (`claude-opus-5-5`, structured output) · Vercel Cron.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in what you have; everything is optional
npm run dev
```

With no keys set the app runs fully on simulated prices, holdings and news, and skips the Claude evaluation
(status shows `rules-only`). Add `ANTHROPIC_API_KEY` to get real assumption checks.

```bash
npm test          # unit tests for rules, status, advice guard, form parsing
npm run typecheck
```

## Deploy to Vercel

1. Push this repo to GitHub and import it in Vercel.
2. In Supabase, create a project and run `supabase/migrations/0001_init.sql` in the SQL editor.
3. In Vercel project settings → Environment Variables, set `ANTHROPIC_API_KEY`, `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET` (any random string).
4. Deploy. `vercel.json` schedules `/api/cron/check` at 11:00 UTC (16:30 IST, after market close) on weekdays.

## Zerodha

Set `KITE_API_KEY` and `KITE_ACCESS_TOKEN` to read live quotes and holdings from Kite Connect. The access token is
issued by Kite's login flow and expires daily; automating that refresh is the next step. Kite has no news feed, so
news stays simulated until a news source is chosen.

## Layout

- `src/lib/types.ts` – domain model (Agent, Rule, Check)
- `src/lib/rules.ts`, `status.ts` – deterministic rule evaluation and status
- `src/lib/evaluate.ts` – Claude evaluation of each assumption, structured output
- `src/lib/guard.ts` – advice filter
- `src/lib/market.ts` – market provider (mock, Kite)
- `src/lib/store.ts` – storage (Supabase, local JSON)
- `src/app/` – pages and API routes; `api/cron/check` is the scheduled run

// Domain types for the Personal Thesis Agent.
// An agent holds the user's OWN reasoning about a stock or theme; the app only
// checks the world against that reasoning. It never produces buy/sell advice.

export type RuleKind = "price_below" | "price_above" | "drop_from_entry_pct" | "note";

export interface Rule {
  id: string;
  kind: RuleKind;
  /** Symbol the rule watches (NSE trading symbol). */
  symbol: string;
  /** Threshold for numeric rules: a price, or a percentage for drop_from_entry_pct. */
  value?: number;
  /** The user's own words for this rule, e.g. "My exit if it closes under 1,400". */
  text: string;
}

export type AccountRole = "owner" | "member";

/** A person using the app. They sign in with a personal link carrying `token`. */
export interface Account {
  id: string;
  name: string;
  token: string;
  role: AccountRole;
  createdAt: string;
}

export interface Agent {
  id: string;
  /** Owner of this agent; missing only on rows created before accounts existed. */
  accountId?: string;
  name: string;
  symbols: string[];
  /** The thesis in the user's words. */
  thesis: string;
  /** The pillars the thesis rests on; each one is checked separately. */
  assumptions: string[];
  notes: string;
  /** Tips the user picked up elsewhere, kept with their source so they can be tracked. */
  tips: string;
  rules: Rule[];
  /** Average entry price per symbol, used by drop_from_entry_pct rules. */
  entryPrices: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export type AgentInput = Omit<Agent, "id" | "accountId" | "createdAt" | "updatedAt">;

export interface Quote {
  symbol: string;
  lastPrice: number;
  changePct: number;
  asOf: string;
  /** Where the price came from; absent on older records. */
  source?: "yahoo" | "kite" | "mock";
}

export interface NewsItem {
  symbol: string;
  title: string;
  summary: string;
  source: string;
  url?: string;
  publishedAt: string;
}

export interface Holding {
  symbol: string;
  quantity: number;
  averagePrice: number;
  lastPrice: number;
}

export type PillarVerdict = "supported" | "challenged" | "no_signal";

export interface PillarResult {
  assumption: string;
  verdict: PillarVerdict;
  evidence: string;
}

export interface TriggeredRule {
  ruleId: string;
  text: string;
  observed: string;
}

export type CheckStatus = "intact" | "watch" | "broken";

export interface Check {
  id: string;
  agentId: string;
  ranAt: string;
  status: CheckStatus;
  summary: string;
  pillars: PillarResult[];
  triggeredRules: TriggeredRule[];
  quotes: Quote[];
  newsCount: number;
  /** Which evaluator ran: a Claude model id, or "rules-only" when no API key is set. */
  evaluator: string;
  /** Phrases the advice guard removed from the model output, kept for audit. */
  guardFlags: string[];
}

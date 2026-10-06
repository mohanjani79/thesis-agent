import type { Agent, Check } from "./types.ts";
import { getMarketProvider } from "./market.ts";
import { getStore } from "./store.ts";
import { evaluateRules } from "./rules.ts";
import { evaluateThesis } from "./evaluate.ts";
import { computeStatus } from "./status.ts";

/** Runs one full check for an agent and records it. */
export async function runCheck(agent: Agent): Promise<Check> {
  const market = getMarketProvider();
  const [quotes, news] = await Promise.all([market.quotes(agent.symbols), market.news(agent.symbols)]);
  const triggeredRules = evaluateRules(agent, quotes);
  const evaluation = await evaluateThesis(agent, quotes, news);
  const status = computeStatus(evaluation.pillars, triggeredRules);

  return getStore().addCheck({
    agentId: agent.id,
    ranAt: new Date().toISOString(),
    status,
    summary: evaluation.summary,
    pillars: evaluation.pillars,
    triggeredRules,
    quotes,
    newsCount: news.length,
    evaluator: evaluation.evaluator,
    guardFlags: evaluation.guardFlags,
  });
}

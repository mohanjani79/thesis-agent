import type { CheckStatus, PillarResult, TriggeredRule } from "./types.ts";

/**
 * Overall status is computed from the parts, not chosen by the model:
 * - broken: one of the user's own rules fired, or half or more of the pillars are challenged
 * - watch: at least one pillar is challenged
 * - intact: otherwise
 */
export function computeStatus(pillars: PillarResult[], triggered: TriggeredRule[]): CheckStatus {
  if (triggered.length > 0) return "broken";
  const challenged = pillars.filter((p) => p.verdict === "challenged").length;
  if (pillars.length > 0 && challenged * 2 >= pillars.length) return "broken";
  if (challenged > 0) return "watch";
  return "intact";
}

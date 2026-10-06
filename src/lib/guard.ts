// Last line of defence for the SEBI boundary: the app reports how the facts
// line up with the user's own thesis and rules, and must never tell them what
// to trade. The prompt asks for this; this filter enforces it on the output.

const ADVISORY_PATTERNS: RegExp[] = [
  /\b(you|we|i)\s+(should|must|need to|ought to)\s+(consider\s+)?(buy|sell|exit|accumulate|book|hold|add|trim|average)\w*/i,
  /\b(strong\s+)?(buy|sell|hold|accumulate|reduce)\s+(rating|call|recommendation|signal)\b/i,
  /\b(we|i)\s+recommend\b/i,
  /\brecommend(ed|s)?\s+(buying|selling|exiting|holding|adding|trimming)\b/i,
  /\b(target price|price target|stop[- ]?loss)\s+(of|at|is)\s+₹?\s?\d/i,
  /\b(good|great|right|best)\s+time\s+to\s+(buy|sell|enter|exit)\b/i,
  /\b(it'?s|this is)\s+a\s+(buy|sell)\b/i,
  // Bare imperatives at the start of a sentence, common from small local models.
  /^\s*(buy|sell|hold|exit|accumulate|trim|add more|book profits?|stay invested|remain invested|keep holding|avoid|wait for a (better|lower|higher) (price|entry|level))\b/i,
  /\b(consider|worth|advisable to|advise(d)? to)\s+(buying|selling|exiting|holding|adding|trimming|accumulating|booking)\b/i,
];

export interface GuardResult {
  text: string;
  flags: string[];
}

/** Removes any sentence that reads as trading advice and reports what was removed. */
export function guardAdvice(text: string): GuardResult {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const flags: string[] = [];
  const kept = sentences.filter((s) => {
    const hit = ADVISORY_PATTERNS.some((p) => p.test(s));
    if (hit) flags.push(s.trim());
    return !hit;
  });
  return { text: kept.join(" ").trim(), flags };
}

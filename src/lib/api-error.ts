import Anthropic from "@anthropic-ai/sdk";

/** Short, readable text for an Anthropic API failure, without the raw JSON body. */
export function describeAnthropicError(e: unknown): string {
  if (e instanceof Anthropic.APIError) {
    const body = e.error as { error?: { message?: string } } | undefined;
    const detail = body?.error?.message ?? e.message.replace(/^\d+\s*/, "");
    return `Anthropic API ${e.status ?? ""}: ${detail}`.replace(/\s+:/, ":");
  }
  return e instanceof Error ? e.message : String(e);
}

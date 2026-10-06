import Anthropic from "@anthropic-ai/sdk";

/**
 * One place to build the Anthropic client. Keys created at the organisation level (not inside a
 * workspace) must name the workspace on every request, so ANTHROPIC_WORKSPACE_ID is passed as a header.
 */
export function anthropicClient(): Anthropic {
  const workspace = process.env.ANTHROPIC_WORKSPACE_ID?.trim();
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY?.trim(),
    defaultHeaders: workspace ? { "anthropic-workspace-id": workspace } : undefined,
  });
}

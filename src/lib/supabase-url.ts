/**
 * People paste the dashboard link or the REST endpoint as SUPABASE_URL.
 * Reduce anything that contains a project ref to the bare project URL.
 */
export function normaliseSupabaseUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const s = raw.trim();
  const host = s.match(/^https?:\/\/([a-z0-9-]+)\.supabase\.co(?:[/?#].*)?$/i);
  if (host) return `https://${host[1].toLowerCase()}.supabase.co`;
  const dash = s.match(/supabase\.com\/dashboard\/project\/([a-z0-9]{15,})/i);
  if (dash) return `https://${dash[1].toLowerCase()}.supabase.co`;
  return s.replace(/\/+$/, "");
}

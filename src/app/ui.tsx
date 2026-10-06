import type { CheckStatus } from "@/lib/types";

export const STATUS_LABEL: Record<CheckStatus, string> = { intact: "Thesis intact", watch: "Watch", broken: "Thesis challenged" };

export function StatusPill({ status }: { status?: CheckStatus }) {
  if (!status) return <span className="pill none">Not checked yet</span>;
  return <span className={`pill ${status}`}>{STATUS_LABEL[status]}</span>;
}

export function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 48) return `${h} h ago`;
  return `${Math.round(h / 24)} days ago`;
}

export const inr = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
export const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;

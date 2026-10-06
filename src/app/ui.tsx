import type { CheckStatus } from "@/lib/types";

const LABEL: Record<CheckStatus, string> = { intact: "Thesis intact", watch: "Watch", broken: "Thesis challenged" };

export function StatusBadge({ status }: { status?: CheckStatus }) {
  if (!status) return <span className="badge none">Unchecked</span>;
  return <span className={`badge ${status}`}>{LABEL[status]}</span>;
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

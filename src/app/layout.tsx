import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Thesis Agent",
  description: "Keep your own investment thesis honest. Not investment advice.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>
          <div className="row" style={{ marginBottom: 16 }}>
            <Link href="/" style={{ fontWeight: 700, color: "inherit" }}>
              Thesis Agent
            </Link>
            <span className="muted">·</span>
            <Link href="/holdings">Holdings</Link>
            <span className="grow" />
            <Link href="/agents/new" className="btn">
              New agent
            </Link>
          </div>
          {children}
          <p className="disclaimer">
            This tool only checks facts against reasoning you wrote yourself. It does not recommend buying or selling any security
            and is not investment advice. Market data may be delayed or simulated.
          </p>
        </main>
      </body>
    </html>
  );
}

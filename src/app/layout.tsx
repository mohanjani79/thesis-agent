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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>
        <header className="topbar">
          <div className="topbar-inner">
            <Link href="/" className="wordmark">
              Thesis Agent
            </Link>
            <nav className="topnav">
              <Link href="/">Agents</Link>
              <Link href="/holdings">Holdings</Link>
              <Link href="/setup">Setup</Link>
            </nav>
            <span className="spacer" />
            <Link href="/agents/new" className="btn">
              New agent
            </Link>
          </div>
        </header>
        <main>{children}</main>
        <p className="footnote">
          Thesis Agent checks facts against reasoning you wrote yourself. It does not recommend buying or selling any security and is
          not investment advice. Prices and headlines come from public feeds and may be delayed or simulated.
        </p>
      </body>
    </html>
  );
}

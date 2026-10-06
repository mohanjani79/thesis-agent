import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { currentAccount } from "@/lib/auth";
import { signOutAction } from "./actions";

export const metadata: Metadata = {
  title: "Thesis Agent",
  description: "Keep your own investment thesis honest. Not investment advice.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const account = await currentAccount();
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
              {account && <Link href="/">Agents</Link>}
              {account && <Link href="/holdings">Holdings</Link>}
              {account?.role === "owner" && <Link href="/members">Members</Link>}
              {(!account || account.role === "owner") && <Link href="/setup">Setup</Link>}
            </nav>
            <span className="spacer" />
            {account ? (
              <>
                <span className="small muted">{account.name}</span>
                <form action={signOutAction}>
                  <button type="submit" className="btn quiet">
                    Sign out
                  </button>
                </form>
                <Link href="/agents/new" className="btn">
                  New agent
                </Link>
              </>
            ) : null}
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

"use client";

import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="empty">
      <h2>Something went wrong on the server</h2>
      <p className="lede">
        Usually this means the database is not set up yet or a key is wrong. The setup page checks each piece and says what to fix.
      </p>
      <p className="small muted" style={{ fontFamily: "var(--font-mono)" }}>
        {error.message}
      </p>
      <div className="actions">
        <Link href="/setup" className="btn">
          Open setup check
        </Link>
        <button type="button" className="btn secondary" onClick={() => reset()}>
          Try again
        </button>
      </div>
    </div>
  );
}

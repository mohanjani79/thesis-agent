import Link from "next/link";
import { redirect } from "next/navigation";
import { getStore } from "@/lib/store";
import { currentAccount } from "@/lib/auth";
import { claimWorkspaceAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function Welcome({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  if (await currentAccount()) redirect("/");
  let unclaimed = false;
  let dbError: string | undefined;
  try {
    unclaimed = (await getStore().listAccounts()).length === 0;
  } catch (e) {
    dbError = e instanceof Error ? e.message : String(e);
  }

  if (dbError) {
    return (
      <div className="empty">
        <h2>The database is not ready</h2>
        <p className="lede">Sign-in needs the accounts table. Run the migration in supabase/migrations/0002_accounts.sql, then reload.</p>
        <p className="small muted" style={{ fontFamily: "var(--font-mono)" }}>{dbError}</p>
        <div className="actions">
          <Link href="/setup" className="btn">Open setup check</Link>
        </div>
      </div>
    );
  }

  if (unclaimed) {
    return (
      <div className="empty">
        <div>
          <h2>Claim this workspace</h2>
          <p className="lede" style={{ marginTop: 6 }}>
            Nobody has signed in yet. The first person becomes the owner, keeps any agents already here, and can invite friends.
          </p>
        </div>
        <form action={claimWorkspaceAction} className="agent" style={{ maxWidth: 420 }}>
          <div className="field">
            <label htmlFor="name">Your name</label>
            <input id="name" name="name" placeholder="Mohan" autoFocus />
          </div>
          <div className="actions">
            <button type="submit" className="btn">Become the owner</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="empty">
      <div>
        <h2>{error === "invalid" ? "That link no longer works" : "You need an invite link"}</h2>
        <p className="lede" style={{ marginTop: 6 }}>
          {error === "invalid"
            ? "The invite was removed or the address was copied wrongly. Ask the person who invited you for a fresh link."
            : "Thesis Agent is open by invitation. Ask the person who runs it for your personal link, then open it on this device."}
        </p>
      </div>
      <p className="small muted">Your link is your key: it signs you in on any device, so do not share it.</p>
    </div>
  );
}

import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { setSession } from "@/lib/auth";

/** A personal invite link. Visiting it signs the browser in as that account. */
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const account = await getStore().getAccountByToken(token).catch(() => null);
  const url = new URL(req.url);
  if (!account) return NextResponse.redirect(new URL("/welcome?error=invalid", url.origin));
  await setSession(account.token);
  return NextResponse.redirect(new URL("/", url.origin));
}

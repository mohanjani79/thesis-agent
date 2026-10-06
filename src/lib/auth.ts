import { randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getStore } from "./store.ts";
import type { Account } from "./types.ts";

// Sign-in is a personal link: /join/<token> stores the token in a cookie and
// every page looks the account up from it. No passwords, no emails to deliver.
// Treat a link like a house key; the owner can revoke it from the Members page.

export const SESSION_COOKIE = "ta_session";
const ONE_YEAR = 60 * 60 * 24 * 365;

export const newToken = () => randomBytes(24).toString("base64url");

export async function currentAccount(): Promise<Account | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    return await getStore().getAccountByToken(token);
  } catch {
    return null;
  }
}

/** The signed-in account, or a redirect to the welcome page. */
export async function requireAccount(): Promise<Account> {
  const account = await currentAccount();
  if (!account) redirect("/welcome");
  return account;
}

export async function requireOwner(): Promise<Account> {
  const account = await requireAccount();
  if (account.role !== "owner") redirect("/");
  return account;
}

export async function setSession(token: string) {
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: ONE_YEAR });
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Account for an API request: Bearer token or the session cookie. */
export async function apiAccount(req: Request): Promise<Account | null> {
  const bearer = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (bearer) return getStore().getAccountByToken(bearer.trim());
  return currentAccount();
}

/** Public origin of the site, for building invite links. */
export async function siteOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Agent, AgentInput, Check } from "./types.ts";
import { normaliseSupabaseUrl } from "./supabase-url.ts";

// Storage: Supabase when SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set,
// otherwise a JSON file under .data/ for local development. Vercel's file
// system is not persistent, so a deployed app needs Supabase.

export interface Store {
  listAgents(): Promise<Agent[]>;
  getAgent(id: string): Promise<Agent | null>;
  createAgent(input: AgentInput): Promise<Agent>;
  updateAgent(id: string, input: AgentInput): Promise<Agent | null>;
  deleteAgent(id: string): Promise<void>;
  addCheck(check: Omit<Check, "id">): Promise<Check>;
  listChecks(agentId: string, limit?: number): Promise<Check[]>;
  latestChecks(): Promise<Record<string, Check>>;
}

interface Db {
  agents: Agent[];
  checks: Check[];
}

class FileStore implements Store {
  private file = path.join(process.cwd(), ".data", "db.json");

  private async read(): Promise<Db> {
    try {
      return JSON.parse(await fs.readFile(this.file, "utf8")) as Db;
    } catch {
      return { agents: [], checks: [] };
    }
  }

  private async write(db: Db) {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    await fs.writeFile(this.file, JSON.stringify(db, null, 2));
  }

  async listAgents() {
    return (await this.read()).agents.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getAgent(id: string) {
    return (await this.read()).agents.find((a) => a.id === id) ?? null;
  }

  async createAgent(input: AgentInput) {
    const db = await this.read();
    const now = new Date().toISOString();
    const agent: Agent = { ...input, id: randomUUID(), createdAt: now, updatedAt: now };
    db.agents.push(agent);
    await this.write(db);
    return agent;
  }

  async updateAgent(id: string, input: AgentInput) {
    const db = await this.read();
    const i = db.agents.findIndex((a) => a.id === id);
    if (i < 0) return null;
    db.agents[i] = { ...db.agents[i], ...input, id, updatedAt: new Date().toISOString() };
    await this.write(db);
    return db.agents[i];
  }

  async deleteAgent(id: string) {
    const db = await this.read();
    await this.write({ agents: db.agents.filter((a) => a.id !== id), checks: db.checks.filter((c) => c.agentId !== id) });
  }

  async addCheck(input: Omit<Check, "id">) {
    const db = await this.read();
    const check: Check = { ...input, id: randomUUID() };
    db.checks.push(check);
    await this.write(db);
    return check;
  }

  async listChecks(agentId: string, limit = 20) {
    return (await this.read()).checks
      .filter((c) => c.agentId === agentId)
      .sort((a, b) => b.ranAt.localeCompare(a.ranAt))
      .slice(0, limit);
  }

  async latestChecks() {
    const out: Record<string, Check> = {};
    for (const c of (await this.read()).checks) {
      if (!out[c.agentId] || out[c.agentId].ranAt < c.ranAt) out[c.agentId] = c;
    }
    return out;
  }
}

// Supabase rows use snake_case columns; see supabase/migrations/0001_init.sql.
type AgentRow = {
  id: string;
  name: string;
  symbols: string[];
  thesis: string;
  assumptions: string[];
  notes: string;
  tips: string;
  rules: Agent["rules"];
  entry_prices: Record<string, number>;
  created_at: string;
  updated_at: string;
};

const fromAgentRow = (r: AgentRow): Agent => ({
  id: r.id,
  name: r.name,
  symbols: r.symbols,
  thesis: r.thesis,
  assumptions: r.assumptions,
  notes: r.notes,
  tips: r.tips,
  rules: r.rules,
  entryPrices: r.entry_prices,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const toAgentRow = (a: AgentInput) => ({
  name: a.name,
  symbols: a.symbols,
  thesis: a.thesis,
  assumptions: a.assumptions,
  notes: a.notes,
  tips: a.tips,
  rules: a.rules,
  entry_prices: a.entryPrices,
});

type CheckRow = {
  id: string;
  agent_id: string;
  ran_at: string;
  status: Check["status"];
  summary: string;
  pillars: Check["pillars"];
  triggered_rules: Check["triggeredRules"];
  quotes: Check["quotes"];
  news_count: number;
  evaluator: string;
  guard_flags: string[];
};

const fromCheckRow = (r: CheckRow): Check => ({
  id: r.id,
  agentId: r.agent_id,
  ranAt: r.ran_at,
  status: r.status,
  summary: r.summary,
  pillars: r.pillars,
  triggeredRules: r.triggered_rules,
  quotes: r.quotes,
  newsCount: r.news_count,
  evaluator: r.evaluator,
  guardFlags: r.guard_flags,
});

class SupabaseStore implements Store {
  constructor(private db: SupabaseClient) {}

  private must<T>(res: { data: T; error: { message: string } | null }): T {
    if (res.error) throw new Error(res.error.message);
    return res.data;
  }

  async listAgents() {
    const rows = this.must(await this.db.from("agents").select("*").order("updated_at", { ascending: false }));
    return (rows as AgentRow[]).map(fromAgentRow);
  }

  async getAgent(id: string) {
    const row = this.must(await this.db.from("agents").select("*").eq("id", id).maybeSingle());
    return row ? fromAgentRow(row as unknown as AgentRow) : null;
  }

  async createAgent(input: AgentInput) {
    const row = this.must(await this.db.from("agents").insert(toAgentRow(input)).select().single());
    return fromAgentRow(row as unknown as AgentRow);
  }

  async updateAgent(id: string, input: AgentInput) {
    const row = this.must(
      await this.db.from("agents").update({ ...toAgentRow(input), updated_at: new Date().toISOString() }).eq("id", id).select().maybeSingle(),
    );
    return row ? fromAgentRow(row as unknown as AgentRow) : null;
  }

  async deleteAgent(id: string) {
    this.must(await this.db.from("agents").delete().eq("id", id));
  }

  async addCheck(c: Omit<Check, "id">) {
    const row = this.must(
      await this.db
        .from("checks")
        .insert({
          agent_id: c.agentId,
          ran_at: c.ranAt,
          status: c.status,
          summary: c.summary,
          pillars: c.pillars,
          triggered_rules: c.triggeredRules,
          quotes: c.quotes,
          news_count: c.newsCount,
          evaluator: c.evaluator,
          guard_flags: c.guardFlags,
        })
        .select()
        .single(),
    );
    return fromCheckRow(row as unknown as CheckRow);
  }

  async listChecks(agentId: string, limit = 20) {
    const rows = this.must(await this.db.from("checks").select("*").eq("agent_id", agentId).order("ran_at", { ascending: false }).limit(limit));
    return (rows as CheckRow[]).map(fromCheckRow);
  }

  async latestChecks() {
    const rows = this.must(await this.db.from("latest_checks").select("*"));
    return Object.fromEntries((rows as CheckRow[]).map((r) => [r.agent_id, fromCheckRow(r)]));
  }
}

let store: Store | undefined;

export function getStore(): Store {
  if (!store) {
    const SUPABASE_URL = normaliseSupabaseUrl(process.env.SUPABASE_URL);
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    store =
      SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
        ? new SupabaseStore(createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } }))
        : new FileStore();
  }
  return store;
}

/** The only paid dependency in the app.
 *
 *  Three rules hold everywhere this is used:
 *    1. Nothing calls it on a page load. Every call sits behind a button a
 *       person pressed, because every call spends prepaid credits.
 *    2. Every result is cached before it is returned, keyed by something
 *       immutable where possible — a filing's accession number never changes,
 *       so its takeaways are correct forever and cost once.
 *    3. A daily call ceiling is enforced here, server-side. A bug in a loop
 *       should hit a wall, not the bottom of the credit balance.
 */
import OpenAI from "openai";
import { DAY, cache } from "@/lib/cache";

/** Per 1M tokens, from OpenAI's pricing page (checked 17 Nov 2026). Used only
 *  to estimate what a call cost, for the spend log and the button label. */
const RATES: Record<string, { input: number; cachedInput: number; output: number }> = {
  "gpt-6-astra": { input: 10, cachedInput: 1, output: 50 },
  "gpt-6.1-sol": { input: 2, cachedInput: 0.1, output: 10 },
  "gpt-6.1-terra": { input: 1, cachedInput: 0.05, output: 5 },
  "gpt-6-luna": { input: 0.1, cachedInput: 0.01, output: 0.5 },
  "gpt-6-sol": { input: 2, cachedInput: 0.2, output: 10 },
  "gpt-5.6-sol": { input: 4, cachedInput: 0.4, output: 20 },
};

export const MODEL = process.env.OPENAI_MODEL ?? "gpt-6.1-sol";

/** Rough: one token per four characters of English prose. Enough for a cap. */
export const estimateTokens = (text: string) => Math.ceil(text.length / 4);

export function estimateCostUsd(inputTokens: number, outputTokens: number, model = MODEL): number {
  const rate = RATES[model] ?? RATES["gpt-6.1-sol"];
  return (inputTokens / 1e6) * rate.input + (outputTokens / 1e6) * rate.output;
}

export class AiUnavailable extends Error {}
export class AiBudgetExceeded extends Error {}

let client: OpenAI | null = null;

function openai(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new AiUnavailable(
      "OPENAI_API_KEY is not set, so nothing can be pulled. Add a project-scoped key to .env.local.",
    );
  }
  if (client === null) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

const DAILY_LIMIT = Number(process.env.AI_DAILY_CALL_LIMIT ?? 25);

interface SpendDay {
  calls: number;
  usd: number;
}

const today = () => new Date().toISOString().slice(0, 10);
const spendKey = () => `ai:spend:${today()}`;

export async function spendToday(): Promise<SpendDay> {
  const hit = await cache.get<SpendDay>(spendKey());
  return hit === null ? { calls: 0, usd: 0 } : hit;
}

async function recordSpend(usd: number) {
  const current = await spendToday();
  await cache.set(spendKey(), { calls: current.calls + 1, usd: current.usd + usd }, 2 * DAY);
}

export interface AskOptions {
  instructions: string;
  input: string;
  maxOutputTokens?: number;
  effort?: "none" | "minimal" | "low" | "medium" | "high";
  /** Turn on the hosted web search tool. $10 per 1,000 calls on top of tokens. */
  webSearch?: { allowedDomains?: string[]; contextSize?: "low" | "medium" | "high" };
}

export interface AskResult {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  usd: number;
  at: string;
}

/** One model call. Counts against the daily ceiling and logs its own cost. */
export async function ask(options: AskOptions): Promise<AskResult> {
  const spend = await spendToday();
  if (spend.calls >= DAILY_LIMIT) {
    throw new AiBudgetExceeded(
      `Daily ceiling of ${DAILY_LIMIT} model calls reached (about $${spend.usd.toFixed(2)} spent). ` +
        "Raise AI_DAILY_CALL_LIMIT if that was deliberate.",
    );
  }

  const tools = options.webSearch
    ? [
        {
          type: "web_search" as const,
          search_context_size: options.webSearch.contextSize ?? ("medium" as const),
          ...(options.webSearch.allowedDomains
            ? { filters: { allowed_domains: options.webSearch.allowedDomains } }
            : {}),
        },
      ]
    : undefined;

  const response = await openai().responses.create({
    model: MODEL,
    instructions: options.instructions,
    input: options.input,
    max_output_tokens: options.maxOutputTokens ?? 2000,
    reasoning: { effort: options.effort ?? "low" },
    ...(tools ? { tools } : {}),
  });

  const inputTokens = response.usage?.input_tokens ?? estimateTokens(options.input);
  const outputTokens = response.usage?.output_tokens ?? 0;
  const usd = estimateCostUsd(inputTokens, outputTokens);
  await recordSpend(usd);

  return {
    text: response.output_text ?? "",
    model: MODEL,
    inputTokens,
    outputTokens,
    usd,
    at: new Date().toISOString(),
  };
}

/** Models answer in prose around their JSON more often than anyone admits. */
export function parseJsonLoosely<T>(text: string): T | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced ? fenced[1] : text).trim();
  const start = candidate.search(/[[{]/);
  if (start === -1) return null;
  for (let end = candidate.length; end > start; end--) {
    try {
      return JSON.parse(candidate.slice(start, end)) as T;
    } catch {
      // Walk the tail back until it parses; trailing prose is the usual cause.
    }
  }
  return null;
}

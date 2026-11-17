import { takeawaysFor } from "@/lib/ai/takeaways";
import { AiBudgetExceeded, AiUnavailable, spendToday } from "@/lib/ai/openai";
import { company } from "@/lib/sec/submissions";
import { padCik } from "@/lib/sec/client";

/** Pull the takeaways for one filing.
 *
 *  POST only, and only from a button press. There is deliberately no GET that
 *  triggers a model call: a crawler, a prefetch or a double render must not be
 *  able to spend credits. The page reads the cache directly on the server, so
 *  an already-pulled filing costs nothing to display.
 */
export async function POST(request: Request) {
  let body: { cik?: string; accession?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const cik = body.cik ? padCik(body.cik) : "";
  const accession = (body.accession ?? "").trim();
  if (!/^\d{10}$/.test(cik) || !/^\d{10}-\d{2}-\d{6}$/.test(accession)) {
    return Response.json({ error: "A valid cik and accession are required." }, { status: 400 });
  }

  try {
    const profile = await company(cik);
    const filing = profile.recent.find((f) => f.accession === accession);
    if (!filing) {
      return Response.json(
        { error: "That filing is not in this company's recent index." },
        { status: 404 },
      );
    }

    const result = await takeawaysFor(cik, filing, profile.name);
    const spend = await spendToday();
    return Response.json({ ...result, spend });
  } catch (error) {
    if (error instanceof AiUnavailable) {
      return Response.json({ error: error.message }, { status: 501 });
    }
    if (error instanceof AiBudgetExceeded) {
      return Response.json({ error: error.message }, { status: 429 });
    }
    const message = error instanceof Error ? error.message : "The pull failed.";
    return Response.json({ error: message }, { status: 502 });
  }
}

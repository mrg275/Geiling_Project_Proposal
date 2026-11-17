"use client";

import { useState } from "react";
import type { CannedAnswer } from "@/lib/types";

const STUB =
  "In the built version this question goes to the model with the filings, the transcript and your conviction list in context. In the mockup only the suggested questions have written answers.";

interface Turn {
  role: "me" | "answer";
  text: string;
}

/** Chat against the four debates. The suggested questions have real written
 *  answers; anything else says plainly that it is not wired up yet. */
export default function DebatesChat({ canned }: { canned: CannedAnswer[] }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");

  const unasked = canned.filter((c) => !turns.some((t) => t.role === "me" && t.text === c.question));

  function ask(question: string, answer: string) {
    setTurns((prev) => [...prev, { role: "me", text: question }, { role: "answer", text: answer }]);
  }

  return (
    <div className="pad-b" style={{ borderTop: "1px solid var(--line)" }}>
      <p className="lbl" style={{ marginBottom: 12 }}>
        Ask about these debates
      </p>

      {turns.map((turn, i) => (
        <div className={`bub ${turn.role === "me" ? "me" : "ai"}`} key={i}>
          <div className="who">{turn.role === "me" ? "You" : "Analysis"}</div>
          <div className="t">{turn.text}</div>
        </div>
      ))}

      {unasked.length > 0 && (
        <div className="sugg">
          {unasked.map((c) => (
            <button type="button" key={c.question} onClick={() => ask(c.question, c.answer)}>
              {c.question}
            </button>
          ))}
        </div>
      )}

      <form
        className="askrow"
        onSubmit={(e) => {
          e.preventDefault();
          const value = input.trim();
          if (!value) return;
          const match = canned.find((c) => c.question === value);
          ask(value, match ? match.answer : STUB);
          setInput("");
        }}
      >
        <label className="sr" htmlFor="ask">
          Ask your own question
        </label>
        <input
          id="ask"
          type="text"
          value={input}
          placeholder="Ask your own question"
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="btn" type="submit">
          Ask
        </button>
      </form>
    </div>
  );
}

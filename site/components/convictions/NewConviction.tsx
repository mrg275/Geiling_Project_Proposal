"use client";

import { useState } from "react";
import Link from "next/link";
import { book } from "@/lib/data";

const PLACEHOLDER = "Power and cooling, not silicon, will limit AI compute by 2027.";

/** Writing a conviction down is the easy half. The five follow-ups are the
 *  product: they force the belief into something with a date, a mechanism and a
 *  condition that would kill it, which is what the rest of the interface then
 *  scores positions against. */
export default function NewConviction() {
  const questions = book.pressureTestQuestions;
  const [draft, setDraft] = useState("");
  const [asked, setAsked] = useState(false);
  const [answers, setAnswers] = useState<string[]>(() => questions.map(() => ""));
  const [saved, setSaved] = useState(false);

  const answered = answers.filter((a) => a.trim().length > 0).length;

  if (saved) {
    return (
      <section className="pane">
        <header>
          <h2>Saved</h2>
          <span className="hint">in this tab only</span>
        </header>
        <div className="pad">
          <p className="sub">&ldquo;{draft}&rdquo;</p>
          <p className="fine" style={{ marginTop: 12 }}>
            {answered} of {questions.length} follow-ups answered. Nothing is written anywhere yet —
            convictions live in memory until the database lands, so this one disappears on reload.
          </p>
          <div className="btns" style={{ marginTop: 16 }}>
            <Link className="btn sec" href="/convictions">
              Back to convictions
            </Link>
            <button
              className="btn sec"
              type="button"
              onClick={() => {
                setSaved(false);
                setAsked(false);
                setDraft("");
                setAnswers(questions.map(() => ""));
              }}
            >
              Write another
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pane">
      <header>
        <h2>New conviction</h2>
        <span className="hint">
          {asked ? `${answered} of ${questions.length} answered` : "one sentence to start"}
        </span>
      </header>

      {asked && (
        <div className="prog" aria-hidden="true">
          <i style={{ width: `${(answered / questions.length) * 100}%` }} />
        </div>
      )}

      {!asked ? (
        <div className="pad">
          <p className="sub" style={{ marginBottom: 12 }}>
            Say it the way you would out loud. The five follow-ups are where it gets sharp enough to
            trade.
          </p>
          <label className="sr" htmlFor="draft">
            Your conviction
          </label>
          <textarea
            id="draft"
            rows={3}
            value={draft}
            placeholder={PLACEHOLDER}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="btns" style={{ marginTop: 12 }}>
            <button
              className="btn"
              type="button"
              onClick={() => {
                setDraft((d) => (d.trim() ? d.trim() : PLACEHOLDER));
                setAsked(true);
              }}
            >
              Pressure test it
            </button>
            <Link className="btn sec" href="/convictions">
              Cancel
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="pad">
            <p className="lbl" style={{ marginBottom: 6 }}>
              Your words
            </p>
            <p className="sub">&ldquo;{draft}&rdquo;</p>
          </div>

          {questions.map((question, i) => (
            <div className="q" key={question}>
              <div className="qn">
                {i + 1} of {questions.length}
              </div>
              <label className="qt" htmlFor={`q${i}`}>
                {question}
              </label>
              <textarea
                id={`q${i}`}
                rows={2}
                placeholder="Answer"
                value={answers[i]}
                onChange={(e) =>
                  setAnswers((prev) => prev.map((a, k) => (k === i ? e.target.value : a)))
                }
              />
            </div>
          ))}

          <div className="pad-b" style={{ borderTop: "1px solid var(--line)" }}>
            <div className="btns">
              <button className="btn" type="button" onClick={() => setSaved(true)}>
                Save conviction
              </button>
              <button className="btn sec" type="button" onClick={() => setAsked(false)}>
                Back
              </button>
              <Link className="btn sec" href="/convictions">
                Discard
              </Link>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

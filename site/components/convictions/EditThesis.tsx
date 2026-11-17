"use client";

import { useState } from "react";

/** The thesis is editable in the interface, but nothing is written anywhere
 *  yet: the save is local to this tab and the copy says so, rather than
 *  implying a database that does not exist. */
export default function EditThesis({ thesis }: { thesis: string }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(thesis);
  const [saved, setSaved] = useState(false);

  return (
    <>
      <div className="btns" style={{ marginTop: 16 }}>
        <button
          className="btn sec"
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            setSaved(false);
          }}
        >
          {open ? "Cancel" : "Edit thesis"}
        </button>
        {saved && <span className="fine">Saved in this tab only — no database yet.</span>}
      </div>

      {open && (
        <div style={{ marginTop: 12 }}>
          <label className="sr" htmlFor="thesis">
            Thesis
          </label>
          <textarea id="thesis" rows={4} value={draft} onChange={(e) => setDraft(e.target.value)} />
          <div className="btns" style={{ marginTop: 10 }}>
            <button
              className="btn"
              type="button"
              onClick={() => {
                setOpen(false);
                setSaved(true);
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </>
  );
}

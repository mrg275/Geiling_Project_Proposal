"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { book } from "@/lib/data";
import { usd2 } from "@/lib/format";
import { isHeld } from "@/lib/portfolio";
import { NAV } from "@/lib/nav";

interface Item {
  group: string;
  title: string;
  note: string;
  right: string;
  href: string;
}

/** The pages and convictions, which are a fixed list this app ships with. */
function localItems(): Item[] {
  return [
    ...NAV.map((n) => ({
      group: "Pages",
      title: n.label,
      note: "Go to " + n.label.toLowerCase(),
      right: n.key,
      href: n.href,
    })),
    ...book.convictions.map((c) => ({
      group: "Convictions",
      title: c.short,
      note: c.title,
      right: c.pct.toFixed(1) + "%",
      href: "/convictions/" + c.id,
    })),
  ];
}

/** The securities this app knows about without asking: the book's own. Shown
 *  with an empty box, where the real index would be 39,034 rows. */
function heldItems(): Item[] {
  return book.universe
    .filter((u) => isHeld(u.ticker))
    .map((u) => ({
      group: "Securities",
      title: u.ticker,
      note: u.name + ", " + u.sector,
      right: usd2(u.price),
      href: "/securities/" + u.ticker,
    }));
}

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const [found, setFound] = useState<Item[]>([]);
  const seq = useRef(0);

  // The securities group used to be the nineteen names in the book, while the
  // box behind this one searched 39,034 — so "LLY" and "BRK" answered "Nothing
  // matches that" from a palette whose own button promises any security. It
  // asks the same index the page does.
  useEffect(() => {
    const q = query.trim();
    if (!open || !q) {
      setFound([]);
      return;
    }
    const mine = ++seq.current;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = (await res.json()) as {
          hits: { ticker: string; name: string; exchange: string | null }[];
        };
        if (mine !== seq.current) return;
        setFound(
          (data.hits ?? []).slice(0, 8).map((hit) => ({
            group: "Securities",
            title: hit.ticker,
            note: hit.name || "Fund or ETF share class",
            right: hit.exchange ?? "",
            href: `/securities/${hit.ticker}`,
          })),
        );
      } catch {
        if (mine === seq.current) setFound([]);
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [query, open]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [...localItems(), ...heldItems()];
    const local = localItems().filter((i) => (i.title + " " + i.note).toLowerCase().includes(q));
    return [...local, ...found];
  }, [query, found]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setSelected(0);
  }, []);

  const go = useCallback(
    (item: Item | undefined) => {
      if (!item) return;
      close();
      router.push(item.href);
    },
    [close, router],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (open) {
        if (e.key === "Escape") {
          e.preventDefault();
          close();
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelected((s) => Math.min(items.length - 1, s + 1));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelected((s) => Math.max(0, s - 1));
        } else if (e.key === "Enter") {
          e.preventDefault();
          go(items[selected]);
        }
        return;
      }
      // Number keys jump between sections, but not while typing somewhere.
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || e.metaKey || e.ctrlKey || e.altKey) return;
      const hit = NAV.find((n) => n.key === e.key);
      if (hit) router.push(hit.href);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, items, selected, close, go, router]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  let lastGroup: string | null = null;

  return (
    <>
      <button className="kbtn" type="button" onClick={() => setOpen(true)}>
        <svg className="ic" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M7 2a5 5 0 1 1-3.5 8.5l-2 2L.4 11.4l2-2A5 5 0 0 1 7 2zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z" />
        </svg>
        <span>Search any security, conviction or page</span>
        <kbd>⌘K</kbd>
      </button>

      {open && (
        <div
          className="scrim"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="cmd" role="dialog" aria-modal="true" aria-label="Command palette">
            <input
              ref={inputRef}
              type="text"
              value={query}
              aria-label="Search pages, convictions and securities"
              placeholder="Jump to a page, a conviction or any security"
              autoComplete="off"
              onChange={(e) => {
                setQuery(e.target.value);
                setSelected(0);
              }}
            />
            {/* `aria-selected` is only a state a listbox option has, so the
                rows are options in a listbox rather than bare buttons. */}
            <div className="cmdlist" role="listbox" aria-label="Results">
              {items.length === 0 && <div className="empty">Nothing matches that.</div>}
              {items.map((item, i) => {
                const header = item.group !== lastGroup ? item.group : null;
                lastGroup = item.group;
                return (
                  <div key={item.href + i}>
                    {header && <div className="cmdg">{header}</div>}
                    <button
                      className="cmdi"
                      type="button"
                      role="option"
                      aria-selected={i === selected}
                      onMouseEnter={() => setSelected(i)}
                      onClick={() => go(item)}
                    >
                      <span className="t">{item.title}</span>
                      <span className="n">{item.note}</span>
                      <span className="r">{item.right}</span>
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="cmdfoot">
              <span>↑↓ move</span>
              <span>↵ open</span>
              <span>esc close</span>
              <span>1–5 switch pages</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { book } from "@/lib/data";
import { axisNumber, change, pct } from "@/lib/format";
import { MONTH_LABELS, RANGES, niceTicks, rebase } from "@/lib/series";

interface SeriesDef {
  key: "portfolio" | "sp500" | "nasdaq100";
  label: string;
  color: string;
  width: number;
  raw: number[];
  /** See CustomSeries.base. The book's own series never sets it. */
  base?: number | null;
}

/** One axis, three series, each rebased to 100 at the start of the window.
 *
 *  A dollar book value and an index level cannot share a scale, and a second
 *  y-axis can be slid until it shows any relationship you want. Rebasing is the
 *  honest version of the same comparison: every line starts at the same point
 *  and the axis means one thing.
 */
export interface CustomSeries {
  key: string;
  label: string;
  color: string;
  width: number;
  /** Raw levels; the chart rebases them to 100 over the visible window. */
  raw: number[];
  /** Rebase on this level instead of the window's first point — a previous
   *  close, for an intraday window. */
  base?: number | null;
}

export default function PerformanceChart({
  title,
  customSeries,
  labels: fixedLabels,
  months: initialMonths = 35,
  compact = false,
  showControls = true,
  showSp = true,
  showTech = false,
}: {
  /** When given, the chart renders its own pane with the range controls in the
   *  header. Without it, the caller supplies the surround. */
  title?: string;
  /** Plot something other than the book: a security against a benchmark, say.
   *  The range control and the benchmark checkboxes are for the book view, so
   *  they are hidden when this is set. */
  customSeries?: CustomSeries[];
  /** One label per point, when the caller's series has its own time axis — an
   *  intraday price window, say. Without it the axis is the book's months. */
  labels?: string[];
  months?: number;
  compact?: boolean;
  showControls?: boolean;
  showSp?: boolean;
  showTech?: boolean;
}) {
  const [months, setMonths] = useState(initialMonths);
  const [sp, setSp] = useState(showSp);
  const [tech, setTech] = useState(showTech);
  const [width, setWidth] = useState(760);
  const [hover, setHover] = useState<number | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const ro = new ResizeObserver(() => setWidth(Math.max(260, Math.floor(host.clientWidth))));
    ro.observe(host);
    setWidth(Math.max(260, Math.floor(host.clientWidth)));
    return () => ro.disconnect();
  }, []);

  const height = compact ? 190 : width < 560 ? 210 : 280;

  const geom = useMemo(() => {
    const defs: SeriesDef[] = customSeries
      ? (customSeries as unknown as SeriesDef[])
      : [
      { key: "portfolio", label: "My portfolio", color: "var(--c-port)", width: 2.2, raw: book.performance.portfolio },
      { key: "sp500", label: "S&P 500", color: "var(--c-sp)", width: 1.4, raw: book.performance.sp500 },
          { key: "nasdaq100", label: "Nasdaq-100", color: "var(--c-tech)", width: 1.4, raw: book.performance.nasdaq100 },
        ];
    const shown = customSeries
      ? defs
      : defs.filter((d) => d.key === "portfolio" || (d.key === "sp500" ? sp : tech));
    const n = defs[0].raw.length;
    // A caller-supplied axis is already the window: plot all of it. Otherwise
    // take the last `months` points and anchor the month labels to the end, so
    // a 12-point custom series and a 12-month slice of the book both read as
    // the last twelve months.
    const start = fixedLabels ? 0 : Math.max(0, n - months);
    const labels = fixedLabels ?? MONTH_LABELS.slice(MONTH_LABELS.length - (n - start));
    const series = shown.map((d) => {
      const slice = d.raw.slice(start);
      // An explicit base lets a one-day window be measured from the previous
      // close, so the chart's endpoint and the quote tile agree about today.
      const values = d.base ? slice.map((v) => (v / d.base!) * 100) : rebase(slice);
      return { ...d, values };
    });

    const flat = series.flatMap((s) => s.values);
    let lo = Math.min(...flat);
    let hi = Math.max(...flat);
    const padding = (hi - lo) * 0.14 || 4;
    lo -= padding;
    hi += padding;
    const ticks = niceTicks(lo, hi, 4);
    if (ticks.length) {
      lo = Math.min(lo, ticks[0]);
      hi = Math.max(hi, ticks[ticks.length - 1]);
    }

    const pad = { top: 16, right: width < 420 ? 44 : 62, bottom: 26, left: width < 420 ? 30 : 38 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;
    const x = (i: number) => pad.left + (labels.length < 2 ? 0 : (plotW * i) / (labels.length - 1));
    const y = (v: number) => pad.top + plotH * (1 - (v - lo) / (hi - lo));

    // Endpoint labels, nudged apart so two close lines do not overprint.
    const marks = series
      .map((s) => {
        const last = s.values[s.values.length - 1];
        return { color: s.color, value: last, y: y(last), label: change(last - 100) };
      })
      .sort((a, b) => a.y - b.y);
    for (let i = 1; i < marks.length; i++) {
      if (marks[i].y - marks[i - 1].y < 14) marks[i].y = marks[i - 1].y + 14;
    }

    const xSteps = width < 420 ? 2 : 4;
    const xLabels = Array.from({ length: xSteps + 1 }, (_, j) => {
      const i = Math.round((j * (labels.length - 1)) / xSteps);
      const anchor: "start" | "middle" | "end" = j === 0 ? "start" : j === xSteps ? "end" : "middle";
      return { i, text: labels[i], anchor };
    });

    return { series, labels, ticks, pad, plotW, plotH, x, y, marks, xLabels };
  }, [customSeries, fixedLabels, months, sp, tech, width, height]);

  function pointerIndex(clientX: number) {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const px = ((clientX - rect.left) / rect.width) * width;
    const ratio = (px - geom.pad.left) / geom.plotW;
    return Math.max(0, Math.min(geom.labels.length - 1, Math.round(ratio * (geom.labels.length - 1))));
  }

  const areaPath = (() => {
    const s = geom.series[0];
    if (!s || s.values.length < 2) return null;
    const line = s.values.map((v, i) => `${i ? "L" : "M"}${geom.x(i).toFixed(1)},${geom.y(v).toFixed(1)}`).join("");
    const floor = (geom.pad.top + geom.plotH).toFixed(1);
    return `${line}L${geom.x(s.values.length - 1).toFixed(1)},${floor}L${geom.pad.left},${floor}Z`;
  })();

  const tipLeft = (() => {
    if (hover === null) return 0;
    const atPct = geom.x(hover) / width;
    return atPct > 0.6 ? `calc(${atPct * 100}% - 176px)` : `calc(${atPct * 100}% + 14px)`;
  })();

  const controls = (
    <div className="ctl">
          <div className="seg" role="group" aria-label="Range">
            {RANGES.map((r) => (
              <button
                key={r.id}
                type="button"
                aria-pressed={months === r.months}
                onClick={() => setMonths(r.months)}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="ov">
            <label>
              <input type="checkbox" checked={sp} onChange={(e) => setSp(e.target.checked)} />
              S&amp;P 500
            </label>
            <label>
              <input type="checkbox" checked={tech} onChange={(e) => setTech(e.target.checked)} />
              Nasdaq-100
            </label>
      </div>
    </div>
  );

  const body = (
    <div className="chart" ref={hostRef}>
        <svg
          ref={svgRef}
          className="chart-svg"
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          role="img"
          tabIndex={0}
          aria-label={`Indexed performance, ${geom.labels[0]} to ${
            geom.labels[geom.labels.length - 1]
          }. Each series starts at 100. ${geom.series[0].label} ends at ${geom.series[0].values[
            geom.series[0].values.length - 1
          ].toFixed(0)}.`}
          onPointerMove={(e) => setHover(pointerIndex(e.clientX))}
          onPointerLeave={() => setHover(null)}
          onBlur={() => setHover(null)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
              e.preventDefault();
              const step = e.key === "ArrowRight" ? 1 : -1;
              setHover((h) => {
                const next = h === null ? geom.labels.length - 1 : h + step;
                return Math.max(0, Math.min(geom.labels.length - 1, next));
              });
            } else if (e.key === "Escape") {
              setHover(null);
            }
          }}
        >
          <defs>
            <linearGradient id="port-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: "var(--c-port)", stopOpacity: 0.17 }} />
              <stop offset="100%" style={{ stopColor: "var(--c-port)", stopOpacity: 0 }} />
            </linearGradient>
          </defs>

          {geom.ticks.map((t) => (
            <g key={t}>
              <line
                x1={geom.pad.left}
                y1={geom.y(t).toFixed(1)}
                x2={geom.pad.left + geom.plotW}
                y2={geom.y(t).toFixed(1)}
                style={{ stroke: "var(--grid)" }}
                strokeWidth="1"
              />
              <text
                x={geom.pad.left - 7}
                y={(geom.y(t) + 3.5).toFixed(1)}
                textAnchor="end"
                fontSize="10.5"
                style={{ fill: "var(--axis-ink)", fontVariantNumeric: "tabular-nums" }}
              >
                {axisNumber(t)}
              </text>
            </g>
          ))}

          <line
            x1={geom.pad.left}
            y1={geom.pad.top + geom.plotH}
            x2={geom.pad.left + geom.plotW}
            y2={geom.pad.top + geom.plotH}
            style={{ stroke: "var(--axis)" }}
            strokeWidth="1"
          />

          {geom.xLabels.map((l) => (
            <text
              key={l.i}
              x={geom.x(l.i).toFixed(1)}
              y={height - 8}
              textAnchor={l.anchor}
              fontSize="10.5"
              style={{ fill: "var(--axis-ink)" }}
            >
              {l.text}
            </text>
          ))}

          {areaPath && <path d={areaPath} fill="url(#port-fill)" stroke="none" />}

          {[...geom.series].reverse().map((s) => (
            <path
              key={s.key}
              d={s.values.map((v, i) => `${i ? "L" : "M"}${geom.x(i).toFixed(1)},${geom.y(v).toFixed(1)}`).join("")}
              fill="none"
              style={{ stroke: s.color }}
              strokeWidth={s.width}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {geom.marks.map((m, i) => (
            <g key={i}>
              <circle
                cx={geom.x(geom.labels.length - 1).toFixed(1)}
                cy={geom.y(m.value).toFixed(1)}
                r="3.2"
                style={{ fill: m.color, stroke: "var(--chart-bg)" }}
                strokeWidth="2"
              />
              <text
                x={(geom.x(geom.labels.length - 1) + 7).toFixed(1)}
                y={(m.y + 3.5).toFixed(1)}
                fontSize="11"
                style={{ fill: "var(--chart-ink)", fontVariantNumeric: "tabular-nums" }}
              >
                {m.label}
              </text>
            </g>
          ))}

          {hover !== null && (
            <g>
              <line
                x1={geom.x(hover)}
                x2={geom.x(hover)}
                y1={geom.pad.top}
                y2={geom.pad.top + geom.plotH}
                style={{ stroke: "var(--axis)" }}
                strokeWidth="1"
              />
              {geom.series.map((s) => (
                <circle
                  key={s.key}
                  cx={geom.x(hover)}
                  cy={geom.y(s.values[hover])}
                  r="3.6"
                  style={{ fill: s.color, stroke: "var(--chart-bg)" }}
                  strokeWidth="2"
                />
              ))}
            </g>
          )}
        </svg>

        {hover !== null && (
          <div className="chart-tip" style={{ left: tipLeft, top: 8 }}>
            <div className="tip-h">{geom.labels[hover]}</div>
            {geom.series.map((s) => (
              <div className="tip-r" key={s.key}>
                <i style={{ background: s.color }} />
                <span>{s.label}</span>
                <b>{change(s.values[hover] - 100)}</b>
              </div>
            ))}
          </div>
        )}

      <div className="chart-legend">
        {geom.series.map((s) => (
          <span className="lg" key={s.key}>
            <i style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );

  if (title) {
    return (
      <section className="pane">
        <header>
          <h2>{title}</h2>
          {showControls && !customSeries && controls}
        </header>
        <div className="pad">{body}</div>
      </section>
    );
  }

  return (
    <>
      {showControls && !customSeries && controls}
      {body}
    </>
  );
}

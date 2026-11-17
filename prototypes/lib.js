/* Shared formatting + chart engine for all three prototypes.
   Colours are read from CSS custom properties on the chart host, so each
   prototype styles the same chart through its own tokens. */
window.IIP = (function () {
  const MINUS = "−";
  const sgn = n => (n > 0 ? "+" : n < 0 ? MINUS : "");
  const usd0 = n => "$" + Math.round(n).toLocaleString("en-US");
  const usd2 = n => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pct = (n, dp = 1) => sgn(n) + Math.abs(n).toFixed(dp) + "%";
  const dol = n => sgn(n) + "$" + Math.abs(Math.round(n)).toLocaleString("en-US");
  const dayDollars = p => p.v - p.v / (1 + p.d / 100);
  const dir = n => (n > 0 ? "up" : n < 0 ? "down" : "flat");
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const monthLabels = Array.from({ length: 35 }, (_, i) => {
    const d = new Date(2024, i, 1);
    return d.toLocaleString("en-US", { month: "short" }) + " ’" + String(d.getFullYear()).slice(2);
  });

  const RANGES = [
    { id: "ytd", label: "YTD", months: 11 },
    { id: "1y", label: "1Y", months: 12 },
    { id: "3y", label: "3Y", months: 35 }
  ];

  function niceTicks(lo, hi, count) {
    const raw = (hi - lo) / count;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw) || 10 * mag;
    const out = [];
    for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(6));
    return out;
  }

  /* ---- index chart: three series, one axis, rebased to 100 at window start ---- */
  function indexChart(host, state, opts) {
    const o = Object.assign({ h: 280, fill: true, endLabels: true, ticks: 4 }, opts || {});
    const cs = getComputedStyle(host);
    const C = k => cs.getPropertyValue(k).trim() || "#888";
    const W = Math.max(260, Math.floor(host.clientWidth || 600));
    const H = o.h;
    const P = { t: 16, r: o.endLabels ? (W < 420 ? 44 : 62) : 14, b: 26, l: W < 420 ? 30 : 38 };
    const n = DATA.perf.port.length;
    const s0 = Math.max(0, n - state.months);
    const L = monthLabels.slice(s0);

    const defs = [
      { k: "port", label: "My portfolio", color: C("--c-port"), w: 2.2, raw: DATA.perf.port },
      { k: "sp", label: "S&P 500", color: C("--c-sp"), w: 1.4, raw: DATA.perf.sp },
      { k: "tech", label: "Nasdaq-100", color: C("--c-tech"), w: 1.4, raw: DATA.perf.tech }
    ];
    const vis = defs
      .filter(d => d.k === "port" || state.show[d.k])
      .map(d => {
        const sl = d.raw.slice(s0), b = sl[0];
        return Object.assign({}, d, { vals: sl.map(v => (v / b) * 100) });
      });

    const flat = vis.flatMap(d => d.vals);
    let lo = Math.min.apply(null, flat), hi = Math.max.apply(null, flat);
    const pad = (hi - lo) * 0.14 || 4;
    lo -= pad; hi += pad;
    const ticks = niceTicks(lo, hi, o.ticks);
    if (ticks.length) { lo = Math.min(lo, ticks[0]); hi = Math.max(hi, ticks[ticks.length - 1]); }

    const PW = W - P.l - P.r, PH = H - P.t - P.b;
    const x = i => P.l + (L.length < 2 ? 0 : (PW * i) / (L.length - 1));
    const y = v => P.t + PH * (1 - (v - lo) / (hi - lo));
    const uid = "g" + Math.random().toString(36).slice(2, 8);

    let s = `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" tabindex="0" aria-label="Indexed performance, portfolio against benchmarks. Window starts at 100.">`;
    if (o.fill) {
      s += `<defs><linearGradient id="${uid}" x1="0" y1="0" x2="0" y2="1">` +
        `<stop offset="0%" stop-color="${vis[0].color}" stop-opacity="0.17"/>` +
        `<stop offset="100%" stop-color="${vis[0].color}" stop-opacity="0"/></linearGradient></defs>`;
    }
    ticks.forEach(t => {
      s += `<line x1="${P.l}" y1="${y(t).toFixed(1)}" x2="${P.l + PW}" y2="${y(t).toFixed(1)}" stroke="${C("--grid")}" stroke-width="1" fill="none"/>`;
      s += `<text x="${P.l - 7}" y="${(y(t) + 3.5).toFixed(1)}" text-anchor="end" font-size="10.5" fill="${C("--axis-ink")}" style="font-variant-numeric:tabular-nums">${t}</text>`;
    });
    s += `<line x1="${P.l}" y1="${P.t + PH}" x2="${P.l + PW}" y2="${P.t + PH}" stroke="${C("--axis")}" stroke-width="1" fill="none"/>`;

    const stepCount = W < 420 ? 2 : 4;
    for (let j = 0; j <= stepCount; j++) {
      const i = Math.round((j * (L.length - 1)) / stepCount);
      const anchor = j === 0 ? "start" : j === stepCount ? "end" : "middle";
      s += `<text x="${x(i).toFixed(1)}" y="${H - 8}" text-anchor="${anchor}" font-size="10.5" fill="${C("--axis-ink")}">${L[i]}</text>`;
    }

    if (o.fill && vis[0].vals.length > 1) {
      const d = vis[0].vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
      s += `<path d="${d}L${x(vis[0].vals.length - 1).toFixed(1)},${(P.t + PH).toFixed(1)}L${P.l},${(P.t + PH).toFixed(1)}Z" fill="url(#${uid})" stroke="none"/>`;
    }
    vis.slice().reverse().forEach(d => {
      const path = d.vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
      s += `<path d="${path}" fill="none" stroke="${d.color}" stroke-width="${d.w}" stroke-linecap="round" stroke-linejoin="round"/>`;
    });

    if (o.endLabels) {
      const marks = vis.map(d => {
        const last = d.vals[d.vals.length - 1];
        return { d: d, v: last, y: y(last), txt: pct(last - 100) };
      }).sort((a, b) => a.y - b.y);
      for (let i = 1; i < marks.length; i++) {
        if (marks[i].y - marks[i - 1].y < 14) marks[i].y = marks[i - 1].y + 14;
      }
      marks.forEach(m => {
        const px = x(m.d.vals.length - 1);
        s += `<circle cx="${px.toFixed(1)}" cy="${y(m.v).toFixed(1)}" r="3.2" fill="${m.d.color}" stroke="${C("--chart-bg")}" stroke-width="2"/>`;
        s += `<text x="${(px + 7).toFixed(1)}" y="${(m.y + 3.5).toFixed(1)}" font-size="11" fill="${C("--chart-ink")}" style="font-variant-numeric:tabular-nums">${m.txt}</text>`;
      });
    }

    s += `<g class="xhair" style="display:none"><line y1="${P.t}" y2="${P.t + PH}" stroke="${C("--axis")}" stroke-width="1"/>`;
    vis.forEach(d => { s += `<circle r="3.6" fill="${d.color}" stroke="${C("--chart-bg")}" stroke-width="2"/>`; });
    s += `</g><rect class="hit" x="${P.l}" y="0" width="${PW}" height="${H}" fill="transparent"/></svg>`;

    const legend = vis.map(d => `<span class="lg"><i style="background:${d.color}"></i>${d.label}</span>`).join("");
    host.innerHTML = s + `<div class="chart-tip" hidden></div><div class="chart-legend">${legend}</div>`;

    /* hover + keyboard read-out */
    const svg = host.querySelector("svg");
    const tip = host.querySelector(".chart-tip");
    const xh = host.querySelector(".xhair");
    const dots = Array.prototype.slice.call(xh.querySelectorAll("circle"));
    const line = xh.querySelector("line");
    let cur = -1;

    function show(i) {
      if (i < 0 || i >= L.length) return;
      cur = i;
      xh.style.display = "";
      line.setAttribute("x1", x(i)); line.setAttribute("x2", x(i));
      vis.forEach((d, k) => { dots[k].setAttribute("cx", x(i)); dots[k].setAttribute("cy", y(d.vals[i])); });
      tip.hidden = false;
      tip.innerHTML = `<div class="tip-h">${L[i]}</div>` + vis.map(d =>
        `<div class="tip-r"><i style="background:${d.color}"></i><span>${d.label}</span><b>${pct(d.vals[i] - 100)}</b></div>`).join("");
      const rect = svg.getBoundingClientRect();
      const tw = tip.offsetWidth || 150;
      let left = (x(i) / W) * rect.width + 14;
      if (left + tw > rect.width) left = (x(i) / W) * rect.width - tw - 14;
      tip.style.left = Math.max(2, left) + "px";
      tip.style.top = "8px";
    }
    function hide() { xh.style.display = "none"; tip.hidden = true; cur = -1; }

    svg.addEventListener("pointermove", e => {
      const r = svg.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * W;
      const i = Math.max(0, Math.min(L.length - 1, Math.round(((px - P.l) / PW) * (L.length - 1))));
      show(i);
    });
    svg.addEventListener("pointerleave", hide);
    svg.addEventListener("blur", hide);
    svg.addEventListener("keydown", e => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        show(cur < 0 ? L.length - 1 : Math.max(0, Math.min(L.length - 1, cur + (e.key === "ArrowRight" ? 1 : -1))));
      } else if (e.key === "Escape") hide();
    });
    return { lo: lo, hi: hi, labels: L };
  }

  /* ---- deterministic sparkline for a ticker, ending at the given % change ---- */
  function sparkValues(ticker, change, n) {
    n = n || 30;
    let s = 0; for (const ch of ticker) s = (s * 31 + ch.charCodeAt(0)) % 99991;
    let x = s || 7;
    const rnd = () => ((x = (x * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    const out = []; let v = 100;
    for (let i = 0; i < n; i++) { v += (rnd() - 0.47) * 2.6; out.push(v); }
    const base = out[0], end = out[n - 1], target = base * (1 + change / 100);
    return out.map((q, i) => q + (i / (n - 1)) * (target - end));
  }

  function sparkline(ticker, change, opts) {
    const o = Object.assign({ w: 68, h: 22, stroke: "var(--spark)", dot: true }, opts || {});
    const vals = sparkValues(ticker, change, 30);
    const lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), span = hi - lo || 1;
    const X = i => (i / (vals.length - 1)) * (o.w - 2) + 1;
    const Y = v => o.h - 2 - ((v - lo) / span) * (o.h - 4);
    const d = vals.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join("");
    const lastX = X(vals.length - 1), lastY = Y(vals[vals.length - 1]);
    return `<svg class="spark" width="${o.w}" height="${o.h}" viewBox="0 0 ${o.w} ${o.h}" aria-hidden="true">` +
      `<path d="${d}" fill="none" stroke="${o.stroke}" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"/>` +
      (o.dot ? `<circle cx="${lastX.toFixed(1)}" cy="${lastY.toFixed(1)}" r="2" fill="var(--${dir(change)}-ink)"/>` : "") +
      `</svg>`;
  }

  /* ---- derived figures, computed once so every prototype shows the same maths ---- */
  function totals() {
    const day = DATA.positions.reduce((a, p) => a + dayDollars(p), 0);
    const prior = DATA.total - day;
    return { day: day, dayPct: (day / prior) * 100, gain: DATA.total - DATA.basis };
  }

  function convById(id) { return DATA.convictions.find(c => c.id === id); }
  function convName(id) { const c = convById(id); return c ? c.short : id; }

  return {
    MINUS, sgn, usd0, usd2, pct, dol, dayDollars, dir, esc,
    monthLabels, RANGES, niceTicks, indexChart, sparkline, sparkValues,
    totals, convById, convName
  };
})();

# Interface prototypes — Personal Investing Interface

Three clickable mockups of the same product, built to be chosen between. All three share
one dataset (`data.js`) and one chart engine (`lib.js`), so the comparison is about layout
and navigation rather than content.

| File | Direction | Published |
| --- | --- | --- |
| `a-broadsheet.html` | Reading-first. One column, top tabs, rules instead of cards. Carries the Desk / Broadsheet tokens from Weeks 2–3. | https://claude.ai/artifact/T5zjq2WGuVP21rJdWhqsjW |
| `b-terminal.html` | **Chosen direction.** Dark-first, keyboard-driven. Left rail, ⌘K command palette, master/detail panes. DM Sans / DM Mono on warm neutrals; colour is reserved for data. | https://claude.ai/artifact/EJenJJ1UzxZijKhQqvXCUM |
| `c-stack.html` | Conviction-first. Positions nested inside the belief they serve; sidebar at desktop, bottom tab bar on a phone. | https://claude.ai/artifact/PP8hVdtL38FWRqjYLTmZRH |

## The chosen direction

`b-terminal.html` is the one being taken forward. It has had two passes since the three were
first put side by side:

1. **Dark by default**, independent of the host theme, with a moon/sun switch in the top bar
   that is remembered per browser in `localStorage`. Light mode is the override, not the start.
2. **Softer type and palette, less on screen.** DM Sans and DM Mono replace Inter and IBM Plex
   Mono; surfaces moved from cold near-black to warm neutral charcoal (paper in light mode);
   uppercase mono micro-labels became sentence-case sans in muted ink. The interface chrome is
   near-greyscale and the three data hues (blue, terracotta, teal) appear only in the chart, the
   exposure bar and the conviction dots — all three validated for colour-blind separation and
   contrast in both themes. Holdings dropped from eight columns to six, the stat row from five
   tiles to four, conviction pills became a dot plus a name, and *Add a conviction* moved out of
   the stack into a `+ New` button on the conviction list.

Each one covers the same six surfaces: portfolio, conviction exposure map, conviction
detail with the pressure-test flow, news, security research page (NVDA carries the full
sample detail), and emerging tech.

## Running them

No build step. The three HTML files load `data.js` and `lib.js` as siblings, so they need a
server rather than a `file://` open:

```bash
cd prototypes && python3 -m http.server 8000
# then open http://localhost:8000/a-broadsheet.html
```

The published links above are the authoritative view — they are wrapped in the artifact
page skeleton, which these files deliberately omit.

## What is fake

Everything numeric. Prices, day moves, filings, headlines, price targets and correlations
are invented sample data chosen so the arithmetic reconciles (the three daily themes plus
drift sum to the day's P&L; conviction exposure sums to 100% of the book). Article and
research links point at publication home pages, not at articles.

## Known data constraints for the real build

- **Chase has no public brokerage API.** Account connection means an aggregator (Plaid
  investments, SnapTrade) or CSV import. Worth deciding before the portfolio view is built
  on an assumption.
- **Yahoo Finance has no official API.** The Week-3 proposal already chose Alpaca for bars
  and SEC EDGAR for filings, which is the right path; keep it.
- **Sell-side price targets and PDFs are licensed.** Without a Refinitiv/FactSet seat, this
  section becomes links to public summaries, or it comes out.

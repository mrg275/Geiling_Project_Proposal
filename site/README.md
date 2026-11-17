# Conviction — personal investing interface

A portfolio read against the convictions behind it, rather than against a benchmark alone.
Five surfaces: the book and what moved it today, the convictions with the exposure and the
correlation behind each one, a filtered reading list, a research page for any security, and
the week's emerging-technology milestones.

Next.js App Router, TypeScript, no UI framework. Every figure on screen is invented — see
[What is fake](#what-is-fake).

- **Live:** _(Vercel URL — add after first deploy)_
- **Design prototypes it came from:** [`../prototypes`](../prototypes)

## Running it

```bash
cd site
npm install
cp .env.example .env.local   # then set SEC_USER_AGENT to a real contact
npm run dev                  # http://localhost:3000
```

`SEC_USER_AGENT` is load-bearing, not boilerplate: EDGAR answers a bare
User-Agent with `403 Request Rate Threshold Exceeded` on the very first request,
and the same request with a declared contact returns 200. Nothing else is
required to run the app — search and filings work with no key at all.

Other scripts: `npm run build` (production build), `npm start` (serve the build),
`npm run typecheck` (`tsc --noEmit`).

## Deploying to Vercel

This app lives in `site/` inside a repo whose root holds the Week-9 proposal page, so
**Vercel's Root Directory has to be set to `site`** — otherwise it finds the static
`index.html` at the root and never detects a framework.

### From the CLI

```bash
cd site
vercel          # preview deploy; accept the framework detection
vercel --prod   # the URL to submit
```

Running `vercel` from inside `site/` makes that directory the project root, so no extra
configuration is needed.

### From the dashboard

Import the GitHub repo, then **Settings → Build & Deployment → Root Directory → `site`**.
Framework preset is Next.js; build command and output directory are the defaults. Pushes to
`main` then deploy on their own.

Everything here is free on Hobby: there are no API calls, no database and no environment
variables yet. 32 of the 34 routes prerender as static HTML; `/news` and
`/securities/[ticker]` render on demand because they read their state out of the URL.

## How it is put together

```
site/
  app/
    layout.tsx            Rail, top bar, theme boot, provenance footer
    globals.css           The whole design system: tokens, base, components
    page.tsx              Portfolio
    convictions/          Index, [id], new
    news/                 ?conviction= filters
    securities/           Index, [ticker] with ?section=
    emerging/
    not-found.tsx
  components/
    PerformanceChart.tsx  One axis, series rebased to 100, hover + keyboard
    Sparkline.tsx         Deterministic 30-session shape per ticker
    CommandPalette.tsx    ⌘K, and 1–5 for the five sections
    Tag.tsx Score.tsx ThemeToggle.tsx Nav.tsx TopBar.tsx
    portfolio/ convictions/ securities/
  lib/
    types.ts              The shapes a real data layer has to produce
    data.ts               The invented book — the only file to replace
    prices.ts             Sample price history, every chart range from one series
    portfolio.ts          Derived figures: day P&L, weights, residual
    series.ts             Rebasing, axis ticks, deterministic walks
    format.ts keys.ts nav.ts
```

Three decisions worth knowing about:

**State lives in the URL where it is worth linking to.** The selected conviction, the news
filter and the research section are all routes or query parameters, so they survive a
reload and can be sent to someone. Only genuinely transient things — the chart's range, the
search box, an open draft — are component state.

**Server by default, client islands where there is interaction.** The chart, the palette,
the theme switch, the new-conviction flow and the debates chat are the only
`"use client"` files; everything else renders on the server.

**One stylesheet, not CSS modules.** The design is a token system, and a single
`globals.css` keeps the three theme blocks next to each other where they can be checked
against one another. Every colour is defined on `:root` for dark, then again under
`prefers-color-scheme: light` and `[data-theme="light"]`, because the in-page switch has to
beat the OS setting in both directions.

### Colour

The interface is deliberately near-greyscale; colour is spent on data. The three data hues
— blue, terracotta, teal — are the only set that clears colour-blind separation, the
normal-vision floor and 3:1 contrast against both surfaces when every pair can appear side
by side, which is what a stacked exposure bar does. A fourth hue fails those gates, so the
fourth conviction onward takes the neutral key and the slice behind no conviction is drawn
as a hatch. Slots follow the conviction, not its size, so a position moving never repaints
the chart.

Dark is the default whatever the OS says. An inline script in `<head>` stamps
`data-theme` before first paint, so there is no flash of the wrong theme.

## One section is finished; the rest are behind glass

A reader cannot tell a finished section from a sketch by looking, and the
sketches are the ones made of invented numbers. So only **Securities** renders
normally. Portfolio, Convictions, News and Emerging tech render blurred under a
card naming what the section will be and what it is waiting on, and the rail
marks them "soon" before you click.

Which ones those are is a `ready` flag in `lib/nav.ts` — the same definition the
rail and the command palette already read, so the rail and the page cannot
disagree about what works. Turning a section on is deleting one line.

The blurred layer is `inert` and `aria-hidden`: it is a texture, not content, so
it takes no focus and no screen reader reads it. What gets read is the card.

## What is real and what is still sample

Live, with no key and no quota:

- **Search** — 39,034 tickers from two EDGAR files: 10,400 companies with
  names and exchanges, and 28,635 fund and ETF share classes with neither. Both
  are needed. VOO is a position in this very book and is *not* in the company
  file, nor are QQQ, VTI or ARKK; SPY is, because it is a unit investment trust
  and files like a company.

  Ranked by exact ticker, then ticker prefix, then company name, with three
  signals breaking ties: EDGAR's own row order (which tracks company size — the
  file opens AAPL, NVDA, MSFT, and Microalgo sits at row 5,556), the listing
  venue, so the OTC tail loses ties on a name fragment, and a flat penalty on
  funds, which are worth finding by ticker and rarely by fragment. Typing
  "micro" returns Microsoft, Micron, Microchip; typing "voo" returns VOO.

  Names come from whichever source knows: EDGAR for companies, the broker's
  asset list for funds — EDGAR's fund index has no names, and the registrant
  behind VOO is "Vanguard Index Funds", which is true and not what anyone is
  looking for. EDGAR shouts its names, so they are title-cased, keeping genuine
  acronyms and the ticker itself: "Invesco QQQ Trust", not "Invesco Qqq Trust",
  and "SPDR S&P 500 ETF Trust", not "Spdr S&p 500 ETF Trust".
- **Company identity** — legal name, SIC industry, exchange, fiscal year end,
  CIK, for any ticker.
- **The 52-week range, one-year change and average volume**, computed from the
  same daily bars the chart asks for, so they cost no extra call and work for
  any ticker rather than only the ones with sample research.
- **Filings** — the latest 10-K, 10-Q and earnings release, with direct document
  URLs and exhibit indexes. The earnings 8-K is found by filtering on Item 2.02,
  "Results of Operations", which is how you pick it out of dozens of unrelated
  8-Ks.

Still invented, in `lib/data.ts` and `lib/prices.ts`:

- **Prices and charts.** Alpaca is not connected. Its free plan is IEX-feed only
  and 15 minutes delayed via the API, so a free daily bar is indicative rather
  than the official close.

  Until it is, `lib/prices.ts` generates ten years of sessions per ticker so that
  the seven ranges on a company page — 1D, 5D, 1M, 6M, YTD, 5Y, Total — are seven
  windows onto one history rather than seven unrelated pictures. Three numbers in
  it are anchored exactly: today's close, the day move, and the trailing one-year
  return. The rest is a trend plus a bounded deviation, because a ten-year random
  walk's noise swamps its drift and lands a compounder below where it started.
  Replacing the file with real bars changes no component.
- **The book** — positions, weights, day P&L, convictions, news, emerging tech.
- **How each company earns**, in `book.businesses`: written by hand for the
  nineteen names in the sample universe, and kept qualitative on purpose, since
  an invented share of revenue beside a real company reads as a fact. Every
  other ticker offers to read it out of the 10-K instead — see below.
- **Valuation, comps, targets and debates**, and the sample only covers NVDA.
  Every other ticker says so rather than showing blanks.

The invented figures still reconcile with each other: day-dollar moves sum to
the Today tile, the three day themes plus a computed residual sum to the same
number, and conviction exposure plus the unassigned slice is exactly 100%.

## Spending credits

OpenAI is the only paid dependency, and the rules are enforced in code, not in
a convention:

1. **Nothing calls the model on a page load.** Every call is behind a button.
   The route is POST-only — a GET returns 405 — so a crawler, a prefetch or a
   double render cannot spend anything.
2. **Results are cached against the filing's accession number**, which never
   changes. A filing's takeaways cost once and are then free forever. The page
   reads that cache on the server, so an already-pulled filing renders with no
   call at all and the button is replaced by the result.
3. **A daily call ceiling is enforced server-side** (`AI_DAILY_CALL_LIMIT`,
   default 25). A bug in a loop hits a wall rather than the bottom of the
   balance. Each call logs its own estimated cost.

The filing is fetched by us from the known EDGAR URL and passed in, rather than
letting the model search for it: the URL is already known, a fetch is free where
a hosted web search is $10 per 1,000 calls, and it removes any chance of
summarising the wrong document. Input is capped at 180k tokens, below the 272k
threshold where OpenAI's input pricing steps up. Filing text is treated as a
document, never as instructions.

At `gpt-6.1-sol` ($2/1M in, $10/1M out) a first pull runs about **$0.32 for a
10-K, $0.10 for a 10-Q, $0.05 for an earnings release** — and the button says so
before you press it. `gpt-6.1-terra` halves that.

### Turning on live prices

Two environment variables and a restart:

1. Create a **paper-only account** at alpaca.markets. It needs an email address
   and nothing else — no funding, no card, no identity check — and its free data
   plan is what this app is built against.
2. Generate API keys and put them in `.env.local` as `ALPACA_KEY_ID` and
   `ALPACA_SECRET_KEY`.
3. Restart `npm run dev` and open **`/api/market/check`**. It asks Alpaca
   directly rather than through the selector, so a bad key reports itself
   instead of being papered over by the sample fallback. A working setup returns
   `ok: true`, which feed the key reached, SPY's price and the time it traded.

Nothing else changes. The app detects the keys and stops using its generator.

### The market-data layer

One interface, `lib/market/types.ts`, with two methods: `quote` and `history`.
Two implementations behind it — `alpaca.ts` and `sample.ts` — and one selector,
`index.ts`, that picks the live one when `ALPACA_KEY_ID` and `ALPACA_SECRET_KEY`
are set and the sample one when they are not. No page knows which answered. Each
answer carries a `provenance` the page prints, because a price whose source is
unstated is worse than no price.

Three things in the Alpaca adapter are worth knowing:

- **Every window ends sixteen minutes ago, explicitly.** The documentation says
  `end` defaults to fifteen minutes back without real-time access; measured
  against a real free key, it does not. Asking for SIP bars with no `end`
  returns `403 subscription does not permit querying recent SIP data`. So the
  window is closed by hand, with a minute of margin, and the consolidated tape
  is allowed.
- **The feed is negotiated per endpoint, not assumed, because entitlements
  differ by endpoint.** A free key reads the consolidated tape for a window that
  has closed (`sip`) but is refused that tape's *latest* value — for which the
  answer is `delayed_sip`, the same tape fifteen minutes late. Both were found
  by probing, both are cached for an hour, and `iex` is the fallback if neither
  works. IEX alone is one exchange and a few per cent of volume, so the
  provenance line says which one drew the chart.
- **Intraday bars are filtered to regular hours.** Alpaca returns the whole
  trading day, 4am to 8pm ET, so an unfiltered "1D" was 157 five-minute bars
  running from pre-market to after-hours — and because the time label dropped
  the meridiem, 4am and 5pm were both "4:00" and "5:00" on the axis. Filtered to
  9:30–4:00, it is 78 bars.
- **The quote's close comes from those session bars, not from the daily bar.**
  Alpaca's daily bar close includes extended hours too: at 5pm both it and
  `latestTrade` read $156.72 for NVIDIA while the chart ended at $155.45 — same
  company, same page, two prices. The tile now shows the session close and says
  "after hours $158.52 +2.0%" on its own line, which is the thing that was
  actually true.
- **Bars are requested `adjustment=all`.** Without it NVIDIA's ten-year chart
  shows a 90% crash where its stock split was.

A failed live call degrades to the sample generator *with the failure in the
provenance note*. Falling back silently would put invented prices on screen
dressed as real ones, which is the one outcome worth engineering against.

Cache TTLs are set by how fast the window can change: five minutes for the two
intraday ranges, an hour for daily closes, a day for weekly and monthly. The
free plan's 200 requests a minute is generous for one page and not generous for
a comps table, so the cache is what makes the ceiling irrelevant.

### Market cap, which needs both halves

A live price does not fix a market cap on its own; it needs a share count, and
that is free from EDGAR. `lib/sec/facts.ts` tries three tags in order, because
no single one covers every filer:

1. `dei:EntityCommonStockSharesOutstanding` — the cover-page count, the closest
   thing to today.
2. `us-gaap:CommonStockSharesOutstanding` — the balance-sheet-date count.
   Alphabet reports its cover-page count *per share class*, and the
   companyconcept API returns only facts carrying no dimensions, so tag 1 is a
   404 for GOOGL while this one returns 12.29bn.
3. `us-gaap:WeightedAverageNumberOfDilutedSharesOutstanding` — an average over a
   period rather than a count on a date, so it is the last resort and the page
   labels it as what it is.

Verified live against Apple, NVIDIA, Micron and Alphabet. The page prints the
count, the form it came from and its date, so a cap that looks wrong can be
checked rather than argued about.

### Reading Item 1 instead of the whole 10-K

The "how it makes money" pull sends only the business section, which is worth a
paragraph because it is where the cost went. A 10-K is 60,000 to 180,000 tokens
and most of it — risk factors, legal proceedings, accounting policy — cannot
answer the question. Item 1 can, and it is a fraction of the document, so the
pull runs about four cents instead of a quarter.

Finding it took two corrections. Filings name every item twice, once in the
table of contents and once where the section begins, and some repeat it in a
running page header; pairing each "Item 1A, Risk Factors" with the nearest
"Item 1, Business" *above* it and taking the widest pair lands on the body
heading, where taking the first pair over a size threshold landed Micron on its
contents page. And the headings have to be matched with the whitespace removed,
because Microsoft's own 10-K writes its heading as `ITEM 1. B USINESS` and
Apple's writes it as `Item 1.&#160;&#160;&#160;&#160;Business`. Verified by hand
against Apple, NVIDIA, Micron, Microsoft and Constellation: all five land on the
real section.

Decoding those numeric entities fixed something else by accident. The stripper
knew `&nbsp;` but not `&#160;`, so until now every filing sent to the model
carried `&#8220;` where it should have carried a quotation mark.

## Caching

Every external call writes the cache before anything reads it; the free tiers
are small enough that an uncached page is one refresh from a 429. TTLs: the
ticker index a day, company submissions six hours, anything derived from a
filing permanently.

The driver is chosen by environment: a directory on disk (`.cache` locally,
`/tmp` on Vercel) with an in-process layer in front. **This is the one gap
before the AI surfaces go to production** — `/tmp` does not survive a cold
start, so a pull could be paid for twice. The `Cache` interface in
`lib/cache/index.ts` is two methods; a Postgres driver behind the same interface
is the fix, and Supabase is already in the project plan.

## What the real version still needs

- **Fundamentals from XBRL.** Market cap, P/E, EV/EBITDA, net debt and the
  industry ratios all compute from `companyfacts`, free and authoritative, but
  two things bite: the revenue tag varies by company and by filing (NVDA carries
  10-Q revenue under `Revenues`, not under
  `RevenueFromContractWithCustomerExcludingAssessedTax`), and every 10-Q reports
  the same period end twice — once as the quarter, once cumulative. Filtering on
  a roughly 90-day span is what separates them. That period normalizer is the
  keystone the stat tiles and comps both sit on.
- **Chase has no public brokerage API.** Account connection means an aggregator
  (Plaid Investments, SnapTrade) or CSV import.
- **Price targets are licensed.** Named-firm targets start around $75/month and
  the research PDFs are not publicly linkable at any price, so this section
  becomes a consensus band — high, median, low, analyst count.
- **Transcripts are not in EDGAR.** The 8-K carries the press release, never the
  call Q&A. Equibles' free tier is 100 requests/day; whether it includes the
  analyst Q&A rather than prepared remarks is still unverified and is a
  twenty-minute test.
- **Comps need a peer list.** No free API gives a good one, and SIC codes are
  too crude (3674 lumps NVIDIA with analog chipmakers). For a watchlist of this
  size a curated list beats any vendor's sector code.

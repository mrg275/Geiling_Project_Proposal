/** Invented sample data.
 *
 *  Nothing here is live. Every price, move, filing, headline, price target and
 *  correlation is made up, chosen so the arithmetic reconciles: the positions'
 *  day-dollar moves sum to the day's P&L, the three day themes plus drift sum to
 *  the same number, and conviction exposure plus the unassigned slice is exactly
 *  100% of the book. That way the interface can be judged on whether it reads
 *  well, not on whether the numbers happen to agree.
 *
 *  Replacing this file is the whole data task: see README "What is fake".
 */
import type { Book } from "./types";

export const book: Book = {
  asOf: "Mon 16 Nov 2026 · 4:02pm ET",
  total: 420740,
  basis: 285830,
  totalPct: 47.2,
  cash: 14600,

  positions: [
    { ticker: "NVDA", name: "NVIDIA", value: 78420, dayPct: 1.8, thirtyDayPct: 8.4, totalPct: 142.4, price: 184.26, convictions: ["diffusion"] },
    { ticker: "MSFT", name: "Microsoft", value: 61250, dayPct: 0.4, thirtyDayPct: 2.1, totalPct: 38.1, price: 512.4, convictions: ["diffusion"] },
    { ticker: "VOO", name: "Vanguard S&P 500 ETF", value: 58900, dayPct: 0.5, thirtyDayPct: 3.2, totalPct: 21.3, price: 598.12, convictions: [] },
    { ticker: "TSM", name: "TSMC (ADR)", value: 44980, dayPct: 2.6, thirtyDayPct: 11.6, totalPct: 91.2, price: 312.75, convictions: ["packaging"] },
    { ticker: "AMZN", name: "Amazon", value: 39110, dayPct: -0.3, thirtyDayPct: -1.4, totalPct: 24.6, price: 241.8, convictions: ["diffusion"] },
    { ticker: "GOOGL", name: "Alphabet", value: 36540, dayPct: 0.9, thirtyDayPct: 6.8, totalPct: 52.4, price: 318.65, convictions: ["diffusion", "silicon"] },
    { ticker: "SNOW", name: "Snowflake", value: 22870, dayPct: -2.1, thirtyDayPct: -9.2, totalPct: -8.4, price: 198.3, convictions: ["diffusion"] },
    { ticker: "VRT", name: "Vertiv", value: 19340, dayPct: 3.4, thirtyDayPct: 14.3, totalPct: 67.1, price: 176.9, convictions: ["power"] },
    { ticker: "CRWD", name: "CrowdStrike", value: 17620, dayPct: -1.2, thirtyDayPct: 1.7, totalPct: 19.3, price: 452.1, convictions: [] },
    { ticker: "PLTR", name: "Palantir", value: 14230, dayPct: 4.1, thirtyDayPct: 18.6, totalPct: 208.5, price: 214.55, convictions: ["diffusion"] },
    { ticker: "CEG", name: "Constellation Energy", value: 12880, dayPct: 2.2, thirtyDayPct: 7.9, totalPct: 44.8, price: 368.2, convictions: ["power"] },
  ],

  // 35 monthly points, Jan 2024 to Nov 2026, each series starting at 100.
  performance: {
    portfolio: [100, 104.2, 109.8, 106.4, 112.1, 118.6, 115.2, 121.9, 126.4, 122.8, 130.5, 134.1,
      128.6, 133.9, 139.2, 131.4, 127.8, 134.6, 141.2, 137.5, 144.8, 139.1, 133.6, 140.2,
      136.4, 129.8, 135.1, 142.6, 148.3, 141.7, 136.9, 143.2, 149.6, 144.1, 147.2],
    sp500: [100, 102.1, 104.6, 103.2, 105.8, 107.9, 106.4, 109.1, 111.3, 109.8, 112.6, 114.2,
      111.4, 113.8, 116.1, 112.9, 110.6, 113.4, 116.8, 114.2, 117.9, 115.1, 112.4, 115.8,
      113.2, 109.6, 112.8, 116.4, 119.8, 116.2, 113.8, 117.1, 120.4, 118.1, 119.4],
    nasdaq100: [100, 103.4, 107.9, 104.8, 109.2, 113.6, 110.1, 115.4, 119.2, 115.6, 121.4, 124.8,
      120.1, 124.6, 128.9, 122.4, 118.9, 124.1, 129.8, 125.4, 131.6, 126.8, 121.9, 127.4,
      123.1, 117.4, 122.6, 129.1, 134.2, 128.4, 124.1, 130.2, 136.1, 130.8, 131.8],
  },

  dayThemes: [
    {
      headline: "Power, not compute, carried the book.",
      body: "VRT +3.4% and CEG +2.2% after Constellation's 1.4GW Ohio campus PPA cleared review. Your power sleeve is 7.7% of the book and produced 23% of the day.",
      dollars: 913,
      tickers: ["VRT", "CEG"],
    },
    {
      headline: "Taiwan packaging relief.",
      body: "TSM +2.6% and NVDA +1.8% on a grid allocation for two CoWoS-L fabs. Same headline, two positions, 29% of the book.",
      dollars: 2527,
      tickers: ["TSM", "NVDA"],
    },
    {
      headline: "Seat-priced software kept bleeding.",
      body: "SNOW −2.1% and CRWD −1.2% as enterprise buyers renegotiate seat counts. This is the one theme your own convictions disagree about.",
      dollars: -705,
      tickers: ["SNOW", "CRWD"],
    },
  ],
  dayDriftNote: "Drift across MSFT, VOO, GOOGL, AMZN and PLTR.",
  themeNote:
    "Two of these three are the same bet: packaging relief and the power buildout both pay off only if 2027 cluster buildouts stay on schedule.",

  convictions: [
    {
      id: "diffusion",
      short: "Enterprise AI diffusion",
      title: "Enterprise AI diffusion is a decade of spend, not a cycle",
      score: 9,
      added: "12 Mar 2026",
      horizon: "5–10 years",
      thesis:
        "The spend moves from experiments to line-item budgets once agents touch revenue-generating work. The layer that keeps the margin is whoever owns the scarce input, and for the next three years that is compute and the power to run it, not the application layer.",
      falsifiedBy:
        "Two consecutive quarters where hyperscaler capex guidance falls while their revenue growth holds. Spend without payback is the bear case; payback without spend kills the thesis.",
      value: 252420,
      pct: 60.0,
      tickers: ["NVDA", "MSFT", "AMZN", "GOOGL", "SNOW", "PLTR"],
      correlation: 0.69,
      correlationNote: "MSFT – GOOGL at 0.82",
      ideas: [
        {
          kind: "Risk reversal",
          ticker: "NVDA",
          body: "Sell Mar-27 $150 puts, buy Mar-27 $200 calls. Keeps the upside without adding cash to an 18.6% position. The pain case is assignment at $150 in exactly the scenario that breaks the thesis.",
        },
        {
          kind: "Covered call",
          ticker: "PLTR",
          body: "Feb-27 $260 against the 3.4% position, now +208%. Collects roughly 2.1% on a holding where the multiple, not the thesis, is doing the work.",
        },
      ],
    },
    {
      id: "power",
      short: "Power is the ceiling",
      title: "Power and cooling, not silicon, set the ceiling on 2027 compute",
      score: 8,
      added: "04 Jun 2026",
      horizon: "3–5 years",
      thesis:
        "Fab capacity is being added faster than interconnection queues clear. The binding constraint on delivered compute in 2027 is megawatts at the meter, which prices the people who sell generation, switchgear and liquid cooling.",
      falsifiedBy:
        "Interconnection queue times in the three largest data-center markets shortening two years in a row, or a behind-the-meter rule change that makes on-site generation routine.",
      value: 32220,
      pct: 7.7,
      tickers: ["VRT", "CEG"],
      correlation: 0.58,
      correlationNote: "VRT – CEG at 0.58",
      ideas: [
        {
          kind: "LEAPS instead of shares",
          ticker: "CEG",
          body: "Jan-28 $400 calls rather than adding shares. The term matches the buildout and the capital at risk is about a quarter of the share equivalent.",
        },
        {
          kind: "Unowned expression",
          ticker: "ALAB",
          body: "A Jan-27 $80/$100 call spread sizes an entry at 0.4% of the book while the name is down 14% on a competitor claim.",
        },
      ],
    },
    {
      id: "packaging",
      short: "Packaging chokepoint",
      title: "Advanced packaging is the real chokepoint, not wafer starts",
      score: 7,
      added: "21 Jul 2026",
      horizon: "2–4 years",
      thesis:
        "Leading-edge wafer capacity is contracted years out, but the step that actually gates accelerator shipments is CoWoS-class packaging and the substrate supply behind it. That step has fewer suppliers and a longer tool lead time than the fab itself.",
      falsifiedBy:
        "Packaging capacity additions outrunning accelerator unit growth for three quarters, visible as falling lead times rather than as price cuts.",
      value: 44980,
      pct: 10.7,
      tickers: ["TSM"],
      correlation: null,
      correlationNote: "Single position — no correlation to measure",
      ideas: [
        {
          kind: "Add the second leg",
          ticker: "ALAB",
          body: "The thesis has one position behind it. Connectivity attach rate rises with every rack-scale deployment, and the name is 14% cheaper than it was Tuesday.",
        },
      ],
    },
    {
      id: "silicon",
      short: "Custom silicon takes share",
      title: "Custom accelerators take real unit share from merchant GPUs by 2028",
      score: 6,
      added: "09 Sep 2026",
      horizon: "3–5 years",
      thesis:
        "Inference at scale is a cost-per-token problem, and whoever owns both the workload and the design captures the margin the merchant vendor used to. This matters in units, not just at the low end.",
      falsifiedBy:
        "Two more generations where internal silicon lands late or underperforms on the memory bandwidth that actually matters.",
      value: 36540,
      pct: 8.7,
      tickers: ["GOOGL"],
      correlation: null,
      correlationNote: "Single position — no correlation to measure",
      tension: "Pulls against your largest holding. NVDA is 18.6% of the book.",
      ideas: [
        {
          kind: "Size the contradiction",
          ticker: "NVDA",
          body: "If this conviction is right, the 18.6% position is the thing it is right about. Either trim to 12% or mark this conviction down from 6.",
        },
      ],
    },
    {
      id: "seats",
      short: "Seat pricing breaks",
      title: "Per-seat software pricing breaks when agents do the work",
      score: 7,
      added: "28 Oct 2026",
      horizon: "2–4 years",
      thesis:
        "Pricing a license per human is pricing the wrong unit once the work is done by something that is not a human. Vendors who re-price to consumption keep the revenue; vendors who defend seats lose it on renewal.",
      falsifiedBy:
        "A full renewal cycle at the big seat-based vendors with net revenue retention holding above 115%.",
      value: 0,
      pct: 0,
      tickers: [],
      correlation: null,
      correlationNote: "No positions behind this conviction",
      tension: "SNOW and CRWD are 9.6% of the book and sit on the wrong side of it.",
      ideas: [
        {
          kind: "The obvious trade",
          ticker: "SNOW",
          body: "You hold the position this conviction argues against. Resolve it: either this conviction is a 4, or the position is a trim.",
        },
      ],
    },
  ],

  unassigned: { value: 91120, pct: 21.7, tickers: ["VOO", "CRWD", "Cash"] },
  exposureNote:
    "Alphabet also carries \u201ccustom silicon takes share\u201d, counted once above. \u201cSeat pricing breaks\u201d has no positions behind it.",

  correlationMatrix: {
    tickers: ["NVDA", "MSFT", "AMZN", "GOOGL", "PLTR"],
    values: [
      [1, 0.71, 0.66, 0.69, 0.74],
      [0.71, 1, 0.78, 0.82, 0.58],
      [0.66, 0.78, 1, 0.76, 0.54],
      [0.69, 0.82, 0.76, 1, 0.61],
      [0.74, 0.58, 0.54, 0.61, 1],
    ],
  },

  pressureTestQuestions: [
    "Over what period does this have to be true for you to be right — 12 months, three years, or a decade? Name the date you would check.",
    "Who pays, and out of which budget? New spend, or cannibalised seats and headcount?",
    "Which layer keeps the margin: the labs, the hyperscalers, the application layer, or the silicon?",
    "If you are right, what shows up in the next two earnings cycles? Name a number you would expect to see.",
    "What single piece of evidence would make you sell? Make it specific enough that you would actually notice it.",
  ],

  flagged: [
    {
      kind: "Buy",
      ticker: "ALAB",
      name: "Astera Labs",
      price: 71.4,
      move: -14.2,
      window: "5 sessions",
      conviction: "packaging",
      owned: false,
      why: "Down 14% since Tuesday on a rival's design-win claim, not on guidance. Connectivity attach rate rises with every rack-scale deployment, which is the thing your packaging conviction is actually about.",
    },
    {
      kind: "Add",
      ticker: "CEG",
      name: "Constellation Energy",
      price: 368.2,
      move: 2.2,
      window: "today",
      conviction: "power",
      owned: true,
      why: "You rate this conviction 8 out of 10 and hold 7.7% against it — the smallest sleeve of your three funded convictions.",
    },
    {
      kind: "Trim",
      ticker: "SNOW",
      name: "Snowflake",
      price: 198.3,
      move: -2.1,
      window: "today",
      conviction: "seats",
      owned: true,
      why: "Two of your convictions disagree about this position. It sits inside AI diffusion and is the clearest loser if seat pricing breaks.",
    },
    {
      kind: "Decide",
      ticker: "NVDA",
      name: "NVIDIA",
      price: 184.26,
      move: 1.8,
      window: "today",
      conviction: "silicon",
      owned: true,
      why: "18.6% of the book in one name, three days before the 19 Nov call. Concentration is a decision — make it on purpose.",
    },
  ],

  news: [
    {
      source: "Reuters",
      url: "https://www.reuters.com/markets/",
      title: "Taiwan grid operator approves 1.2GW allocation for two advanced-packaging fabs",
      when: "2 hours ago",
      readingTime: "4 min",
      convictions: ["packaging", "power"],
      why: "The allocation is the gating item for the CoWoS-L capacity your packaging thesis assumes arrives in 2027.",
    },
    {
      source: "The Information",
      url: "https://www.theinformation.com",
      title: "Inside the capex re-forecast: three of four hyperscalers raised 2027 power budgets before chip budgets",
      when: "5 hours ago",
      readingTime: "9 min",
      convictions: ["power"],
      why: "First reporting that puts an order on the two budget lines. Your power conviction is the claim that this ordering holds.",
    },
    {
      source: "The Wall Street Journal",
      url: "https://www.wsj.com/news/markets",
      title: "Enterprise software buyers renegotiate seat counts as agents absorb workflows",
      when: "Yesterday",
      readingTime: "6 min",
      convictions: ["seats", "diffusion"],
      why: "Reads directly against two positions you hold, SNOW and CRWD, and in favour of a conviction with no positions behind it.",
    },
    {
      source: "SemiAnalysis",
      url: "https://semianalysis.com",
      title: "CoWoS-L capacity through 2028: the bottleneck moved downstream",
      when: "2 days ago",
      readingTime: "22 min",
      convictions: ["packaging"],
      deepDive: true,
      why: "The substrate section is the part that matters. It argues the chokepoint is no longer the step your thesis names.",
    },
    {
      source: "Financial Times",
      url: "https://www.ft.com/markets",
      title: "Astera Labs falls 14% after rival claims rack-scale design win",
      when: "3 days ago",
      readingTime: "3 min",
      convictions: ["packaging"],
      why: "Price context for the unowned name flagged in your opportunities.",
    },
    {
      source: "Bloomberg",
      url: "https://www.bloomberg.com/markets",
      title: "Constellation signs 1.4GW power purchase agreement with Ohio data-centre campus",
      when: "4 days ago",
      readingTime: "5 min",
      convictions: ["power"],
      why: "The contract behind today's move in two of your positions.",
    },
  ],

  emergingTech: [
    {
      domain: "AI research",
      when: "14 Nov",
      source: "arXiv / lab blog",
      title: "Open-weights model matches a frontier reasoning benchmark at roughly one-eighth the inference cost",
      why: "Compresses the premium on closed-model API pricing and pressures the margin of anything priced per token.",
      convictions: ["diffusion"],
    },
    {
      domain: "Chips",
      when: "13 Nov",
      source: "Vendor qualification notice",
      title: "First HBM4 qualification samples ship to two accelerator vendors",
      why: "Bandwidth per watt is the binding constraint on 2027 training clusters, ahead of logic density.",
      convictions: ["packaging", "diffusion"],
    },
    {
      domain: "Power",
      when: "12 Nov",
      source: "Utility filing",
      title: "Two 300MW grid-scale sodium-ion storage installations commissioned",
      why: "Decouples storage buildout from lithium pricing, which shortens the interconnection story your power thesis leans on.",
      convictions: ["power"],
    },
    {
      domain: "Quantum",
      when: "11 Nov",
      source: "Peer-reviewed",
      title: "Error-corrected logical qubit count doubles to 96 on a superconducting device",
      why: "Still three orders of magnitude from anything cryptographically relevant. The near-term trade is cryogenics and control electronics, not algorithms.",
      convictions: [],
    },
    {
      domain: "Space",
      when: "10 Nov",
      source: "Launch log",
      title: "Heavy-lift reuse cadence reaches 11 flights in 30 days",
      why: "Cost per kilogram to orbit sets the floor for proliferated constellations and, downstream, for space-based sensing data.",
      convictions: [],
    },
    {
      domain: "Robotics",
      when: "09 Nov",
      source: "Operator disclosure",
      title: "Humanoid pilots move from single demos to multi-shift warehouse trials",
      why: "The first deployment where labour cost per hour is measured against a wage rather than against a video.",
      convictions: ["diffusion"],
    },
  ],

  universe: [
    { ticker: "NVDA", name: "NVIDIA", sector: "Semiconductors", price: 184.26, dayPct: 1.8, marketCapB: 4480, forwardPE: 31.8, evEbitda: 38.2, revGrowth: 62, year1Pct: 86.4 },
    { ticker: "AMD", name: "Advanced Micro Devices", sector: "Semiconductors", price: 254.1, dayPct: 2.1, marketCapB: 412, forwardPE: 38.2, evEbitda: 44.1, revGrowth: 28, year1Pct: 42.1 },
    { ticker: "AVGO", name: "Broadcom", sector: "Semiconductors", price: 345.6, dayPct: 0.7, marketCapB: 1620, forwardPE: 31.5, evEbitda: 26.4, revGrowth: 22, year1Pct: 58.2 },
    { ticker: "MRVL", name: "Marvell Technology", sector: "Semiconductors", price: 112.4, dayPct: 1.9, marketCapB: 98, forwardPE: 26.8, evEbitda: 31.6, revGrowth: 41, year1Pct: 31.4 },
    { ticker: "ALAB", name: "Astera Labs", sector: "Semiconductors", price: 71.4, dayPct: -3.1, marketCapB: 12.4, forwardPE: 42.6, evEbitda: 48.9, revGrowth: 71, year1Pct: -12.6 },
    { ticker: "TSM", name: "TSMC (ADR)", sector: "Foundry", price: 312.75, dayPct: 2.6, marketCapB: 1180, forwardPE: 21.4, evEbitda: 13.8, revGrowth: 34, year1Pct: 61.8 },
    { ticker: "ASML", name: "ASML Holding", sector: "Semicap", price: 982.5, dayPct: 1.4, marketCapB: 388, forwardPE: 29.1, evEbitda: 24.2, revGrowth: 18, year1Pct: 24.3 },
    { ticker: "MU", name: "Micron Technology", sector: "Memory", price: 268.9, dayPct: 3.2, marketCapB: 301, forwardPE: 12.4, evEbitda: 8.6, revGrowth: 58, year1Pct: 94.2 },
    { ticker: "MSFT", name: "Microsoft", sector: "Software", price: 512.4, dayPct: 0.4, marketCapB: 3810, forwardPE: 29.6, evEbitda: 21.8, revGrowth: 16, year1Pct: 18.6 },
    { ticker: "GOOGL", name: "Alphabet", sector: "Internet", price: 318.65, dayPct: 0.9, marketCapB: 3860, forwardPE: 24.1, evEbitda: 16.4, revGrowth: 18, year1Pct: 41.2 },
    { ticker: "AMZN", name: "Amazon", sector: "Internet", price: 241.8, dayPct: -0.3, marketCapB: 2580, forwardPE: 31.2, evEbitda: 17.9, revGrowth: 12, year1Pct: 14.8 },
    { ticker: "ORCL", name: "Oracle", sector: "Software", price: 298.7, dayPct: 1.6, marketCapB: 842, forwardPE: 32.6, evEbitda: 22.4, revGrowth: 19, year1Pct: 36.4 },
    { ticker: "SNOW", name: "Snowflake", sector: "Software", price: 198.3, dayPct: -2.1, marketCapB: 67, forwardPE: 118.0, evEbitda: 92.4, revGrowth: 24, year1Pct: -18.4 },
    { ticker: "CRWD", name: "CrowdStrike", sector: "Software", price: 452.1, dayPct: -1.2, marketCapB: 112, forwardPE: 86.4, evEbitda: 68.2, revGrowth: 21, year1Pct: 12.1 },
    { ticker: "PLTR", name: "Palantir", sector: "Software", price: 214.55, dayPct: 4.1, marketCapB: 508, forwardPE: 198.0, evEbitda: 174.0, revGrowth: 42, year1Pct: 128.6 },
    { ticker: "ANET", name: "Arista Networks", sector: "Networking", price: 168.4, dayPct: 1.1, marketCapB: 212, forwardPE: 44.2, evEbitda: 36.8, revGrowth: 25, year1Pct: 22.4 },
    { ticker: "VRT", name: "Vertiv Holdings", sector: "Electrical equipment", price: 176.9, dayPct: 3.4, marketCapB: 67, forwardPE: 32.8, evEbitda: 25.6, revGrowth: 29, year1Pct: 71.2 },
    { ticker: "CEG", name: "Constellation Energy", sector: "Utilities", price: 368.2, dayPct: 2.2, marketCapB: 116, forwardPE: 31.4, evEbitda: 18.2, revGrowth: 14, year1Pct: 48.6 },
    { ticker: "VOO", name: "Vanguard S&P 500 ETF", sector: "Index fund", price: 598.12, dayPct: 0.5, marketCapB: null, forwardPE: null, evEbitda: null, revGrowth: null, year1Pct: 14.2 },
  ],

  // How each name earns, written by hand. A sector code is not an answer, and
  // this is the first thing you want to know about a company you do not follow.
  // Qualitative on purpose: shares of revenue move every quarter, and an
  // invented percentage next to a real company reads as a fact. For tickers
  // outside this list the same two fields come out of the 10-K on a click.
  businesses: {
    NVDA: {
      does: "Data-centre accelerators and the racks around them",
      model: "Sells GPUs — increasingly whole server racks rather than loose chips — to cloud providers and large enterprises, and gives away the CUDA software that makes them painful to swap out. Data centre is the great majority of revenue and a short list of customers is most of that; gaming, professional visualisation and automotive are what is left.",
    },
    AVGO: {
      does: "Custom AI silicon, networking, infrastructure software",
      model: "Two halves. Semiconductors designed into other companies’ hardware — custom accelerators for hyperscalers, switching and connectivity, wireless parts sold largely to one phone maker — and infrastructure software bought rather than built, VMware and mainframe, renewed on long licences at very high margin.",
    },
    AMD: {
      does: "Server and PC processors, plus GPUs",
      model: "Sells x86 CPUs for data centres and PCs, GPUs for accelerators and gaming, and semi-custom chips for games consoles. Server CPUs and accelerators carry the margin; it designs and TSMC manufactures, so capacity is bought, not owned.",
    },
    MRVL: {
      does: "Custom data-centre silicon and interconnect",
      model: "Designs chips to order for a few very large customers — custom accelerators, optical and electrical interconnect, storage controllers — and earns on multi-year programmes rather than catalogue parts. Data centre dominates; carrier, enterprise networking and automotive are the remainder.",
    },
    ALAB: {
      does: "Connectivity chips inside AI racks",
      model: "Sells the signal-conditioning and fabric silicon that keeps PCIe, CXL and Ethernet links alive across an AI rack, plus the software to diagnose them. Revenue follows rack build rates at a handful of hyperscalers and the contract manufacturers assembling for them.",
    },
    TSM: {
      does: "Contract manufacturing of other firms’ designs",
      model: "Manufactures chips its customers design and charges per wafer, with the newest process nodes priced highest and booked furthest ahead. Earnings turn on how full the leading-edge fabs are and on advanced packaging, which is now its own bottleneck.",
    },
    ASML: {
      does: "Lithography machines, and service on the installed base",
      model: "Sells the machines that print circuit patterns onto wafers — the only source of EUV — against multi-year order books, then earns a compounding annuity servicing and upgrading machines already in fabs. Shipments are lumpy; the service line is not.",
    },
    MU: {
      does: "DRAM and NAND memory",
      model: "Makes commodity memory and sells it at whatever contract and spot markets will bear, so earnings swing with the gap between industry supply and demand more than with its own execution. High-bandwidth memory for accelerators is the part sold out ahead and priced under contract.",
    },
    MSFT: {
      does: "Cloud, Office subscriptions, Windows",
      model: "Mostly subscriptions: Azure billed by consumption, and Office, Dynamics and Windows billed per seat per year. Azure and the Office stack are both the growth and the margin; devices and gaming are small beside them.",
    },
    GOOGL: {
      does: "Search advertising, plus cloud and YouTube",
      model: "Sells advertising against search intent and YouTube attention, which is the large majority of revenue and very nearly all of the profit. Cloud, subscriptions and devices are the rest; the moonshots consume cash rather than produce it.",
    },
    AMZN: {
      does: "Online retail, AWS, advertising",
      model: "Retail moves enormous revenue at thin margins and pays for the logistics network, while AWS and advertising — both high margin — produce most of the operating profit. Third-party sellers buying fulfilment and placement sit between the two.",
    },
    ORCL: {
      does: "Database licences and cloud infrastructure",
      model: "Sells database and application licences whose support renewals have compounded for decades, and is now spending heavily to rent out GPU capacity as cloud infrastructure. The old licence base funds the build-out; the new revenue is contracted before the capacity exists.",
    },
    SNOW: {
      does: "Consumption-priced cloud data warehouse",
      model: "Charges for compute and storage by the second rather than per seat, so revenue tracks how much customers actually query — which cuts both ways. It runs on the three big clouds and pays them for the underlying capacity, which sets the floor under its margins.",
    },
    CRWD: {
      does: "Endpoint-security subscriptions",
      model: "Sells annual subscriptions to an agent installed on laptops and servers, then sells further modules onto that same agent, which is where the economics live: the hard part is already deployed. Revenue is recurring and visible; the risk is doing no harm during an update.",
    },
    PLTR: {
      does: "Data platforms for governments and enterprises",
      model: "Sells software that joins an organisation’s scattered data into one model, under long government programmes and enterprise contracts that often begin as short paid pilots. Government work is the steadier half; the commercial half expands faster and far less evenly.",
    },
    ANET: {
      does: "Data-centre switches and network software",
      model: "Sells high-speed Ethernet switches running one operating system across the whole range, mostly to cloud providers and large enterprises building data-centre fabrics. Customer concentration is high and orders arrive in build cycles; software support renewals smooth the gaps.",
    },
    VRT: {
      does: "Data-centre power and cooling, plus service",
      model: "Sells the power distribution, UPS and cooling a data centre needs before a single server runs, then services that installed base for years. Orders lead revenue by quarters, so backlog is the number that matters, and liquid cooling is the line growing fastest.",
    },
    CEG: {
      does: "Nuclear generation, sold forward",
      model: "Runs the largest nuclear fleet in the US and sells its output wholesale and under long power purchase agreements, increasingly straight to data-centre operators who want clean round-the-clock supply. The plants are already built, so it comes down to capacity factor and the price the next contract clears.",
    },
    VOO: {
      does: "Index fund, not a company",
      model: "Holds the S&P 500 in proportion and charges a few basis points to do it. There is no business to analyse: the return is the index’s return less the fee, and none of the ratios on this page apply.",
    },
  },

  // Only NVDA carries a full research page in the sample data. Every other
  // ticker falls back to the universe row plus a note saying so.
  securities: {
    NVDA: {
      ticker: "NVDA",
      name: "NVIDIA Corporation",
      sector: "Semiconductors · Accelerated computing",
      price: 184.26,
      dayPct: 1.8,
      dayAbs: 3.26,
      low52: 98.4,
      high52: 196.2,
      nextCall: "19 Nov 2026",
      held: { value: 78420, weight: 18.6, totalPct: 142.4 },
      stats: [
        { label: "Market cap", value: "$4.48T" },
        { label: "Enterprise value", value: "$4.44T" },
        { label: "P/E, trailing", value: "52.4×" },
        { label: "P/E, FY28e", value: "31.8×" },
        { label: "EV / EBITDA", value: "38.2×" },
        { label: "Net debt / EBITDA", value: "−0.9×", note: "$29.6B net cash" },
        { label: "Gross margin", value: "73.4%" },
        { label: "FCF margin", value: "48.1%" },
      ],
      industryRatios: [
        { label: "Data-centre revenue, QoQ", value: "+11%", why: "The only line that matters; everything else is rounding on the model." },
        { label: "Inventory + purchase commitments / next-Q revenue", value: "0.71×", why: "Semis analysts watch this for a demand turn two quarters before it shows in revenue." },
        { label: "Top-four customer concentration", value: "46%", why: "Four buyers with their own silicon programmes. This is the custom-silicon risk, quantified." },
        { label: "Implied useful life of installed base", value: "4–6 yrs", why: "The single biggest swing factor in every bull and bear model on the Street." },
      ],
      comps: [
        { ticker: "NVDA", marketCap: "$4.48T", evEbitda: "38.2×", forwardPE: "31.8×", revGrowth: "+62%", grossMargin: "73.4%", self: true },
        { ticker: "AVGO", marketCap: "$1.62T", evEbitda: "26.4×", forwardPE: "31.5×", revGrowth: "+22%", grossMargin: "68.1%" },
        { ticker: "AMD", marketCap: "$412B", evEbitda: "44.1×", forwardPE: "38.2×", revGrowth: "+28%", grossMargin: "54.6%" },
        { ticker: "MRVL", marketCap: "$98B", evEbitda: "31.6×", forwardPE: "26.8×", revGrowth: "+41%", grossMargin: "62.3%" },
        { ticker: "ALAB", marketCap: "$12.4B", evEbitda: "48.9×", forwardPE: "42.6×", revGrowth: "+71%", grossMargin: "76.2%" },
        { ticker: "Median", marketCap: "—", evEbitda: "38.2×", forwardPE: "31.8×", revGrowth: "+41%", grossMargin: "68.1%", median: true },
      ],
      targets: [
        { firm: "Melius Research", target: 250, rating: "Buy", when: "10 Nov 2026", note: "Models a six-year useful life on the installed base." },
        { firm: "Morgan Stanley", target: 235, rating: "Overweight", when: "12 Nov 2026", note: "Raised on the packaging allocation; power is the named risk." },
        { firm: "Goldman Sachs", target: 215, rating: "Buy", when: "07 Nov 2026", note: "Trims out-year units for custom silicon, holds margin." },
        { firm: "Bernstein", target: 200, rating: "Outperform", when: "06 Nov 2026", note: "Argues backlog is option value, not orders." },
        { firm: "UBS", target: 185, rating: "Neutral", when: "30 Oct 2026", note: "Concentration and depreciation schedules." },
      ],
      filings: [
        {
          kind: "10-K",
          label: "Annual report, FY2026",
          when: "Filed 26 Feb 2026",
          takeaways: [
            "Useful-life assumption on data-centre equipment moved from 5 to 6 years, which lifted reported gross margin by about 80bps without a single extra sale.",
            "Purchase commitments rose 41% year on year to $38.2B — capacity booked ahead of orders.",
            "Customer concentration disclosed at four buyers above 10% of revenue, up from two.",
          ],
        },
        {
          kind: "10-Q",
          label: "Quarterly report, Q2 FY2027",
          when: "Filed 27 Aug 2026",
          takeaways: [
            "Data-centre revenue +11% sequentially; the deceleration is supply-side, and management says so in the MD&A.",
            "Inventory up 18% against a 9% revenue step — the first quarter in six where those diverge.",
            "New line item for prepayments to packaging subcontractors. Read alongside the packaging thesis.",
          ],
        },
        {
          kind: "Call",
          label: "Q2 FY2027 earnings call",
          when: "26 Aug 2026",
          takeaways: [
            "Four analyst questions on power availability, none on demand. The debate has moved.",
            "Management declined to quantify custom-silicon displacement for the third call running.",
            "First time the CFO framed packaging capacity, not wafer starts, as the constraint on shipments.",
          ],
        },
      ],
      debates: [
        {
          question: "How long does a deployed accelerator actually earn?",
          state: "Bulls carry five to six years, bears carry three. Nothing between those two numbers is a small difference.",
          why: "It sets reported margin on the installed base and every hyperscaler's depreciation schedule. A one-year change moves the Street's FY28 EPS by roughly 14%.",
          watch: "Depreciation-life language in the next round of hyperscaler 10-Ks.",
        },
        {
          question: "Does custom silicon take units, or only low-end inference?",
          state: "Consensus concedes inference at the edges and defends training. Four customers above 10% of revenue all have their own programmes.",
          why: "Unit share, not price, is what breaks the model. Margin holds right up until volume leaves.",
          watch: "Whether the next internal accelerator generation ships on time and on memory bandwidth.",
        },
        {
          question: "Is the backlog demand, or is it an option?",
          state: "Non-cancellable orders versus reservations that cost nothing to walk away from. The filings do not fully separate them.",
          why: "The bear case is not a demand cliff, it is discovering the backlog was always a queue position.",
          watch: "Any change in how purchase obligations are described in the next 10-Q.",
        },
        {
          question: "Does power availability cap shipments before demand does?",
          state: "Four questions on last call, no guidance. This is the newest of the four debates and the least priced.",
          why: "If true, revenue is set by megawatts at the meter rather than by units off the line — and your own power conviction is long that outcome.",
          watch: "Interconnection queue data in the three largest data-centre markets.",
        },
      ],
      cannedChat: [
        {
          question: "Which of these four debates is least priced in right now?",
          answer:
            "Power. The depreciation and custom-silicon debates both show up in published models — you can see them in the spread between the $185 and $250 targets. The power question appeared on the last call and in none of the five target notes. That is also the debate your own portfolio is already positioned for, through VRT and CEG, so being right there pays you twice.",
        },
        {
          question: "What would change the useful-life debate fastest?",
          answer:
            "A hyperscaler changing the disclosed depreciation life in a 10-K. It is a one-line change that re-rates the whole installed base, it has happened once already in this cycle, and it arrives on a filing date you can diary rather than on a surprise.",
        },
      ],
    },
  },
};

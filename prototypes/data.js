/* Shared sample dataset for all three interface prototypes.
   Every figure here is invented. Day-dollar moves, theme attribution and
   conviction exposure all reconcile to the same totals so the prototypes
   can be compared on design rather than on content. */
const DATA = {
  asOf: "Mon 16 Nov 2026 · 4:02pm ET",
  total: 420740,
  basis: 285830,
  totPct: 47.2,
  cash: 14600,

  positions: [
    { t:"NVDA",  n:"NVIDIA",                v:78420, d:1.8,  tot:142.4, px:184.26, c:["diffusion"] },
    { t:"MSFT",  n:"Microsoft",             v:61250, d:0.4,  tot:38.1,  px:512.40, c:["diffusion"] },
    { t:"VOO",   n:"Vanguard S&P 500 ETF",  v:58900, d:0.5,  tot:21.3,  px:598.12, c:[] },
    { t:"TSM",   n:"TSMC (ADR)",            v:44980, d:2.6,  tot:91.2,  px:312.75, c:["packaging"] },
    { t:"AMZN",  n:"Amazon",                v:39110, d:-0.3, tot:24.6,  px:241.80, c:["diffusion"] },
    { t:"GOOGL", n:"Alphabet",              v:36540, d:0.9,  tot:52.4,  px:318.65, c:["diffusion","silicon"] },
    { t:"SNOW",  n:"Snowflake",             v:22870, d:-2.1, tot:-8.4,  px:198.30, c:["diffusion"] },
    { t:"VRT",   n:"Vertiv",                v:19340, d:3.4,  tot:67.1,  px:176.90, c:["power"] },
    { t:"CRWD",  n:"CrowdStrike",           v:17620, d:-1.2, tot:19.3,  px:452.10, c:[] },
    { t:"PLTR",  n:"Palantir",              v:14230, d:4.1,  tot:208.5, px:214.55, c:["diffusion"] },
    { t:"CEG",   n:"Constellation Energy",  v:12880, d:2.2,  tot:44.8,  px:368.20, c:["power"] }
  ],

  perf: {
    port: [100,104.2,109.8,106.4,112.1,118.6,115.2,121.9,126.4,122.8,130.5,134.1,
           128.6,133.9,139.2,131.4,127.8,134.6,141.2,137.5,144.8,139.1,133.6,140.2,
           136.4,129.8,135.1,142.6,148.3,141.7,136.9,143.2,149.6,144.1,147.2],
    sp:   [100,102.1,104.6,103.2,105.8,107.9,106.4,109.1,111.3,109.8,112.6,114.2,
           111.4,113.8,116.1,112.9,110.6,113.4,116.8,114.2,117.9,115.1,112.4,115.8,
           113.2,109.6,112.8,116.4,119.8,116.2,113.8,117.1,120.4,118.1,119.4],
    tech: [100,103.4,107.9,104.8,109.2,113.6,110.1,115.4,119.2,115.6,121.4,124.8,
           120.1,124.6,128.9,122.4,118.9,124.1,129.8,125.4,131.6,126.8,121.9,127.4,
           123.1,117.4,122.6,129.1,134.2,128.4,124.1,130.2,136.1,130.8,131.8]
  },

  themes: [
    { h:"Power, not compute, carried the book.",
      b:"VRT +3.4% and CEG +2.2% after Constellation’s 1.4GW Ohio campus PPA cleared review. Your power sleeve is 7.7% of the book and produced 23% of the day.",
      dollars: 913, names:["VRT","CEG"] },
    { h:"Taiwan packaging relief.",
      b:"TSM +2.6% and NVDA +1.8% on a grid allocation for two CoWoS-L fabs. Same headline, two positions, 29% of the book.",
      dollars: 2527, names:["TSM","NVDA"] },
    { h:"Seat-priced software kept bleeding.",
      b:"SNOW −2.1% and CRWD −1.2% as enterprise buyers renegotiate seat counts. This is the one theme your own convictions disagree about.",
      dollars: -705, names:["SNOW","CRWD"] }
  ],
  themeRest: 1305,
  themeNote: "Two of these three are the same bet: packaging relief and the power buildout both pay off only if 2027 cluster buildouts stay on schedule.",

  convictions: [
    { id:"diffusion", short:"Enterprise AI diffusion",
      title:"Enterprise AI diffusion is a decade of spend, not a cycle",
      score:9, added:"12 Mar 2026", horizon:"5–10 years",
      body:"The spend moves from experiments to line-item budgets once agents touch revenue-generating work. The layer that keeps the margin is whoever owns the scarce input, and for the next three years that is compute and the power to run it, not the application layer.",
      falsify:"Two consecutive quarters where hyperscaler capex guidance falls while their revenue growth holds. Spend without payback is the bear case; payback without spend kills the thesis.",
      val:252420, pct:60.0, names:["NVDA","MSFT","AMZN","GOOGL","SNOW","PLTR"],
      corr:0.69, corrHi:"MSFT – GOOGL at 0.82",
      ideas:[
        { k:"Risk reversal", t:"NVDA", d:"Sell Mar-27 $150 puts, buy Mar-27 $200 calls. Keeps the upside without adding cash to an 18.6% position. The pain case is assignment at $150 in exactly the scenario that breaks the thesis." },
        { k:"Covered call",  t:"PLTR", d:"Feb-27 $260 against the 3.4% position, now +208%. Collects roughly 2.1% on a holding where the multiple, not the thesis, is doing the work." }
      ] },
    { id:"power", short:"Power is the ceiling",
      title:"Power and cooling, not silicon, set the ceiling on 2027 compute",
      score:8, added:"04 Jun 2026", horizon:"3–5 years",
      body:"Fab capacity is being added faster than interconnection queues clear. The binding constraint on delivered compute in 2027 is megawatts at the meter, which prices the people who sell generation, switchgear and liquid cooling.",
      falsify:"Interconnection queue times in the three largest data-center markets shortening two years in a row, or a behind-the-meter rule change that makes on-site generation routine.",
      val:32220, pct:7.7, names:["VRT","CEG"],
      corr:0.58, corrHi:"VRT – CEG at 0.58",
      ideas:[
        { k:"LEAPS instead of shares", t:"CEG", d:"Jan-28 $400 calls rather than adding shares. The term matches the buildout and the capital at risk is about a quarter of the share equivalent." },
        { k:"Unowned expression", t:"ALAB", d:"A Jan-27 $80/$100 call spread sizes an entry at 0.4% of the book while the name is down 14% on a competitor claim." }
      ] },
    { id:"packaging", short:"Packaging chokepoint",
      title:"Advanced packaging is the real chokepoint, not wafer starts",
      score:7, added:"21 Jul 2026", horizon:"2–4 years",
      body:"Leading-edge wafer capacity is contracted years out, but the step that actually gates accelerator shipments is CoWoS-class packaging and the substrate supply behind it. That step has fewer suppliers and a longer tool lead time than the fab itself.",
      falsify:"Packaging capacity additions outrunning accelerator unit growth for three quarters, visible as falling lead times rather than as price cuts.",
      val:44980, pct:10.7, names:["TSM"],
      corr:null, corrHi:"Single position — no correlation to measure",
      ideas:[
        { k:"Add the second leg", t:"ALAB", d:"The thesis has one position behind it. Connectivity attach rate rises with every rack-scale deployment, and the name is 14% cheaper than it was Tuesday." }
      ] },
    { id:"silicon", short:"Custom silicon takes share",
      title:"Custom accelerators take real unit share from merchant GPUs by 2028",
      score:6, added:"09 Sep 2026", horizon:"3–5 years",
      body:"Inference at scale is a cost-per-token problem, and whoever owns both the workload and the design captures the margin the merchant vendor used to. This matters in units, not just at the low end.",
      falsify:"Two more generations where internal silicon lands late or underperforms on the memory bandwidth that actually matters.",
      val:36540, pct:8.7, names:["GOOGL"],
      corr:null, corrHi:"Single position — no correlation to measure",
      tension:"Pulls against your largest holding. NVDA is 18.6% of the book.",
      ideas:[
        { k:"Size the contradiction", t:"NVDA", d:"If this conviction is right, the 18.6% position is the thing it is right about. Either trim to 12% or mark this conviction down from 6." }
      ] },
    { id:"seats", short:"Seat pricing breaks",
      title:"Per-seat software pricing breaks when agents do the work",
      score:7, added:"28 Oct 2026", horizon:"2–4 years",
      body:"Pricing a license per human is pricing the wrong unit once the work is done by something that is not a human. Vendors who re-price to consumption keep the revenue; vendors who defend seats lose it on renewal.",
      falsify:"A full renewal cycle at the big seat-based vendors with net revenue retention holding above 115%.",
      val:0, pct:0, names:[],
      corr:null, corrHi:"No positions behind this conviction",
      tension:"SNOW and CRWD are 9.6% of the book and sit on the wrong side of it.",
      ideas:[
        { k:"The obvious trade", t:"SNOW", d:"You hold the position this conviction argues against. Resolve it: either this conviction is a 4, or the position is a trim." }
      ] }
  ],

  unassigned: { val:91120, pct:21.7, names:["VOO","CRWD","Cash"] },

  corrMatrix: {
    names:["NVDA","MSFT","AMZN","GOOGL","PLTR"],
    m:[[1,.71,.66,.69,.74],[.71,1,.78,.82,.58],[.66,.78,1,.76,.54],[.69,.82,.76,1,.61],[.74,.58,.54,.61,1]]
  },

  followups: [
    "Over what period does this have to be true for you to be right — 12 months, three years, or a decade? Name the date you would check.",
    "Who pays, and out of which budget? New spend, or cannibalised seats and headcount?",
    "Which layer keeps the margin: the labs, the hyperscalers, the application layer, or the silicon?",
    "If you are right, what shows up in the next two earnings cycles? Name a number you would expect to see.",
    "What single piece of evidence would make you sell? Make it specific enough that you would actually notice it."
  ],

  ideas: [
    { kind:"Buy",  t:"ALAB", n:"Astera Labs", px:71.40, move:-14.2, win:"5 sessions", conv:"packaging", owned:false,
      why:"Down 14% since Tuesday on a rival’s design-win claim, not on guidance. Connectivity attach rate rises with every rack-scale deployment, which is the thing your packaging conviction is actually about." },
    { kind:"Add",  t:"CEG",  n:"Constellation Energy", px:368.20, move:2.2, win:"today", conv:"power", owned:true,
      why:"You rate this conviction 8 out of 10 and hold 7.7% against it — the smallest sleeve of your three funded convictions." },
    { kind:"Trim", t:"SNOW", n:"Snowflake", px:198.30, move:-2.1, win:"today", conv:"seats", owned:true,
      why:"Two of your convictions disagree about this position. It sits inside AI diffusion and is the clearest loser if seat pricing breaks." },
    { kind:"Decide", t:"NVDA", n:"NVIDIA", px:184.26, move:1.8, win:"today", conv:"silicon", owned:true,
      why:"18.6% of the book in one name, three days before the 19 Nov call. Concentration is a decision — make it on purpose." }
  ],

  news: [
    { src:"Reuters", url:"https://www.reuters.com/markets/", t:"Taiwan grid operator approves 1.2GW allocation for two advanced-packaging fabs",
      when:"2 hours ago", read:"4 min", conv:["packaging","power"],
      why:"The allocation is the gating item for the CoWoS-L capacity your packaging thesis assumes arrives in 2027." },
    { src:"The Information", url:"https://www.theinformation.com", t:"Inside the capex re-forecast: three of four hyperscalers raised 2027 power budgets before chip budgets",
      when:"5 hours ago", read:"9 min", conv:["power"],
      why:"First reporting that puts an order on the two budget lines. Your power conviction is the claim that this ordering holds." },
    { src:"The Wall Street Journal", url:"https://www.wsj.com/news/markets", t:"Enterprise software buyers renegotiate seat counts as agents absorb workflows",
      when:"Yesterday", read:"6 min", conv:["seats","diffusion"],
      why:"Reads directly against two positions you hold, SNOW and CRWD, and in favour of a conviction with no positions behind it." },
    { src:"SemiAnalysis", url:"https://semianalysis.com", t:"CoWoS-L capacity through 2028: the bottleneck moved downstream",
      when:"2 days ago", read:"22 min", conv:["packaging"], deep:true,
      why:"The substrate section is the part that matters. It argues the chokepoint is no longer the step your thesis names." },
    { src:"Financial Times", url:"https://www.ft.com/markets", t:"Astera Labs falls 14% after rival claims rack-scale design win",
      when:"3 days ago", read:"3 min", conv:["packaging"],
      why:"Price context for the unowned name flagged in your opportunities." },
    { src:"Bloomberg", url:"https://www.bloomberg.com/markets", t:"Constellation signs 1.4GW power purchase agreement with Ohio data-centre campus",
      when:"4 days ago", read:"5 min", conv:["power"],
      why:"The contract behind today’s move in two of your positions." }
  ],

  tech: [
    { dom:"AI research", when:"14 Nov", src:"arXiv / lab blog",
      t:"Open-weights model matches a frontier reasoning benchmark at roughly one-eighth the inference cost",
      why:"Compresses the premium on closed-model API pricing and pressures the margin of anything priced per token.", hits:["diffusion"] },
    { dom:"Chips", when:"13 Nov", src:"Vendor qualification notice",
      t:"First HBM4 qualification samples ship to two accelerator vendors",
      why:"Bandwidth per watt is the binding constraint on 2027 training clusters, ahead of logic density.", hits:["packaging","diffusion"] },
    { dom:"Power", when:"12 Nov", src:"Utility filing",
      t:"Two 300MW grid-scale sodium-ion storage installations commissioned",
      why:"Decouples storage buildout from lithium pricing, which shortens the interconnection story your power thesis leans on.", hits:["power"] },
    { dom:"Quantum", when:"11 Nov", src:"Peer-reviewed",
      t:"Error-corrected logical qubit count doubles to 96 on a superconducting device",
      why:"Still three orders of magnitude from anything cryptographically relevant. The near-term trade is cryogenics and control electronics, not algorithms.", hits:[] },
    { dom:"Space", when:"10 Nov", src:"Launch log",
      t:"Heavy-lift reuse cadence reaches 11 flights in 30 days",
      why:"Cost per kilogram to orbit sets the floor for proliferated constellations and, downstream, for space-based sensing data.", hits:[] },
    { dom:"Robotics", when:"09 Nov", src:"Operator disclosure",
      t:"Humanoid pilots move from single demos to multi-shift warehouse trials",
      why:"The first deployment where labour cost per hour is measured against a wage rather than against a video.", hits:["diffusion"] }
  ],

  universe: [
    { t:"NVDA",  n:"NVIDIA",               sec:"Semiconductors",       px:184.26, d:1.8,  mcap:4480, fpe:31.8,  ev:38.2, g:62 },
    { t:"AMD",   n:"Advanced Micro Devices",sec:"Semiconductors",      px:254.10, d:2.1,  mcap:412,  fpe:38.2,  ev:44.1, g:28 },
    { t:"AVGO",  n:"Broadcom",             sec:"Semiconductors",       px:345.60, d:0.7,  mcap:1620, fpe:31.5,  ev:26.4, g:22 },
    { t:"MRVL",  n:"Marvell Technology",   sec:"Semiconductors",       px:112.40, d:1.9,  mcap:98,   fpe:26.8,  ev:31.6, g:41 },
    { t:"ALAB",  n:"Astera Labs",          sec:"Semiconductors",       px:71.40,  d:-3.1, mcap:12.4, fpe:42.6,  ev:48.9, g:71 },
    { t:"TSM",   n:"TSMC (ADR)",           sec:"Foundry",              px:312.75, d:2.6,  mcap:1180, fpe:21.4,  ev:13.8, g:34 },
    { t:"ASML",  n:"ASML Holding",         sec:"Semicap",              px:982.50, d:1.4,  mcap:388,  fpe:29.1,  ev:24.2, g:18 },
    { t:"MU",    n:"Micron Technology",    sec:"Memory",               px:268.90, d:3.2,  mcap:301,  fpe:12.4,  ev:8.6,  g:58 },
    { t:"MSFT",  n:"Microsoft",            sec:"Software",             px:512.40, d:0.4,  mcap:3810, fpe:29.6,  ev:21.8, g:16 },
    { t:"GOOGL", n:"Alphabet",             sec:"Internet",             px:318.65, d:0.9,  mcap:3860, fpe:24.1,  ev:16.4, g:18 },
    { t:"AMZN",  n:"Amazon",               sec:"Internet",             px:241.80, d:-0.3, mcap:2580, fpe:31.2,  ev:17.9, g:12 },
    { t:"ORCL",  n:"Oracle",               sec:"Software",             px:298.70, d:1.6,  mcap:842,  fpe:32.6,  ev:22.4, g:19 },
    { t:"SNOW",  n:"Snowflake",            sec:"Software",             px:198.30, d:-2.1, mcap:67,   fpe:118.0, ev:92.4, g:24 },
    { t:"CRWD",  n:"CrowdStrike",          sec:"Software",             px:452.10, d:-1.2, mcap:112,  fpe:86.4,  ev:68.2, g:21 },
    { t:"PLTR",  n:"Palantir",             sec:"Software",             px:214.55, d:4.1,  mcap:508,  fpe:198.0, ev:174.0,g:42 },
    { t:"ANET",  n:"Arista Networks",      sec:"Networking",           px:168.40, d:1.1,  mcap:212,  fpe:44.2,  ev:36.8, g:25 },
    { t:"VRT",   n:"Vertiv Holdings",      sec:"Electrical equipment", px:176.90, d:3.4,  mcap:67,   fpe:32.8,  ev:25.6, g:29 },
    { t:"CEG",   n:"Constellation Energy", sec:"Utilities",            px:368.20, d:2.2,  mcap:116,  fpe:31.4,  ev:18.2, g:14 },
    { t:"VOO",   n:"Vanguard S&P 500 ETF", sec:"Index fund",           px:598.12, d:0.5,  mcap:null, fpe:null,  ev:null, g:null }
  ],

  security: {
    t:"NVDA", n:"NVIDIA Corporation", sec:"Semiconductors · Accelerated computing",
    px:184.26, d:1.8, dAbs:3.26, lo52:98.40, hi52:196.20, nextCall:"19 Nov 2026",
    held:{ v:78420, w:18.6, tot:142.4 },
    stats:[
      { k:"Market cap",        v:"$4.48T" },
      { k:"Enterprise value",  v:"$4.44T" },
      { k:"P/E, trailing",     v:"52.4×" },
      { k:"P/E, FY28e",        v:"31.8×" },
      { k:"EV / EBITDA",       v:"38.2×" },
      { k:"Net debt / EBITDA", v:"−0.9×", note:"$29.6B net cash" },
      { k:"Gross margin",      v:"73.4%" },
      { k:"FCF margin",        v:"48.1%" }
    ],
    industry:[
      { k:"Data-centre revenue, QoQ",            v:"+11%",  why:"The only line that matters; everything else is rounding on the model." },
      { k:"Inventory + purchase commitments / next-Q revenue", v:"0.71×", why:"Semis analysts watch this for a demand turn two quarters before it shows in revenue." },
      { k:"Top-four customer concentration",     v:"46%",   why:"Four buyers with their own silicon programmes. This is the custom-silicon risk, quantified." },
      { k:"Implied useful life of installed base", v:"4–6 yrs", why:"The single biggest swing factor in every bull and bear model on the Street." }
    ],
    comps:[
      { t:"NVDA", mcap:"$4.48T", ev:"38.2×", fpe:"31.8×", g:"+62%", gm:"73.4%", self:true },
      { t:"AVGO", mcap:"$1.62T", ev:"26.4×", fpe:"31.5×", g:"+22%", gm:"68.1%" },
      { t:"AMD",  mcap:"$412B",  ev:"44.1×", fpe:"38.2×", g:"+28%", gm:"54.6%" },
      { t:"MRVL", mcap:"$98B",   ev:"31.6×", fpe:"26.8×", g:"+41%", gm:"62.3%" },
      { t:"ALAB", mcap:"$12.4B", ev:"48.9×", fpe:"42.6×", g:"+71%", gm:"76.2%" },
      { t:"Median", mcap:"—", ev:"38.2×", fpe:"31.8×", g:"+41%", gm:"68.1%", median:true }
    ],
    targets:[
      { firm:"Melius Research", pt:250, rate:"Buy",  when:"10 Nov 2026", note:"Models a six-year useful life on the installed base." },
      { firm:"Morgan Stanley",  pt:235, rate:"Overweight", when:"12 Nov 2026", note:"Raised on the packaging allocation; power is the named risk." },
      { firm:"Goldman Sachs",   pt:215, rate:"Buy",  when:"07 Nov 2026", note:"Trims out-year units for custom silicon, holds margin." },
      { firm:"Bernstein",       pt:200, rate:"Outperform", when:"06 Nov 2026", note:"Argues backlog is option value, not orders." },
      { firm:"UBS",             pt:185, rate:"Neutral", when:"30 Oct 2026", note:"Concentration and depreciation schedules." }
    ],
    filings:[
      { k:"10-K", label:"Annual report, FY2026", when:"Filed 26 Feb 2026",
        take:["Useful-life assumption on data-centre equipment moved from 5 to 6 years, which lifted reported gross margin by about 80bps without a single extra sale.",
              "Purchase commitments rose 41% year on year to $38.2B — capacity booked ahead of orders.",
              "Customer concentration disclosed at four buyers above 10% of revenue, up from two."] },
      { k:"10-Q", label:"Quarterly report, Q2 FY2027", when:"Filed 27 Aug 2026",
        take:["Data-centre revenue +11% sequentially; the deceleration is supply-side, and management says so in the MD&A.",
              "Inventory up 18% against a 9% revenue step — the first quarter in six where those diverge.",
              "New line item for prepayments to packaging subcontractors. Read alongside the packaging thesis."] },
      { k:"Call", label:"Q2 FY2027 earnings call", when:"26 Aug 2026",
        take:["Four analyst questions on power availability, none on demand. The debate has moved.",
              "Management declined to quantify custom-silicon displacement for the third call running.",
              "First time the CFO framed packaging capacity, not wafer starts, as the constraint on shipments."] }
    ],
    debates:[
      { q:"How long does a deployed accelerator actually earn?",
        state:"Bulls carry five to six years, bears carry three. Nothing between those two numbers is a small difference.",
        why:"It sets reported margin on the installed base and every hyperscaler’s depreciation schedule. A one-year change moves the Street’s FY28 EPS by roughly 14%.",
        watch:"Depreciation-life language in the next round of hyperscaler 10-Ks." },
      { q:"Does custom silicon take units, or only low-end inference?",
        state:"Consensus concedes inference at the edges and defends training. Four customers above 10% of revenue all have their own programmes.",
        why:"Unit share, not price, is what breaks the model. Margin holds right up until volume leaves.",
        watch:"Whether the next internal accelerator generation ships on time and on memory bandwidth." },
      { q:"Is the backlog demand, or is it an option?",
        state:"Non-cancellable orders versus reservations that cost nothing to walk away from. The filings do not fully separate them.",
        why:"The bear case is not a demand cliff, it is discovering the backlog was always a queue position.",
        watch:"Any change in how purchase obligations are described in the next 10-Q." },
      { q:"Does power availability cap shipments before demand does?",
        state:"Four questions on last call, no guidance. This is the newest of the four debates and the least priced.",
        why:"If true, revenue is set by megawatts at the meter rather than by units off the line — and your own power conviction is long that outcome.",
        watch:"Interconnection queue data in the three largest data-centre markets." }
    ],
    chat:[
      { q:"Which of these four debates is least priced in right now?",
        a:"Power. The depreciation and custom-silicon debates both show up in published models — you can see them in the spread between the $185 and $250 targets. The power question appeared on the last call and in none of the five target notes. That is also the debate your own portfolio is already positioned for, through VRT and CEG, so being right there pays you twice." },
      { q:"What would change the useful-life debate fastest?",
        a:"A hyperscaler changing the disclosed depreciation life in a 10-K. It is a one-line change that re-rates the whole installed base, it has happened once already in this cycle, and it arrives on a filing date you can diary rather than on a surprise." }
    ]
  }
};

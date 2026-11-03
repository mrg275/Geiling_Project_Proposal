# Debate — project proposal

One static page proposing my project for Design, Build, Ship (MPCS 51238), Autumn 2026.
Due Tuesday, November 3, at 5:30 PM.

- **Live:** _(Vercel URL — add after first deploy)_
- **Repo:** _(GitHub URL — add after `gh repo create`)_

The project itself: an agent that, for a given ticker, finds the specific arguments that
are actually unresolved and still moving the price — not "earnings miss," but claims at
the level of "the useful life assumed for a GPU fleet is shorter than the market was
carrying."

## What's here

Two files. No framework, no build step, no dependencies.

```
index.html   The proposal. Inline CSS, no JavaScript.
README.md    This file.
```

Open `index.html` in a browser to read it. There is nothing to install.

The design tokens are carried over from the Desk / Broadsheet system I built in Week 2 and
refined in Week 3, so the page matches the rest of my work for this course. Two fonts load
from Google Fonts; everything else is inline. If the font request fails the page falls back
to Iowan Old Style / Georgia and still reads correctly.

## Deploying

### 1. Create the repository

From inside this folder:

```bash
git init
git add index.html README.md
git commit -m "Project proposal: Debate"
gh repo create Geiling_Project_Proposal --public --source=. --remote=origin --push
```

`gh` will prompt you to authenticate the first time (`gh auth login`).

### 2. Deploy to Vercel from your own account

```bash
vercel login      # first time only
vercel            # preview deploy; accept the defaults
vercel --prod     # the URL you submit
```

When prompted:

- **Set up and deploy?** yes
- **Which scope?** your personal account
- **Link to existing project?** no
- **Project name?** `geiling-project-proposal`
- **In which directory is your code located?** `./`
- **Build settings** — none. Leave the build command empty and the output directory as
  the root. Vercel serves `index.html` as a static file. There is no framework to detect.

Deploy from your own account, not an anonymous deploy. Anonymous Vercel deploys expire
after an hour, and the submitted URL has to still work when it is graded.

### 3. Updating it

```bash
# edit index.html
git add index.html
git commit -m "Add user quotes"
git push
```

If you linked the GitHub repo to the Vercel project, that push deploys on its own. If you
deployed with the CLI only, run `vercel --prod` again after pushing.

### 4. Submit

Both URLs go in Google Classroom: the Vercel URL and the GitHub URL.

## Costs and caps

Everything for this page is free: Vercel Hobby serves static files at no cost, and the
page makes no API calls.

The **project** this proposes does spend money in one place, and the cap matters more than
the amount. Set these before writing any code that calls a model in a loop:

| Service | Free tier | What to set, and where |
| --- | --- | --- |
| **OpenAI** | None. Prepaid credits. | **Settings → Limits**: a monthly budget and an email alert threshold well below the balance. Then create a **project-scoped API key** for this app with its own budget, so a runaway batch job cannot reach the rest of the credits. This is the only paid dependency. |
| **Vercel** | Hobby. Free, non-commercial. | Leave it on Hobby. Do not add a payment method. If a Pro trial is ever offered, decline it. |
| **Supabase** | 500MB database; the project pauses after a week of inactivity. | No spending controls needed on free. Just know about the pause — a project that sits idle over Thanksgiving needs waking before the fair. |
| **Clerk** | 10,000 monthly active users. | Nothing to set at this scale. |
| **Alpaca** (Basic) | Free. 200 historical requests/minute, equities back to 2016. | Nothing to cap. Sign up for a **paper trading** account — data-only access needs no funding and no card. Pass `adjustment=all` on the bars endpoint, or splits will corrupt every return you compute. |
| **Equibles** | 100 requests/day, no card. | Same approach: cache every transcript on first fetch and read from Postgres after. |
| **SEC EDGAR** | 10 requests/second. Free, no key. | No account and no cap, but a declared `User-Agent` header is required or requests are refused. Use a generic client name and a contact address. Stay under 10/sec. Note that the full-text search endpoint (`efts.sec.gov`) is what powers the public search UI and is **not** in the documented API, so treat it as liable to change. |

Two rules that follow from the table: **no payment method on anything but OpenAI**, and
**every external fetch writes to the cache before anything reads it**. The free tiers here
are small enough that an uncached page is one refresh away from a 429.

## Verify before relying on these

The free-tier numbers above and in the HTML comment in `index.html` were checked on
2026-11-03. EDGAR's 10 req/sec, Alpaca's 200/min and 2016 history, and Equibles' 100/day
all come from those providers' own documentation. The Roic.ai figure comes from a vendor
page and was **not** confirmed. Two things still to check on November 10: whether Alpaca's
daily bars accept `adjustment=all` (its overview page does not say), and whether Equibles'
transcript endpoint includes the analyst Q&A section rather than prepared remarks only —
the Q&A is the part this project actually needs.

One design note that follows from the table: **transcripts are the only real cap**, at 100 a
day. Everything else scales with any public company. So a lookup reads SEC filings always and
a transcript when one is available or already cached, rather than treating the transcript as a
requirement. Cache every transcript on first fetch and the popular names cost nothing after
the first time.

Alpha Vantage was the original choice and was dropped after reading its documentation: the
free key returns only the last 100 trading days, unadjusted. That history is too short for
a long-running debate and unadjusted closes break returns across any split. Recorded here
so the decision does not get quietly re-made later.

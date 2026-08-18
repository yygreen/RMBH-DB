# RMBH Dashboard — Recovered Project Context

Compiled 2026-08-18 by sweeping past Claude sessions, Vercel, Google Drive, and published
artifacts. This is the "everything about this project" file.

## The project in one paragraph

A live growth dashboard at **https://rmbh-dashboard.josephgreen.ai/** for Rabbi Meir Baal Haness
Charities (rmbhcharities.com), part of Rank Friendly's SEO engagement. It tracks the north-star
goal of +5% monthly organic traffic via five goals: (1) **Preserve** 40 priority keywords,
(2) **Enhance** page-2 keywords to page 1, (3) **Broaden** into new topics (mourning, prayer,
history) and philanthropy markets, (4) **Establish** organic share vs 6 competitor charities
(Semrush snapshots; Yad Ezra + Lev LaLev added Jun 2026), (5) **Ensure** AI-answer-engine
mentions via weekly prompt testing (evidence archive in goal5-archive.json). Plus the
"500 Deliverables" program (250 pages/guides/answers, 145 recordings/print/media, 105
technical/audits) and the client proposal page.

## Timeline (from session history)

| When | Session | What happened |
|---|---|---|
| 2026-06-09/10 | "KMezuzah & JRM Hotels: AI Engine Mention Overlap" (bridge) | RMBH AI-mention diagnostic ledger completed (feeds Goal 5) |
| 2026-06-17 | — | First `/api/edits` overlay edit saved (lastEdited stamp) |
| 2026-06-18 → 06-30 | "Fix keyword filtering and charity data discrepancies" (bridge/Remote Control) | Dashboard live at rmbh-dashboard.josephgreen.ai: "organic traffic" rename, 6 charities in Goal 4 (Yad Ezra + Lev LaLev added), badges + spacing fixed, "all 61 gates verified" |
| 2026-06-23 | "Code session migration" (cloud, this repo) | Attempted to migrate work into cloud sessions — repo was empty, nothing recovered |
| 2026-06-30 | "Keyword filtering and charity data discrepancies" (cloud, this repo) | Stalled for the same reason: dashboard code doesn't live in this repo |
| 2026-06-30 → 08-18 | "RMBH Dashboard: deploy, refresh tracking + Vercel persistent setup" (bridge/Remote Control, session_01HiiukG84cFb3qejBW1bqbg) | GSC 90-day column added to Keyword Coverage and deployed; refresh tracking + persistent Vercel setup; Build Docs updated. Last touched 2026-08-18 09:36 — this is the main working session on the office PC |
| ~2026-07 | "Fix dashboard navigation and add deliverable management" | Nav fixes + the expanded Deliverables page (the 30 KB deliverables.html + PDF now live) |
| 2026-07-27 | Artifact "RMBH — The Deliverables List" | The 500-deliverables count sheet (see Artifacts below) |
| 2026-07-29 | Vercel deploy | Last deploy of project `rmbh-dashboard-live` — what the live domain still serves |
| 2026-08-03/04 | Vercel deploys | 4 deploys of project `rmbh-dashboard` (refresh rail); newest data.json stamped 2026-08-04. Nothing since |
| 2026-08-18 | This session ("RMBH dashboard project", cloud) | Recovered full site into this repo |

## Where things live

**Vercel (team `rmbh` / "joseph-3479's projects", team_dR06wgxMphIGn3bAJDS93Sxg):**
- `rmbh-dashboard-live` (prj_awhlj0LcoXybW06Ob0STuYAdWKg2) — **holds the live domain**
  rmbh-dashboard.josephgreen.ai; last deploy Jul 29 2026 (dpl_855QugYkTtW2HXCzUJBxQSzXwKjZ).
- `rmbh-dashboard` (prj_Y9TzFFINDGwnfTWJnB5zv8RvzI3Z) — the refresh rail's target; 4 production
  deploys Aug 1–4 2026, latest dpl_AhjkcjmEwsa1LMbKQb3BNpisqFdE (deployment-protected;
  data.json stamped 2026-08-04). Has a Node serverless function (the `/api/edits` endpoint).
- Related RMBH projects on the same team: `rmbh-sentinel`, `rmbh-www-redirect` (www 301 backstop,
  do not delete), `rmbh` (prj_kpRZeLHMldw4F31TlVgRbhKc4i9N).
- Deploys are made by joseph@rankfriendly.com via CLI token (`VERCEL_RMBH_TOKEN` in
  `.api-keys.env` on the office PC — minting documented in the Chesed 2026-07-19 build doc).

**Office PC (Remote Control / bridge sessions):** the original source folder and the scheduled
refresh scripts (GSC/GA4 pull → regenerate JSONs → `npx vercel --prod` → alias). Exact folder
path wasn't recoverable from here; the "RMBH Dashboard: deploy, refresh tracking + Vercel
persistent setup" bridge session has it.

**GitHub:** yygreen/RMBH-DB — was empty until this recovery; now holds the mirrored site
(`site/`) + these docs.

**Google Drive (login@rankfriendly.com):**
- RMBH Charities — Issues Log (11 issues: donation form 404s, plaintext card+CVV storage,
  $1–$2.10 blocklist, data exfil to outside server, www 404s…):
  https://docs.google.com/document/d/1XCeAkfOBemQAnbWhgmdDO2OwkJ_B8CCiXtPCq_RATNk
- RMBH Charities — Change Log (every site change + PageSpeed baseline):
  https://docs.google.com/document/d/12aPZpuQPZ57C7IUSGhH7CRDWwFTQyxt9LYMDH7Wy7Ck
- rmbh-www-redirect — Build Doc: https://docs.google.com/document/d/1t2tx0OJKv8-Mv9Ow3T1ClP6UWd0mjRLhDafZ9ROLBJI
- The dashboard's own Build Doc lives in the **Build Docs folder under joseph@'s Drive**
  (folder 1mkSDr2TWtWtucNzVo2JBmOnNSW455gJM), which is invisible to the login@ connector used
  here — several other build docs carry "move to Build Docs" notes about that same folder.

**Artifacts (claude.ai):**
- RMBH — The Deliverables List (the 500 count sheet: 100 prayer recordings, 100 under-the-hood
  fixes, 70 page refreshes, 40 straight answers, 30 printable prayer sheets, 30 new mitzvah topic
  pages, 20 yeshuos stories, 20 legacy giving guides, 20 Tehillim guides, 20 Rabbi Meir
  collection, 15 calendar pages, 15 WhatsApp cards, 15 "where your tzedakah goes", 5 audits):
  https://claude.ai/code/artifact/937b276e-64e9-4580-af85-d79f5cdaf3a9

## Site architecture

Static pages + `styles.css`/`proposal.css`; `app.js` renders the dashboard from `data.json`
(+ `goal5-archive.json` AI-citation evidence); per-page JSONs: `cms-keywords.json` (Keyword
Coverage), `articles-data.json` (Content), `insights.json`, `opportunities.json`.
`edits-ui.js` overlays client-visible edits (comments / remove / restore / add row) persisted
via `POST /api/edits` with header `x-rmbh-key` (key stored in localStorage `rmbh_edit_key`);
GET is public. Clean URLs via Vercel (`/proposal`, `/keywords`…). `app.js` shows a red STALE
pill when data.json is >8 days old ("matches prod-monitor FRESH_DAYS" — implies a prod-monitor
rail on the PC too). Data marked "Google Search Console + Google Analytics 4 · auto-refreshed".

## Current state / open issues (verified 2026-08-18)

1. **Live data is stale**: live data.json = 2026-07-29 (~20 days old) → the dashboard is showing
   its red STALE warning to anyone who visits.
2. **Deploy-target divergence**: refresh deploys (Aug 1–4) went to project `rmbh-dashboard`,
   but the domain sits on `rmbh-dashboard-live` — so fresh data never reached the client.
   Same failure family as the documented Chesed alias-detach incidents.
3. **Refresh rail stopped entirely after Aug 4** — even the wrong-target project has nothing
   newer. The PC-side scheduled task likely failed (token/login/alias — check RAIL-ALERTS-style
   logs on the PC).
4. **Code divergence**: the refresh-rail project serves an older, smaller deliverables.html and
   is missing RMBH-The-Next-500.pdf — its source folder on the PC predates the deliverables
   overhaul. If the rail resumes and someone re-points the alias to it, the Deliverables page
   would regress. This repo merges newest code + newest data.
5. **`/api/edits` source unrecovered** (see README). Client-entered overlay edits exist
   (snapshot in docs/) — don't lose them when redeploying.

## GSC / analytics access

The Advanced_GSC connector in this Claude setup can query the rmbhcharities.com Search Console
property (30-day window, 100 rows/call on the free tier) — usable for refreshing Goal 1/2
numbers from cloud sessions if the PC rail stays down.

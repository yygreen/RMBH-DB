# Weekly Refresh Runbook — RMBH Dashboard

Executed weekly by the scheduled Claude Routine "RMBH dashboard weekly refresh"
(created 2026-08-18). Any Claude session can also run it manually. This is the exact
procedure verified live on 2026-08-18.

## Rules that override everything else

1. **Never fabricate or estimate data.** Every number written to `site/data.json` must come
   from a real Search Console API response in this run. If the crawl cannot happen, STOP:
   do not update `lastUpdated`, and end the run reporting the failure clearly.
2. The Advanced GSC connector pins ONE property (free plan). **Always re-pin
   `sc-domain:mastermindbehavior.com` at the end of the run** — success or failure — other
   workflows depend on it.
3. Only touch the fields this runbook names. GA4/donations, goal2/goalEnhance positions,
   goal4 Semrush, goal5 AI scans have their own `lastFetched`/`lastChecked` stamps and are
   refreshed by other processes — leave them and their stamps alone.

## Procedure

1. **Pin the property**: `select_property` → `sc-domain:rmbhcharities.com`.
2. **Crawl**: `get_search_analytics` with `site_url=sc-domain:rmbhcharities.com`,
   `dimensions=date`, `days=30`, `row_limit=31`. (GSC data lags ~1-2 days; the trailing
   zero/partial days are normal — treat the last date with clicks>0 or impressions>0 as the
   last complete day.)
3. **Merge into `site/data.json`** (in repo yygreen/RMBH-DB, branch
   `claude/rmbh-dashboard-project-2sdzj2`):
   - **Current month partial row** in `goal1.history12mo`: sum clicks (= `visitors`) and
     impressions for the current month's days; `position` = impressions-weighted average
     (1 decimal); `ctr` = clicks/impressions × 100 (1 decimal).
   - **Month rollover** (first run of a new month): the previous month's row is now final —
     recompute it from its full days if the window still covers them, then update
     `goal1.current` (= last full month's visitors), `goal1.monthOverMonth` (vs the month
     before, 1 decimal %), `goal1.yearOverYear` (vs same month prior year, from the history
     row's `priorYear` or the year-ago row), and append the new month's partial row
     (`priorYear` from the year-ago row's visitors if present). Keep the array at 13 entries
     (drop the oldest).
   - **`goal1.history13wk`**: Monday-start weeks, `visitors` = Mon–Sun click sum. Update
     complete weeks covered by the window, set the in-progress week to `null`, keep the last
     13. **Methodology guard**: before writing, recompute one or two already-stored weeks
     from the crawl and confirm they match the stored values; if they don't, stop and report
     instead of writing.
   - Do NOT touch `goal1.last30` (it is the engagement BASELINE window, 30 days to Jun 15).
   - Stamp top-level `lastUpdated` with the current UTC time — only if the merge succeeded.
4. **Validate**: `python3 -c "import json; json.load(open('site/data.json'))"` and eyeball the
   changed rows.
5. **Commit and push** to `claude/rmbh-dashboard-project-2sdzj2` with a message noting the
   crawl window.
6. **Deploy production**: `deploy_to_vercel` with `target=production`,
   `name=rmbh-dashboard-live`, `teamId=team_dR06wgxMphIGn3bAJDS93Sxg`,
   `projectSettings={"outputDirectory":"public","framework":null}`, and files = exact
   current contents of repo-root `package.json`, `vercel.json`, `fetch-site.mjs`,
   `api/edits.js`. (The build pulls `site/` from GitHub, so push BEFORE deploying.)
7. **Verify live** at https://rmbh-dashboard.josephgreen.ai : `/data.json` shows today's
   `lastUpdated`; `/`, `/keywords`, `/proposal` return 200; `/api/edits` GET returns the
   overlay JSON.
8. **Re-pin** `sc-domain:mastermindbehavior.com` (rule 2).
9. Report: crawl window, the month row written, weeks updated, deployment id, live checks.

## Known limits

- GSC free tier: 30-day history, 100 rows/call — that's why only goal1 traffic is in scope.
- GA4 (donations) has no connector in cloud sessions yet; the donations line shows the last
  full GA4 month (fixed 2026-08-18 — it previously mislabeled the baseline as "Last 30 days").
- Semrush share-of-voice (goal4) refresh requires API units (semrush.com/mcp-access).

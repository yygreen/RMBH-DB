(async function () {
  const r = await fetch('/data.json', { cache: 'no-store' });
  const d = await r.json();
  // AI-citation proof archive (real answers that named RMBH) — optional; render evidence if present
  let g5archive = null;
  try { g5archive = await (await fetch('/goal5-archive.json', { cache: 'no-store' })).json(); } catch (e) {}

  // ============== HERO META ==============
  const updated = new Date(d.lastUpdated);
  const dateLabel = updated.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const ageDays = (Date.now() - updated.getTime()) / 86400000;
  const pillEl = document.getElementById('last-updated');
  if (pillEl) pillEl.textContent = dateLabel;
  const footEl = document.getElementById('foot-date');
  if (footEl) footEl.textContent = dateLabel;
  // Visual stale warning if data is > 8 days old (matches prod-monitor FRESH_DAYS)
  const livePill = document.getElementById('live-pill');
  if (livePill) {
    if (ageDays > 8) {
      livePill.style.background = 'rgba(220,38,38,0.25)';
      livePill.style.outline = '1px solid #fca5a5';
      livePill.title = `Data is ${Math.round(ageDays)} days old — weekly refresh/deploy may have failed`;
      if (pillEl) pillEl.textContent = dateLabel + ' · STALE';
    } else {
      livePill.title = `Data refreshed ${ageDays < 1 ? 'today' : Math.round(ageDays) + 'd ago'} (source: data.json lastUpdated)`;
    }
  }

  // Engagement period line removed from the report per the 2026-06-18 review (focus on the north-star
  // milestones, not a fixed engagement window). d.engagement is retained only for internal milestone math.

  const fmtNum = (n) => n == null ? '—' : new Intl.NumberFormat('en-US').format(n);
  const pct = (cur, target) => target ? Math.min(100, Math.round((cur / target) * 100)) : 0;

  // ============== EXCLUDE PARTIAL CURRENT MONTH ==============
  // The current month (last entry in history12mo) is incomplete — drop it for trend display.
  const allMonths = d.goal1.history12mo || [];
  const today = new Date();
  const currentYM = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2,'0')}`;
  const fullMonths = allMonths.filter(m => m.month !== currentYM);
  const lastFull = fullMonths[fullMonths.length - 1] || null;
  const lastFullVisitors = lastFull?.visitors;
  const lastFullMonthLabel = lastFull?.month;

  // Average and peak from full months only
  const valid = fullMonths.filter(m => m.visitors != null);
  const avgFull = valid.length ? Math.round(valid.reduce((a, m) => a + m.visitors, 0) / valid.length) : null;
  const peakObj = valid.reduce((max, m) => max == null || m.visitors > max.visitors ? m : max, null);

  // Baseline = the last 30 days back from the June-15 benchmark (Joseph 2026-06-19); +5% compounded targets
  // build off it: month-4 = Oct 15, month-6 = Dec 15.
  const base30 = (d.goal1.last30 && d.goal1.last30.traffic != null) ? d.goal1.last30.traffic : lastFullVisitors;
  const target4mo = base30 != null ? Math.round(base30 * Math.pow(1.05, 4)) : null;
  const target6mo = base30 != null ? Math.round(base30 * Math.pow(1.05, 6)) : null;

  // ============== NORTH STAR HERO ==============
  const fmtMonthLabel = (ym) => {
    if (!ym) return '—';
    const [y, m] = ym.split('-');
    const date = new Date(Date.UTC(parseInt(y), parseInt(m) - 1, 1));
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };
  if (document.getElementById('ns-baseline')) {
    document.getElementById('ns-baseline').textContent = fmtNum(base30);
    document.getElementById('ns-baseline-month').textContent = (d.goal1.last30 ? '30 days to Jun 15' : fmtMonthLabel(lastFullMonthLabel)) + ' · GSC verified';
    document.getElementById('ns-target').textContent = fmtNum(target4mo);
    document.getElementById('ns-target-6').textContent = fmtNum(target6mo);
  }

  // ============== KPI STRIP — the proposal's 5 goals (Preserve/Enhance/Broaden/Establish/Ensure) ==============
  // Traffic (+5% MoM) is the OVERALL north star and lives in the hero, not as a numbered goal card.
  const setStatus = (id, text, ok) => { const e = document.getElementById(id); if (e) { e.textContent = text; e.className = 'status ' + (ok ? 'ok' : 'pending'); } };

  // Goal 1 — PRESERVE (data.goal2): headline = HOLDING PAGE 1 (so the number, the bar, and the pass line
  // all describe the same thing); the top-3 figure is shown alongside as the stretch metric.
  document.getElementById('kpi1-big').textContent = `${d.goal2.currentRetained}`;
  document.getElementById('kpi1-target').textContent = `hold ${d.goal2.passLine}+ on page 1`;
  document.getElementById('kpi1-progress').style.width = Math.min(100, pct(d.goal2.currentRetained, d.goal2.passLine)) + '%';
  setStatus('kpi1-status', `${d.goal2.currentRetained} of ${d.goal2.sampleSize} on page 1 · ${d.goal2.inTop5} in top 5`, d.goal2.currentRetained >= d.goal2.passLine);

  // Goal 2 — ENHANCE (data.goalEnhance): striking-distance keywords now on page 1
  const ge = d.goalEnhance || {};
  document.getElementById('kpi2-big').textContent = ge.sampleSize != null ? `${ge.currentOnPage1}/${ge.sampleSize}` : '—';
  document.getElementById('kpi2-target').textContent = ge.target != null ? `${ge.target}` : '—';
  document.getElementById('kpi2-progress').style.width = (ge.target ? pct(ge.currentOnPage1, ge.target) : 0) + '%';
  if (ge.currentOnPage1 != null) setStatus('kpi2-status', ge.currentOnPage1 >= (ge.passLine || 0) ? 'On track' : `${ge.currentOnPage1} on page 1`, ge.currentOnPage1 >= (ge.passLine || 0));

  // Goal 3 — BROADEN (data.goal3)
  document.getElementById('kpi3-big').textContent = fmtNum(d.goal3.currentNewlyRanked || 0);
  document.getElementById('kpi3-target').textContent = '+' + fmtNum(d.goal3.target);
  document.getElementById('kpi3-progress').style.width = pct(d.goal3.currentNewlyRanked || 0, d.goal3.target) + '%';
  { const won = d.goal3.currentNewlyRanked || 0; setStatus('kpi3-status', won >= d.goal3.passLine ? 'On track' : `${won} of ${d.goal3.target} ranked`, won >= d.goal3.passLine); }

  // Goal 4 — ESTABLISH (data.goal4 share of organic traffic, headline = proposal big charities)
  const sov4 = d.goal4.shareOfVoice;
  document.getElementById('kpi4-big').textContent = sov4 ? `${sov4.rmbhCurrentSoV}%` : '—';
  document.getElementById('kpi4-target').textContent = sov4 ? `${sov4.targetSoV}%` : '—';
  document.getElementById('kpi4-progress').style.width = (sov4 ? pct(sov4.rmbhCurrentSoV, sov4.targetSoV) : 0) + '%';
  if (sov4) setStatus('kpi4-status', `Currently ${['', '1st', '2nd', '3rd', '4th', '5th'][sov4.rmbhRank] || sov4.rmbhRank + 'th'}`, true);

  // Goal 5 — ENSURE (data.goal5)
  document.getElementById('kpi5-big').textContent = `${d.goal5.currentMentions}/${d.goal5.totalQuestions}`;
  document.getElementById('kpi5-target').textContent = `${d.goal5.target}/${d.goal5.totalQuestions}`;
  document.getElementById('kpi5-progress').style.width = pct(d.goal5.currentMentions, d.goal5.target) + '%';
  { const m = d.goal5.currentMentions; setStatus('kpi5-status', (d.goal5.target != null && m >= d.goal5.target) ? 'At target' : (m >= d.goal5.passLine ? 'On track' : 'Baseline'), m >= d.goal5.passLine); }

  // ============== GOAL 1 PANEL ==============
  document.getElementById('g1-current').textContent = fmtNum(lastFullVisitors);
  const sgn = v => (v == null ? '' : (v >= 0 ? '+' : '') + v + '%');
  const momYoy = [];
  if (d.goal1.monthOverMonth != null) momYoy.push(`${sgn(d.goal1.monthOverMonth)} MoM`);
  if (d.goal1.yearOverYear != null) momYoy.push(`${sgn(d.goal1.yearOverYear)} YoY`);
  document.getElementById('g1-current-note').textContent = `${fmtMonthLabel(lastFullMonthLabel)} · GSC verified${momYoy.length ? ' · ' + momYoy.join(', ') : ''}`;
  document.getElementById('g1-avg').textContent = fmtNum(avgFull);
  if (document.getElementById('g1-avg-label')) document.getElementById('g1-avg-label').textContent = `${valid.length}-month average`;
  document.getElementById('g1-peak').textContent = fmtNum(peakObj?.visitors);
  if (document.getElementById('g1-peak-month')) {
    document.getElementById('g1-peak-month').textContent = peakObj ? fmtMonthLabel(peakObj.month) + ` · ${valid.length}-month max` : `${valid.length}-month max`;
  }
  document.getElementById('g1-goal').textContent = fmtNum(target4mo);
  if (document.getElementById('g1-badge') && lastFullVisitors != null) {
    const ok1 = lastFullVisitors >= d.goal1.passLine;
    const b1 = document.getElementById('g1-badge');
    b1.textContent = `${fmtNum(lastFullVisitors)} · ${fmtMonthLabel(lastFullMonthLabel)}`;
    b1.className = 'badge ' + (ok1 ? 'ok' : 'pending');
  }

  // Trend chart with monthly / weekly toggle
  const trendEl = document.getElementById('g1-trend');
  const axisEl = document.getElementById('g1-axis');
  const trendLabel = document.getElementById('g1-trend-label');
  const trendMonths = fullMonths.slice(-12);
  const trendWeeks = (d.goal1.history13wk || []).slice(-13);

  const fmtWeek = (ws) => {
    if (!ws) return '—';
    const dt = new Date(ws + 'T00:00:00Z');
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  function renderTrend(view) {
    trendEl.innerHTML = ''; axisEl.innerHTML = '';
    const isWeekly = view === 'weekly', isYoY = view === 'yoy';
    const data = isWeekly ? trendWeeks : trendMonths;
    const labelFn = isWeekly ? (item) => fmtWeek(item.weekStart) : (item) => fmtMonthLabel(item.month);
    const unit = isWeekly ? 'clicks (week)' : 'clicks';
    // The in-progress (partial) month is EXCLUDED entirely from the trend (Joseph 2026-06-18: remove the
    // partial-month section so partial data can't distort the view). No projected bar is shown.
    const proj = null;
    const max = Math.max(...data.map(x => x.visitors || 0)) || 100;
    trendLabel.textContent = isYoY ? 'Monthly vs. same month last year' : (isWeekly ? `Last ${data.length} weeks` : `Last ${data.length} months`);
    data.forEach((m) => {
      const bar = document.createElement('div');
      bar.className = 'trend-bar' + (m.visitors == null ? ' empty' : '');
      bar.style.height = (m.visitors ? (m.visitors / max) * 100 : 4) + '%';
      let yoyTxt = '';
      if (isYoY && m.visitors != null && m.priorYear) { const dlt = Math.round((m.visitors - m.priorYear) / m.priorYear * 1000) / 10; bar.style.background = dlt >= 0 ? '#3A7A48' : '#A8503E'; yoyTxt = ` · ${dlt >= 0 ? '+' : ''}${dlt}% vs ${(+m.month.slice(0, 4)) - 1}`; }
      const tip = document.createElement('div'); tip.className = 'tip';
      tip.textContent = `${labelFn(m)}: ${m.visitors == null ? 'no data' : fmtNum(m.visitors) + ' ' + unit}${yoyTxt}`;
      bar.appendChild(tip); trendEl.appendChild(bar);
    });
    if (proj) {  // dashed, distinct "projected" bar for the in-progress month
      const bar = document.createElement('div'); bar.className = 'trend-bar';
      bar.style.height = (proj.projected / max) * 100 + '%';
      bar.style.background = 'repeating-linear-gradient(45deg,#D8C68C,#D8C68C 5px,#EFE6C4 5px,#EFE6C4 10px)';
      bar.style.border = '1px dashed #B08940'; bar.style.borderBottom = 'none';
      const tip = document.createElement('div'); tip.className = 'tip';
      tip.textContent = `${fmtMonthLabel(proj.month)} (in progress): ${fmtNum(proj.actual)} so far · projected ~${fmtNum(proj.projected)} by month-end (day ${proj.elapsed}/${proj.dim})`;
      bar.appendChild(tip); trendEl.appendChild(bar);
    }
    if (data.length) {
      const mid = Math.floor(data.length / 2);
      axisEl.innerHTML = `<span>${labelFn(data[0])}</span><span>${labelFn(data[mid])}</span><span>${labelFn(data[data.length - 1])}${proj ? ' · ' + fmtMonthLabel(proj.month).split(' ')[0] + '*' : ''}</span>`;
    }
  }

  document.querySelectorAll('.trend-toggle button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.trend-toggle button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderTrend(btn.dataset.view);
    });
  });

  renderTrend('monthly');

  const ga4 = d.goal1.ga4 || {};
  const ga4Full = (ga4.history12mo || []).filter(m => m.month !== currentYM && m.sessions != null);
  const ga4L = ga4Full.length ? ga4Full[ga4Full.length - 1] : null;
  const convRate = (ga4L && ga4L.conversions != null && ga4L.sessions) ? Math.round((ga4L.conversions / ga4L.sessions) * 1000) / 10 : null;
  // Goal 1 stat cards — donations (clean figure, not just inline prose) + impressions
  if (document.getElementById('g1-don-year')) {
    document.getElementById('g1-don-year').textContent = ga4.conversions12mo != null ? fmtNum(ga4.conversions12mo) : '—';
    if (ga4L && ga4L.conversions != null) document.getElementById('g1-don-note').textContent = fmtNum(ga4L.conversions) + ' last full month';
  }
  // Donation DOLLAR figures (total raised + organic %) REMOVED from the report per Joseph 2026-06-18.
  // The underlying ga4.donations data is still computed by the ETL but is no longer displayed.
  if (document.getElementById('g1-impr')) {
    const im = lastFull && lastFull.impressions;
    document.getElementById('g1-impr').textContent = im != null ? fmtNum(im) : '—';
    if (im && lastFullVisitors) document.getElementById('g1-impr-note').textContent = (Math.round(lastFullVisitors / im * 1000) / 10) + '% click-through rate';
  }
  // Avg. Google position — last full month, with the movement vs the prior full month COLORED.
  // Lower position = better, so an improvement (number went DOWN) is green, a slip (number went UP) is red.
  if (document.getElementById('g1-position')) {
    const posEl = document.getElementById('g1-position');
    const posNote = document.getElementById('g1-position-note');
    const curPos = lastFull && lastFull.position != null ? lastFull.position : null;
    const prevFull = fullMonths.length >= 2 ? fullMonths[fullMonths.length - 2] : null;
    const prevPos = prevFull && prevFull.position != null ? prevFull.position : null;
    posEl.textContent = curPos != null ? curPos.toFixed(1) : '—';
    if (posNote) {
      if (curPos != null && prevPos != null) {
        const move = prevPos - curPos;            // +ve = improved (rank number fell)
        const prevLbl = fmtMonthLabel(prevFull.month).split(' ')[0];
        if (move > 0.05) {
          posNote.className = 'delta up';
          posNote.textContent = `▲ improved ${move.toFixed(1)} vs ${prevLbl}`;
        } else if (move < -0.05) {
          posNote.className = 'delta down';
          posNote.textContent = `▼ slipped ${Math.abs(move).toFixed(1)} vs ${prevLbl}`;
        } else {
          posNote.className = 'delta';
          posNote.textContent = `unchanged vs ${prevLbl}`;
        }
      } else {
        posNote.className = 'delta';
        posNote.textContent = 'average rank across all queries';
      }
    }
  }
  {
    // 2026-08-18 fix: this line used to show goal1.last30.donations (the BASELINE window,
    // 30 days to Jun 15) under a "Last 30 days" label. Now shows the last full GA4 month.
    const dnMonthly = (d.goal1.ga4 && d.goal1.ga4.donations && d.goal1.ga4.donations.monthly) || [];
    const dnLast = dnMonthly.length ? dnMonthly[dnMonthly.length - 1] : null;
    const el = document.getElementById('ns-donations');
    if (el && dnLast && dnLast.organicDonations != null) {
      el.innerHTML = `<span style="opacity:.8;font-size:13px">${fmtMonthLabel(dnLast.month)} —</span> organic search drove <strong>${fmtNum(dnLast.organicDonations)}</strong> donations.`;
    }
  }
  // (Donations bar chart removed 2026-06-18 — consolidated to a single Goal-1 trend chart; the donation
  // count + dollar value live in the stat cards above, so we don't show two competing bar charts.)
  const engStart = (d.engagement && d.engagement.startDate) ? new Date(d.engagement.startDate) : null;
  const engStartLabel = engStart ? engStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null;
  const engStartMonth = engStart ? engStart.toLocaleDateString('en-US', { month: 'long' }) : null;
  const engFirstFull = engStart ? new Date(engStart.getFullYear(), engStart.getMonth() + (engStart.getDate() > 1 ? 1 : 0), 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : null;
  const peakLabel = peakObj ? fmtMonthLabel(peakObj.month) : null;
  // GA4 sessions MoM for the SAME two full months (so we don't cite only the GSC number — show both)
  const gaFull = ((d.goal1.ga4 || {}).history12mo || []).filter(m => m.month !== currentYM && m.sessions != null);
  const gaMoM = (gaFull.length >= 2 && gaFull[gaFull.length - 2].sessions > 0)
    ? Math.round((gaFull[gaFull.length - 1].sessions - gaFull[gaFull.length - 2].sessions) / gaFull[gaFull.length - 2].sessions * 1000) / 10 : null;
  // Honest context (spin-checked): the decline is largely pre-engagement, BUT the engagement began mid-May,
  // so the last month is a MIXED signal — cite both data sources, claim no credit, tie to the real target.
  const inheritedFrame = (engStartLabel && peakLabel && d.goal1.yearOverYear != null && d.goal1.yearOverYear < 0)
    ? ` <strong>Reading the trend in context:</strong> organic clicks peaked in ${peakLabel} (${fmtNum(peakObj.visitors)}) and declined through the months before Rank Friendly's engagement began on ${engStartLabel}. The last full month is ${sgn(d.goal1.monthOverMonth)} vs the prior month on Search Console clicks${gaMoM != null ? `, and ${sgn(gaMoM)} on GA4 sessions` : ''} — a mixed signal. Because the engagement began mid-${engStartMonth}, ${engStartMonth} is neither a clean pre-engagement baseline nor a clean result; ${engFirstFull} is the first complete month fully under this engagement. This dashboard sets the verified baseline (the 30 days to June 15), measured against the +5% compounded target (${fmtNum(target4mo)} by October 15).`
    : '';
  document.getElementById('g1-note').innerHTML =
    `<strong>What you're seeing:</strong> the most recent complete calendar months from Google Search Console (Property 382006145, Organic Search channel). The current in-progress month is excluded so partial data does not skew the trend. The +5% MoM target line compounds from the last full month.` +
    inheritedFrame +
    (ga4L ? ` <strong>Cross-check:</strong> Google Analytics 4 reports <strong>${fmtNum(ga4L.sessions)}</strong> organic sessions last full month, corroborating Search Console.` : '') +
    (ga4L && ga4L.conversions != null ? ` <strong>Bottom line:</strong> organic search drove <strong>${fmtNum(ga4L.conversions)}</strong> key conversions (donations / key actions)${convRate != null ? ` — a ${convRate}% conversion rate` : ''}${ga4.conversions12mo ? `, and ${fmtNum(ga4.conversions12mo)} over the past year` : ''}. This is the bottom-line impact the rankings produce.` : '');

  // ============== GOAL 2 PANEL ==============
  if (document.getElementById('g2-badge')) {
    const b2 = document.getElementById('g2-badge');
    const ok2 = d.goal2.currentRetained >= d.goal2.passLine;
    b2.textContent = `${d.goal2.currentRetained} holding page 1`;
    b2.className = 'badge ' + (ok2 ? 'ok' : 'pending');
  }
  // ---- PRESERVE maintenance scoreboard: are we HOLDING each position band vs the baseline? ----
  (function () {
    const pres = d.goal2.preserve, el = document.getElementById('preserve-maintain');
    if (!pres || !pres.baseline || !el) return;
    const mlbl = (ym) => { const p = ym.split('-'); return new Date(+p[0], +p[1] - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); };
    const BANDS = [
      { key: 'top5', label: 'In the Top 5', sub: 'positions 1–5' },
      { key: 'page1', label: 'On Page 1', sub: 'positions 1–10 (top 10)' },
      { key: 'page2', label: 'On Page 2', sub: 'positions 11–20' },
    ];
    const months = pres.monthly || [];
    const bt = d.goal2.bandTargets || {};
    const cards = BANDS.map(b => {
      const base = pres.baseline[b.key], now = pres.current[b.key], diff = now - base, held = now >= base;
      const tgt = bt[b.key];
      const pillTxt = diff > 0 ? `▲ +${diff}` : (diff < 0 ? `▼ ${Math.abs(diff)}` : '✓ holding');
      const pillC = held ? ['#2F6B3A', '#EAF3EC'] : ['#A03A2E', '#F7E4E0'];
      const tgtLine = (tgt != null) ? ` · target ≥ ${tgt} <span style="color:${now >= tgt ? '#2F6B3A' : '#A03A2E'};font-weight:600">${now >= tgt ? '✓' : '✗'}</span>` : '';
      const spark = months.length >= 2 ? `<div style="font-size:12.5px;color:var(--ink-soft);margin-top:12px">${months.map(m => `<strong title="${mlbl(m.month)}">${m[b.key]}</strong>`).join(' <span style="color:var(--ink-faint)">→</span> ')}</div>` : '';
      return `<div style="flex:1 1 180px;min-width:180px;background:#fff;border:1px solid var(--rule);border-radius:14px;padding:16px 18px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
          <div><div style="font-size:13px;font-weight:700;color:var(--ink)">${b.label}</div><div style="font-size:11px;color:var(--ink-faint)">${b.sub}</div></div>
          <span style="flex:0 0 auto;font-size:11px;font-weight:700;color:${pillC[0]};background:${pillC[1]};padding:3px 10px;border-radius:999px">${pillTxt}</span>
        </div>
        <div style="font-family:'Crimson Pro',serif;font-size:42px;font-weight:600;line-height:1.05;color:var(--ink);margin:12px 0 3px">${now}</div>
        <div style="font-size:12px;color:var(--ink-soft)">baseline ${base}${tgtLine}</div>
        ${spark}
      </div>`;
    }).join('');
    const top20now = (pres.current.page1 || 0) + (pres.current.page2 || 0);
    const top20line = (bt.top20 != null) ? ` Within the top 2 pages (≤20): <strong>${top20now}</strong> · target ≥ ${bt.top20} ${top20now >= bt.top20 ? '✓' : '✗'}.` : '';
    el.innerHTML = `<div style="font-size:13.5px;font-weight:600;color:var(--ink-soft);margin:0 0 12px">Are we holding the rankings we've won? <span style="font-weight:400;color:var(--ink-faint)">— benchmark set ${pres.benchmarkDate ? new Date(pres.benchmarkDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : mlbl(pres.trackingSince)}, re-checked every Sunday</span></div>
      <div style="display:flex;gap:14px;flex-wrap:wrap">${cards}</div>
      <div style="font-size:12px;color:var(--ink-faint);margin-top:12px">${d.goal2.sampleSize} priority keywords tracked — all ranking right now (live Semrush + Ubersuggest positions, with the Search Console 90-day average alongside) · last checked ${new Date(d.goal2.lastChecked).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}. Targets: ≥ ${bt.top5} in Top 5, ≥ ${bt.page1} on Page 1.${top20line} "Holding" = at or above the benchmark.</div>`;
  })();

  const g2tbody = document.getElementById('g2-tbody');
  // Three rank columns so the sources can be cross-checked (Joseph 2026-06-18): Semrush · Live check · GSC.
  const posSpan = (p) => p != null ? `<span class="pos ${p <= 3 ? '' : (p <= 10 ? 'mid' : 'bad')}">#${p}</span>` : '<span class="pos none" style="color:var(--ink-faint)">—</span>';
  d.goal2.sample.forEach(k => {
    const tr = document.createElement('tr');
    // Shade the GSC 90-day cell the same way as the Semrush / Ubersuggest columns: green = top 3,
    // amber = rest of page 1 (4–10), red = page 2+ (>10), neutral gray = no GSC data.
    const gsc = posSpan(k.gscPosition90);
    tr.innerHTML = `
      <td><strong>${k.keyword}</strong></td>
      <td class="num-col">${fmtNum(k.volume)}</td>
      <td>${posSpan(k.semrushPosition)}</td>
      <td>${posSpan(k.ubersuggestPosition)}</td>
      <td>${gsc}</td>
    `;
    g2tbody.appendChild(tr);
  });

  if (d.goal2.note) {
    // Fill the existing #g2-note element rather than appending a second .note (which left the
    // static one empty — an empty maroon-bordered box between the table and the sample note).
    const note = document.getElementById('g2-note');
    if (note) note.innerHTML = `<strong>Sample note:</strong> ${d.goal2.note}`;
  }

  // ============== GOAL 2 · ENHANCE PANEL ==============
  if (d.goalEnhance) {
    const g = d.goalEnhance;
    const setT = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    setT('ge-current', g.currentOnPage1);
    setT('ge-locked-head', g.baselineDate ? 'Benchmark · ' + new Date(g.baselineDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Locked at');
    setT('ge-size', g.sampleSize);
    setT('ge-goal', g.target);
    setT('ge-checked', g.lastChecked ? new Date(g.lastChecked).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—');
    if (document.getElementById('ge-badge')) { const b = document.getElementById('ge-badge'); const ok = g.currentOnPage1 >= (g.passLine || 0); b.textContent = `${g.currentOnPage1}/${g.sampleSize} on page 1`; b.className = 'badge ' + (ok ? 'ok' : 'pending'); }
    const tbE = document.getElementById('ge-tbody');
    if (tbE) (g.sample || []).slice().sort((a, b) => (a.currentPosition ?? 99) - (b.currentPosition ?? 99)).forEach(k => {
      const tr = document.createElement('tr');
      const mv = k.change == null ? '–' : (k.change > 0 ? `<span class="change up">↑${k.change}</span>` : (k.change < 0 ? `<span class="change down">↓${Math.abs(k.change)}</span>` : '<span class="change flat">–</span>'));
      tr.innerHTML = `<td><strong>${k.keyword}</strong></td><td class="num-col">#${k.startPosition}</td><td><span class="pos ${k.onPage1 ? '' : (k.currentPosition <= 20 ? 'mid' : 'bad')}">#${k.currentPosition ?? '?'}</span></td><td>${mv}</td><td>${k.onPage1 ? '<span class="yes">✓ page 1</span>' : '<span class="no">page 2</span>'}</td>`;
      tbE.appendChild(tr);
    });
    if (document.getElementById('ge-note')) document.getElementById('ge-note').innerHTML = `<strong>How this works:</strong> ${g.note}`;
  }

  // ============== GOAL 3 PANEL ==============
  document.getElementById('g3-current').textContent = d.goal3.currentNewlyRanked;
  document.getElementById('g3-goal').textContent = `+${d.goal3.target}`;
  document.getElementById('g3-pass').textContent = `+${d.goal3.passLine}`;
  document.getElementById('g3-topics-count').textContent = d.goal3.topicAreas.length;
  if (document.getElementById('g3-badge')) {
    const won3 = d.goal3.currentNewlyRanked || 0;
    const b3 = document.getElementById('g3-badge');
    b3.textContent = `${won3} on page 1`;
    b3.className = 'badge ' + (won3 >= d.goal3.passLine ? 'ok' : 'pending');
  }

  const g3tbody = document.getElementById('g3-tbody');
  d.goal3.sample.forEach(k => {
    const tr = document.createElement('tr');
    const posDisplay = k.currentPosition == null
      ? '<span class="pos none">Not ranked</span>'
      : `<span class="pos">#${k.currentPosition}</span>`;
    tr.innerHTML = `
      <td><strong>${k.keyword}</strong></td>
      <td class="num-col">${fmtNum(k.volume)}</td>
      <td>${posDisplay}</td>
      <td>${k.status}</td>
    `;
    g3tbody.appendChild(tr);
  });
  if (d.goal3.opportunitySource) {
    const n3 = document.createElement('div');
    n3.className = 'note';
    n3.innerHTML = `<strong>Data source:</strong> ${d.goal3.opportunitySource}. Search volumes are a Semrush point-in-time snapshot; current ranking positions are checked against live Search Console (these terms aren't ranking yet).`;
    document.getElementById('goal-3').querySelector('.panel').appendChild(n3);
  }
  if (d.goal3.subList && d.goal3.subList.length) {
    const sub = document.createElement('div');
    sub.style.cssText = 'margin-top:18px;border-top:1px solid var(--rule-soft);padding-top:14px';
    sub.innerHTML = `<div style="font-size:11px;color:var(--ink-faint);font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">${d.goal3.subListLabel || 'Also broadening into parnassah & refuah'}</div>` +
      '<div style="display:flex;flex-wrap:wrap;gap:8px">' +
      d.goal3.subList.map(s => `<span style="font-size:12.5px;background:var(--rule-soft);border-radius:6px;padding:3px 10px;color:var(--ink-soft)">${s.keyword} <span style="color:var(--ink-faint)">· ${fmtNum(s.volume)}/mo</span></span>`).join('') +
      '</div>';
    document.getElementById('goal-3').querySelector('.panel').appendChild(sub);
  }

  // Beyond-philanthropy broaden wins — newly published articles already ranking page 1 in NEW topic territory
  (function () {
    const wins = (d.goal3.newContentWins || []).filter(w => w.position != null && w.position <= 10);
    const el = document.getElementById('g3-wins');
    if (!el || !wins.length) return;
    const onP1 = d.goal3.newContentWinsOnPage1 || wins.length;
    const top = wins.slice(0, 12);
    const rows = top.map(w => `<tr>
      <td><strong>${w.keyword}</strong>${w.matchedQuery && w.matchedQuery.toLowerCase() !== (w.keyword || '').toLowerCase() ? `<div style="font-size:11px;color:var(--ink-faint)">ranks via “${w.matchedQuery}”</div>` : ''}</td>
      <td><span style="font-size:12px;color:var(--ink-soft)">${w.hub}</span></td>
      <td><span class="pos ${w.position <= 3 ? '' : 'mid'}">#${w.position}</span></td>
      <td class="num-col">${fmtNum(w.impressions)}</td>
    </tr>`).join('');
    el.innerHTML =
      `<div style="border-top:1px solid var(--rule-soft);padding-top:16px">
        <div style="font-size:13.5px;font-weight:700;color:var(--ink)">Beyond philanthropy — new content already ranking page 1</div>
        <div style="font-size:13px;color:var(--ink-soft);margin:5px 0 12px;line-height:1.55">Broadening isn't only about the philanthropy terms above. The 2026 plan's net-new content is opening whole new topic areas: <strong>${onP1} newly published articles</strong> already sit on page 1 in mourning &amp; remembrance, prayer, and Rabbi Meir history &amp; Torah — territory the site didn't rank for before. <a href="/deliverables.html" style="color:#8B3A3A;font-weight:600">→ the 500-deliverable plan</a></div>
        <div class="table-wrap"><table class="data"><thead><tr><th>Newly published article keyword</th><th>Topic area</th><th>Position</th><th>90-day impressions · this query</th></tr></thead><tbody>${rows}</tbody></table></div>
        <div style="font-size:12px;color:var(--ink-faint);margin-top:8px">Position and impressions are for the specific Google Search Console query each article ranks for over the last 90 days — the query shown under the keyword — not the page's total across every term it ranks for.${wins.length > top.length ? ` Showing the top ${top.length} of ${onP1} page-1 wins by visibility.` : ''}</div>
      </div>`;
  })();

  // ============== GOAL 4 PANEL — SHARE OF ORGANIC TRAFFIC ==============
  const sov = d.goal4.shareOfVoice;
  if (sov) {
    document.getElementById('g4-rmbh-sov').textContent = sov.rmbhCurrentSoV.toFixed(1) + '%';
    document.getElementById('g4-rmbh-rank').textContent = `${sov.rmbhRank} of ${sov.totalTracked} tracked competitors`;

    const top = [...sov.competitors].filter(c => c.sov != null).sort((a,b) => b.sov - a.sov)[0];
    document.getElementById('g4-top-competitor').textContent = top ? top.name : '—';
    document.getElementById('g4-top-sov').textContent = top ? top.sov.toFixed(1) + '% share of organic traffic' : '—';

    document.getElementById('g4-target-sov').textContent = sov.targetSoV + '%';

    const fetched = new Date(sov.lastFetched);
    document.getElementById('g4-fetched').textContent = `pulled ${fetched.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}`;

    // Bars showing each competitor's share of organic traffic
    const barEl = document.getElementById('g4-bars');
    const sorted = [...sov.competitors].sort((a, b) => (b.sov || 0) - (a.sov || 0));
    const maxSov = Math.max(...sorted.map(c => c.sov || 0));
    sorted.forEach(c => {
      const isUs = c.isUs === true;
      const widthPct = c.sov != null ? Math.max(2, (c.sov / maxSov) * 100) : 1;
      const div = document.createElement('div');
      div.className = 'bar-row' + (isUs ? ' organic' : '');
      div.style.cssText = 'display:flex;align-items:center;gap:14px;margin-bottom:10px;font-size:13px;';
      div.innerHTML = `
        <span class="label" style="flex:0 0 210px;color:${isUs ? 'var(--ink)' : 'var(--ink-soft)'};font-weight:${isUs ? '700' : '500'}">${c.name}${isUs ? ' (you)' : ''}${c.domain ? `<br><span style="font-size:11px;font-weight:400;color:var(--ink-faint)">${c.domain}</span>` : ''}</span>
        <span class="bar-track" style="flex:1;height:24px;background:var(--rule-soft);border-radius:4px;position:relative;overflow:hidden;">
          <span class="bar-fill" style="display:block;height:100%;width:${widthPct}%;background:${isUs ? 'linear-gradient(90deg,var(--accent-deep),var(--accent))' : 'linear-gradient(90deg,#5a6b80,#8b9bb0)'};border-radius:4px;"></span>
        </span>
        <span class="amount" style="flex:0 0 110px;text-align:right;font-family:'Crimson Pro',serif;font-weight:600;font-size:16px;color:var(--ink);">
          ${c.sov != null ? c.sov.toFixed(1) + '%' : '— no data'}
        </span>
      `;
      barEl.appendChild(div);
    });

    // Second view — direct Rabbi-Meir rivals (Joseph: show both views)
    const dv = sov.views && sov.views.directRivals;
    if (dv && barEl) {
      const hdr = document.createElement('div');
      hdr.style.cssText = 'margin:20px 0 10px;font-size:11px;color:var(--ink-faint);font-weight:600;text-transform:uppercase;letter-spacing:.05em;border-top:1px solid var(--rule-soft);padding-top:14px';
      hdr.textContent = 'Second view — direct Rabbi Meir Baal Haness charities';
      barEl.appendChild(hdr);
      const dvNote = document.createElement('div');
      dvNote.style.cssText = 'margin:-2px 0 12px;font-size:12px;color:var(--ink-faint);line-height:1.5';
      dvNote.innerHTML = `RMBH holds <strong>${dv.rmbhCurrentSoV != null ? dv.rmbhCurrentSoV.toFixed(1) + '%' : '—'}</strong> here${dv.rmbhRank === 1 ? ' — the <strong>#1</strong> direct Rabbi Meir Baal Haness charity' : ` (#${dv.rmbhRank} of ${dv.totalTracked})`}. This differs from the ${sov.rmbhCurrentSoV}% above because the share is measured against a different set — only the direct Rabbi-Meir charities. (Colel Chabad, a large general welfare organization, sits in the proposal set above, not here.)`;
      barEl.appendChild(dvNote);
      const dmax = Math.max(...dv.competitors.map(c => c.sov || 0)) || 1;
      [...dv.competitors].sort((a, b) => (b.sov || 0) - (a.sov || 0)).forEach(c => {
        const us = c.isUs === true;
        const w = c.sov != null ? Math.max(2, (c.sov / dmax) * 100) : 1;
        const div = document.createElement('div');
        div.style.cssText = 'display:flex;align-items:center;gap:14px;margin-bottom:8px;font-size:13px;';
        div.innerHTML = `<span style="flex:0 0 210px;color:${us ? 'var(--ink)' : 'var(--ink-soft)'};font-weight:${us ? '700' : '500'}">${c.name}${us ? ' (you)' : ''}${c.domain ? `<br><span style="font-size:11px;font-weight:400;color:var(--ink-faint)">${c.domain}</span>` : ''}</span><span style="flex:1;height:20px;background:var(--rule-soft);border-radius:4px;overflow:hidden"><span style="display:block;height:100%;width:${w}%;background:${us ? 'linear-gradient(90deg,var(--accent-deep),var(--accent))' : 'linear-gradient(90deg,#5a6b80,#8b9bb0)'}"></span></span><span style="flex:0 0 90px;text-align:right;font-weight:600">${c.sov != null ? c.sov.toFixed(1) + '%' : '— n/a'}</span>`;
        barEl.appendChild(div);
      });
    }
    const ordinal = (n) => n + (['th','st','nd','rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : Math.min(n % 10, 4)] || 'th');
    const ahead = [...sov.competitors].filter(c => c.sov != null && !c.isUs && c.sov > sov.rmbhCurrentSoV).sort((a, b) => b.sov - a.sov).map(c => c.name);
    const place = `${ordinal(sov.rmbhRank)} of ${sov.totalTracked} tracked` + (ahead.length ? `, behind ${ahead.join(' and ')}` : '');
    if (document.getElementById('g4-badge')) document.getElementById('g4-badge').textContent = `Currently ${ordinal(sov.rmbhRank)}`;
    // Only claim a rank change if we have a DATED prior measurement to back it (no undated/asserted history)
    const moved = (sov.prevFetchDate && sov.prevRmbhRank && sov.prevRmbhRank !== sov.rmbhRank)
      ? ` (was ${ordinal(sov.prevRmbhRank)} at ${sov.prevRmbhSoV}% as of ${sov.prevFetchDate}).` : '';
    document.getElementById('g4-note').innerHTML =
      `<strong>How share of organic traffic is calculated:</strong> for each tracked competitor, we take their estimated monthly organic traffic from Semrush. Each domain's share is its traffic divided by the total of the tracked set. RMBH currently sits at ${sov.rmbhCurrentSoV}% — ${place}.${moved} This headline view is the proposal's big-charity set (Yad Eliezer, Meir Panim, Colel Chabad, Latet) measured on the US database — RMBH's English-donor market. Latet and Yad Eliezer serve the Israeli market and barely register in US (Latet draws ~5,400 organic visits in Semrush's Israel database). The second view below compares the direct Rabbi Meir Baal Haness charities.`;
  }

  // Goal 4 explainer — "why some positions move while we hold the #1 share of organic traffic" (verified, data-backed)
  (function () {
    const ex = (d.goal4.shareOfVoice || {}).explainer, el = document.getElementById('g4-explainer');
    if (!ex || !el) return;
    const stats = (ex.stats || []).map(s => `<div style="flex:1 1 160px;min-width:160px;background:var(--rule-soft);border-radius:10px;padding:12px 14px">
      <div style="font-family:'Crimson Pro',serif;font-size:23px;font-weight:600;color:var(--ink)">${s.value}</div>
      <div style="font-size:11.5px;color:var(--ink-soft);margin-top:3px;line-height:1.35">${s.label}</div></div>`).join('');
    const body = (ex.body || []).map(p => `<p style="margin:0 0 10px;font-size:13.5px;line-height:1.6;color:var(--ink-soft)">${p}</p>`).join('');
    const bullets = (ex.bullets || []).map(b => `<li style="margin:0 0 6px;font-size:13px;line-height:1.5;color:var(--ink-soft)">${b}</li>`).join('');
    el.innerHTML =
      `<details style="border:1px solid var(--rule);border-radius:12px;background:#fff">
        <summary style="cursor:pointer;padding:14px 18px;font-size:14px;font-weight:700;color:var(--ink)">${ex.title}</summary>
        <div style="padding:2px 18px 18px">
          <div style="display:flex;gap:12px;flex-wrap:wrap;margin:0 0 16px">${stats}</div>
          ${body}
          <ul style="margin:8px 0 0;padding-left:18px">${bullets}</ul>
          ${ex.source ? `<div style="font-size:11px;color:var(--ink-faint);margin-top:12px">${ex.source}</div>` : ''}
        </div>
      </details>`;
  })();

  // ============== GOAL 5 PANEL ==============
  document.getElementById('g5-total').textContent = d.goal5.totalQuestions;
  // Data-driven engine columns: show ONLY engines that actually ran this scan (have a boolean
  // per prompt). An engine with no credit is cleared by the ETL and simply has no column — it
  // is listed as "pending" in the note below and reappears automatically once credit is added.
  const ENGINE_DEFS = [
    ['chatgpt', 'ChatGPT'], ['claude', 'Claude'], ['gemini', 'Gemini'],
    ['googleSearch', 'Google AI Search'], ['perplexity', 'Perplexity'],
  ];
  const activeEngines = ENGINE_DEFS.filter(([k]) => d.goal5.sample.some(q => typeof q[k] === 'boolean'));
  if (document.getElementById('g5-engines-note')) document.getElementById('g5-engines-note').textContent = `across ${activeEngines.length} AI engine${activeEngines.length === 1 ? '' : 's'}`;
  // Build the matrix header dynamically (Question + one column per active engine)
  const headRow = document.querySelector('.ai-matrix thead tr');
  if (headRow) headRow.innerHTML = '<th class="q">Question</th>' + activeEngines.map(([, label]) => `<th class="cell">${label}</th>`).join('');

  document.getElementById('g5-current').textContent = d.goal5.currentMentions;
  if (document.getElementById('g5-badge')) document.getElementById('g5-badge').textContent = `${d.goal5.currentMentions} of ${d.goal5.totalQuestions} questions`;
  if (document.getElementById('kpi5-status')) { const e5 = document.getElementById('kpi5-status'); const m5 = d.goal5.currentMentions; if (d.goal5.target != null && m5 >= d.goal5.target) { e5.textContent = 'At target'; e5.className = 'status ok'; } else if (m5 >= d.goal5.passLine) { e5.textContent = 'On track'; e5.className = 'status ok'; } else { e5.textContent = 'Baseline'; e5.className = 'status pending'; } }
  document.getElementById('g5-goal').textContent = `${d.goal5.target}+`;
  document.getElementById('g5-scanned').textContent = new Date(d.goal5.lastScanned).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const g5tbody = document.getElementById('g5-tbody');
  const cell = (b) => `<td class="cell">${b ? '<span class="yes">✓</span>' : '<span class="no">·</span>'}</td>`;
  const answersByQ = {};
  if (g5archive && g5archive.prompts) g5archive.prompts.forEach(p => { answersByQ[p.query] = p.answers; });
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const hl = (s) => esc(s).replace(/((?:rabbi |reb |rav )?meir baal ha?ness charit\w*|rmbhcharities[^\s"]*)/ig, '<mark style="background:#FBE7A2;padding:0 2px;border-radius:2px">$1</mark>');
  const clsTag = { client: ['✓ named us', '#2F6B3A', '#E3F0E5'], ambiguous: ['~ our name + a competitor', '#9A7322', '#FBF1D9'], competitor: ['named a competitor', '#A03A2E', '#F7E4E0'], none: ['did not name us', '#8a8a8a', '#F1EEE8'] };
  const colSpan = activeEngines.length + 1;
  // Baseline (Jun 15) per-prompt snapshot — lets the matrix toggle Baseline <-> Latest so the client SEES progress.
  const g5base = d.goal5.baseline || null;
  const g5baseByQ = {};
  if (g5base && g5base.perPrompt) g5base.perPrompt.forEach(q => { g5baseByQ[q.query] = q; });
  function renderG5(which) {
    const isBase = which === 'baseline' && g5base;
    g5tbody.innerHTML = '';
    d.goal5.sample.forEach((q, idx) => {
      const row = isBase ? (g5baseByQ[q.query] || { query: q.query }) : q;
      const ans = isBase ? null : answersByQ[q.query];     // archived answers exist only for the latest scan
      const tr = document.createElement('tr');
      const qcell = ans && ans.length
        ? `<td class="q"><a href="#" data-ev="${idx}" style="color:var(--accent);text-decoration:none;font-weight:700">&#9656;</a> ${esc(q.query)}</td>`
        : `<td class="q">${esc(q.query)}</td>`;
      tr.innerHTML = qcell + activeEngines.map(([k]) => cell(row[k])).join('');
      g5tbody.appendChild(tr);
      if (ans && ans.length) {
        const det = document.createElement('tr');
        det.style.display = 'none';
        det.setAttribute('data-evrow', idx);
        det.innerHTML = `<td colspan="${colSpan}" style="background:var(--rule-soft,#f4efe3);padding:12px 16px;font-size:12.5px;line-height:1.55">` +
          `<div style="color:var(--ink-faint);font-weight:600;margin-bottom:7px;text-transform:uppercase;letter-spacing:.04em;font-size:10.5px">What each engine actually answered · ${g5archive.lastScanned}</div>` +
          ans.map(a => { const c = clsTag[a.classification] || clsTag.none; return `<div style="margin-bottom:9px"><strong>${esc(a.label)}</strong> <span style="font-size:10.5px;font-weight:600;color:${c[1]};background:${c[2]};padding:1px 7px;border-radius:10px">${c[0]}</span><div style="color:var(--ink-soft);margin-top:3px">&ldquo;${hl(a.text)}&rdquo;</div></div>`; }).join('') +
          `</td>`;
        g5tbody.appendChild(det);
      }
    });
    g5tbody.querySelectorAll('a[data-ev]').forEach(a => a.addEventListener('click', (e) => {
      e.preventDefault();
      const r = g5tbody.querySelector(`tr[data-evrow="${a.getAttribute('data-ev')}"]`);
      if (r) { const open = r.style.display !== 'none'; r.style.display = open ? 'none' : ''; a.innerHTML = open ? '&#9656;' : '&#9662;'; }
    }));
  }
  renderG5('latest');
  // Progress headline + Baseline/Latest toggle (Joseph 2026-06-19: show AI-visibility progress vs the Jun-15 start).
  (function () {
    const host = document.getElementById('g5-snapshot'); if (!host) return;
    const T = d.goal5.totalQuestions, curM = d.goal5.currentMentions, baseM = g5base ? g5base.mentions : null;
    const fmtD = (s) => { try { return new Date(String(s).length <= 10 ? s + 'T00:00:00' : s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); } catch (e) { return s; } };
    const baseDate = g5base ? g5base.date : '2026-06-15', curDate = d.goal5.lastScanned;
    let prog;
    if (baseM != null) {
      const dlt = curM - baseM;
      const badge = dlt > 0 ? `<b style="color:#2F6B3A">▲ +${dlt}</b>` : (dlt < 0 ? `<b style="color:#A03A2E">▼ ${Math.abs(dlt)}</b>` : `<span style="color:var(--ink-faint)">— no change yet; this is the starting line</span>`);
      prog = `<strong>Progress:</strong> named in <strong>${baseM}</strong> of ${T} on ${fmtD(baseDate)} (baseline) &rarr; <strong>${curM}</strong> of ${T} now ${badge}`;
    } else {
      prog = `<strong>Baseline ${fmtD(baseDate)}:</strong> ${curM} of ${T}. Every weekly scan is measured against this starting point.`;
    }
    const toggle = g5base ? `<div style="display:inline-flex;border:1px solid var(--rule);border-radius:999px;overflow:hidden;font-size:12.5px;flex:0 0 auto">
        <button type="button" data-snap="baseline" style="border:0;background:#fff;color:var(--ink-soft);padding:6px 14px;cursor:pointer;font-weight:600">Baseline · ${fmtD(baseDate)}</button>
        <button type="button" data-snap="latest" style="border:0;background:var(--ink);color:#fff;padding:6px 14px;cursor:pointer;font-weight:600">Latest · ${fmtD(curDate)}</button>
      </div>` : '';
    host.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap"><div style="font-size:13px;color:var(--ink-soft)">${prog}</div>${toggle}</div>`;
    const btns = host.querySelectorAll('button[data-snap]');
    btns.forEach(b => b.addEventListener('click', () => {
      renderG5(b.dataset.snap);
      btns.forEach(x => { const on = x === b; x.style.background = on ? 'var(--ink)' : '#fff'; x.style.color = on ? '#fff' : 'var(--ink-soft)'; });
    }));
  })();

  // Bar chart — who AI names instead of us (competitive intel)
  const g5comp = document.getElementById('g5-competitors');
  if (g5comp && d.goal5.competitorMentions && d.goal5.competitorMentions.length) {
    const max = Math.max(...d.goal5.competitorMentions.map(c => c.count), d.goal5.currentMentions || 0) || 1;
    const row = (name, count, us) => `<div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;font-size:13px"><span style="flex:0 0 160px;color:${us ? 'var(--accent)' : 'var(--ink-soft)'};font-weight:${us ? 700 : 500}">${name}</span><span style="flex:1;height:18px;background:var(--rule-soft);border-radius:4px;overflow:hidden"><span style="display:block;height:100%;width:${Math.max(2, (count / max) * 100)}%;background:${us ? 'linear-gradient(90deg,var(--accent-deep),var(--accent))' : 'linear-gradient(90deg,#5a6b80,#8b9bb0)'}"></span></span><span style="flex:0 0 32px;text-align:right;font-weight:${us ? 700 : 600};color:${us ? 'var(--accent)' : 'var(--ink)'}">${count}</span></div>`;
    g5comp.innerHTML = '<div style="font-size:11px;color:var(--ink-faint);font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px">Who AI names instead — mentions across the test</div>' +
      d.goal5.competitorMentions.slice(0, 8).map(c => row(c.name, c.count, false)).join('') +
      row('Rabbi Meir Baal Haness (you)', d.goal5.currentMentions || 0, true);
  }

  // Who does AI name instead of us? + which engines were tested this scan
  const g5note = document.getElementById('g5-note');
  if (g5note) {
    const comp = (d.goal5.competitorMentions || []).slice(0, 7).map(c => `${c.name} (${c.count})`).join(', ');
    const tested = (d.goal5.enginesTested || []).join(', ');
    const pending = (d.goal5.enginesPending || []).length ? ` Awaiting an API key (auto-added once funded): ${d.goal5.enginesPending.join(', ')}.` : '';
    g5note.innerHTML =
      (comp ? `<strong>Who AI names instead:</strong> across these prompts the charities named most were ${comp}. RMBH was named in ${d.goal5.currentMentions} of ${d.goal5.totalQuestions}. ` : '') +
      (tested ? `<br><span style="color:var(--ink-faint)">Engines this scan: ${tested}.${pending} Consumer-app screenshots are captured monthly as the client-facing proof.</span>` : '');
  }

  // ============== DATA FRESHNESS (per source) ==============
  const fr = document.getElementById('freshness');
  if (fr) {
    const dt = (s) => s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';
    fr.textContent = `Sources refreshed — Search Console + Analytics: ${dt(d.lastUpdated)} · Semrush: ${dt(d.goal4 && d.goal4.shareOfVoice && d.goal4.shareOfVoice.lastFetched)} · AI test: ${dt(d.goal5 && d.goal5.lastScanned)}`;
  }

  // ---- wire the editing layer (edits-ui.js): mark editable keyword tables + row ids ----
  try {
    [['g2-tbody', 'preserve'], ['g3-tbody', 'broaden'], ['ge-tbody', 'enhance']].forEach(([tbId, name]) => {
      const tb = document.getElementById(tbId); if (!tb) return;
      const tbl = tb.closest('table'); if (tbl) tbl.dataset.editTable = name;
      tb.querySelectorAll('tr').forEach(tr => { const c = tr.cells[0]; if (c && !tr.hasAttribute('data-row-id')) tr.setAttribute('data-row-id', c.innerText.trim().slice(0, 80)); });
    });
    if (window.RMBHEdits) window.RMBHEdits.enhanceAll();
  } catch (e) {}
})().catch(function (e) {
  console.error(e);
  var b = document.createElement('div');
  b.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99998;background:#A03A2E;color:#fff;padding:9px;text-align:center;font:13px Inter,system-ui,sans-serif';
  b.textContent = 'Could not load live data — please refresh the page.';
  document.body.appendChild(b);
});

// Shared editing UI for the RMBH dashboard. Any table marked  data-edit-table="<name>"  with rows
// carrying  data-row-id="<id>"  becomes: sortable (click headers) for everyone; and — with the team
// edit key — commentable / removable / restorable, plus an "add row". Persists via /api/edits (Vercel
// Blob). Client view (no key) is read-only: it just shows comments and hides removed rows.
(function () {
  const API = '/api/edits', KEYLS = 'rmbh_edit_key';
  let OV = { tables: {}, added: {} };
  let editKey = '';
  try { editKey = localStorage.getItem(KEYLS) || ''; } catch (e) {}
  const editMode = () => !!editKey;
  const norm = o => { o = o || {}; o.tables = o.tables || {}; o.added = o.added || {}; return o; };

  async function load() { try { OV = norm(await (await fetch(API, { cache: 'no-store' })).json()); } catch (e) { OV = norm({}); } }
  async function post(ops) {
    try {
      const r = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json', 'x-rmbh-key': editKey }, body: JSON.stringify({ ops }) });
      if (r.status === 401) { alert('Wrong edit key — ask Joseph.'); return false; }
      if (!r.ok) { alert('Could not save (' + r.status + ').'); return false; }
      OV = norm((await r.json()).overrides); return true;
    } catch (e) { alert('Could not save — network error.'); return false; }
  }
  const ovRow = (t, id) => ((OV.tables[t] || {})[id]) || {};
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- sorting ----------
  function makeSortable(table) {
    const ths = table.tHead ? [...table.tHead.rows[0].cells] : [];
    ths.forEach((th, i) => {
      if (th.dataset.noSort != null) return;
      th.style.cursor = 'pointer'; th.title = 'Click to sort';
      th.addEventListener('click', () => {
        const tb = table.tBodies[0]; if (!tb) return;
        const rows = [...tb.querySelectorAll('tr[data-row-id]')];
        const asc = th.dataset.sortAsc !== '1'; ths.forEach(h => h.dataset.sortAsc = '');
        th.dataset.sortAsc = asc ? '1' : '0';
        const val = tr => { const c = tr.cells[i]; if (!c) return ''; const t = c.innerText.trim().replace(/[#,%$]/g, ''); const n = parseFloat(t); return isNaN(n) ? c.innerText.trim().toLowerCase() : n; };
        rows.sort((a, b) => { const x = val(a), y = val(b); return (x < y ? -1 : x > y ? 1 : 0) * (asc ? 1 : -1); });
        rows.forEach(r => { const det = r.nextElementSibling; tb.appendChild(r); if (det && det.hasAttribute('data-evrow')) tb.appendChild(det); });
        ths.forEach(h => h.querySelector('.sort-caret') && h.querySelector('.sort-caret').remove());
        const car = document.createElement('span'); car.className = 'sort-caret'; car.textContent = asc ? ' ▲' : ' ▼'; car.style.opacity = '.5'; car.style.fontSize = '10px'; th.appendChild(car);
      });
    });
  }

  // ---------- apply overrides + controls to one table ----------
  function enhance(table) {
    const T = table.dataset.editTable; if (!T) return;
    makeSortable(table);
    const tb = table.tBodies[0]; if (!tb) return;
    const colCount = table.tHead ? table.tHead.rows[0].cells.length : 1;
    // existing rows
    [...tb.querySelectorAll('tr[data-row-id]')].forEach(tr => {
      const id = tr.getAttribute('data-row-id'); const o = ovRow(T, id);
      tr.querySelectorAll('.rmbh-cmt,.rmbh-ctl').forEach(n => n.remove());
      if (o.removed && !editMode()) { tr.style.display = 'none'; return; }
      tr.style.display = ''; tr.style.opacity = o.removed ? '0.45' : '';
      const first = tr.cells[0]; if (!first) return;
      if (o.comment) { const c = document.createElement('div'); c.className = 'rmbh-cmt'; c.style.cssText = 'font-size:11.5px;color:#8a6d3b;background:#FBF1D9;border-radius:5px;padding:2px 7px;margin-top:4px;display:inline-block'; c.textContent = '💬 ' + o.comment; first.appendChild(c); }
      if (editMode()) addControls(tr, T, id, o);
    });
    // added rows
    (OV.added[T] || []).forEach(a => {
      const tr = document.createElement('tr'); tr.setAttribute('data-row-id', a._id); tr.setAttribute('data-added', '1');
      tr.innerHTML = `<td colspan="${colCount}" style="background:#EAF2EC"><strong style="color:#2F6B3A">➕ ${esc(a.label || a.keyword || a.title || JSON.stringify(a))}</strong>${a.note ? ' — ' + esc(a.note) : ''}${editMode() ? ` <a href="#" data-del="${esc(a._id)}" style="color:#A03A2E;margin-left:8px;font-size:11px">remove</a>` : ''}</td>`;
      if (editMode()) tr.querySelector('a[data-del]').addEventListener('click', async e => { e.preventDefault(); if (await post([{ table: T, op: 'delete-added', id: a._id }])) refresh(); });
      tb.appendChild(tr);
    });
  }
  function addControls(tr, T, id, o) {
    const first = tr.cells[0];
    const ctl = document.createElement('span'); ctl.className = 'rmbh-ctl'; ctl.style.cssText = 'margin-left:8px;white-space:nowrap';
    ctl.innerHTML = `<a href="#" data-act="cmt" title="Comment" style="text-decoration:none">✎</a> <a href="#" data-act="${o.removed ? 'restore' : 'rm'}" title="${o.removed ? 'Restore' : 'Remove'}" style="text-decoration:none;color:${o.removed ? '#2F6B3A' : '#A03A2E'}">${o.removed ? '↺' : '✕'}</a>`;
    first.appendChild(ctl);
    ctl.querySelector('[data-act="cmt"]').addEventListener('click', async e => { e.preventDefault(); const v = prompt('Comment on "' + id + '":', o.comment || ''); if (v === null) return; if (await post([{ table: T, id, op: 'comment', value: v }])) refresh(); });
    const rm = ctl.querySelector('[data-act="rm"],[data-act="restore"]');
    rm.addEventListener('click', async e => { e.preventDefault(); if (await post([{ table: T, id, op: o.removed ? 'restore' : 'remove' }])) refresh(); });
  }

  function enhanceAll() { document.querySelectorAll('table[data-edit-table]').forEach(enhance); updateAddButtons(); }
  function refresh() { enhanceAll(); }

  // "+ add" buttons + the floating edit toggle
  function updateAddButtons() {
    document.querySelectorAll('table[data-edit-table]').forEach(table => {
      const T = table.dataset.editTable; let btn = table.parentNode.querySelector('.rmbh-add[data-for="' + T + '"]');
      if (!editMode()) { if (btn) btn.remove(); return; }
      if (!btn) {
        btn = document.createElement('button'); btn.className = 'rmbh-add'; btn.dataset.for = T;
        btn.textContent = '+ add row'; btn.style.cssText = 'margin:8px 0 0;font-size:12px;font-weight:600;color:#2F6B3A;background:#EAF2EC;border:1px solid #B7CDB0;border-radius:7px;padding:5px 12px;cursor:pointer';
        table.parentNode.insertBefore(btn, table.nextSibling);
        btn.addEventListener('click', async () => { const v = prompt('Add to "' + T + '" — keyword / item:'); if (!v) return; if (await post([{ table: T, op: 'add', value: { label: v } }])) refresh(); });
      }
    });
  }
  function toggleBtn() {
    let b = document.getElementById('rmbh-edit-toggle');
    if (!b) {
      b = document.createElement('button'); b.id = 'rmbh-edit-toggle';
      b.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:9999;font:600 13px Inter,system-ui,sans-serif;border:none;border-radius:22px;padding:10px 16px;cursor:pointer;box-shadow:0 3px 12px rgba(0,0,0,.18)';
      document.body.appendChild(b);
      b.addEventListener('click', () => {
        if (editMode()) { editKey = ''; try { localStorage.removeItem(KEYLS); } catch (e) {} }
        else { const k = prompt('Enter the team edit key to make changes:'); if (!k) return; editKey = k.trim(); try { localStorage.setItem(KEYLS, editKey); } catch (e) {} }
        paintToggle(); refresh();
      });
    }
    paintToggle();
  }
  function paintToggle() {
    const b = document.getElementById('rmbh-edit-toggle'); if (!b) return;
    b.textContent = editMode() ? '✓ Editing — click to finish' : '✎ Edit';
    b.style.background = editMode() ? '#2F6B3A' : '#fff'; b.style.color = editMode() ? '#fff' : '#5E2424';
  }

  async function init() { await load(); enhanceAll(); toggleBtn();
    // re-enhance when pages render tables late (app.js builds them after fetch)
    const mo = new MutationObserver(() => { clearTimeout(window.__rmbhT); window.__rmbhT = setTimeout(enhanceAll, 150); });
    mo.observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState !== 'loading') init(); else document.addEventListener('DOMContentLoaded', init);
  window.RMBHEdits = { refresh, enhanceAll };
})();

// Reconstructed /api/edits — the original function's source was never recovered from Vercel,
// so this reimplements the exact contract edits-ui.js depends on (see site/edits-ui.js):
//   GET  -> overlay JSON {tables, added, lastEdited}
//   POST -> header x-rmbh-key + body {ops:[{table, id?, op, value?}]} -> {overrides}
// Persists to Vercel Blob (requires BLOB_READ_WRITE_TOKEN on the project). If the blob store
// is empty or unreadable, GET falls back to the 2026-08-18 snapshot of the live overlay.
const PATHNAME = 'rmbh-dashboard/edits.json';
const SNAPSHOT = {
  tables: { coverage: { 'tzedakah meaning': { comment: '' } } },
  added: {},
  lastEdited: '2026-06-17T17:17:14.600Z',
};

async function readOverlay() {
  try {
    const { head } = await import('@vercel/blob');
    const h = await head(PATHNAME);
    const r = await fetch(h.url + '?ts=' + Date.now());
    if (r.ok) return await r.json();
  } catch (e) { /* no blob yet, or no token — serve the snapshot */ }
  return JSON.parse(JSON.stringify(SNAPSHOT));
}

async function writeOverlay(ov) {
  const { put } = await import('@vercel/blob');
  ov.lastEdited = new Date().toISOString();
  await put(PATHNAME, JSON.stringify(ov), {
    access: 'public', addRandomSuffix: false, allowOverwrite: true,
    contentType: 'application/json',
  });
}

module.exports = async (req, res) => {
  res.setHeader('cache-control', 'no-store');
  if (req.method === 'GET') return res.json(await readOverlay());
  if (req.method !== 'POST') return res.status(405).end();

  const key = process.env.RMBH_EDIT_KEY || process.env.EDIT_KEY || process.env.RMBH_KEY;
  if (!key || (req.headers['x-rmbh-key'] || '') !== key) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const ops = (req.body && req.body.ops) || [];
  const ov = await readOverlay();
  ov.tables = ov.tables || {}; ov.added = ov.added || {};
  for (const op of ops) {
    const T = op.table; if (!T) continue;
    const row = id => ((ov.tables[T] = ov.tables[T] || {})[id] = ov.tables[T][id] || {});
    if (op.op === 'comment') row(op.id).comment = op.value;
    else if (op.op === 'remove') row(op.id).removed = true;
    else if (op.op === 'restore') { if (ov.tables[T] && ov.tables[T][op.id]) delete ov.tables[T][op.id].removed; }
    else if (op.op === 'add') {
      (ov.added[T] = ov.added[T] || []).push({
        _id: 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        ...(op.value || {}),
      });
    } else if (op.op === 'delete-added') ov.added[T] = (ov.added[T] || []).filter(a => a._id !== op.id);
  }
  try { await writeOverlay(ov); }
  catch (e) { return res.status(500).json({ error: 'persist failed: ' + (e && e.message || e) }); }
  return res.json({ overrides: ov });
};

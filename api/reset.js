// Destructive admin operation: deletes all stored content blobs.
// After reset, /api/content falls back to the seed content.json in the repo.
// Requires password + ?confirm=yes to prevent accidents.

const { list, del } = require('@vercel/blob');

const BLOB_PATHNAME = 'content.json';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword) {
    return res.status(500).send('Server is not configured (missing ADMIN_PASSWORD)');
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).send('Missing BLOB_READ_WRITE_TOKEN');
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const { password, confirm } = body || {};

  if (password !== expectedPassword) {
    return res.status(401).send('Invalid password');
  }
  if (confirm !== 'yes') {
    return res.status(400).send('Missing confirm: "yes"');
  }

  try {
    const { blobs } = await list({ prefix: BLOB_PATHNAME, limit: 100 });
    const urls = (blobs || []).map((b) => b.url);
    if (urls.length === 0) {
      return res.status(200).json({ ok: true, deleted: 0, note: 'No blobs to delete' });
    }
    await del(urls);
    return res.status(200).json({ ok: true, deleted: urls.length });
  } catch (e) {
    console.error('Reset failed:', e);
    return res.status(502).send('Reset failed: ' + (e && e.message));
  }
};

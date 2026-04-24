// Writes an updated content JSON to Vercel Blob.
// Requires env vars:
//   ADMIN_PASSWORD        - editor password
//   BLOB_READ_WRITE_TOKEN - auto-injected when a Blob store is linked to the project

const { put } = require('@vercel/blob');

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
    return res.status(500).send(
      'Server is not configured (no BLOB_READ_WRITE_TOKEN). ' +
      'Create a Blob store in the Vercel dashboard and link it to this project.'
    );
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const { password, content } = body || {};

  if (password !== expectedPassword) {
    return res.status(401).send('Invalid password');
  }
  if (!content || typeof content !== 'object') {
    return res.status(400).send('Missing or invalid content object');
  }

  try {
    const json = JSON.stringify(content, null, 2) + '\n';
    const blob = await put(BLOB_PATHNAME, json, {
      access: 'public',
      allowOverwrite: true,
      contentType: 'application/json; charset=utf-8',
      cacheControlMaxAge: 0
    });
    return res.status(200).json({ ok: true, url: blob.url });
  } catch (e) {
    console.error('Blob put failed:', e);
    return res.status(502).send('Save failed: ' + (e && e.message));
  }
};

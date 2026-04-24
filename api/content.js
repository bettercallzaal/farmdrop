// Returns the latest content JSON.
// Reads from Vercel Blob (live edits from the admin panel).
// Falls back to the checked-in content.json seed if no blob exists yet.

const { head } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

const BLOB_PATHNAME = 'content.json';

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  // Try Vercel Blob first
  try {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const meta = await head(BLOB_PATHNAME);
      if (meta && meta.url) {
        const upstream = await fetch(meta.url, { cache: 'no-store' });
        if (upstream.ok) {
          const text = await upstream.text();
          return res.status(200).send(text);
        }
      }
    }
  } catch (e) {
    // BlobNotFoundError is expected on first run - fall through
    if (!/not\s*found/i.test(String(e && e.message))) {
      console.warn('Blob head failed:', e && e.message);
    }
  }

  // Fall back to seed file in the deploy
  try {
    const seedPath = path.join(process.cwd(), 'content.json');
    const seed = fs.readFileSync(seedPath, 'utf8');
    return res.status(200).send(seed);
  } catch (e) {
    return res.status(500).send(JSON.stringify({ error: 'No content available' }));
  }
};

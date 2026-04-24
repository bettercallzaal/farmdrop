// Returns the latest content JSON.
// Reads from Vercel Blob via list() (guaranteed to sort by uploadedAt desc,
// so we always pick the most recent blob even if older ones still exist).
// Falls back to the checked-in content.json seed if no blob exists yet.

const { list } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

const BLOB_PATHNAME = 'content.json';

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  // Try Vercel Blob
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { blobs } = await list({ prefix: BLOB_PATHNAME, limit: 10 });
      const match = (blobs || [])
        .filter((b) => b.pathname === BLOB_PATHNAME)
        .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
      if (match && match.url) {
        const upstream = await fetch(match.url, { cache: 'no-store' });
        if (upstream.ok) {
          const text = await upstream.text();
          return res.status(200).send(text);
        }
      }
    } catch (e) {
      console.warn('Blob list/fetch failed:', e && e.message);
    }
  }

  // Fall back to seed file
  try {
    const seedPath = path.join(process.cwd(), 'content.json');
    const seed = fs.readFileSync(seedPath, 'utf8');
    return res.status(200).send(seed);
  } catch (e) {
    return res.status(500).send(JSON.stringify({ error: 'No content available' }));
  }
};

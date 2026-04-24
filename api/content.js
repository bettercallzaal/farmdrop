// Returns the latest content JSON.
// Reads the newest Vercel Blob at content.json pathname, deep-merges it
// over the checked-in seed so newly-added fields always have defaults.
// Falls back to the seed entirely if the blob is missing or unreadable.

const { list } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

const BLOB_PATHNAME = 'content.json';

function deepMerge(base, override) {
  if (Array.isArray(override)) return override.slice();
  if (override && typeof override === 'object') {
    const out = base && typeof base === 'object' && !Array.isArray(base) ? { ...base } : {};
    for (const k of Object.keys(override)) {
      out[k] = deepMerge(out[k], override[k]);
    }
    return out;
  }
  return override === undefined ? base : override;
}

function readSeed() {
  const seedPath = path.join(process.cwd(), 'content.json');
  const raw = fs.readFileSync(seedPath, 'utf8');
  return JSON.parse(raw);
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  let seed = {};
  try { seed = readSeed(); } catch {}

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
          try {
            const blobJson = JSON.parse(text);
            const merged = deepMerge(seed, blobJson);
            return res.status(200).send(JSON.stringify(merged));
          } catch {
            // blob not valid JSON, fall through to seed
          }
        }
      }
    } catch (e) {
      console.warn('Blob list/fetch failed:', e && e.message);
    }
  }

  return res.status(200).send(JSON.stringify(seed));
};

// Commits updated content.json to the bettercallzaal/farmdrop main branch
// via the GitHub Contents API. Requires env vars:
//   ADMIN_PASSWORD - editor password
//   GITHUB_TOKEN   - fine-grained PAT with contents:write on this repo
//
// Optional env vars (defaults shown):
//   GH_OWNER=bettercallzaal
//   GH_REPO=farmdrop
//   GH_BRANCH=main
//   GH_FILE_PATH=content.json

const OWNER = process.env.GH_OWNER || 'bettercallzaal';
const REPO = process.env.GH_REPO || 'farmdrop';
const BRANCH = process.env.GH_BRANCH || 'main';
const FILE_PATH = process.env.GH_FILE_PATH || 'content.json';

async function githubFetch(path, options = {}) {
  const url = 'https://api.github.com' + path;
  const headers = {
    'Accept': 'application/vnd.github+json',
    'Authorization': 'Bearer ' + process.env.GITHUB_TOKEN,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'farmdrop-admin-editor',
    ...(options.headers || {})
  };
  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  let parsed;
  try { parsed = text ? JSON.parse(text) : {}; } catch { parsed = { raw: text }; }
  return { status: res.status, ok: res.ok, data: parsed };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  const expectedPassword = process.env.ADMIN_PASSWORD;
  const token = process.env.GITHUB_TOKEN;
  if (!expectedPassword || !token) {
    return res.status(500).send('Server is not configured (missing ADMIN_PASSWORD or GITHUB_TOKEN)');
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

  // Fetch current file SHA
  const getRes = await githubFetch(
    `/repos/${OWNER}/${REPO}/contents/${FILE_PATH}?ref=${encodeURIComponent(BRANCH)}`,
    { method: 'GET' }
  );
  if (!getRes.ok) {
    return res.status(502).send('Could not read current content.json: ' + JSON.stringify(getRes.data));
  }
  const sha = getRes.data && getRes.data.sha;
  if (!sha) {
    return res.status(502).send('No SHA on current file');
  }

  const json = JSON.stringify(content, null, 2) + '\n';
  const base64 = Buffer.from(json, 'utf8').toString('base64');

  const putRes = await githubFetch(
    `/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'chore: admin edit of content.json',
        content: base64,
        sha,
        branch: BRANCH,
        committer: {
          name: 'FarmDrop Editor',
          email: 'editor@farmdrop.us'
        }
      })
    }
  );

  if (!putRes.ok) {
    return res.status(502).send('Commit failed: ' + JSON.stringify(putRes.data));
  }

  res.status(200).json({ ok: true, commit: putRes.data.commit && putRes.data.commit.sha });
};

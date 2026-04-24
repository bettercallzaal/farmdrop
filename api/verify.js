// Verifies the admin password matches ADMIN_PASSWORD env var.
// Returns 200 OK on match, 401 on mismatch.

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return res.status(500).send('ADMIN_PASSWORD env var is not set');
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const provided = (body && body.password) || '';

  if (provided !== expected) {
    return res.status(401).send('Invalid password');
  }
  res.status(200).json({ ok: true });
};

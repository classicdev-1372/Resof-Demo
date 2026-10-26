// Resof backend — plain Node.js, no npm install needed (Node 16+).
// Run:  node server.js     then open http://localhost:3000
// Change the admin login with environment variables:  ADMIN_USER=you ADMIN_PASS=secret node server.js
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const PORT = process.env.PORT || 3000;
const USER = process.env.ADMIN_USER || 'admin', PASS = process.env.ADMIN_PASS || '123';
const DB = path.join(process.env.DATA_DIR || __dirname, 'data.json');   // set DATA_DIR to a persistent volume when hosting
const KEYS = ['courses', 'classes', 'resources', 'faculty', 'depts', 'societies', 'places', 'holidays'];
const empty = () => Object.fromEntries(KEYS.map(k => [k, []]));

let data = empty();
try { data = { ...empty(), ...JSON.parse(fs.readFileSync(DB, 'utf8')) }; } catch {}
const persist = () => { const tmp = DB + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(data, null, 1)); fs.renameSync(tmp, DB); };
if (!fs.existsSync(DB)) persist();

const sessions = new Map(), fails = new Map();           // token -> expiry, ip -> {n,t}
const hash = s => crypto.createHash('sha256').update(String(s ?? '')).digest();
const same = (a, b) => crypto.timingSafeEqual(hash(a), hash(b));
const bearer = req => (req.headers.authorization || '').slice(7);
const authed = req => { const e = sessions.get(bearer(req)); return !!e && e > Date.now(); };
const send = (res, code, payload, type = 'application/json') => {
  res.writeHead(code, { 'Content-Type': type + '; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(type === 'application/json' ? JSON.stringify(payload) : payload);
};
const readBody = req => new Promise((ok, no) => {
  let b = '';
  req.on('data', c => { b += c; if (b.length > 2e6) { no(413); req.destroy(); } });
  req.on('end', () => { try { ok(JSON.parse(b || '{}')); } catch { no(400); } });
});

// The website files. Only these four names are ever served, from /public (or, if you
// put everything in one flat folder, from next to server.js). Nothing else is exposed.
const WEB = new Map([['index.html', 'text/html'], ['styles.css', 'text/css'], ['app.js', 'text/javascript'], ['campus-map.png', 'image/png']]);
const findWeb = name => [path.join(__dirname, 'public', name), path.join(__dirname, name)].find(f => fs.existsSync(f));
function serveStatic(res, url) {
  const name = url === '/' ? 'index.html' : url.slice(1), type = WEB.get(name), file = type && findWeb(name);
  if (!file) return false;
  res.writeHead(200, { 'Content-Type': type + (type.startsWith('image') ? '' : '; charset=utf-8'),
    'Cache-Control': type === 'image/png' ? 'public, max-age=86400' : 'no-cache', 'X-Content-Type-Options': 'nosniff' });
  res.end(fs.readFileSync(file));
  return true;
}
const missing = () => [...WEB.keys()].filter(n => !findWeb(n));

http.createServer(async (req, res) => {
  try {
    const url = req.url.split('?')[0];
    // behind a host/tunnel every request comes from the proxy, so use the client IP it forwards
    const ip = (req.headers['x-forwarded-for'] || '').split(',').pop().trim() || req.socket.remoteAddress;

    // Anyone (students) can read
    if (url === '/api/data' && req.method === 'GET') return send(res, 200, data);

    // Only a logged-in admin can write
    if (url === '/api/data' && req.method === 'PUT') {
      if (!authed(req)) return send(res, 401, { error: 'unauthorized' });
      const b = await readBody(req), next = empty();
      for (const k of KEYS) {
        if (!Array.isArray(b[k]) || b[k].some(x => !x || typeof x !== 'object')) return send(res, 400, { error: 'invalid ' + k });
        next[k] = b[k];
      }
      data = next; persist();
      return send(res, 200, { ok: true });
    }

    if (url === '/api/login' && req.method === 'POST') {
      let f = fails.get(ip) || { n: 0, t: Date.now() };
      if (Date.now() - f.t > 6e5) f = { n: 0, t: Date.now() };         // 10-minute window
      if (f.n >= 5) return send(res, 429, { error: 'too many attempts' });
      const b = await readBody(req);
      if (same(b.u, USER) && same(b.p, PASS)) {
        fails.delete(ip);
        const token = crypto.randomBytes(24).toString('hex');
        sessions.set(token, Date.now() + 12 * 3600e3);                  // 12-hour session
        return send(res, 200, { token });
      }
      f.n++; fails.set(ip, f);
      return send(res, 401, { error: 'invalid' });
    }

    if (url === '/api/logout' && req.method === 'POST') { sessions.delete(bearer(req)); return send(res, 200, { ok: true }); }
    if (req.method === 'GET' && serveStatic(res, url)) return;      // the website files in /public
    if (req.method === 'GET' && url === '/')
      return send(res, 404, `<h2>Website files not found</h2><p>Missing: ${missing().join(', ')}</p><p>Put them in a folder named <b>public</b> next to server.js, then restart the server.</p>`, 'text/html');
    send(res, 404, { error: 'not found' });
  } catch (e) { send(res, typeof e === 'number' ? e : 500, { error: 'error' }); }
}).listen(PORT, () => {
  console.log(`Resof running at http://localhost:${PORT}`);
  if (missing().length) console.warn('WARNING: website files not found: ' + missing().join(', ') + ' — put them in a "public" folder next to server.js.');
  if (PASS === '123') console.warn('WARNING: using the default admin password. Set ADMIN_PASS before putting this online.');
});

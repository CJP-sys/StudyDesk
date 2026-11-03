import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import pg from 'pg';

const { Pool } = pg;
const required = ['DATABASE_URL', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing ${key}. Copy .env.example to .env and configure it.`);
}
if (process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be at least 32 characters.');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const app = express();
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
app.disable('x-powered-by');
// Existing pages use inline scripts/styles; keep Helmet's other headers while
// CSP is configured separately during a frontend security-header migration.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '1mb' }));
// Permit local development servers such as VS Code Live Server. Production
// deployments should serve the site and API from one origin or set an allowlist.
app.use((req, res, next) => {
  const origin = req.get('origin');
  const localOrigin = origin && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
  if (localOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
  }
  next();
});
app.use(express.static(projectRoot));

const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
// Apply numbered SQL migrations once, in order, before accepting requests.
async function migrate() {
  await pool.query('CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())');
  const { rows: applied } = await pool.query('SELECT version FROM schema_migrations');
  const done = new Set(applied.map((row) => row.version));
  const sql = await readFile(new URL('../schema.sql', import.meta.url), 'utf8');
  if (!done.has('001_initial_schema')) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations(version) VALUES ('001_initial_schema') ON CONFLICT DO NOTHING");
      await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }
}
const issueToken = (user) => jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const authenticate = (req, res, next) => {
  const token = req.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return res.status(401).json({ error: 'Please log in.' });
  try { req.userId = jwt.verify(token, process.env.JWT_SECRET).sub; next(); }
  catch { return res.status(401).json({ error: 'Session expired. Please log in again.' }); }
};

app.get('/api/health', asyncRoute(async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok', database: 'connected' });
}));

app.post('/api/auth/register', asyncRoute(async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!name || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || password.length > 200)
    return res.status(400).json({ error: 'Enter a name, valid email, and password (8–200 characters).' });
  const passwordHash = await bcrypt.hash(password, 12);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('INSERT INTO users (name,email,password_hash) VALUES ($1,$2,$3) RETURNING id,name,email', [name,email,passwordHash]);
    await client.query('INSERT INTO study_data(user_id) VALUES ($1)', [rows[0].id]);
    await client.query('COMMIT');
    res.status(201).json({ token: issueToken(rows[0]), user: rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') return res.status(409).json({ error: 'That email already has an account. Try logging in.' });
    throw error;
  } finally { client.release(); }
}));

app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const { rows } = await pool.query('SELECT id,name,email,password_hash FROM users WHERE email=$1', [email]);
  if (!rows[0] || !(await bcrypt.compare(password, rows[0].password_hash)))
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  const { id, name } = rows[0];
  res.json({ token: issueToken({ id }), user: { id, name, email } });
}));

app.get('/api/data', authenticate, asyncRoute(async (req, res) => {
  const { rows } = await pool.query('SELECT data FROM study_data WHERE user_id=$1', [req.userId]);
  if (!rows[0]) return res.status(404).json({ error: 'Study data not found.' });
  res.json(rows[0].data);
}));

app.put('/api/data', authenticate, asyncRoute(async (req, res) => {
  const data = req.body;
  const collections = ['subjects', 'notes', 'tasks', 'cards', 'log', 'plans'];
  const valid = data && typeof data === 'object' && !Array.isArray(data) &&
    Buffer.byteLength(JSON.stringify(data)) <= 1_000_000 &&
    collections.every((key) => Array.isArray(data[key]) && data[key].length <= 10000 && data[key].every((item) => item && typeof item === 'object' && !Array.isArray(item)));
  if (!valid) return res.status(400).json({ error: 'Study data must contain valid subjects, notes, tasks, cards, log and plans arrays under 1 MB.' });
  const { rows } = await pool.query(
    'INSERT INTO study_data(user_id,data,updated_at) VALUES ($1,$2::jsonb,now()) ON CONFLICT(user_id) DO UPDATE SET data=EXCLUDED.data,updated_at=now() RETURNING updated_at',
    [req.userId, JSON.stringify(data)]
  );
  res.json({ saved: true, updatedAt: rows[0].updated_at });
}));

// Collection endpoints give clients resource-level access while the existing
// single-page app continues to sync its aggregate state through /api/data.
const resourceKeys = { subjects: 'subjects', notes: 'notes', tasks: 'tasks', flashcards: 'cards', plans: 'plans', reviews: 'log' };
app.get('/api/:resource', authenticate, asyncRoute(async (req, res) => {
  const key = resourceKeys[req.params.resource];
  if (!key) return res.status(404).json({ error: 'Unknown resource.' });
  const { rows } = await pool.query('SELECT data->$2 AS items FROM study_data WHERE user_id=$1', [req.userId, key]);
  if (!rows[0]) return res.status(404).json({ error: 'Study data not found.' });
  res.json(rows[0].items || []);
}));
app.put('/api/:resource', authenticate, asyncRoute(async (req, res) => {
  const key = resourceKeys[req.params.resource];
  const items = req.body?.items;
  if (!key) return res.status(404).json({ error: 'Unknown resource.' });
  if (!Array.isArray(items) || items.length > 10000 || items.some((item) => !item || typeof item !== 'object' || Array.isArray(item)))
    return res.status(400).json({ error: 'items must be an array of objects (maximum 10,000).' });
  const { rowCount } = await pool.query('UPDATE study_data SET data=jsonb_set(data,$2::text[],$3::jsonb,true),updated_at=now() WHERE user_id=$1', [req.userId, [key], JSON.stringify(items)]);
  if (!rowCount) return res.status(404).json({ error: 'Study data not found.' });
  res.json({ saved: true, count: items.length });
}));

app.use((err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Request body must be valid JSON.' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request body is too large.' });
  console.error(err);
  res.status(500).json({ error: 'Server error. Check the API log for details.' });
});

const port = Number(process.env.PORT || 3000);
await migrate();
const server = app.listen(port, () => console.log(`StudyDesk API listening on http://localhost:${port}`));
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.close(async () => { await pool.end(); process.exit(0); }));

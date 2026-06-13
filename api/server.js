const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8001;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(cors());
app.use(express.json());
app.disable('x-powered-by');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY, username TEXT UNIQUE NOT NULL, display_name TEXT NOT NULL,
        password_hash TEXT NOT NULL, locale TEXT NOT NULL DEFAULT 'en',
        is_owner BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS auth_sessions (
        id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT UNIQUE NOT NULL, expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS api_tokens (
        id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT UNIQUE NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        version INTEGER NOT NULL DEFAULT 1, profile JSONB NOT NULL,
        completed_at TIMESTAMPTZ, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS weeks (
        id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        week_start DATE NOT NULL
      );
      CREATE TABLE IF NOT EXISTS office_days (
        id SERIAL PRIMARY KEY, week_id INTEGER NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
        day TEXT NOT NULL, UNIQUE (week_id, day)
      );
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY, week_id INTEGER NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
        day TEXT NOT NULL, type TEXT NOT NULL, category TEXT, name TEXT NOT NULL,
        time_slot TEXT, is_commute BOOLEAN NOT NULL DEFAULT FALSE,
        status TEXT NOT NULL DEFAULT 'pending', felt TEXT, notes TEXT, brief TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0
      );
      ALTER TABLE weeks ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
      ALTER TABLE sessions ADD COLUMN IF NOT EXISTS category TEXT;
      ALTER TABLE sessions ADD COLUMN IF NOT EXISTS brief TEXT;
      UPDATE sessions SET category = CASE type
        WHEN 'football' THEN 'sport' WHEN 'speed' THEN 'cardio' WHEN 'chinese' THEN 'learning'
        WHEN 'strength' THEN 'strength' WHEN 'cardio' THEN 'cardio' ELSE 'other' END
        WHERE category IS NULL;
      ALTER TABLE weeks DROP CONSTRAINT IF EXISTS weeks_week_start_key;
      ALTER TABLE weeks DROP CONSTRAINT IF EXISTS weeks_user_id_week_start_key;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_weeks_user_week_start ON weeks(user_id, week_start);
      CREATE INDEX IF NOT EXISTS idx_sessions_week_id ON sessions(week_id);
      CREATE INDEX IF NOT EXISTS idx_office_days_week_id ON office_days(week_id);
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_token_hash ON auth_sessions(token_hash);
      CREATE INDEX IF NOT EXISTS idx_api_tokens_token_hash ON api_tokens(token_hash);
    `);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

const distDir = path.join(__dirname, 'frontend', 'dist');
const hasDist = fs.existsSync(distDir);
if (hasDist) app.use(express.static(distDir));

const VALID_OFFICE_DAYS = new Set(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
const VALID_STATUSES = new Set(['pending', 'done', 'injured', 'cancelled', 'skipped']);
const VALID_FELT = new Set(['great', 'good', 'okay', 'tough']);

const DAY_ORDER_SQL = `CASE day
  WHEN 'monday'    THEN 1
  WHEN 'tuesday'   THEN 2
  WHEN 'wednesday' THEN 3
  WHEN 'thursday'  THEN 4
  WHEN 'friday'    THEN 5
  WHEN 'saturday'  THEN 6
  WHEN 'sunday'    THEN 7
  ELSE 8 END`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getMondayOfCurrentWeek() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
}

async function getSessionsForWeek(weekId) {
  const result = await pool.query(
    `SELECT * FROM sessions WHERE week_id = $1 ORDER BY ${DAY_ORDER_SQL}, sort_order`,
    [weekId]
  );
  return result.rows;
}

// ─── Routes ──────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const { router: authRouter, optionalAuth, requireAuth } = require('./auth')(pool);
app.use('/api/auth', authRouter);
app.use('/api', optionalAuth, requireAuth);

const createAIRouter = require('./ai');
app.use('/api/ai', createAIRouter(pool));
app.use('/api/profile', require('./profile')(pool));

// GET /api/sessions?week=YYYY-MM-DD
app.get('/api/sessions', async (req, res) => {
  try {
    const { week } = req.query;
    if (!week) return res.status(400).json({ error: 'week parameter required' });

    const weekRow = await pool.query('SELECT id FROM weeks WHERE user_id = $1 AND week_start = $2', [req.user.id, week]);
    if (weekRow.rows.length === 0) return res.json({ sessions: [], week_exists: false });

    const sessions = await getSessionsForWeek(weekRow.rows[0].id);
    res.json({ sessions, week_exists: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/week-status — checks whether the current week has a generated plan
app.get('/api/week-status', async (req, res) => {
  try {
    const weekStart = getMondayOfCurrentWeek();
    const weekRow = await pool.query('SELECT id FROM weeks WHERE user_id = $1 AND week_start = $2', [req.user.id, weekStart]);

    if (weekRow.rows.length === 0) {
      return res.json({ seeded: false, needs_setup: true, week_start: weekStart });
    }

    const weekId = weekRow.rows[0].id;
    const sessionCount = await pool.query(
      'SELECT COUNT(*) FROM sessions WHERE week_id = $1',
      [weekId]
    );

    if (parseInt(sessionCount.rows[0].count, 10) === 0) {
      return res.json({ seeded: false, needs_setup: true, week_start: weekStart });
    }

    res.json({ seeded: true, week_start: weekStart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/sessions/:id
app.patch('/api/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, felt, notes, time_slot } = req.body;
    if (status !== undefined && !VALID_STATUSES.has(status)) return res.status(400).json({ error: 'Invalid status' });
    if (felt !== undefined && felt !== null && !VALID_FELT.has(felt)) return res.status(400).json({ error: 'Invalid felt rating' });
    if (notes !== undefined && typeof notes !== 'string') return res.status(400).json({ error: 'Invalid notes' });
    if (time_slot !== undefined && typeof time_slot !== 'string') return res.status(400).json({ error: 'Invalid time slot' });

    const setClauses = [];
    const values = [];
    let i = 1;

    if (status    !== undefined) { setClauses.push(`status = $${i++}`);    values.push(status); }
    if (felt      !== undefined) { setClauses.push(`felt = $${i++}`);      values.push(felt); }
    if (notes     !== undefined) { setClauses.push(`notes = $${i++}`);     values.push(notes); }
    if (time_slot !== undefined) { setClauses.push(`time_slot = $${i++}`); values.push(time_slot); }

    if (setClauses.length === 0) return res.status(400).json({ error: 'Nothing to update' });

    values.push(id, req.user.id);
    const result = await pool.query(
      `UPDATE sessions SET ${setClauses.join(', ')}
       WHERE id = $${i} AND week_id IN (SELECT id FROM weeks WHERE user_id = $${i + 1})
       RETURNING *`,
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Session not found' });
    res.json({ session: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/weeks?week=YYYY-MM-DD
app.delete('/api/weeks', async (req, res) => {
  try {
    const { week } = req.query;
    if (!week) return res.status(400).json({ error: 'week parameter required' });
    const result = await pool.query('DELETE FROM weeks WHERE user_id = $1 AND week_start = $2 RETURNING id', [req.user.id, week]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Week not found' });
    res.json({ message: 'Week deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/weeks
app.get('/api/weeks', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        w.id,
        w.week_start,
        COUNT(s.id)                                          AS total,
        COUNT(s.id) FILTER (WHERE s.status = 'done')        AS done,
        COUNT(s.id) FILTER (WHERE s.status = 'injured')     AS injured,
        COUNT(s.id) FILTER (WHERE s.status = 'cancelled')   AS cancelled,
        COUNT(s.id) FILTER (WHERE s.status = 'skipped')     AS skipped,
        COUNT(s.id) FILTER (WHERE s.status = 'pending')     AS pending
      FROM weeks w
      LEFT JOIN sessions s ON s.week_id = w.id
      WHERE w.user_id = $1
      GROUP BY w.id, w.week_start
      ORDER BY w.week_start DESC
    `, [req.user.id]);
    res.json({ weeks: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats
app.get('/api/stats', async (req, res) => {
  try {
    const [totals, weekCount, byType, feltDist, avgWeek] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)                                           AS total,
          COUNT(*) FILTER (WHERE status = 'done')           AS done,
          COUNT(*) FILTER (WHERE status = 'injured')        AS injured,
          COUNT(*) FILTER (WHERE status = 'cancelled')      AS cancelled,
          COUNT(*) FILTER (WHERE status = 'skipped')        AS skipped
        FROM sessions s JOIN weeks w ON w.id = s.week_id WHERE w.user_id = $1
      `, [req.user.id]),
      pool.query('SELECT COUNT(*) AS count FROM weeks WHERE user_id = $1', [req.user.id]),
      pool.query(`
        SELECT
          category,
          COUNT(*) FILTER (WHERE status = 'done')             AS done,
          COUNT(*) FILTER (WHERE status = 'injured')          AS injured,
          COUNT(*) FILTER (WHERE status NOT IN ('cancelled')) AS total
        FROM sessions s JOIN weeks w ON w.id = s.week_id
        WHERE w.user_id = $1
        GROUP BY category
      `, [req.user.id]),
      pool.query(`
        SELECT felt, COUNT(*)::int AS count
        FROM sessions s JOIN weeks w ON w.id = s.week_id
        WHERE w.user_id = $1 AND felt IS NOT NULL
        GROUP BY felt
      `, [req.user.id]),
      pool.query(`
        SELECT COALESCE(ROUND(AVG(done_count)::numeric, 1), 0) AS avg
        FROM (
          SELECT COUNT(*) FILTER (WHERE status = 'done') AS done_count
          FROM sessions s JOIN weeks w ON w.id = s.week_id
          WHERE w.user_id = $1
          GROUP BY week_id
        ) t
      `, [req.user.id]),
    ]);

    const { total, done, injured } = totals.rows[0];
    const totalInt = parseInt(total, 10);
    const doneInt  = parseInt(done, 10);

    res.json({
      total_sessions:  totalInt,
      completed:       doneInt,
      completion_rate: totalInt > 0 ? Math.round((doneInt / totalInt) * 100) : 0,
      injured:         parseInt(injured, 10),
      cancelled:       parseInt(totals.rows[0].cancelled, 10),
      skipped:         parseInt(totals.rows[0].skipped, 10),
      weeks_tracked:   parseInt(weekCount.rows[0].count, 10),
      avg_per_week:    parseFloat(avgWeek.rows[0]?.avg ?? '0'),
      by_type:         Object.fromEntries(
        byType.rows.map(r => [r.category, {
          done:    parseInt(r.done, 10),
          injured: parseInt(r.injured, 10),
          total:   parseInt(r.total, 10),
        }])
      ),
      felt_dist: Object.fromEntries(
        feltDist.rows.map(r => [r.felt, r.count])
      ),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/office-days?week=YYYY-MM-DD
app.get('/api/office-days', async (req, res) => {
  try {
    const { week } = req.query;
    if (!week) return res.status(400).json({ error: 'week parameter required' });

    const weekRow = await pool.query('SELECT id FROM weeks WHERE user_id = $1 AND week_start = $2', [req.user.id, week]);
    if (weekRow.rows.length === 0) return res.json({ office_days: [] });

    const result = await pool.query(
      'SELECT day FROM office_days WHERE week_id = $1',
      [weekRow.rows[0].id]
    );
    res.json({ office_days: result.rows.map(r => r.day) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/office-days  body: { week_start, days: ['monday', 'wednesday', ...] }
app.post('/api/office-days', async (req, res) => {
  const client = await pool.connect();
  try {
    const { week_start, days } = req.body;
    if (!week_start || !Array.isArray(days)) {
      return res.status(400).json({ error: 'week_start and days[] required' });
    }
    if (days.some(day => !VALID_OFFICE_DAYS.has(day))) return res.status(400).json({ error: 'Invalid office day' });
    const uniqueDays = [...new Set(days)];
    await client.query('BEGIN');
    const week = await client.query(
      `INSERT INTO weeks (user_id, week_start) VALUES ($1, $2)
       ON CONFLICT (user_id, week_start) DO UPDATE SET week_start = EXCLUDED.week_start
       RETURNING id`,
      [req.user.id, week_start],
    );
    const weekId = week.rows[0].id;

    // Check if sessions already exist — if so, just update office_days record
    const sessionCount = await client.query(
      'SELECT COUNT(*) FROM sessions WHERE week_id = $1',
      [weekId]
    );
    const alreadySeeded = parseInt(sessionCount.rows[0].count, 10) > 0;

    await client.query('DELETE FROM office_days WHERE week_id = $1', [weekId]);
    for (const day of uniqueDays) {
      await client.query(
        'INSERT INTO office_days (week_id, day) VALUES ($1, $2)',
        [weekId, day]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Office days saved', week_id: weekId, already_seeded: alreadySeeded });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Widget script
app.use('/widget', express.static(path.join(__dirname, 'widget')));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// SPA fallback — only in production where the build exists
if (hasDist) {
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

migrate()
  .then(() => app.listen(PORT, () => console.log(`Habitual listening on :${PORT}`)))
  .catch(err => {
    console.error('Database migration failed', err);
    process.exit(1);
  });

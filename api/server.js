const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8001;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));

// ─── Session templates ───────────────────────────────────────────────────────
// Each session has a wfh_slot (WFH day time) and office_slot (office day time).
// Commute sessions (is_commute: true) only appear on office days.
// null wfh_slot means session only exists on office days.
const SESSION_TEMPLATES = [
  // Monday: speed + strength block — morning on WFH, evening on office days (capped at 60 min total)
  { day: 'monday',    type: 'speed',    name: 'Dynamic warmup',      wfh_slot: '7:30 – 7:50',   office_slot: '18:30 – 18:45', is_commute: false, sort_order: 1 },
  { day: 'monday',    type: 'speed',    name: 'Sprint & plyo block', wfh_slot: '7:50 – 8:10',   office_slot: '18:45 – 19:05', is_commute: false, sort_order: 2 },
  { day: 'monday',    type: 'strength', name: 'Lower body strength', wfh_slot: '8:10 – 8:40',   office_slot: '19:05 – 19:30', is_commute: false, sort_order: 3 },
  { day: 'monday',    type: 'chinese',  name: 'Anki',                wfh_slot: '21:30 – 21:40', office_slot: '21:30 – 21:40', is_commute: false, sort_order: 4 },
  // Tuesday: fixed 5-a-side + Anki
  { day: 'tuesday',   type: 'football', name: '5-a-side football',   wfh_slot: '19:00 – 20:00', office_slot: '19:00 – 20:00', is_commute: false, sort_order: 1 },
  { day: 'tuesday',   type: 'chinese',  name: 'Anki',                wfh_slot: '21:30 – 21:40', office_slot: '21:30 – 21:40', is_commute: false, sort_order: 2 },
  // Wednesday: strength is WFH-morning only (office_slot: null = skip on office days).
  // Office Wednesday evening: cardio + ball mastery = 60 min total.
  { day: 'wednesday', type: 'strength', name: 'Upper body & core',   wfh_slot: '7:00 – 8:00',   office_slot: null,            is_commute: false, sort_order: 1 },
  { day: 'wednesday', type: 'chinese',  name: 'Pimsleur',            wfh_slot: null,             office_slot: 'Commute × 2',   is_commute: true,  sort_order: 2 },
  { day: 'wednesday', type: 'cardio',   name: 'Zone 2 jog',          wfh_slot: '19:30 – 20:00', office_slot: '19:00 – 19:30', is_commute: false, sort_order: 3 },
  { day: 'wednesday', type: 'football', name: 'Ball mastery drills', wfh_slot: '20:00 – 20:30', office_slot: '19:30 – 20:00', is_commute: false, sort_order: 4 },
  // Thursday: commute Pimsleur + fixed 5-a-side + Anki
  { day: 'thursday',  type: 'chinese',  name: 'Pimsleur',            wfh_slot: null,             office_slot: 'Commute × 2',   is_commute: true,  sort_order: 1 },
  { day: 'thursday',  type: 'football', name: '5-a-side football',   wfh_slot: '20:00 – 21:00', office_slot: '20:00 – 21:00', is_commute: false, sort_order: 2 },
  { day: 'thursday',  type: 'chinese',  name: 'Anki',                wfh_slot: '21:30 – 21:40', office_slot: '21:30 – 21:40', is_commute: false, sort_order: 3 },
  // Friday: commute Pimsleur only
  { day: 'friday',    type: 'chinese',  name: 'Pimsleur',            wfh_slot: null,             office_slot: 'Commute × 2',   is_commute: true,  sort_order: 1 },
  // Sunday: fixed match
  { day: 'sunday',    type: 'football', name: '11-a-side match',     wfh_slot: '10:30',          office_slot: '10:30',         is_commute: false, sort_order: 1 },
];

// Build the list of sessions to insert for a given set of office days.
function buildWeekSchedule(officeDays) {
  const officeSet = new Set(officeDays);
  const result = [];
  for (const t of SESSION_TEMPLATES) {
    const isOfficeDay = officeSet.has(t.day);
    if (t.is_commute && !isOfficeDay) continue;            // commute sessions: office days only
    if (!isOfficeDay && t.wfh_slot === null) continue;     // no WFH version
    if (isOfficeDay && t.office_slot === null) continue;   // WFH-only session (e.g. Wed morning strength)
    result.push({
      day: t.day,
      type: t.type,
      name: t.name,
      time_slot: isOfficeDay ? t.office_slot : t.wfh_slot,
      is_commute: t.is_commute || false,
      sort_order: t.sort_order,
    });
  }
  return result;
}

// Compute which pending sessions would change given new office days.
// Returns array of {type:'update'|'add'|'remove', session_id?, name, day, old_slot?, new_slot?}
function computeRescheduleChanges(currentSessions, newSchedule) {
  const pending = currentSessions.filter(s => s.status === 'pending');
  const currentMap = new Map(pending.map(s => [`${s.day}:${s.name}`, s]));
  const newMap     = new Map(newSchedule.map(t => [`${t.day}:${t.name}`, t]));

  const changes = [];
  for (const [key, s] of currentMap) {
    const next = newMap.get(key);
    if (!next) {
      changes.push({ type: 'remove', session_id: s.id, name: s.name, day: s.day, old_slot: s.time_slot });
    } else if (next.time_slot !== s.time_slot) {
      changes.push({ type: 'update', session_id: s.id, name: s.name, day: s.day, old_slot: s.time_slot, new_slot: next.time_slot });
    }
  }
  for (const [key, t] of newMap) {
    if (!currentMap.has(key)) {
      changes.push({ type: 'add', name: t.name, day: t.day, new_slot: t.time_slot });
    }
  }
  return changes;
}

// Apply a reschedule: update time slots, remove stale sessions, insert new ones.
async function applyReschedule(weekId, newSchedule, currentSessions) {
  const pending    = currentSessions.filter(s => s.status === 'pending');
  const currentMap = new Map(pending.map(s => [`${s.day}:${s.name}`, s]));
  const newMap     = new Map(newSchedule.map(t => [`${t.day}:${t.name}`, t]));

  for (const [key, s] of currentMap) {
    const next = newMap.get(key);
    if (!next) {
      await pool.query('DELETE FROM sessions WHERE id = $1', [s.id]);
    } else if (next.time_slot !== s.time_slot) {
      await pool.query('UPDATE sessions SET time_slot = $1 WHERE id = $2', [next.time_slot, s.id]);
    }
  }
  for (const [key, t] of newMap) {
    if (!currentMap.has(key)) {
      await pool.query(
        `INSERT INTO sessions (week_id, day, type, name, time_slot, is_commute, status, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)`,
        [weekId, t.day, t.type, t.name, t.time_slot, t.is_commute, t.sort_order]
      );
    }
  }
}

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

async function getOrCreateWeek(weekStart) {
  const existing = await pool.query('SELECT id FROM weeks WHERE week_start = $1', [weekStart]);
  if (existing.rows.length > 0) return existing.rows[0].id;
  const inserted = await pool.query(
    'INSERT INTO weeks (week_start) VALUES ($1) RETURNING id',
    [weekStart]
  );
  return inserted.rows[0].id;
}

async function seedWeek(weekId, officeDays) {
  const schedule = buildWeekSchedule(officeDays);
  for (const t of schedule) {
    await pool.query(
      `INSERT INTO sessions (week_id, day, type, name, time_slot, is_commute, status, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)`,
      [weekId, t.day, t.type, t.name, t.time_slot, t.is_commute, t.sort_order]
    );
  }
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

const createAIRouter = require('./ai');
app.use('/api/ai', createAIRouter(pool));

// GET /api/sessions?week=YYYY-MM-DD
app.get('/api/sessions', async (req, res) => {
  try {
    const { week } = req.query;
    if (!week) return res.status(400).json({ error: 'week parameter required' });

    const weekRow = await pool.query('SELECT id FROM weeks WHERE week_start = $1', [week]);
    if (weekRow.rows.length === 0) return res.json({ sessions: [], week_exists: false });

    const sessions = await getSessionsForWeek(weekRow.rows[0].id);
    res.json({ sessions, week_exists: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/seed?week=YYYY-MM-DD
app.post('/api/seed', async (req, res) => {
  try {
    const { week } = req.query;
    if (!week) return res.status(400).json({ error: 'week parameter required' });

    const weekId = await getOrCreateWeek(week);

    const existing = await pool.query(
      'SELECT id FROM sessions WHERE week_id = $1 LIMIT 1',
      [weekId]
    );
    if (existing.rows.length > 0) {
      const sessions = await getSessionsForWeek(weekId);
      return res.json({ message: 'Already seeded', sessions });
    }

    const officeDaysRows = await pool.query(
      'SELECT day FROM office_days WHERE week_id = $1',
      [weekId]
    );
    const officeDays = officeDaysRows.rows.map(r => r.day);

    await seedWeek(weekId, officeDays);
    const sessions = await getSessionsForWeek(weekId);
    res.json({ message: 'Week seeded', sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/seed-auto  — checks current week, returns needs_setup if not configured
app.post('/api/seed-auto', async (req, res) => {
  try {
    const weekStart = getMondayOfCurrentWeek();
    const weekRow = await pool.query('SELECT id FROM weeks WHERE week_start = $1', [weekStart]);

    if (weekRow.rows.length === 0) {
      return res.json({ seeded: false, needs_setup: true, week_start: weekStart });
    }

    const weekId = weekRow.rows[0].id;
    const sessionCount = await pool.query(
      'SELECT COUNT(*) FROM sessions WHERE week_id = $1',
      [weekId]
    );

    if (parseInt(sessionCount.rows[0].count, 10) === 0) {
      // Office days saved but sessions not yet seeded — seed now
      const officeDaysRows = await pool.query(
        'SELECT day FROM office_days WHERE week_id = $1',
        [weekId]
      );
      await seedWeek(weekId, officeDaysRows.rows.map(r => r.day));
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

    const setClauses = [];
    const values = [];
    let i = 1;

    if (status    !== undefined) { setClauses.push(`status = $${i++}`);    values.push(status); }
    if (felt      !== undefined) { setClauses.push(`felt = $${i++}`);      values.push(felt); }
    if (notes     !== undefined) { setClauses.push(`notes = $${i++}`);     values.push(notes); }
    if (time_slot !== undefined) { setClauses.push(`time_slot = $${i++}`); values.push(time_slot); }

    if (setClauses.length === 0) return res.status(400).json({ error: 'Nothing to update' });

    values.push(id);
    const result = await pool.query(
      `UPDATE sessions SET ${setClauses.join(', ')} WHERE id = $${i} RETURNING *`,
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
    const result = await pool.query('DELETE FROM weeks WHERE week_start = $1 RETURNING id', [week]);
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
      GROUP BY w.id, w.week_start
      ORDER BY w.week_start DESC
    `);
    res.json({ weeks: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats
app.get('/api/stats', async (req, res) => {
  try {
    const totals = await pool.query(`
      SELECT
        COUNT(*)                                           AS total,
        COUNT(*) FILTER (WHERE status = 'done')           AS done,
        COUNT(*) FILTER (WHERE status = 'injured')        AS injured,
        COUNT(*) FILTER (WHERE status = 'cancelled')      AS cancelled,
        COUNT(*) FILTER (WHERE status = 'skipped')        AS skipped
      FROM sessions
    `);
    const weekCount = await pool.query('SELECT COUNT(*) AS count FROM weeks');
    const topInjured = await pool.query(`
      SELECT type, COUNT(*) AS count
      FROM sessions
      WHERE status = 'injured'
      GROUP BY type
      ORDER BY count DESC
      LIMIT 1
    `);

    const { total, done, injured } = totals.rows[0];
    const totalInt = parseInt(total, 10);
    const doneInt  = parseInt(done, 10);

    res.json({
      total_sessions:      totalInt,
      completed:           doneInt,
      completion_rate:     totalInt > 0 ? Math.round((doneInt / totalInt) * 100) : 0,
      injured:             parseInt(injured, 10),
      cancelled:           parseInt(totals.rows[0].cancelled, 10),
      skipped:             parseInt(totals.rows[0].skipped, 10),
      weeks_tracked:       parseInt(weekCount.rows[0].count, 10),
      most_injured_type:   topInjured.rows[0]?.type ?? null,
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

    const weekRow = await pool.query('SELECT id FROM weeks WHERE week_start = $1', [week]);
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
  try {
    const { week_start, days } = req.body;
    if (!week_start || !Array.isArray(days)) {
      return res.status(400).json({ error: 'week_start and days[] required' });
    }

    const weekId = await getOrCreateWeek(week_start);

    // Check if sessions already exist — if so, just update office_days record
    const sessionCount = await pool.query(
      'SELECT COUNT(*) FROM sessions WHERE week_id = $1',
      [weekId]
    );
    const alreadySeeded = parseInt(sessionCount.rows[0].count, 10) > 0;

    await pool.query('DELETE FROM office_days WHERE week_id = $1', [weekId]);
    for (const day of days) {
      await pool.query(
        'INSERT INTO office_days (week_id, day) VALUES ($1, $2)',
        [weekId, day]
      );
    }

    res.json({ message: 'Office days saved', week_id: weekId, already_seeded: alreadySeeded });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reschedule-preview  body: { week_start, days: [...] }
// Returns the list of changes (updates/adds/removes) that would occur for pending sessions.
app.post('/api/reschedule-preview', async (req, res) => {
  try {
    const { week_start, days } = req.body;
    if (!week_start || !Array.isArray(days)) {
      return res.status(400).json({ error: 'week_start and days[] required' });
    }
    const weekRow = await pool.query('SELECT id FROM weeks WHERE week_start = $1', [week_start]);
    if (weekRow.rows.length === 0) return res.json({ changes: [] });

    const currentSessions = await getSessionsForWeek(weekRow.rows[0].id);
    const newSchedule = buildWeekSchedule(days);
    const changes = computeRescheduleChanges(currentSessions, newSchedule);
    res.json({ changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reschedule-apply  body: { week_start, days: [...] }
// Saves new office days and applies the reschedule to pending sessions.
app.post('/api/reschedule-apply', async (req, res) => {
  try {
    const { week_start, days } = req.body;
    if (!week_start || !Array.isArray(days)) {
      return res.status(400).json({ error: 'week_start and days[] required' });
    }
    const weekId = await getOrCreateWeek(week_start);
    const currentSessions = await getSessionsForWeek(weekId);
    const newSchedule = buildWeekSchedule(days);

    await pool.query('DELETE FROM office_days WHERE week_id = $1', [weekId]);
    for (const day of days) {
      await pool.query('INSERT INTO office_days (week_id, day) VALUES ($1, $2)', [weekId, day]);
    }

    await applyReschedule(weekId, newSchedule, currentSessions);
    const sessions = await getSessionsForWeek(weekId);
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Widget script
app.use('/widget', express.static(path.join(__dirname, 'widget')));

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

app.listen(PORT, () => console.log(`Habitual listening on :${PORT}`));

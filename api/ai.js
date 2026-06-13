const Anthropic = require('@anthropic-ai/sdk');
const { CATEGORIES, DAYS } = require('./profile');

const SYSTEM = `You are the weekly planning assistant for Habitual.

Build plans from the authenticated user's profile, not from generic defaults. Their recurring commitments are anchors. Work toward higher-priority goals and target frequencies using preferred activities and availability windows. Adapt volume using recent completion and felt ratings. Respect equipment, limitations, disliked activities, office days, injuries, cancellations, and temporary notes.

For a new week, session_updates must be empty and new_sessions must contain the complete plan. For an existing week, preserve unaffected sessions and only propose necessary updates or additions. Each new session needs a concise actionable brief. Never invent detailed medical advice. Always use propose_changes so the user reviews the plan before it is saved.`;

const tools = [{
  name: 'propose_changes',
  description: 'Propose personalized weekly schedule changes for review.',
  input_schema: {
    type: 'object',
    required: ['summary', 'session_updates', 'new_sessions'],
    properties: {
      summary: { type: 'string' },
      office_days: {
        type: 'array',
        items: { type: 'string', enum: [...DAYS].filter(day => day !== 'saturday' && day !== 'sunday') },
      },
      session_updates: {
        type: 'array',
        items: {
          type: 'object',
          required: ['session_id'],
          properties: {
            session_id: { type: 'integer' },
            status: { type: 'string', enum: ['pending', 'done', 'injured', 'cancelled', 'skipped'] },
            time_slot: { type: 'string' },
            notes: { type: 'string' },
            brief: { type: 'string' },
          },
        },
      },
      new_sessions: {
        type: 'array',
        items: {
          type: 'object',
          required: ['day', 'category', 'name', 'time_slot', 'brief'],
          properties: {
            day: { type: 'string', enum: [...DAYS] },
            category: { type: 'string', enum: [...CATEGORIES] },
            name: { type: 'string' },
            time_slot: { type: 'string' },
            brief: { type: 'string' },
          },
        },
      },
    },
  },
}];

const DAY_ORDER_SQL = `CASE day
  WHEN 'monday' THEN 1 WHEN 'tuesday' THEN 2 WHEN 'wednesday' THEN 3
  WHEN 'thursday' THEN 4 WHEN 'friday' THEN 5 WHEN 'saturday' THEN 6
  WHEN 'sunday' THEN 7 ELSE 8 END`;
const STATUSES = new Set(['pending', 'done', 'injured', 'cancelled', 'skipped']);
const WEEKDAYS = new Set(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function cleanText(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function validateOfficeDays(value) {
  if (!Array.isArray(value) || value.some(day => !WEEKDAYS.has(day))) {
    throw new Error('Invalid office days');
  }
  return [...new Set(value)];
}

function validateProposal(raw, sessions, isNewWeek) {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid AI proposal');
  const ownedIds = new Set(sessions.map(session => session.id));
  const updates = Array.isArray(raw.session_updates) ? raw.session_updates.map(update => {
    if (!ownedIds.has(update.session_id)) throw new Error('Proposal referenced an unavailable session');
    const clean = { session_id: update.session_id };
    if (update.status !== undefined) {
      if (!STATUSES.has(update.status)) throw new Error('Invalid proposed status');
      clean.status = update.status;
    }
    if (update.time_slot !== undefined) clean.time_slot = cleanText(update.time_slot, 80);
    if (update.notes !== undefined) clean.notes = cleanText(update.notes, 2000);
    if (update.brief !== undefined) clean.brief = cleanText(update.brief, 1000);
    return clean;
  }) : [];
  if (isNewWeek && updates.length > 0) throw new Error('New-week proposal cannot update existing sessions');

  const additions = Array.isArray(raw.new_sessions) ? raw.new_sessions.map(session => {
    if (!DAYS.has(session.day) || !CATEGORIES.has(session.category)) throw new Error('Invalid proposed session');
    const name = cleanText(session.name, 120);
    const timeSlot = cleanText(session.time_slot, 80);
    const brief = cleanText(session.brief, 1000);
    if (!name || !timeSlot || !brief) throw new Error('Proposed sessions require a name, time, and brief');
    return { day: session.day, category: session.category, name, time_slot: timeSlot, brief };
  }) : [];

  return {
    summary: cleanText(raw.summary, 500) || 'Personalized weekly plan',
    office_days: raw.office_days === undefined ? undefined : validateOfficeDays(raw.office_days),
    session_updates: updates,
    new_sessions: additions,
  };
}

module.exports = function createAIRouter(pool) {
  const router = require('express').Router();
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  router.post('/chat', async (req, res) => {
    try {
      const { messages, week_start, office_days } = req.body;
      if (!ISO_DATE.test(week_start ?? '')) return res.status(400).json({ error: 'Valid week_start required' });
      if (!Array.isArray(messages) || messages.length === 0 || messages.some(message =>
        !message || !['user', 'assistant'].includes(message.role) || typeof message.content !== 'string'
      )) {
        return res.status(400).json({ error: 'At least one valid planning message is required' });
      }
      const cleanOfficeDays = validateOfficeDays(office_days ?? []);
      const [profileResult, ownedSessions, recentHistory] = await Promise.all([
        pool.query('SELECT profile FROM user_profiles WHERE user_id = $1 AND completed_at IS NOT NULL', [req.user.id]),
        pool.query(
          `SELECT s.* FROM sessions s JOIN weeks w ON w.id = s.week_id
           WHERE w.user_id = $1 AND w.week_start = $2 ORDER BY ${DAY_ORDER_SQL}, sort_order`,
          [req.user.id, week_start],
        ),
        pool.query(
          `SELECT w.week_start, s.category,
                  COUNT(*)::int AS planned,
                  COUNT(*) FILTER (WHERE s.status = 'done')::int AS completed,
                  ARRAY_AGG(s.felt) FILTER (WHERE s.felt IS NOT NULL) AS felt_ratings
           FROM weeks w JOIN sessions s ON s.week_id = w.id
           WHERE w.user_id = $1 AND w.week_start < $2
           AND w.id IN (SELECT id FROM weeks WHERE user_id = $1 AND week_start < $2 ORDER BY week_start DESC LIMIT 4)
           GROUP BY w.week_start, s.category ORDER BY w.week_start DESC, s.category`,
          [req.user.id, week_start],
        ),
      ]);
      if (!profileResult.rows[0]) return res.status(409).json({ error: 'Complete your profile before planning a week' });
      const sessions = ownedSessions.rows;
      const context = [
        `User profile:\n${JSON.stringify(profileResult.rows[0].profile, null, 2)}`,
        `Week: ${week_start}`,
        `Office days this week: ${cleanOfficeDays.length ? cleanOfficeDays.join(', ') : 'none'}`,
        `Current sessions:\n${sessions.length ? JSON.stringify(sessions, null, 2) : '(new week)'}`,
        `Recent four-week history:\n${recentHistory.rows.length ? JSON.stringify(recentHistory.rows, null, 2) : '(none)'}`,
      ].join('\n\n');
      const languageInstruction = req.user.locale === 'zh-CN'
        ? '\nRespond in Simplified Chinese, while keeping enum values in English.'
        : '';
      const system = SYSTEM + languageInstruction + '\n\n' + context;
      const history = (messages ?? []).slice(-12).map(message => ({ role: message.role, content: cleanText(message.content, 4000) }));
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 1800, system, tools,
        tool_choice: { type: 'tool', name: 'propose_changes' }, messages: history,
      });
      const toolBlock = response.content.find(block => block.type === 'tool_use' && block.name === 'propose_changes');
      if (!toolBlock) return res.status(500).json({ error: 'No schedule proposal returned from AI' });
      const proposal = validateProposal(toolBlock.input, sessions, sessions.length === 0);
      proposal.session_updates = proposal.session_updates.map(update => {
        const session = sessions.find(item => item.id === update.session_id);
        return { ...update, name: session.name, day: session.day, current_status: session.status, current_time: session.time_slot ?? '' };
      });
      res.json({ message: proposal.summary, proposal });
    } catch (err) {
      console.error('[AI chat]', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/apply', async (req, res) => {
    const client = await pool.connect();
    try {
      if (!ISO_DATE.test(req.body.week_start ?? '')) {
        return res.status(400).json({ error: 'Valid week_start required' });
      }
      const requestedOfficeDays = validateOfficeDays(req.body.office_days ?? []);
      await client.query('BEGIN');
      const weekRow = await client.query('SELECT id FROM weeks WHERE user_id = $1 AND week_start = $2 FOR UPDATE', [req.user.id, req.body.week_start]);
      let weekId = weekRow.rows[0]?.id;
      const current = weekId
        ? await client.query('SELECT * FROM sessions WHERE week_id = $1', [weekId])
        : { rows: [] };
      const proposal = validateProposal(req.body.proposal, current.rows, current.rows.length === 0);

      if (!weekId) {
        const inserted = await client.query(
          `INSERT INTO weeks (user_id, week_start) VALUES ($1, $2)
           ON CONFLICT (user_id, week_start) DO UPDATE SET week_start = EXCLUDED.week_start
           RETURNING id`,
          [req.user.id, req.body.week_start],
        );
        weekId = inserted.rows[0].id;
      }
      await client.query('DELETE FROM office_days WHERE week_id = $1', [weekId]);
      for (const day of requestedOfficeDays) {
        await client.query('INSERT INTO office_days (week_id, day) VALUES ($1, $2)', [weekId, day]);
      }
      for (const update of proposal.session_updates) {
        const fields = ['status', 'time_slot', 'notes', 'brief'].filter(field => update[field] !== undefined);
        if (!fields.length) continue;
        const values = fields.map(field => update[field]);
        values.push(update.session_id, weekId);
        await client.query(`UPDATE sessions SET ${fields.map((field, i) => `${field} = $${i + 1}`).join(', ')}
          WHERE id = $${fields.length + 1} AND week_id = $${fields.length + 2}`, values);
      }
      const maxRows = await client.query('SELECT day, COALESCE(MAX(sort_order), 0)::int AS max_sort FROM sessions WHERE week_id = $1 GROUP BY day', [weekId]);
      const maxByDay = Object.fromEntries(maxRows.rows.map(row => [row.day, row.max_sort]));
      for (const session of proposal.new_sessions) {
        const sortOrder = (maxByDay[session.day] ?? 0) + 1;
        maxByDay[session.day] = sortOrder;
        await client.query(
          `INSERT INTO sessions (week_id, day, type, category, name, time_slot, brief, status, sort_order)
           VALUES ($1, $2, $3, $3, $4, $5, $6, 'pending', $7)`,
          [weekId, session.day, session.category, session.name, session.time_slot, session.brief, sortOrder],
        );
      }
      const sessions = await client.query(`SELECT * FROM sessions WHERE week_id = $1 ORDER BY ${DAY_ORDER_SQL}, sort_order`, [weekId]);
      const officeDays = await client.query('SELECT day FROM office_days WHERE week_id = $1', [weekId]);
      await client.query('COMMIT');
      res.json({ sessions: sessions.rows, office_days: officeDays.rows.map(row => row.day) });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('[AI apply]', err.message);
      res.status(400).json({ error: err.message });
    } finally {
      client.release();
    }
  });

  return router;
};

module.exports.validateProposal = validateProposal;
module.exports.validateOfficeDays = validateOfficeDays;

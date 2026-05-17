const Anthropic = require('@anthropic-ai/sdk');

const SYSTEM = `You are a concise schedule assistant for Habitual, a personal weekly habit tracker.

The user tracks these recurring sessions each week:
- Football: 5-a-side (Tue & Thu 20:00–21:00), ball mastery drills (Wed), 11-a-side match (Sun 10:30)
- Strength: lower body + speed block (Mon), upper body & core (Wed, WFH days only)
- Speed: dynamic warmup + sprint & plyo block (Mon)
- Cardio: Zone 2 jog (Wed)
- Chinese: Anki review ~10 min (nightly), Pimsleur (commute only on office days Wed/Thu/Fri)

Office day rules:
- Exercise sessions shift to evening slots when in the office
- Pimsleur commute sessions only appear on office days (Wed, Thu, Fri)
- Upper body & core on Wednesday is WFH-only (skipped on office Wednesdays)

Session statuses: pending, done, injured, cancelled, skipped
Physical sessions also track feeling: great, good, okay, tough

━━━ CANCELLATION RULES ━━━
When a session or event is cancelled (not due to injury):
1. Mark the cancelled session(s) with status "cancelled"
2. Propose replacement sessions in the freed time using new_sessions — e.g. Sunday match
   cancelled → add extra ball mastery or cardio; 5-a-side cancelled → add strength or cardio.
   Use realistic times that fit the day. Always schedule something unless the user says otherwise.

━━━ INJURY RULES ━━━
When the user reports an injury, think carefully about what it affects:

• Ankle / knee / foot:  no football, no speed, no cardio (running). Upper body strength and
  Chinese are fine. Suggest upper body strength as a replacement session if any football slots
  are freed.

• Shoulder / arm / wrist:  no upper body strength; football may be possible at low intensity
  (check with user). Lower body strength, cardio, Chinese are fine.

• Back / spine:  no strength training, no speed. Light walking-pace cardio may be ok but check.
  Chinese study is fine. Do not replace with heavy exercise.

• Hip / groin:  no football, no speed, no lower body strength. Upper body strength and cardio
  (cycling-style, not running) may be ok. Chinese fine.

• General illness / fatigue:  cancel ALL physical sessions. Keep Chinese study.

For injuries:
1. Mark affected sessions "injured"
2. Mark collateral sessions that would aggravate the injury "cancelled"
3. Keep all sessions that are genuinely safe
4. Do NOT add new_sessions — rest is part of recovery. The one exception is if the injury
   clearly frees a slot and an unaffected session type fits (e.g. ankle injury frees Sunday
   morning → propose upper body strength if the user has equipment available).

━━━ NEW WEEK PLANNING ━━━
When the current sessions list is empty, you are planning a brand-new week from scratch.
Rules:
• session_updates must be [] — no existing sessions to change
• Put the COMPLETE week schedule in new_sessions
• Do NOT include cancelled football sessions — omit them entirely and replace with fitness
• Replacement sessions go in the same time slot as the omitted session (e.g. cancelled 5-a-side
  at 20:00–21:00 → Zone 2 jog or strength session at 20:00–21:00)
• You MAY add sessions not in the default template if they make sense as replacements
• Respect injury rules — omit unsafe sessions, keep safe ones, use the freed slot if appropriate

Default session template to adapt:
  Mon  | Dynamic warmup        | WFH 7:30–7:50   / office 18:30–18:45
  Mon  | Sprint & plyo block   | WFH 7:50–8:10   / office 18:45–19:05
  Mon  | Lower body strength   | WFH 8:10–8:40   / office 19:05–19:30
  Mon  | Anki                  | 21:30–21:40 (always)
  Tue  | 5-a-side football     | 19:00–20:00 (unless cancelled)
  Tue  | Anki                  | 21:30–21:40 (always)
  Wed  | Upper body & core     | WFH 7:00–8:00 ONLY — omit on office Wednesdays
  Wed  | Pimsleur (commute)    | office days only
  Wed  | Zone 2 jog            | WFH 19:30–20:00 / office 19:00–19:30
  Wed  | Ball mastery drills   | WFH 20:00–20:30 / office 19:30–20:00
  Thu  | Pimsleur (commute)    | office days only
  Thu  | 5-a-side football     | 20:00–21:00 (unless cancelled)
  Thu  | Anki                  | 21:30–21:40 (always)
  Fri  | Pimsleur (commute)    | office days only
  Sun  | 11-a-side match       | 10:30 (unless cancelled)

Always use propose_changes so the user can review before anything is saved.
Be brief — one or two sentences max. The UI shows the full details.`;

const tools = [
  {
    name: 'propose_changes',
    description: 'Propose schedule changes for the user to review and confirm before anything is saved.',
    input_schema: {
      type: 'object',
      required: ['summary', 'session_updates'],
      properties: {
        summary: {
          type: 'string',
          description: 'One sentence explaining what is changing and why.',
        },
        office_days: {
          type: 'array',
          items: { type: 'string', enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] },
          description: 'New office days for the week. Only include if office days are changing.',
        },
        session_updates: {
          type: 'array',
          description: 'Changes to existing sessions.',
          items: {
            type: 'object',
            required: ['session_id'],
            properties: {
              session_id: { type: 'integer' },
              status:     { type: 'string', enum: ['pending', 'done', 'injured', 'cancelled', 'skipped'] },
              time_slot:  { type: 'string' },
              notes:      { type: 'string' },
            },
          },
        },
        new_sessions: {
          type: 'array',
          description: 'Extra sessions to add. Use for cancellation replacements only — NOT for injuries.',
          items: {
            type: 'object',
            required: ['day', 'type', 'name'],
            properties: {
              day:       { type: 'string', enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
              type:      { type: 'string', enum: ['football', 'strength', 'speed', 'cardio', 'chinese'] },
              name:      { type: 'string', description: 'Short descriptive name, e.g. "Extra Zone 2 jog"' },
              time_slot: { type: 'string', description: 'e.g. "10:30 – 11:15"' },
            },
          },
        },
      },
    },
  },
];

const DAY_ORDER_SQL = `CASE day
  WHEN 'monday'    THEN 1 WHEN 'tuesday'   THEN 2 WHEN 'wednesday' THEN 3
  WHEN 'thursday'  THEN 4 WHEN 'friday'    THEN 5 WHEN 'saturday'  THEN 6
  WHEN 'sunday'    THEN 7 ELSE 8 END`;

module.exports = function createAIRouter(pool) {
  const router = require('express').Router();
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // POST /api/ai/chat
  router.post('/chat', async (req, res) => {
    try {
      const { messages, week_start, sessions, office_days } = req.body;

      const sessionList = (sessions ?? [])
        .map(s =>
          `[id:${s.id}] ${s.day} | ${s.type} | ${s.name} | ${s.time_slot ?? 'no time'} | ${s.status}${s.felt ? ` | felt:${s.felt}` : ''}`,
        )
        .join('\n');

      const context = [
        `Week: ${week_start}`,
        `Office days: ${office_days?.length ? office_days.join(', ') : 'none set'}`,
        '',
        'Current sessions:',
        sessionList || '(none — week not yet set up)',
      ].join('\n');

      const systemWithContext = SYSTEM + '\n\n---\n' + context;
      const history = (messages ?? []).map(m => ({ role: m.role, content: m.content }));

      let response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemWithContext,
        tools,
        messages: history,
      });

      let text = '';
      let proposal = null;

      if (response.stop_reason === 'tool_use') {
        const toolBlock = response.content.find(b => b.type === 'tool_use' && b.name === 'propose_changes');
        if (toolBlock) {
          proposal = { ...toolBlock.input };

          if (proposal.session_updates) {
            proposal.session_updates = proposal.session_updates.map(u => {
              const s = (sessions ?? []).find(s => s.id === u.session_id);
              return {
                ...u,
                name:           s?.name    ?? 'Session',
                day:            s?.day     ?? '',
                current_status: s?.status  ?? 'pending',
                current_time:   s?.time_slot ?? '',
              };
            });
          }
        }

        const toolResults = response.content
          .filter(b => b.type === 'tool_use')
          .map(b => ({
            type: 'tool_result',
            tool_use_id: b.id,
            content: b.name === 'propose_changes'
              ? `Proposal shown: ${b.input.session_updates?.length ?? 0} update(s), ${b.input.new_sessions?.length ?? 0} new session(s).`
              : 'Done.',
          }));

        const continuation = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 512,
          system: systemWithContext,
          tools,
          messages: [
            ...history,
            { role: 'assistant', content: response.content },
            { role: 'user',      content: toolResults },
          ],
        });

        text = continuation.content.filter(b => b.type === 'text').map(b => b.text).join('');
      } else {
        text = response.content.filter(b => b.type === 'text').map(b => b.text).join('');
      }

      res.json({ message: text, proposal });
    } catch (err) {
      console.error('[AI chat]', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/ai/apply
  router.post('/apply', async (req, res) => {
    try {
      const { proposal, week_start } = req.body;

      const weekRow = await pool.query('SELECT id FROM weeks WHERE week_start = $1', [week_start]);
      if (weekRow.rows.length === 0) return res.status(404).json({ error: 'Week not found' });
      const weekId = weekRow.rows[0].id;

      // Update office days if proposed
      if (Array.isArray(proposal.office_days)) {
        await pool.query('DELETE FROM office_days WHERE week_id = $1', [weekId]);
        for (const day of proposal.office_days) {
          await pool.query('INSERT INTO office_days (week_id, day) VALUES ($1, $2)', [weekId, day]);
        }
      }

      // Apply session updates
      for (const u of proposal.session_updates ?? []) {
        const sets = [];
        const vals = [];
        let i = 1;
        if (u.status    !== undefined) { sets.push(`status = $${i++}`);    vals.push(u.status); }
        if (u.time_slot !== undefined) { sets.push(`time_slot = $${i++}`); vals.push(u.time_slot); }
        if (u.notes     !== undefined) { sets.push(`notes = $${i++}`);     vals.push(u.notes); }
        if (sets.length > 0) {
          vals.push(u.session_id);
          await pool.query(`UPDATE sessions SET ${sets.join(', ')} WHERE id = $${i}`, vals);
        }
      }

      // Insert new sessions
      if ((proposal.new_sessions ?? []).length > 0) {
        const existingSortOrders = await pool.query(
          'SELECT day, MAX(sort_order) AS max_sort FROM sessions WHERE week_id = $1 GROUP BY day',
          [weekId],
        );
        const maxByDay = {};
        for (const row of existingSortOrders.rows) {
          maxByDay[row.day] = parseInt(row.max_sort, 10);
        }

        for (const ns of proposal.new_sessions) {
          const sortOrder = (maxByDay[ns.day] ?? 0) + 1;
          maxByDay[ns.day] = sortOrder;
          await pool.query(
            `INSERT INTO sessions (week_id, day, type, name, time_slot, is_commute, status, sort_order)
             VALUES ($1, $2, $3, $4, $5, false, 'pending', $6)`,
            [weekId, ns.day, ns.type, ns.name, ns.time_slot ?? null, sortOrder],
          );
        }
      }

      // Return refreshed data
      const sessions = await pool.query(
        `SELECT * FROM sessions WHERE week_id = $1 ORDER BY ${DAY_ORDER_SQL}, sort_order`,
        [weekId],
      );
      const officeDays = await pool.query(
        'SELECT day FROM office_days WHERE week_id = $1',
        [weekId],
      );

      res.json({
        sessions: sessions.rows,
        office_days: officeDays.rows.map(r => r.day),
      });
    } catch (err) {
      console.error('[AI apply]', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};

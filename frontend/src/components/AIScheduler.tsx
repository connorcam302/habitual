import { useState, useEffect } from 'react'
import type { Session } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type EventType = 'injury' | 'cancellation' | 'constraint'

interface InjuryEvent   { type: 'injury';       bodyPart: string; severity: string }
interface CancelEvent   { type: 'cancellation'; sessionId: number | null; customText: string }
interface ConstraintEvent { type: 'constraint'; text: string }
type ScheduleEvent = { id: string } & (InjuryEvent | CancelEvent | ConstraintEvent)

interface SessionUpdate {
  session_id: number; name: string; day: string
  current_status: string; current_time: string
  status?: string; time_slot?: string; notes?: string
}
interface NewSession { day: string; type: string; name: string; time_slot?: string }
interface Proposal {
  summary: string
  office_days?: string[]
  session_updates: SessionUpdate[]
  new_sessions?: NewSession[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const
const DAY_SHORT: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
  thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
}
const DAY_LONG: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
}

const BODY_PARTS = [
  { value: 'ankle_foot',    label: 'Ankle / Foot' },
  { value: 'knee',          label: 'Knee' },
  { value: 'shoulder_arm',  label: 'Shoulder / Arm' },
  { value: 'wrist_hand',    label: 'Wrist / Hand' },
  { value: 'back',          label: 'Back' },
  { value: 'hip_groin',     label: 'Hip / Groin' },
  { value: 'illness',       label: 'General illness' },
]

const SEVERITIES = [
  { value: 'mild',     label: 'Mild',     desc: 'can train with modifications' },
  { value: 'moderate', label: 'Moderate', desc: 'rest affected sessions' },
  { value: 'severe',   label: 'Severe',   desc: 'rest all physical activity' },
]

const STATUS_COLOR: Record<string, string> = {
  done: 'var(--done)', injured: 'var(--injured)',
  cancelled: 'var(--cancelled)', skipped: 'var(--skipped)', pending: 'var(--text-muted)',
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(
  officeDays: string[],
  events: ScheduleEvent[],
  notes: string,
  sessions: Session[],
): string {
  const parts: string[] = []

  if (officeDays.length > 0) {
    parts.push(`Office days this week: ${officeDays.map(d => DAY_LONG[d]).join(', ')}`)
  } else {
    parts.push('Working from home all week — no office days')
  }

  for (const ev of events) {
    if (ev.type === 'injury') {
      const bp = BODY_PARTS.find(b => b.value === ev.bodyPart)?.label ?? ev.bodyPart
      parts.push(`I have a ${ev.severity} ${bp.toLowerCase()} injury`)
    } else if (ev.type === 'cancellation') {
      if (ev.sessionId) {
        const s = sessions.find(s => s.id === ev.sessionId)
        if (s) parts.push(`${s.name} (${DAY_LONG[s.day]}) is cancelled`)
      } else if (ev.customText.trim()) {
        parts.push(`Cancelled: ${ev.customText.trim()}`)
      }
    } else if (ev.type === 'constraint' && ev.text.trim()) {
      parts.push(ev.text.trim())
    }
  }

  if (notes.trim()) parts.push(notes.trim())

  return parts.join('. ')
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  currentWeek: string
  sessions: Session[]
  officeDays: string[]
  onApplied: (sessions: Session[], officeDays?: string[]) => void
}

let nextId = 0

export default function AIScheduler({ currentWeek, sessions, officeDays, onApplied }: Props) {
  const [selectedDays, setSelectedDays] = useState<string[]>(officeDays)
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [proposalMessage, setProposalMessage] = useState('')
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [error, setError] = useState('')

  // Sync office days when navigating weeks
  useEffect(() => { setSelectedDays(officeDays) }, [officeDays])
  // Reset proposal when sessions change (week navigation)
  useEffect(() => { setProposal(null); setApplied(false) }, [currentWeek])

  const toggleDay = (day: string) =>
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])

  const addEvent = (type: EventType) => {
    const id = String(nextId++)
    if (type === 'injury')
      setEvents(prev => [...prev, { id, type, bodyPart: 'ankle_foot', severity: 'moderate' }])
    else if (type === 'cancellation')
      setEvents(prev => [...prev, { id, type, sessionId: null, customText: '' }])
    else
      setEvents(prev => [...prev, { id, type, text: '' }])
  }

  const updateEvent = (id: string, patch: Partial<ScheduleEvent>) =>
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...patch } as ScheduleEvent : e))

  const removeEvent = (id: string) =>
    setEvents(prev => prev.filter(e => e.id !== id))

  const propose = async () => {
    const prompt = buildPrompt(selectedDays, events, notes, sessions)
    if (!prompt) return
    setLoading(true)
    setError('')
    setProposal(null)
    setApplied(false)
    try {
      const r = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          week_start: currentWeek,
          sessions,
          office_days: officeDays,
        }),
      })
      const data = await r.json()
      setProposalMessage(data.message ?? '')
      setProposal(data.proposal ?? null)
      if (!data.proposal) setError('No changes proposed — try adding more detail.')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const applyProposal = async () => {
    if (!proposal) return
    setApplying(true)
    try {
      const r = await fetch('/api/ai/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposal, week_start: currentWeek }),
      })
      const data = await r.json()
      onApplied(data.sessions, data.office_days)
      setApplied(true)
      setProposal(null)
    } catch {
      setError('Failed to apply changes. Please try again.')
    } finally {
      setApplying(false)
    }
  }

  const hasContent = events.length > 0 || notes.trim() ||
    JSON.stringify(selectedDays.sort()) !== JSON.stringify([...officeDays].sort())

  return (
    <div className="px-4 py-5 space-y-5 md:px-6 md:max-w-[600px]">

      {/* ── Office days ── */}
      <Section label="Office days this week">
        <div className="flex gap-2">
          {WEEKDAYS.map(day => (
            <button
              key={day}
              onClick={() => toggleDay(day)}
              className="flex-1 py-3 rounded-xl text-[13px] font-semibold font-display text-center
                border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-football"
              style={selectedDays.includes(day) ? {
                borderColor: 'var(--football)',
                background: 'color-mix(in oklch, var(--football) 9%, transparent)',
                color: 'var(--football)',
              } : {
                borderColor: 'var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text-muted)',
              }}
            >
              {DAY_SHORT[day]}
            </button>
          ))}
        </div>
      </Section>

      {/* ── Events ── */}
      <Section label="What's changed?">
        <div className="space-y-2.5">
          {events.map(ev => (
            <EventCard
              key={ev.id}
              event={ev}
              sessions={sessions}
              onChange={patch => updateEvent(ev.id, patch)}
              onRemove={() => removeEvent(ev.id)}
            />
          ))}
        </div>

        {/* Add event buttons */}
        <div className="flex gap-2 mt-2.5">
          {([
            ['injury',       '🤕', 'Injury'],
            ['cancellation', '✕',  'Cancelled'],
            ['constraint',   '+',  'Other'],
          ] as const).map(([type, icon, label]) => (
            <button
              key={type}
              onClick={() => addEvent(type)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl
                border border-dashed border-app-border text-[12px] font-semibold font-display
                text-text-dim hover:border-text-muted hover:text-text-muted transition-colors"
            >
              <span className="text-[14px] leading-none">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </Section>

      {/* ── Notes ── */}
      <Section label="Additional notes" optional>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Anything else Claude should know…"
          rows={2}
          className="w-full resize-none rounded-xl px-3 py-2.5 text-[14px] font-display
            bg-surface-2 border border-app-border text-app-text
            placeholder:text-text-dim outline-none transition-colors
            focus:border-[color-mix(in_oklch,var(--football)_30%,transparent)]"
        />
      </Section>

      {/* ── Propose button ── */}
      <button
        onClick={propose}
        disabled={loading || !hasContent}
        className="w-full py-4 rounded-[14px] text-white text-[16px] font-bold font-display
          disabled:opacity-40 transition-opacity hover:opacity-90"
        style={{ background: 'var(--gradient-cta)' }}
      >
        {loading ? 'Thinking…' : sessions.length === 0 ? 'Set up week' : 'Propose changes'}
      </button>

      {error && (
        <p className="text-[13px] text-center" style={{ color: 'var(--cancelled)' }}>{error}</p>
      )}

      {/* ── Applied confirmation ── */}
      {applied && (
        <div className="rounded-xl border border-app-border px-4 py-3 text-[13px] text-text-muted text-center"
          style={{ background: 'color-mix(in oklch, var(--done) 6%, transparent)', borderColor: 'color-mix(in oklch, var(--done) 20%, transparent)' }}>
          ✓ Schedule updated
        </div>
      )}

      {/* ── Proposal card ── */}
      {proposal && !applied && (
        <div className="space-y-3">
          {proposalMessage && (
            <p className="text-[13px] text-text-muted leading-relaxed">{proposalMessage}</p>
          )}
          <ProposalCard
            proposal={proposal}
            applying={applying}
            onApply={applyProposal}
            onDismiss={() => setProposal(null)}
          />
        </div>
      )}
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ label, optional, children }: {
  label: string; optional?: boolean; children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2.5">
        <span className="font-mono text-[11px] tracking-[0.1em] text-text-dim uppercase">{label}</span>
        {optional && <span className="text-[11px] text-text-dim">optional</span>}
      </div>
      {children}
    </div>
  )
}

// ─── Event card ───────────────────────────────────────────────────────────────

function EventCard({ event, sessions, onChange, onRemove }: {
  event: ScheduleEvent
  sessions: Session[]
  onChange: (patch: Partial<ScheduleEvent>) => void
  onRemove: () => void
}) {
  const selectCls = `w-full bg-surface-2 border border-app-border rounded-lg px-3 py-2
    text-[13px] font-display text-app-text outline-none
    focus:border-[color-mix(in_oklch,var(--football)_30%,transparent)] transition-colors`

  return (
    <div className="bg-surface border border-app-border rounded-xl p-3.5 relative">
      <button
        onClick={onRemove}
        className="absolute top-3 right-3 text-text-dim hover:text-text-muted transition-colors
          text-[18px] leading-none focus-visible:outline-none"
        aria-label="Remove"
      >×</button>

      {event.type === 'injury' && (
        <div className="space-y-2 pr-6">
          <div className="font-mono text-[10px] tracking-[0.08em] text-text-dim uppercase mb-2.5">
            🤕 Injury
          </div>
          <select
            value={event.bodyPart}
            onChange={e => onChange({ bodyPart: e.target.value } as Partial<InjuryEvent>)}
            className={selectCls}
          >
            {BODY_PARTS.map(b => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
          <div className="flex gap-2">
            {SEVERITIES.map(s => (
              <button
                key={s.value}
                onClick={() => onChange({ severity: s.value } as Partial<InjuryEvent>)}
                className="flex-1 py-2 px-1 rounded-lg text-[11px] font-semibold font-display
                  border transition-all text-center"
                style={(event as InjuryEvent).severity === s.value ? {
                  borderColor: 'var(--injured)',
                  background: 'color-mix(in oklch, var(--injured) 9%, transparent)',
                  color: 'var(--injured)',
                } : {
                  borderColor: 'var(--border)',
                  color: 'var(--text-muted)',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {event.type === 'cancellation' && (
        <div className="space-y-2 pr-6">
          <div className="font-mono text-[10px] tracking-[0.08em] text-text-dim uppercase mb-2.5">
            ✕ Cancelled
          </div>
          <select
            value={(event as CancelEvent).sessionId ?? ''}
            onChange={e => onChange({ sessionId: e.target.value ? Number(e.target.value) : null } as Partial<CancelEvent>)}
            className={selectCls}
          >
            <option value="">Select session…</option>
            {sessions.filter(s => s.status === 'pending').map(s => (
              <option key={s.id} value={s.id}>
                {DAY_SHORT[s.day]} — {s.name}
              </option>
            ))}
            <option value="">Other (type below)</option>
          </select>
          {!(event as CancelEvent).sessionId && (
            <input
              type="text"
              value={(event as CancelEvent).customText}
              onChange={e => onChange({ customText: e.target.value } as Partial<CancelEvent>)}
              placeholder="Describe what's cancelled…"
              className="w-full bg-surface-2 border border-app-border rounded-lg px-3 py-2
                text-[13px] font-display text-app-text placeholder:text-text-dim outline-none
                focus:border-[color-mix(in_oklch,var(--football)_30%,transparent)] transition-colors"
            />
          )}
        </div>
      )}

      {event.type === 'constraint' && (
        <div className="pr-6">
          <div className="font-mono text-[10px] tracking-[0.08em] text-text-dim uppercase mb-2.5">
            + Other
          </div>
          <input
            type="text"
            value={(event as ConstraintEvent).text}
            onChange={e => onChange({ text: e.target.value } as Partial<ConstraintEvent>)}
            placeholder="e.g. Work dinner Wednesday evening"
            className="w-full bg-surface-2 border border-app-border rounded-lg px-3 py-2
              text-[13px] font-display text-app-text placeholder:text-text-dim outline-none
              focus:border-[color-mix(in_oklch,var(--football)_30%,transparent)] transition-colors"
          />
        </div>
      )}
    </div>
  )
}

// ─── Proposal card ────────────────────────────────────────────────────────────

function ProposalCard({ proposal, applying, onApply, onDismiss }: {
  proposal: Proposal; applying: boolean; onApply: () => void; onDismiss: () => void
}) {
  return (
    <div className="bg-surface border border-app-border rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-app-border">
        <div className="font-mono text-[10px] tracking-[0.1em] text-text-dim uppercase mb-1">
          Proposed changes
        </div>
        <div className="text-[13px] text-app-text">{proposal.summary}</div>
      </div>

      {proposal.office_days !== undefined && (
        <div className="px-4 py-3 border-b border-app-border">
          <div className="font-mono text-[10px] tracking-[0.08em] text-text-dim uppercase mb-2">
            Office days → {proposal.office_days.length > 0
              ? proposal.office_days.map(d => DAY_SHORT[d]).join(', ')
              : 'none'}
          </div>
          <div className="flex gap-1.5">
            {WEEKDAYS.map(d => {
              const active = proposal.office_days!.includes(d)
              return (
                <span key={d} className="flex-1 text-center py-1.5 rounded-lg text-[11px] font-semibold font-display"
                  style={active ? {
                    border: '1.5px solid color-mix(in oklch, var(--football) 35%, transparent)',
                    background: 'color-mix(in oklch, var(--football) 10%, transparent)',
                    color: 'var(--football)',
                  } : { border: '1.5px solid var(--border)', color: 'var(--text-dim)' }}
                >{DAY_SHORT[d]}</span>
              )
            })}
          </div>
        </div>
      )}

      {proposal.session_updates.map((u, i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-2.5 border-b border-app-border last:border-b-0">
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-app-text truncate">{u.name}</div>
            <div className="font-mono text-[10px] tracking-[0.08em] text-text-dim uppercase">
              {DAY_SHORT[u.day] ?? u.day}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 text-[11px] shrink-0">
            {u.status && u.status !== u.current_status && (
              <div className="flex items-center gap-1.5">
                <span className="text-text-dim line-through">{u.current_status}</span>
                <span className="text-text-dim">→</span>
                <span className="font-semibold" style={{ color: STATUS_COLOR[u.status] ?? 'var(--text)' }}>{u.status}</span>
              </div>
            )}
            {u.time_slot && u.time_slot !== u.current_time && (
              <div className="flex items-center gap-1.5 font-mono">
                {u.current_time && <><span className="text-text-dim line-through">{u.current_time}</span><span className="text-text-dim">→</span></>}
                <span className="text-app-text">{u.time_slot}</span>
              </div>
            )}
          </div>
        </div>
      ))}

      {(proposal.new_sessions ?? []).map((ns, i) => (
        <div key={`new-${i}`} className="flex items-start gap-3 px-4 py-2.5 border-b border-app-border last:border-b-0">
          <span className="font-mono text-[9px] font-medium tracking-[0.08em] uppercase px-1.5 py-0.5 rounded shrink-0 mt-0.5"
            style={{ background: 'color-mix(in oklch, var(--cardio) 9%, transparent)', color: 'var(--cardio)' }}>
            Add
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-app-text truncate">{ns.name}</div>
            <div className="font-mono text-[10px] tracking-[0.08em] text-text-dim uppercase">
              {DAY_SHORT[ns.day] ?? ns.day}
              {ns.time_slot && <span className="ml-2 normal-case tracking-normal">{ns.time_slot}</span>}
            </div>
          </div>
        </div>
      ))}

      <div className="flex gap-2 px-4 py-3 border-t border-app-border">
        <button onClick={onApply} disabled={applying}
          className="flex-1 py-2 rounded-xl text-white text-[13px] font-semibold font-display
            disabled:opacity-50 transition-opacity hover:opacity-90"
          style={{ background: 'var(--gradient-cta)' }}>
          {applying ? 'Applying…' : 'Apply changes'}
        </button>
        <button onClick={onDismiss} disabled={applying}
          className="px-4 py-2 rounded-xl border border-app-border text-text-muted
            text-[13px] font-semibold font-display hover:border-[var(--text-muted)] hover:text-app-text transition-colors">
          Dismiss
        </button>
      </div>
    </div>
  )
}

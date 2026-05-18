import { useState } from 'react'
import { Check } from 'lucide-react'
import type { Session } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import SectionLabel from '@/components/ui/SectionLabel'

// ─── Types ────────────────────────────────────────────────────────────────────

type AffectType = 'cancelled' | 'injured'

interface AffectedSession {
  type: AffectType
  reason: string
  bodyPart: string
  severity: string
}

interface SessionUpdate {
  session_id: number
  name: string
  day: string
  current_status: string
  current_time: string
  status?: string
  time_slot?: string
  notes?: string
}

interface NewSession {
  day: string
  type: string
  name: string
  time_slot?: string
}

interface Proposal {
  summary: string
  office_days?: string[]
  session_updates: SessionUpdate[]
  new_sessions?: NewSession[]
}

interface InjuryState {
  active: boolean
  bodyPart: string
  severity: string
  notes: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const
const DAY_SHORT: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri',
}

// Recurring football sessions that may or may not happen each week
const RECURRING_FOOTBALL = [
  { id: 'tue_5aside',  name: 'Tuesday 5-a-side',  time: '20:00 – 21:00' },
  { id: 'thu_5aside',  name: 'Thursday 5-a-side', time: '20:00 – 21:00' },
  { id: 'sun_11aside', name: 'Sunday 11-a-side',  time: '10:30' },
]

const BODY_PARTS = [
  { value: 'ankle_foot',   label: 'Ankle / Foot' },
  { value: 'knee',         label: 'Knee' },
  { value: 'shoulder_arm', label: 'Shoulder / Arm' },
  { value: 'wrist_hand',   label: 'Wrist / Hand' },
  { value: 'back',         label: 'Back' },
  { value: 'hip_groin',    label: 'Hip / Groin' },
  { value: 'illness',      label: 'Illness' },
]

const SEVERITIES = [
  { value: 'mild',     label: 'Mild' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'severe',   label: 'Severe' },
]

const STATUS_LABEL: Record<string, string> = {
  done: 'done', injured: 'injured', cancelled: 'cancelled', skipped: 'skipped', pending: '',
}

const STATUS_COLOR: Record<string, string> = {
  done: 'var(--done)', injured: 'var(--injured)',
  cancelled: 'var(--cancelled)', skipped: 'var(--skipped)',
}

// ─── Prompt builders ──────────────────────────────────────────────────────────

function buildNewWeekPrompt(
  officeDays: string[],
  cancelledFootball: Record<string, string>,
  injury: InjuryState,
  notes: string,
): string {
  const parts: string[] = ['Please plan my training schedule for this new week.', '']

  parts.push(
    officeDays.length > 0
      ? `Office days: ${officeDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}`
      : 'Working from home all week.',
  )

  const cancelledIds = Object.keys(cancelledFootball)
  if (cancelledIds.length > 0) {
    parts.push('', 'Football sessions NOT happening this week — omit and replace with fitness:')
    for (const id of cancelledIds) {
      const s = RECURRING_FOOTBALL.find(s => s.id === id)
      if (!s) continue
      const reason = cancelledFootball[id] ? `: ${cancelledFootball[id]}` : ''
      parts.push(`- ${s.name}${s.time ? ` (${s.time})` : ''}${reason}`)
    }
  }

  if (injury.active) {
    const part = BODY_PARTS.find(b => b.value === injury.bodyPart)?.label ?? injury.bodyPart
    const extra = injury.notes ? `, notes: ${injury.notes}` : ''
    parts.push('', `Injury: ${part}, ${injury.severity} severity${extra}`)
  }

  if (notes.trim()) parts.push('', `Additional context: ${notes.trim()}`)

  return parts.join('\n')
}

function buildAdjustPrompt(
  sessions: Session[],
  affected: Record<number, AffectedSession>,
  notes: string,
  currentOfficeDays: string[],
  newOfficeDays: string[],
): string {
  const parts: string[] = ['I need to adjust my schedule for this week.', '']

  const officeDaysChanged =
    JSON.stringify([...newOfficeDays].sort()) !== JSON.stringify([...currentOfficeDays].sort())

  if (officeDaysChanged) {
    parts.push(
      newOfficeDays.length > 0
        ? `Office days changing to: ${newOfficeDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}`
        : 'Switching to working from home all week.',
    )
    parts.push('')
  }

  const entries = Object.entries(affected)
  if (entries.length > 0) {
    parts.push('Football sessions affected:')
    for (const [idStr, info] of entries) {
      const s = sessions.find(s => s.id === Number(idStr))
      if (!s) continue
      const day = s.day.charAt(0).toUpperCase() + s.day.slice(1)
      const time = s.time_slot ?? 'unscheduled'
      if (info.type === 'cancelled') {
        const reason = info.reason ? `: ${info.reason}` : ''
        parts.push(`- ${day} ${time} ${s.name} — Cancelled${reason}`)
      } else {
        const part = BODY_PARTS.find(b => b.value === info.bodyPart)?.label ?? info.bodyPart
        const extra = info.reason ? `, notes: ${info.reason}` : ''
        parts.push(`- ${day} ${time} ${s.name} — Injured: ${part}, ${info.severity} severity${extra}`)
      }
    }
    parts.push('')
  }

  if (notes.trim()) parts.push(`Additional context: ${notes.trim()}`, '')

  parts.push('Full schedule for reference:')
  for (const day of DAY_ORDER) {
    for (const s of sessions.filter(s => s.day === day)) {
      const d = day.charAt(0).toUpperCase() + day.slice(1)
      parts.push(`- ${d} ${s.time_slot ?? ''}: ${s.name} (${s.type}, ${s.status})`)
    }
  }

  return parts.join('\n')
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function OfficeDayPicker({
  selected, onChange,
}: {
  selected: string[]
  onChange: (days: string[]) => void
}) {
  const toggle = (day: string) =>
    onChange(selected.includes(day) ? selected.filter(d => d !== day) : [...selected, day])

  return (
    <div className="flex gap-2">
      {WEEKDAYS.map(day => (
        <button
          key={day}
          onClick={() => toggle(day)}
          className="flex-1 py-3 px-1 rounded-[10px] text-sm font-semibold font-display text-center border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-football"
          style={selected.includes(day) ? {
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
  )
}

function InjuryFields({
  injury, onChange,
}: {
  injury: InjuryState
  onChange: (patch: Partial<InjuryState>) => void
}) {
  return (
    <div className="space-y-2.5">
      <select
        aria-label="Injury body part"
        value={injury.bodyPart}
        onChange={e => onChange({ bodyPart: e.target.value })}
        className="w-full px-3 py-2 rounded-[8px] bg-surface-2 border border-app-border text-sm text-app-text focus:outline-none focus:ring-1 focus:ring-football"
      >
        {BODY_PARTS.map(b => (
          <option key={b.value} value={b.value}>{b.label}</option>
        ))}
      </select>

      <div className="flex gap-1.5">
        {SEVERITIES.map(sv => (
          <button
            key={sv.value}
            aria-pressed={injury.severity === sv.value}
            onClick={() => onChange({ severity: sv.value })}
            className="flex-1 py-1.5 rounded-[8px] text-[11px] font-semibold border transition-colors"
            style={injury.severity === sv.value
              ? { backgroundColor: 'var(--football)', borderColor: 'var(--football)', color: '#fdf0d5' }
              : { background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            {sv.label}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder="Notes (optional)"
        value={injury.notes}
        onChange={e => onChange({ notes: e.target.value })}
        className="w-full px-3 py-2 rounded-[8px] bg-surface-2 border border-app-border text-sm text-app-text placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-football"
      />
    </div>
  )
}

// ─── ProposalView ─────────────────────────────────────────────────────────────

function ProposalView({
  message, proposal, isNewWeek, onApply, onBack, applyError,
}: {
  message: string
  proposal: Proposal
  isNewWeek: boolean
  onApply: () => void
  onBack: () => void
  applyError: string
}) {
  const updates = proposal.session_updates ?? []
  const additions = proposal.new_sessions ?? []

  return (
    <div className="space-y-4">
      {message && (
        <p className="text-sm text-app-text leading-relaxed">{message}</p>
      )}

      {(updates.length > 0 || additions.length > 0) && (
        <div className="space-y-1.5">
          <SectionLabel>{isNewWeek ? 'Proposed schedule' : 'Proposed changes'}</SectionLabel>
          <div className="rounded-[10px] border border-app-border overflow-hidden divide-y divide-app-border">
            {updates.map(u => (
              <div key={u.session_id} className="flex items-center gap-3 px-3 py-2.5 bg-surface">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-app-text truncate">{u.name}</div>
                  <div className="text-[11px] text-text-muted capitalize">
                    {u.day}{u.time_slot ? ` · ${u.time_slot}` : ''}
                    {u.current_time && u.time_slot && u.current_time !== u.time_slot
                      ? <span className="text-text-dim"> (was {u.current_time})</span>
                      : null}
                  </div>
                </div>
                {u.status && (
                  <span className="text-[11px] font-semibold shrink-0 capitalize"
                    style={{ color: STATUS_COLOR[u.status] }}
                  >
                    → {u.status}
                  </span>
                )}
              </div>
            ))}
            {additions.map((n, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-surface">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-app-text truncate">{n.name}</div>
                  <div className="text-[11px] text-text-muted capitalize">
                    {n.day}{n.time_slot ? ` · ${n.time_slot}` : ''} · {n.type}
                  </div>
                </div>
                <span className="text-[11px] font-semibold shrink-0" style={{ color: 'var(--done)' }}>
                  + add
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {applyError && (
        <p className="text-xs" style={{ color: 'var(--cancelled)' }}>{applyError}</p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={onBack}
          className="flex-1 py-2.5 rounded-[10px] text-sm font-semibold font-display border border-app-border bg-surface-2 text-app-text hover:bg-surface-3 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onApply}
          className="flex-1 py-2.5 rounded-[10px] text-sm font-semibold font-display text-app-text transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--football)' }}
        >
          {isNewWeek ? 'Start week' : 'Apply changes'}
        </button>
      </div>
    </div>
  )
}

// ─── Session row (adjust mode, football only) ─────────────────────────────────

function FootballSessionRow({
  session,
  info,
  canCancel,
  onToggle,
  onUpdate,
}: {
  session: Session
  info: AffectedSession | undefined
  canCancel: boolean
  onToggle: () => void
  onUpdate: (patch: Partial<AffectedSession>) => void
}) {
  const isAffected = !!info

  return (
    <div>
      <button
        aria-pressed={isAffected}
        aria-label={`${session.name} — ${isAffected ? 'affected, tap to remove' : 'tap to mark as affected'}`}
        onClick={onToggle}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] border text-left transition-colors
          ${isAffected ? 'bg-surface-2 border-app-border' : 'bg-surface border-app-border hover:bg-surface-2'}`}
      >
        <div
          className="w-4 h-4 rounded shrink-0 border flex items-center justify-center transition-colors"
          style={isAffected
            ? { backgroundColor: 'var(--football)', borderColor: 'var(--football)' }
            : { background: 'var(--surface-2)', borderColor: 'var(--border)' }}
        >
          {isAffected && <Check size={10} strokeWidth={2.5} color="white" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-app-text truncate">{session.name}</div>
          <div className="text-[11px] text-text-muted">{session.time_slot ?? 'no time set'}</div>
        </div>
        {session.status !== 'pending' && (
          <span className="text-[11px] shrink-0 capitalize" style={{ color: STATUS_COLOR[session.status] }}>
            {STATUS_LABEL[session.status]}
          </span>
        )}
      </button>

      {isAffected && info && (
        <div className="mt-1.5 ml-3 pl-4 border-l-2 border-app-border space-y-2.5 pb-1">
          <div className="flex gap-1.5 pt-0.5">
            {(['cancelled', 'injured'] as const).filter(t => t !== 'cancelled' || canCancel).map(t => (
              <button
                key={t}
                aria-pressed={info.type === t}
                onClick={() => onUpdate({ type: t })}
                className="px-3 py-1.5 rounded-full text-[11px] font-semibold capitalize border transition-colors"
                style={info.type === t ? {
                  backgroundColor: t === 'injured' ? 'var(--injured)' : 'var(--cancelled)',
                  borderColor: t === 'injured' ? 'var(--injured)' : 'var(--cancelled)',
                  color: '#fdf0d5',
                } : { background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              >
                {t}
              </button>
            ))}
          </div>

          {info.type === 'cancelled' ? (
            <input
              type="text"
              placeholder="Reason (optional)"
              value={info.reason}
              onChange={e => onUpdate({ reason: e.target.value })}
              className="w-full px-3 py-2 rounded-[8px] bg-surface-2 border border-app-border text-sm text-app-text placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-football"
            />
          ) : (
            <InjuryFields
              injury={{ active: true, bodyPart: info.bodyPart, severity: info.severity, notes: info.reason }}
              onChange={p => onUpdate({
                bodyPart: p.bodyPart ?? info.bodyPart,
                severity: p.severity ?? info.severity,
                reason: p.notes ?? info.reason,
              })}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  open: boolean
  onClose: () => void
  currentWeek: string
  sessions: Session[]
  officeDays: string[]
  onApplied: (sessions: Session[], officeDays?: string[]) => void
}

const DEFAULT_INJURY: InjuryState = { active: false, bodyPart: 'knee', severity: 'mild', notes: '' }

export default function AIAdjustModal({
  open, onClose, currentWeek, sessions, officeDays, onApplied,
}: Props) {
  const isNewWeek = sessions.length === 0

  // New-week state
  const [pickedOfficeDays, setPickedOfficeDays] = useState<string[]>([])
  const [cancelledFootball, setCancelledFootball] = useState<Record<string, string>>({})
  const [injury, setInjury] = useState<InjuryState>(DEFAULT_INJURY)

  // Adjust-mode state (football only + office days)
  const [adjustOfficeDays, setAdjustOfficeDays] = useState<string[]>(officeDays)
  const [affectedFootball, setAffectedFootball] = useState<Record<number, AffectedSession>>({})

  // Shared state
  const [notes, setNotes] = useState('')
  const [phase, setPhase] = useState<'form' | 'loading' | 'proposal' | 'applied'>('form')
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [aiMessage, setAiMessage] = useState('')
  const [applyError, setApplyError] = useState('')

  // ── New-week helpers ──

  const toggleCancelledFootball = (id: string) => {
    setCancelledFootball(prev => {
      if (id in prev) {
        const next = { ...prev }
        delete next[id]
        return next
      }
      return { ...prev, [id]: '' }
    })
  }

  // ── Adjust-mode helpers ──

  const toggleAffectedFootball = (id: number, canCancel: boolean) => {
    setAffectedFootball(prev => {
      if (prev[id]) {
        const next = { ...prev }
        delete next[id]
        return next
      }
      return { ...prev, [id]: { type: canCancel ? 'cancelled' : 'injured', reason: '', bodyPart: 'knee', severity: 'mild' } }
    })
  }

  const updateAffectedFootball = (id: number, patch: Partial<AffectedSession>) => {
    setAffectedFootball(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  // ── Propose ──

  const handlePropose = async () => {
    setPhase('loading')
    setApplyError('')
    try {
      const prompt = isNewWeek
        ? buildNewWeekPrompt(pickedOfficeDays, cancelledFootball, injury, notes)
        : buildAdjustPrompt(sessions, affectedFootball, notes, officeDays, adjustOfficeDays)

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          week_start: currentWeek,
          sessions,
          office_days: isNewWeek ? pickedOfficeDays : adjustOfficeDays,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setAiMessage(data.message ?? '')
      setProposal(data.proposal ?? null)
      setPhase(data.proposal ? 'proposal' : 'form')
    } catch {
      setPhase('form')
    }
  }

  // ── Apply ──

  const handleApply = async () => {
    if (!proposal) return
    setApplyError('')
    try {
      if (isNewWeek) {
        // Create the week record and save office days before inserting sessions
        const odRes = await fetch('/api/office-days', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ week_start: currentWeek, days: pickedOfficeDays }),
        })
        if (!odRes.ok) throw new Error()
      }

      const res = await fetch('/api/ai/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week_start: currentWeek, proposal }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      onApplied(data.sessions, data.office_days ?? proposal.office_days)
      setPhase('applied')
    } catch {
      setApplyError('Failed to apply — please try again.')
    }
  }

  // ── Close / reset ──

  const handleClose = () => {
    setPickedOfficeDays([])
    setCancelledFootball({})
    setInjury(DEFAULT_INJURY)
    setAdjustOfficeDays([...officeDays])
    setAffectedFootball({})
    setNotes('')
    setPhase('form')
    setProposal(null)
    setAiMessage('')
    setApplyError('')
    onClose()
  }

  // ── Derived ──

  const footballSessions = sessions.filter(s => s.type === 'football')

  const officeDaysChanged =
    JSON.stringify([...adjustOfficeDays].sort()) !== JSON.stringify([...officeDays].sort())

  const canProposeAdjust =
    officeDaysChanged || Object.keys(affectedFootball).length > 0 || notes.trim().length > 0

  const title = isNewWeek ? 'Plan this week' : 'Adjust this week'

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose() }}>
      <DialogContent className="max-w-lg p-0 gap-0 max-h-[88vh] flex flex-col">
        <DialogHeader className="px-5 pt-5 pb-4 shrink-0 border-b border-app-border">
          <DialogTitle className="text-base font-bold">{title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* ── Applied ── */}
          {phase === 'applied' ? (
            <div className="text-center py-10 space-y-3">
              <div className="text-3xl">✓</div>
              <div className="font-semibold text-base">
                {isNewWeek ? 'Week planned' : 'Schedule updated'}
              </div>
              <button
                onClick={handleClose}
                className="px-5 py-2 rounded-[10px] bg-surface-2 border border-app-border text-sm text-app-text hover:bg-surface-3 transition-colors"
              >
                Close
              </button>
            </div>

          /* ── Loading ── */
          ) : phase === 'loading' ? (
            <div className="text-center py-10 text-text-muted text-sm">
              {isNewWeek ? 'Planning your week…' : 'Planning adjustments…'}
            </div>

          /* ── Proposal ── */
          ) : phase === 'proposal' && proposal ? (
            <ProposalView
              message={aiMessage}
              proposal={proposal}
              isNewWeek={isNewWeek}
              onApply={handleApply}
              onBack={() => setPhase('form')}
              applyError={applyError}
            />

          /* ── New week form ── */
          ) : isNewWeek ? (
            <>
              {/* Office days */}
              <div>
                <SectionLabel>Office days this week</SectionLabel>
                <OfficeDayPicker selected={pickedOfficeDays} onChange={setPickedOfficeDays} />
                <p className="text-[11px] text-text-dim mt-2">
                  Exercise shifts to evenings on office days. Pimsleur on Wed–Fri office days.
                </p>
              </div>

              {/* Football sessions */}
              <div>
                <SectionLabel>Football this week</SectionLabel>
                <div className="space-y-1.5">
                  {RECURRING_FOOTBALL.map(s => {
                    const isCancelled = s.id in cancelledFootball
                    return (
                      <div key={s.id}>
                        <button
                          onClick={() => toggleCancelledFootball(s.id)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] border border-app-border bg-surface text-left transition-colors hover:bg-surface-2"
                        >
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-medium transition-colors ${isCancelled ? 'text-text-dim line-through' : 'text-app-text'}`}>
                              {s.name}
                            </div>
                            <div className="text-[11px] text-text-dim">{s.time}</div>
                          </div>
                          <span
                            className="text-[11px] font-semibold shrink-0 px-2.5 py-1 rounded-full transition-colors"
                            style={isCancelled ? {
                              background: 'var(--surface-3)',
                              color: 'var(--text-dim)',
                            } : {
                              background: 'color-mix(in oklch, var(--done) 12%, transparent)',
                              color: 'var(--done)',
                            }}
                          >
                            {isCancelled ? 'off' : 'on'}
                          </span>
                        </button>
                        {isCancelled && (
                          <div className="mt-1.5 ml-3 pl-4 border-l-2 border-app-border pb-1">
                            <input
                              type="text"
                              placeholder="Reason (optional)"
                              value={cancelledFootball[s.id]}
                              onChange={e => setCancelledFootball(prev => ({ ...prev, [s.id]: e.target.value }))}
                              className="w-full px-3 py-2 rounded-[8px] bg-surface-2 border border-app-border text-sm text-app-text placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-football"
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Injury */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <SectionLabel>Any injuries?</SectionLabel>
                  <button
                    onClick={() => setInjury(prev => ({ ...prev, active: !prev.active }))}
                    className="text-[11px] font-semibold font-display px-3 py-1 rounded-full border transition-colors"
                    style={injury.active ? {
                      backgroundColor: 'var(--injured)',
                      borderColor: 'var(--injured)',
                      color: '#fdf0d5',
                    } : {
                      background: 'var(--surface-2)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {injury.active ? 'Yes' : 'No'}
                  </button>
                </div>
                {injury.active && (
                  <InjuryFields
                    injury={injury}
                    onChange={p => setInjury(prev => ({ ...prev, ...p }))}
                  />
                )}
              </div>

              {/* Notes */}
              <div>
                <SectionLabel>Anything else?</SectionLabel>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. busy Tuesday evening, travelling Friday…"
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-[10px] bg-surface-2 border border-app-border text-sm text-app-text placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-football resize-none"
                />
              </div>

              <button
                onClick={handlePropose}
                className="w-full py-3 rounded-[10px] text-sm font-semibold font-display text-app-text hover:opacity-90 transition-opacity"
                style={{ backgroundColor: 'var(--football)' }}
              >
                Plan this week
              </button>
            </>

          /* ── Adjust mode form ── */
          ) : (
            <>
              {/* Office days */}
              <div>
                <SectionLabel>Office days</SectionLabel>
                <OfficeDayPicker selected={adjustOfficeDays} onChange={setAdjustOfficeDays} />
              </div>

              {/* Football sessions */}
              <div>
                <SectionLabel>Football sessions</SectionLabel>
                {footballSessions.length === 0 ? (
                  <p className="text-sm text-text-muted">No football sessions this week.</p>
                ) : (
                  <div className="space-y-1.5">
                    {footballSessions.map(session => {
                      const canCancel = /5.a.side|11.a.side/i.test(session.name)
                      return (
                        <FootballSessionRow
                          key={session.id}
                          session={session}
                          info={affectedFootball[session.id]}
                          canCancel={canCancel}
                          onToggle={() => toggleAffectedFootball(session.id, canCancel)}
                          onUpdate={patch => updateAffectedFootball(session.id, patch)}
                        />
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <SectionLabel>Additional context</SectionLabel>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Anything else affecting this week…"
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-[10px] bg-surface-2 border border-app-border text-sm text-app-text placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-football resize-none"
                />
              </div>

              <button
                onClick={handlePropose}
                disabled={!canProposeAdjust}
                className="w-full py-3 rounded-[10px] text-sm font-semibold font-display text-app-text disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                style={{ backgroundColor: 'var(--football)' }}
              >
                Propose changes
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

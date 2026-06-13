import { useState } from 'react'
import { Check } from 'lucide-react'
import type { Session, UserProfile } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import SectionLabel from '@/components/ui/SectionLabel'
import { useI18n } from '@/lib/i18n'

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
  category: string
  name: string
  time_slot?: string
  brief: string
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

const BODY_PARTS = [
  { value: 'ankle_foot',   label: 'Ankle / Foot' },
  { value: 'knee',         label: 'Knee' },
  { value: 'shoulder_arm', label: 'Shoulder / Arm' },
  { value: 'wrist_hand',   label: 'Wrist / Hand' },
  { value: 'back',         label: 'Back / Spine' },
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
  skippedCommitments: Record<string, string>,
  injury: InjuryState,
  notes: string,
): string {
  const parts: string[] = ['Please plan my personalized schedule for this new week from my profile.', '']

  parts.push(
    officeDays.length > 0
      ? `Office days: ${officeDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}`
      : 'Working from home all week.',
  )
  const skipped = Object.entries(skippedCommitments)
  if (skipped.length > 0) {
    parts.push('', 'Recurring commitments not happening this week:')
    for (const [name, reason] of skipped) parts.push(`- ${name}${reason ? `: ${reason}` : ''}`)
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
    parts.push('Sessions affected:')
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
      parts.push(`- ${d} ${s.time_slot ?? ''}: ${s.name} (${s.category}, ${s.status})`)
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
  const { t } = useI18n()
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
          {t(DAY_SHORT[day])}
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
  const { t } = useI18n()
  return (
    <div className="space-y-2.5">
      <select
        aria-label={t('Injury body part')}
        value={injury.bodyPart}
        onChange={e => onChange({ bodyPart: e.target.value })}
        className="w-full px-3 py-2 rounded-[8px] bg-surface-2 border border-app-border text-sm text-app-text focus:outline-none focus:ring-1 focus:ring-football"
      >
        {BODY_PARTS.map(b => (
          <option key={b.value} value={b.value}>{t(b.label)}</option>
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
              {t(sv.label)}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder={t('Notes (optional)')}
        value={injury.notes}
        onChange={e => onChange({ notes: e.target.value })}
        className="w-full px-3 py-2 rounded-[8px] bg-surface-2 border border-app-border text-sm text-app-text placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-football"
      />
    </div>
  )
}

// ─── ProposalView ─────────────────────────────────────────────────────────────

function ProposalView({
  message, proposal, isNewWeek, onApply, onBack, applyError, applying,
}: {
  message: string
  proposal: Proposal
  isNewWeek: boolean
  onApply: () => void
  onBack: () => void
  applyError: string
  applying: boolean
}) {
  const { t } = useI18n()
  const updates = proposal.session_updates ?? []
  const additions = proposal.new_sessions ?? []

  return (
    <div className="space-y-4">
      {message && (
        <p className="text-sm text-app-text leading-relaxed">{message}</p>
      )}

      {(updates.length > 0 || additions.length > 0) && (
        <div className="space-y-1.5">
          <SectionLabel>{t(isNewWeek ? 'Proposed schedule' : 'Proposed changes')}</SectionLabel>
          <div className="rounded-[10px] border border-app-border overflow-hidden divide-y divide-app-border">
            {updates.map(u => (
              <div key={u.session_id} className="flex items-center gap-3 px-3 py-2.5 bg-surface">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-app-text truncate">{u.name}</div>
                  <div className="text-[11px] text-text-muted capitalize">
                    {u.day}{u.time_slot ? ` · ${u.time_slot}` : ''}
                    {u.current_time && u.time_slot && u.current_time !== u.time_slot
                      ? <span className="text-text-dim"> ({t('was')} {u.current_time})</span>
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
                    {n.day}{n.time_slot ? ` · ${n.time_slot}` : ''} · {n.category}
                  </div>
                </div>
                <span className="text-[11px] font-semibold shrink-0" style={{ color: 'var(--done)' }}>
                  + {t('add')}
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
          {t('Back')}
        </button>
        <button
          onClick={onApply}
          disabled={applying}
          className="flex-1 py-2.5 rounded-[10px] text-sm font-semibold font-display text-app-text transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--football)' }}
        >
          {t(applying ? 'Applying…' : isNewWeek ? 'Start week' : 'Apply changes')}
        </button>
      </div>
    </div>
  )
}

// ─── Session row ──────────────────────────────────────────────────────────────

function AdjustableSessionRow({
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
  const { t: tr } = useI18n()
  const isAffected = !!info

  return (
    <div>
      <button
        aria-pressed={isAffected}
        aria-label={`${session.name}: ${tr(isAffected ? 'affected, tap to remove' : 'tap to mark as affected')}`}
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
          <div className="text-[11px] text-text-muted">{session.time_slot ?? tr('no time set')}</div>
        </div>
        {session.status !== 'pending' && (
          <span className="text-[11px] shrink-0 capitalize" style={{ color: STATUS_COLOR[session.status] }}>
            {tr(STATUS_LABEL[session.status])}
          </span>
        )}
      </button>

      {isAffected && info && (
        <div className="mt-1.5 ml-3 pl-4 border-l-2 border-app-border space-y-2.5 pb-1">
          <div className="flex gap-1.5 pt-0.5">
            {(['cancelled', 'injured'] as const).filter(status => status !== 'cancelled' || canCancel).map(status => (
              <button
                key={status}
                aria-pressed={info.type === status}
                onClick={() => onUpdate({ type: status })}
                className="px-3 py-1.5 rounded-full text-[11px] font-semibold capitalize border transition-colors"
                style={info.type === status ? {
                  backgroundColor: status === 'injured' ? 'var(--injured)' : 'var(--cancelled)',
                  borderColor: status === 'injured' ? 'var(--injured)' : 'var(--cancelled)',
                  color: '#fdf0d5',
                } : { background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              >
                {tr(status === 'cancelled' ? 'Cancelled' : 'Injured')}
              </button>
            ))}
          </div>

          {info.type === 'cancelled' ? (
            <input
              type="text"
              placeholder={tr('Reason (optional)')}
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
  profile: UserProfile | null
  onApplied: (sessions: Session[], officeDays?: string[]) => void
}

const DEFAULT_INJURY: InjuryState = { active: false, bodyPart: 'knee', severity: 'mild', notes: '' }

export default function AIAdjustModal({
  open, onClose, currentWeek, sessions, officeDays, profile, onApplied,
}: Props) {
  const { t } = useI18n()
  const isNewWeek = sessions.length === 0

  // New-week state
  const [pickedOfficeDays, setPickedOfficeDays] = useState<string[]>([])
  const [skippedCommitments, setSkippedCommitments] = useState<Record<string, string>>({})
  const [injury, setInjury] = useState<InjuryState>(DEFAULT_INJURY)

  // Adjust-mode state
  const [adjustOfficeDays, setAdjustOfficeDays] = useState<string[]>(officeDays)
  const [affectedSessions, setAffectedSessions] = useState<Record<number, AffectedSession>>({})

  // Shared state
  const [notes, setNotes] = useState('')
  const [phase, setPhase] = useState<'form' | 'loading' | 'proposal' | 'applied'>('form')
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [aiMessage, setAiMessage] = useState('')
  const [applyError, setApplyError] = useState('')
  const [proposeError, setProposeError] = useState('')
  const [applying, setApplying] = useState(false)

  // ── New-week helpers ──

  // ── Adjust-mode helpers ──

  const toggleAffectedSession = (id: number, canCancel: boolean) => {
    setAffectedSessions(prev => {
      if (prev[id]) {
        const next = { ...prev }
        delete next[id]
        return next
      }
      return { ...prev, [id]: { type: canCancel ? 'cancelled' : 'injured', reason: '', bodyPart: 'knee', severity: 'mild' } }
    })
  }

  const updateAffectedSession = (id: number, patch: Partial<AffectedSession>) => {
    setAffectedSessions(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  // ── Propose ──

  const handlePropose = async () => {
    setPhase('loading')
    setApplyError('')
    setProposeError('')
    try {
      const prompt = isNewWeek
        ? buildNewWeekPrompt(pickedOfficeDays, skippedCommitments, injury, notes)
        : buildAdjustPrompt(sessions, affectedSessions, notes, officeDays, adjustOfficeDays)

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
      const data = await res.json()
      if (!res.ok) {
        console.error('[AI propose] server error:', data)
        throw new Error(data.error ?? `Server error ${res.status}`)
      }
      if (!data.proposal) {
        console.error('[AI propose] no proposal in response:', data)
        throw new Error(t('No schedule was returned. Please try again.'))
      }
      setAiMessage(data.message ?? '')
      setProposal(data.proposal)
      setPhase('proposal')
    } catch (err) {
      setPhase('form')
      setProposeError(err instanceof Error ? t(err.message) : t('Something went wrong. Please try again.'))
    }
  }

  // ── Apply ──

  const handleApply = async () => {
    if (!proposal) return
    setApplyError('')
    setApplying(true)
    try {
      const res = await fetch('/api/ai/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          week_start: currentWeek,
          office_days: isNewWeek ? pickedOfficeDays : adjustOfficeDays,
          proposal,
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      onApplied(data.sessions, data.office_days ?? proposal.office_days)
      setPhase('applied')
    } catch {
      setApplyError(t('Failed to apply. Please try again.'))
    } finally {
      setApplying(false)
    }
  }

  // ── Close / reset ──

  const handleClose = () => {
    setPickedOfficeDays([])
    setSkippedCommitments({})
    setInjury(DEFAULT_INJURY)
    setAdjustOfficeDays([...officeDays])
    setAffectedSessions({})
    setNotes('')
    setPhase('form')
    setProposal(null)
    setAiMessage('')
    setApplyError('')
    setProposeError('')
    setApplying(false)
    onClose()
  }

  // ── Derived ──

  const adjustableSessions = sessions

  const officeDaysChanged =
    JSON.stringify([...adjustOfficeDays].sort()) !== JSON.stringify([...officeDays].sort())

  const canProposeAdjust =
    officeDaysChanged || Object.keys(affectedSessions).length > 0 || notes.trim().length > 0

  const title = t(isNewWeek ? 'Plan this week' : 'Adjust this week')

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
                {t(isNewWeek ? 'Week planned' : 'Schedule updated')}
              </div>
              <button
                onClick={handleClose}
                className="px-5 py-2 rounded-[10px] bg-surface-2 border border-app-border text-sm text-app-text hover:bg-surface-3 transition-colors"
              >
                {t('Close')}
              </button>
            </div>

          /* ── Loading ── */
          ) : phase === 'loading' ? (
            <div className="text-center py-10 text-text-muted text-sm">
              {t(isNewWeek ? 'Planning your week…' : 'Planning adjustments…')}
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
              applying={applying}
            />

          /* ── New week form ── */
          ) : isNewWeek ? (
            <>
              {/* Office days */}
              <div>
                <SectionLabel>{t('Office days this week')}</SectionLabel>
                <OfficeDayPicker selected={pickedOfficeDays} onChange={setPickedOfficeDays} />
                <p className="text-[11px] text-text-dim mt-2">
                  {t('Office days are passed to the planner as a weekly scheduling constraint.')}
                </p>
              </div>

              {profile && profile.commitments.length > 0 && <div>
                <SectionLabel>{t('Recurring commitments')}</SectionLabel>
                <div className="space-y-1.5">
                  {profile.commitments.map((commitment, index) => {
                    const key = `${commitment.day} ${commitment.start_time} ${commitment.activity_name}`
                    const skipped = key in skippedCommitments
                    return <div key={`${key}-${index}`}>
                      <button onClick={() => setSkippedCommitments(prev => {
                        const next = { ...prev }
                        if (skipped) delete next[key]; else next[key] = ''
                        return next
                      })} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] border border-app-border bg-surface text-left">
                        <div className="flex-1"><div className={skipped ? 'text-sm text-text-dim line-through' : 'text-sm text-app-text'}>{commitment.activity_name}</div>
                          <div className="text-[11px] text-text-dim">{t(commitment.day[0].toUpperCase() + commitment.day.slice(1))} · {commitment.start_time}</div></div>
                        <span className="text-[11px] font-semibold" style={{ color: skipped ? 'var(--text-dim)' : 'var(--done)' }}>{t(skipped ? 'off' : 'on')}</span>
                      </button>
                      {skipped && <input value={skippedCommitments[key]} onChange={e => setSkippedCommitments(prev => ({ ...prev, [key]: e.target.value }))}
                        placeholder={t('Reason (optional)')} className="mt-1.5 field w-full" />}
                    </div>
                  })}
                </div>
              </div>}

              {/* Injury */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <SectionLabel>{t('Any injuries?')}</SectionLabel>
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
                    {t(injury.active ? 'Yes' : 'No')}
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
                <SectionLabel>{t('Anything else?')}</SectionLabel>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder={t('For example, busy Tuesday evening or travelling Friday')}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-[10px] bg-surface-2 border border-app-border text-sm text-app-text placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-football resize-none"
                />
              </div>

              {proposeError && (
                <p className="text-xs" style={{ color: 'var(--cancelled)' }}>{proposeError}</p>
              )}
              <button
                onClick={handlePropose}
                className="w-full py-3 rounded-[10px] text-sm font-semibold font-display text-app-text hover:opacity-90 transition-opacity"
                style={{ backgroundColor: 'var(--football)' }}
              >
                {t('Plan this week')}
              </button>
            </>

          /* ── Adjust mode form ── */
          ) : (
            <>
              {/* Office days */}
              <div>
                <SectionLabel>{t('Office days')}</SectionLabel>
                <OfficeDayPicker selected={adjustOfficeDays} onChange={setAdjustOfficeDays} />
              </div>

              {/* Sessions */}
              <div>
                <SectionLabel>{t('Sessions this week')}</SectionLabel>
                {adjustableSessions.length === 0 ? (
                  <p className="text-sm text-text-muted">{t('No sessions this week.')}</p>
                ) : (
                  <div className="space-y-1.5">
                    {adjustableSessions.map(session => {
                      const canCancel = true
                      return (
                        <AdjustableSessionRow
                          key={session.id}
                          session={session}
                          info={affectedSessions[session.id]}
                          canCancel={canCancel}
                          onToggle={() => toggleAffectedSession(session.id, canCancel)}
                          onUpdate={patch => updateAffectedSession(session.id, patch)}
                        />
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <SectionLabel>{t('Additional context')}</SectionLabel>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder={t('Anything else affecting this week')}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-[10px] bg-surface-2 border border-app-border text-sm text-app-text placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-football resize-none"
                />
              </div>

              {proposeError && (
                <p className="text-xs" style={{ color: 'var(--cancelled)' }}>{proposeError}</p>
              )}
              <button
                onClick={handlePropose}
                disabled={!canProposeAdjust}
                className="w-full py-3 rounded-[10px] text-sm font-semibold font-display text-app-text disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                style={{ backgroundColor: 'var(--football)' }}
              >
                {t('Propose changes')}
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

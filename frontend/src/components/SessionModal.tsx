import { useRef, useCallback } from 'react'
import { Check, Zap, X, Minus, Clock } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { api } from '@/lib/api'
import type { Session, SessionStatus, FeltRating } from '@/types'
import { getWorkoutPlan } from '@/lib/workoutPlans'
import SectionLabel from '@/components/ui/SectionLabel'

const TYPE_COLORS: Record<string, string> = {
  football: 'var(--football)',
  strength: 'var(--strength)',
  speed:    'var(--speed)',
  cardio:   'var(--cardio)',
  chinese:  'var(--chinese)',
}

const STATUS_COLORS: Record<string, string> = {
  done:      'var(--done)',
  injured:   'var(--injured)',
  cancelled: 'var(--cancelled)',
  skipped:   'var(--skipped)',
}

interface Props {
  session: Session | null
  onClose: () => void
  onUpdate: (s: Session) => void
}

export default function SessionModal({ session, onClose, onUpdate }: Props) {
  const notesTimerRef = useRef<ReturnType<typeof setTimeout>>()

  const saveNotes = useCallback((id: number, notes: string) => {
    clearTimeout(notesTimerRef.current)
    notesTimerRef.current = setTimeout(() => {
      api.patchSession(id, { notes })
    }, 900)
  }, [])

  if (!session) return null
  const s = session
  const typeColor = TYPE_COLORS[s.type] ?? 'var(--border)'
  const isChinese = s.type === 'chinese'
  const plan = !isChinese ? getWorkoutPlan(s.type, s.name) : null

  const setStatus = async (status: SessionStatus) => {
    const updated = { ...s, status }
    onUpdate(updated)
    await api.patchSession(s.id, { status })
  }

  const setFelt = async (felt: FeltRating) => {
    const newFelt = s.felt === felt ? null : felt
    onUpdate({ ...s, felt: newFelt })
    await api.patchSession(s.id, { felt: newFelt ?? undefined })
  }

  const handleTimeBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const newTime = e.target.value.trim()
    if (s.time_slot === newTime) return
    onUpdate({ ...s, time_slot: newTime })
    api.patchSession(s.id, { time_slot: newTime })
  }

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const notes = e.target.value
    onUpdate({ ...s, notes })
    saveNotes(s.id, notes)
  }

  return (
    <Dialog open={!!session} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-h-[88vh] flex flex-col p-0 gap-0" onOpenAutoFocus={e => e.preventDefault()}>
        {/* Header */}
        <div
          className="px-5 pt-5 pb-4 shrink-0"
          style={{ borderBottom: `1.5px solid color-mix(in oklch, ${typeColor} 25%, var(--border))` }}
        >
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: typeColor }} />
            <span className="text-lg font-bold text-app-text leading-tight flex-1 min-w-0 truncate">{s.name}</span>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-[36px] h-[36px] -mr-1 shrink-0 flex items-center justify-center rounded-full
                text-text-dim hover:text-app-text hover:bg-surface-3 transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-football"
            >
              <X size={18} />
            </button>
          </div>
          <input
            type="text"
            defaultValue={s.time_slot ?? ''}
            placeholder="Add time"
            aria-label="Edit time slot"
            onBlur={handleTimeBlur}
            className="bg-transparent border-none outline-none w-full p-0 m-0 ml-5
              font-mono text-[11px] tracking-[0.1em] text-text-dim
              placeholder:text-text-dim placeholder:opacity-40
              focus:text-text-muted caret-football cursor-text"
          />
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Status */}
          <div>
            <SectionLabel>Status</SectionLabel>
            {isChinese ? (
              <div className="flex gap-2">
                <StatusPill label="Done"    status="done"    current={s.status} onClick={() => setStatus('done')} />
                <StatusPill label="Skipped" status="skipped" current={s.status} onClick={() => setStatus('skipped')} />
                <StatusPill label="Pending" status="pending" current={s.status} onClick={() => setStatus('pending')} />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <StatusPill label="Done"      status="done"      current={s.status} onClick={() => setStatus('done')} />
                <StatusPill label="Injured"   status="injured"   current={s.status} onClick={() => setStatus('injured')} />
                <StatusPill label="Cancelled" status="cancelled" current={s.status} onClick={() => setStatus('cancelled')} />
                <StatusPill label="Pending"   status="pending"   current={s.status} onClick={() => setStatus('pending')} />
              </div>
            )}
          </div>

          {/* Felt */}
          {!isChinese && (
            <div>
              <SectionLabel>How did it feel?</SectionLabel>
              <div className="flex gap-1.5">
                {(['great', 'good', 'okay', 'tough'] as FeltRating[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setFelt(f)}
                    className={`flex-1 py-2 px-1 rounded-[10px] border text-xs font-semibold font-display text-center transition-colors
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-strength
                      ${s.felt === f
                        ? 'border-strength text-strength bg-strength-tint'
                        : 'border-app-border text-text-muted hover:border-strength hover:text-strength'}`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <SectionLabel>Notes</SectionLabel>
            <textarea
              value={s.notes ?? ''}
              placeholder="Add a note…"
              rows={2}
              onChange={handleNotesChange}
              className="w-full min-h-16 resize-none rounded-[10px] px-3 py-2.5
                bg-surface-3 border border-[1.5px] border-app-border
                text-app-text text-sm font-display
                placeholder:text-text-dim
                outline-none focus:border-[color-mix(in_oklch,var(--football)_30%,transparent)]
                transition-colors"
            />
          </div>

          {/* Workout plan */}
          {plan && (
            <div>
              <SectionLabel>Today's plan</SectionLabel>
              <div
                className="rounded-[12px] border overflow-hidden"
                style={{ borderColor: `color-mix(in oklch, ${typeColor} 20%, var(--border))` }}
              >
                {/* Plan header */}
                <div
                  className="px-3.5 py-2.5 flex items-center justify-between"
                  style={{ background: `color-mix(in oklch, ${typeColor} 6%, var(--surface))` }}
                >
                  <span className="text-sm font-bold text-app-text">{plan.title}</span>
                  <span
                    className="font-mono text-[10px] tracking-[0.08em] uppercase px-2 py-0.5 rounded-full"
                    style={{
                      background: `color-mix(in oklch, ${typeColor} 12%, transparent)`,
                      color: typeColor,
                    }}
                  >
                    {plan.duration}
                  </span>
                </div>

                {/* Exercises */}
                <div className="divide-y divide-app-border">
                  {plan.exercises.map((ex, i) => (
                    <div key={i} className="flex items-center gap-3 px-3.5 py-2.5 bg-surface">
                      <span className="text-[11px] font-mono text-text-dim w-4 shrink-0 text-right">{i + 1}</span>
                      <span className="flex-1 text-sm text-app-text">{ex.name}</span>
                      <span
                        className="font-mono text-[11px] shrink-0"
                        style={{ color: typeColor }}
                      >
                        {ex.detail}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Tip */}
                {plan.tip && (
                  <div
                    className="px-3.5 py-2.5 text-xs text-text-muted italic leading-relaxed"
                    style={{ background: `color-mix(in oklch, ${typeColor} 4%, var(--surface))` }}
                  >
                    {plan.tip}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  done:      <Check  size={12} strokeWidth={2.5} />,
  injured:   <Zap    size={12} strokeWidth={2}   />,
  cancelled: <X      size={12} strokeWidth={2.5} />,
  skipped:   <Minus  size={12} strokeWidth={2.5} />,
  pending:   <Clock  size={12} strokeWidth={2}   />,
}

function StatusPill({
  label, status, current, onClick,
}: {
  label: string
  status: string
  current: string
  onClick: () => void
}) {
  const isActive = current === status
  const color = STATUS_COLORS[status]

  return (
    <button
      onClick={onClick}
      className="flex-1 min-w-0 py-2 px-1.5 rounded-[10px] border text-xs font-semibold font-display
        inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-all
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-football"
      style={isActive && color ? {
        borderColor: color,
        color,
        background: `color-mix(in oklch, ${color} 8%, transparent)`,
      } : {
        borderColor: 'var(--border)',
        color: 'var(--text-muted)',
      }}
    >
      {STATUS_ICONS[status]}
      {label}
    </button>
  )
}

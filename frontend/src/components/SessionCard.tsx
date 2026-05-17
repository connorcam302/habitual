import { useRef, useCallback } from 'react'
import { api } from '@/lib/api'
import type { Session, SessionStatus, FeltRating } from '@/types'

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

function StatusIcon({ status }: { status: SessionStatus }) {
  if (status === 'done') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--done)' }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
  if (status === 'injured') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--injured)' }}>
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
  if (status === 'cancelled' || status === 'skipped') {
    const c = status === 'cancelled' ? 'var(--cancelled)' : 'var(--skipped)'
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: c }}>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    )
  }
  return null
}

interface Props {
  session: Session
  expanded: boolean
  onToggle: () => void
  onUpdate: (s: Session) => void
}

export default function SessionCard({ session: s, expanded, onToggle, onUpdate }: Props) {
  const typeColor = TYPE_COLORS[s.type] ?? 'var(--border)'
  const isChinese = s.type === 'chinese'

  const notesTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const saveNotes = useCallback((notes: string) => {
    clearTimeout(notesTimerRef.current)
    notesTimerRef.current = setTimeout(async () => {
      await api.patchSession(s.id, { notes })
    }, 900)
  }, [s.id])

  const setStatus = async (status: SessionStatus) => {
    const updated = { ...s, status }
    onUpdate(updated)
    await api.patchSession(s.id, { status })
  }

  const quickToggleDone = (e: React.MouseEvent) => {
    e.stopPropagation()
    setStatus(s.status === 'done' ? 'pending' : 'done')
  }

  const setFelt = async (felt: FeltRating) => {
    const newFelt = s.felt === felt ? null : felt
    const updated = { ...s, felt: newFelt }
    onUpdate(updated)
    await api.patchSession(s.id, { felt: newFelt ?? undefined })
  }

  const handleTimeBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const newTime = e.target.value.trim()
    if (s.time_slot === newTime) return
    const updated = { ...s, time_slot: newTime }
    onUpdate(updated)
    api.patchSession(s.id, { time_slot: newTime })
  }

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const notes = e.target.value
    onUpdate({ ...s, notes })
    saveNotes(notes)
  }

  const statusBtnBg = ['done', 'injured', 'cancelled', 'skipped'].includes(s.status)
    ? `color-mix(in oklch, ${STATUS_COLORS[s.status]} 9%, transparent)`
    : 'transparent'
  const statusBtnBorder = STATUS_COLORS[s.status] ?? 'var(--border)'

  const cardOpacity = (s.status === 'done' || s.status === 'cancelled' || s.status === 'skipped')
    ? s.status === 'done' ? '0.55' : '0.45'
    : '1'

  return (
    <div
      className="mx-3 mb-2 rounded-[14px] bg-surface border overflow-hidden cursor-pointer
        hover:bg-surface-2 active:opacity-75 transition-colors md:mx-0"
      style={{
        borderColor: s.status === 'injured' ? 'var(--injured)'
          : s.status === 'cancelled' ? 'var(--cancelled)'
          : typeColor,
        opacity: cardOpacity,
        transition: 'opacity 0.2s, border-color 0.2s, background 0.15s',
      }}
      onClick={(e) => {
        if ((e.target as HTMLElement).tagName === 'INPUT' ||
            (e.target as HTMLElement).tagName === 'TEXTAREA') return
        onToggle()
      }}
    >
      {/* Card header */}
      <div className="flex items-center px-3.5 py-3 gap-3" onClick={(e) => {
        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).tagName === 'INPUT') return
      }}>
        {/* Type dot */}
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: typeColor }} />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold text-app-text truncate">{s.name}</div>
          <input
            type="text"
            defaultValue={s.time_slot ?? ''}
            placeholder="Add time"
            aria-label="Edit time slot"
            onClick={(e) => e.stopPropagation()}
            onBlur={handleTimeBlur}
            className="bg-transparent border-none outline-none w-full min-w-0 p-0 m-0
              font-mono text-[11px] tracking-[0.1em] text-text-dim
              placeholder:text-text-dim placeholder:opacity-40
              focus:text-text-muted caret-football cursor-text"
          />
        </div>

        {/* Quick done button */}
        <button
          aria-label={s.status === 'done' ? 'Mark as pending' : 'Mark as done'}
          onClick={quickToggleDone}
          className="w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 transition-all
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-football focus-visible:ring-offset-2"
          style={{
            border: `2px solid ${statusBtnBorder}`,
            background: statusBtnBg,
          }}
        >
          <StatusIcon status={s.status} />
        </button>

        {/* Chevron */}
        <span
          className={`chevron text-[12px] text-text-dim ml-0.5 shrink-0 select-none ${expanded ? 'open' : ''}`}
          aria-hidden
        >▾</span>
      </div>

      {/* Expandable body */}
      <div className={`card-expand ${expanded ? 'open' : ''}`}>
        <div className="overflow-hidden">
          <div className="px-3.5 pb-3.5 pt-0 border-t border-app-border">
            {/* Status pills */}
            {isChinese ? (
              <div className="flex gap-2 mt-3 flex-wrap">
                <StatusPill label="Done"    status="done"    current={s.status} onClick={() => setStatus('done')} />
                <StatusPill label="Skipped" status="skipped" current={s.status} onClick={() => setStatus('skipped')} />
                <StatusPill label="Pending" status="pending" current={s.status} onClick={() => setStatus('pending')} />
              </div>
            ) : (
              <div className="flex gap-2 mt-3 flex-wrap">
                <StatusPill label="Done"      status="done"      current={s.status} onClick={() => setStatus('done')} />
                <StatusPill label="Injured"   status="injured"   current={s.status} onClick={() => setStatus('injured')} />
                <StatusPill label="Cancelled" status="cancelled" current={s.status} onClick={() => setStatus('cancelled')} />
                <StatusPill label="Pending"   status="pending"   current={s.status} onClick={() => setStatus('pending')} />
              </div>
            )}

            {/* Felt (physical sessions only) */}
            {!isChinese && (
              <div className="mt-3">
                <div className="text-[11px] font-semibold tracking-[0.08em] text-text-dim uppercase mb-2">
                  How did it feel?
                </div>
                <div className="flex gap-1.5">
                  {(['great', 'good', 'okay', 'tough'] as FeltRating[]).map(f => (
                    <button
                      key={f}
                      onClick={(e) => { e.stopPropagation(); setFelt(f) }}
                      className={`flex-1 py-1.5 px-1 rounded-lg border text-[11px] font-semibold font-display text-center transition-colors
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
            <div className="mt-3" onClick={(e) => e.stopPropagation()}>
              <textarea
                value={s.notes ?? ''}
                placeholder="Add a note…"
                rows={2}
                onChange={handleNotesChange}
                className="w-full min-h-16 resize-none rounded-[10px] px-3 py-2.5
                  bg-surface-3 border border-[1.5px] border-app-border
                  text-app-text text-[13px] font-display
                  placeholder:text-text-dim
                  outline-none focus:border-[color-mix(in_oklch,var(--football)_30%,transparent)]
                  transition-colors"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
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
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className="flex-1 min-w-0 py-2 px-1.5 rounded-[10px] border text-[12px] font-semibold font-display
        text-center whitespace-nowrap transition-all
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
      {label}
    </button>
  )
}

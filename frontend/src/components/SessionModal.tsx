import { useRef, useCallback } from 'react'
import { Check, Zap, X, Minus, Clock } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { api } from '@/lib/api'
import type { Session, SessionStatus, FeltRating } from '@/types'
import SectionLabel from '@/components/ui/SectionLabel'
import { useI18n } from '@/lib/i18n'
import { CATEGORY_COLORS } from '@/lib/categories'

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
  const { t } = useI18n()
  const notesTimerRef = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const saveNotes = useCallback((id: number, notes: string) => {
    clearTimeout(notesTimerRef.current.get(id))
    notesTimerRef.current.set(id, setTimeout(() => {
      notesTimerRef.current.delete(id)
      api.patchSession(id, { notes }).catch(() => undefined)
    }, 900)
    )
  }, [])

  if (!session) return null
  const s = session
  const typeColor = CATEGORY_COLORS[s.category] ?? 'var(--border)'
  const isNonPhysical = ['learning', 'lifestyle'].includes(s.category)

  const setStatus = async (status: SessionStatus) => {
    const updated = { ...s, status }
    onUpdate(updated)
    try {
      await api.patchSession(s.id, { status })
    } catch {
      onUpdate(s)
    }
  }

  const setFelt = async (felt: FeltRating) => {
    const newFelt = s.felt === felt ? null : felt
    onUpdate({ ...s, felt: newFelt })
    try {
      await api.patchSession(s.id, { felt: newFelt })
    } catch {
      onUpdate(s)
    }
  }

  const handleTimeBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const newTime = e.target.value.trim()
    if (s.time_slot === newTime) return
    onUpdate({ ...s, time_slot: newTime })
    api.patchSession(s.id, { time_slot: newTime }).catch(() => onUpdate(s))
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
            <span className="text-lg font-bold text-app-text leading-tight flex-1 min-w-0 truncate">{t(s.name)}</span>
            <button
              onClick={onClose}
              aria-label={t('Close')}
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
            placeholder={t('Add time')}
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
            <SectionLabel>{t('Status')}</SectionLabel>
            {isNonPhysical ? (
              <div className="flex gap-2">
                <StatusPill label={t('Done')}    status="done"    current={s.status} onClick={() => setStatus('done')} />
                <StatusPill label={t('Skipped')} status="skipped" current={s.status} onClick={() => setStatus('skipped')} />
                <StatusPill label={t('Pending')} status="pending" current={s.status} onClick={() => setStatus('pending')} />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <StatusPill label={t('Done')}      status="done"      current={s.status} onClick={() => setStatus('done')} />
                <StatusPill label={t('Injured')}   status="injured"   current={s.status} onClick={() => setStatus('injured')} />
                <StatusPill label={t('Cancelled')} status="cancelled" current={s.status} onClick={() => setStatus('cancelled')} />
                <StatusPill label={t('Pending')}   status="pending"   current={s.status} onClick={() => setStatus('pending')} />
              </div>
            )}
          </div>

          {/* Felt */}
          {!isNonPhysical && (
            <div>
              <SectionLabel>{t('How did it feel?')}</SectionLabel>
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
                    {t(f.charAt(0).toUpperCase() + f.slice(1))}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <SectionLabel>{t('Notes')}</SectionLabel>
            <textarea
              value={s.notes ?? ''}
              placeholder={t('Add a note…')}
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

          {s.brief && <div>
            <SectionLabel>{t('Session brief')}</SectionLabel>
            <div className="rounded-[12px] border border-app-border bg-surface-3 px-3.5 py-3 text-sm text-app-text leading-relaxed">{s.brief}</div>
          </div>}

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

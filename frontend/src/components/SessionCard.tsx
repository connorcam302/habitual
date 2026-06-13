import { Check, Zap, X, Minus, ChevronRight } from 'lucide-react'
import { api } from '@/lib/api'
import type { Session, SessionStatus } from '@/types'
import { useI18n } from '@/lib/i18n'
import { CATEGORY_COLORS } from '@/lib/categories'

const STATUS_COLORS: Record<string, string> = {
  done:      'var(--done)',
  injured:   'var(--injured)',
  cancelled: 'var(--cancelled)',
  skipped:   'var(--skipped)',
}

function StatusIcon({ status }: { status: SessionStatus }) {
  if (status === 'done')      return <Check      size={14} strokeWidth={2.5} style={{ color: 'var(--done)'      }} />
  if (status === 'injured')   return <Zap        size={13} strokeWidth={2}   style={{ color: 'var(--injured)'   }} />
  if (status === 'cancelled') return <X          size={13} strokeWidth={2.5} style={{ color: 'var(--cancelled)' }} />
  if (status === 'skipped')   return <Minus      size={13} strokeWidth={2.5} style={{ color: 'var(--skipped)'   }} />
  return null
}

interface Props {
  session: Session
  onOpen: () => void
  onUpdate: (s: Session) => void
}

export default function SessionCard({ session: s, onOpen, onUpdate }: Props) {
  const { t } = useI18n()
  const typeColor = CATEGORY_COLORS[s.category] ?? 'var(--border)'

  const setStatus = async (status: SessionStatus) => {
    const updated = { ...s, status }
    onUpdate(updated)
    try {
      await api.patchSession(s.id, { status })
    } catch {
      onUpdate(s)
    }
  }

  const quickToggleDone = (e: React.MouseEvent) => {
    e.stopPropagation()
    setStatus(s.status === 'done' ? 'pending' : 'done')
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
      className="mx-3 mb-2 rounded-[14px] bg-surface border overflow-hidden cursor-pointer select-none
        hover:bg-surface-2 active:opacity-75 transition-colors md:mx-0"
      style={{
        borderColor: s.status === 'injured' ? 'var(--injured)'
          : s.status === 'cancelled' ? 'var(--cancelled)'
          : typeColor,
        opacity: cardOpacity,
        transition: 'opacity 0.2s, border-color 0.2s, background 0.15s',
      }}
      onClick={onOpen}
    >
      <div className="flex items-center px-3.5 py-3 gap-3">
        {/* Type dot */}
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: typeColor }} />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="text-base font-semibold text-app-text truncate">{t(s.name)}</div>
          {s.time_slot && (
            <div className="font-mono text-[11px] tracking-[0.1em] text-text-dim">
              {s.time_slot}
            </div>
          )}
          {s.brief && <div className="text-xs text-text-muted truncate mt-0.5">{s.brief}</div>}
        </div>

        {/* Quick done button — 44px hit area, 30px visual circle */}
        <button
          aria-label={t(s.status === 'done' ? 'Mark as pending' : 'Mark as done')}
          onClick={quickToggleDone}
          className="w-[44px] h-[44px] rounded-full flex items-center justify-center shrink-0
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-football"
        >
          <span
            className="w-[30px] h-[30px] rounded-full flex items-center justify-center transition-all pointer-events-none"
            style={{ border: `2px solid ${statusBtnBorder}`, background: statusBtnBg }}
          >
            <StatusIcon status={s.status} />
          </span>
        </button>

        <ChevronRight size={14} strokeWidth={2} className="text-text-dim shrink-0 ml-0.5" aria-hidden />
      </div>
    </div>
  )
}

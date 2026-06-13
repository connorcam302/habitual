import { forwardRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Sparkles, Trash2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { formatWeekLabel } from '@/lib/utils'
import type { Session, User } from '@/types'
import { useI18n } from '@/lib/i18n'

interface Props {
  currentWeek: string
  sessions: Session[]
  view: 'week' | 'history'
  onNavigateWeek: (dir: number) => void
  onSwitchView: (v: 'week' | 'history') => void
  onOpenAIModal: () => void
  onDeleteWeek: () => void
  weekExists: boolean
  user: User
  onOpenSettings: () => void
}

const Header = forwardRef<HTMLElement, Props>(function Header({
  currentWeek, sessions, view,
  onNavigateWeek, onSwitchView, onOpenAIModal, onDeleteWeek, weekExists, user, onOpenSettings,
}, ref) {
  const { t, locale } = useI18n()
  const [confirming, setConfirming] = useState(false)

  const done  = sessions.filter(s => s.status === 'done').length
  const total = sessions.length
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0
  const initials = user.display_name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase()

  return (
    <header
      ref={ref}
      className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50
        bg-bg border-b border-app-border md:max-w-[1080px]"
      style={{ paddingTop: 'var(--safe-top)' }}
    >
      <div className="flex flex-wrap items-center gap-x-4 px-4 pt-3 pb-0 md:flex-nowrap md:px-6 md:pt-3.5">

        {/* Brand */}
        <span className="font-mono text-[11px] tracking-[0.2em] text-text-muted font-medium shrink-0">
          HABITUAL
        </span>

        {/* Desktop tab switcher */}
        <div className="hidden md:flex gap-0.5 bg-surface-2 border border-app-border rounded-[10px] p-[3px] shrink-0">
          {([['week', t('This Week')], ['history', t('All Time')]] as const).map(([v, label]) => (
            <button
              key={v}
              className={`px-3.5 py-1.5 rounded-[7px] text-sm font-semibold font-display transition-colors
                ${view === v ? 'bg-surface-3 text-app-text' : 'text-text-muted hover:text-app-text'}`}
              onClick={() => onSwitchView(v)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Week nav + actions — wraps to second row on mobile */}
        <div className="flex items-center w-full gap-2 mt-2.5 md:mt-0 md:flex-1">

          <button
            onClick={() => onNavigateWeek(-1)}
            aria-label={t('Previous week')}
            className="bg-surface-2 border border-app-border rounded-[10px] px-3 h-[38px] inline-flex items-center
              text-app-text shrink-0
              hover:bg-surface-3 transition-colors
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-football"
          ><ChevronLeft size={16} /></button>

          <div className="flex-1 text-center text-sm font-bold md:text-base whitespace-nowrap overflow-hidden">
            {currentWeek ? formatWeekLabel(currentWeek, locale) : ''}
          </div>

          <button
            onClick={() => onNavigateWeek(1)}
            aria-label={t('Next week')}
            className="bg-surface-2 border border-app-border rounded-[10px] px-3 h-[38px] inline-flex items-center
              text-app-text shrink-0
              hover:bg-surface-3 transition-colors
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-football"
          ><ChevronRight size={16} /></button>

          {/* Week actions */}
          {view === 'week' && weekExists && (
            <div className="flex items-center gap-1 shrink-0 border-l border-app-border pl-2 ml-0.5">
              {confirming ? (
                <>
                  <button
                    onClick={() => { setConfirming(false); onDeleteWeek() }}
                    className="h-[34px] px-3 rounded-full text-xs font-semibold font-display
                      hover:opacity-70 transition-opacity"
                    style={{ color: 'var(--cancelled)' }}
                  >
                    {t('Delete')}
                  </button>
                  <button
                    onClick={() => setConfirming(false)}
                    className="h-[34px] px-3 rounded-full text-xs font-semibold font-display
                      text-text-dim hover:text-text-muted transition-colors"
                  >
                    {t('Cancel')}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={onOpenAIModal}
                    aria-label={t('Adjust week with AI')}
                    className="h-[34px] px-2.5 rounded-full inline-flex items-center gap-1.5 shrink-0
                      border border-app-border bg-surface-2 hover:bg-surface-3
                      text-xs font-semibold font-display text-text-muted hover:text-app-text
                      transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-football"
                  >
                    <Sparkles size={12} />
                    <span>{t('Adjust')}</span>
                  </button>
                  <button
                    onClick={() => setConfirming(true)}
                    aria-label={t('Delete this week')}
                    className="h-[34px] w-[34px] inline-flex items-center justify-center rounded-full
                      text-text-dim hover:text-cancelled hover:bg-surface-2
                      transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-football"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          )}
          <button onClick={onOpenSettings} aria-label={t('View profile and settings')} title={user.display_name}
            className="h-[38px] inline-flex items-center gap-2 rounded-full border border-app-border bg-surface-2 p-1 pr-1
              text-text-muted hover:bg-surface-3 hover:text-app-text transition-colors
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-football md:pr-3">
            <span className="h-7 w-7 inline-flex items-center justify-center rounded-full bg-surface-3 font-mono text-[10px] font-bold text-app-text">
              {initials || '?'}
            </span>
            <span className="hidden max-w-28 truncate text-xs font-semibold md:block">{user.display_name}</span>
          </button>

        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 md:px-6 md:pb-3.5">
        <Progress value={pct} className="flex-1" />
        <span
          className="font-mono text-[11px] whitespace-nowrap transition-colors duration-300"
          style={{ color: done > 0 && done === total ? 'var(--done)' : 'var(--text-muted)' }}
        >
          {done} / {total}
        </span>
      </div>
    </header>
  )
})

export default Header

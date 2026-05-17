import { Progress } from '@/components/ui/progress'
import { formatWeekLabel } from '@/lib/utils'
import type { Session } from '@/types'

interface Props {
  currentWeek: string
  sessions: Session[]
  view: 'week' | 'history'
  onNavigateWeek: (dir: number) => void
  onSwitchView: (v: 'week' | 'history') => void
  onOpenEditModal: () => void
}

export default function Header({
  currentWeek,
  sessions,
  view,
  onNavigateWeek,
  onSwitchView,
  onOpenEditModal,
}: Props) {
  const done = sessions.filter(s => s.status === 'done').length
  const total = sessions.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <header
      className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50
        bg-bg border-b border-app-border
        md:max-w-[1080px]"
      style={{ paddingTop: 'var(--safe-top)' }}
    >
      {/* Top row */}
      <div className="flex flex-wrap items-center gap-4 px-4 pt-3 pb-0 md:flex-nowrap md:px-6 md:pt-3.5 md:pb-0">
        <span className="font-mono text-[11px] tracking-[0.2em] text-text-muted font-medium shrink-0">
          HABITUAL
        </span>

        {/* Desktop tab switcher */}
        <div className="hidden md:flex gap-0.5 bg-surface-2 border border-app-border rounded-[10px] p-[3px] shrink-0">
          <button
            className={`px-3.5 py-1.5 rounded-[7px] text-[13px] font-semibold font-display transition-colors
              ${view === 'week' ? 'bg-surface-3 text-app-text' : 'text-text-muted hover:text-app-text'}`}
            onClick={() => onSwitchView('week')}
          >
            This Week
          </button>
          <button
            className={`px-3.5 py-1.5 rounded-[7px] text-[13px] font-semibold font-display transition-colors
              ${view === 'history' ? 'bg-surface-3 text-app-text' : 'text-text-muted hover:text-app-text'}`}
            onClick={() => onSwitchView('history')}
          >
            All Time
          </button>
        </div>

        {/* Week nav — full-width on mobile, flex-1 on desktop */}
        <div className="flex items-center justify-between w-full md:w-auto md:flex-1 md:justify-center md:gap-4 mt-2.5 mb-0 md:my-0">
          <button
            onClick={() => onNavigateWeek(-1)}
            aria-label="Previous week"
            className="bg-surface-2 border border-app-border rounded-[10px] px-3.5 py-2 text-app-text text-lg leading-none hover:bg-surface-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-football"
          >
            ‹
          </button>
          <div className="text-base font-bold md:text-[15px]">
            {currentWeek ? formatWeekLabel(currentWeek) : ''}
          </div>
          <button
            onClick={() => onNavigateWeek(1)}
            aria-label="Next week"
            className="bg-surface-2 border border-app-border rounded-[10px] px-3.5 py-2 text-app-text text-lg leading-none hover:bg-surface-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-football"
          >
            ›
          </button>
        </div>

        {view === 'week' && (
          <button
            onClick={onOpenEditModal}
            className="text-[11px] text-text-dim bg-transparent border-none cursor-pointer font-display hover:text-text-muted shrink-0 md:ml-0 ml-auto"
          >
            office days
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 md:px-6 md:pb-3.5">
        <Progress value={pct} className="flex-1" />
        <span className="font-mono text-[11px] text-text-muted whitespace-nowrap">
          {done} / {total}
        </span>
      </div>
    </header>
  )
}

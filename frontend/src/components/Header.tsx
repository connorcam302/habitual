import { useState } from 'react'
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
  onOpenAIModal: () => void
  onDeleteWeek: () => void
  weekExists: boolean
}

export default function Header({
  currentWeek, sessions, view,
  onNavigateWeek, onSwitchView, onOpenEditModal, onOpenAIModal, onDeleteWeek, weekExists,
}: Props) {
  const [confirming, setConfirming] = useState(false)

  const done  = sessions.filter(s => s.status === 'done').length
  const total = sessions.length
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0

  const handleDeleteClick = () => {
    if (!confirming) { setConfirming(true); return }
    setConfirming(false)
    onDeleteWeek()
  }

  return (
    <header
      className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50
        bg-bg border-b border-app-border md:max-w-[1080px]"
      style={{ paddingTop: 'var(--safe-top)' }}
    >
      {/* Top row */}
      <div className="flex flex-wrap items-center gap-4 px-4 pt-3 pb-0 md:flex-nowrap md:px-6 md:pt-3.5 md:pb-0">
        <span className="font-mono text-[11px] tracking-[0.2em] text-text-muted font-medium shrink-0">
          HABITUAL
        </span>

        {/* Desktop tab switcher */}
        <div className="hidden md:flex gap-0.5 bg-surface-2 border border-app-border rounded-[10px] p-[3px] shrink-0">
          {([['week', 'This Week'], ['history', 'All Time']] as const).map(([v, label]) => (
            <button
              key={v}
              className={`px-3.5 py-1.5 rounded-[7px] text-[13px] font-semibold font-display transition-colors
                ${view === v ? 'bg-surface-3 text-app-text' : 'text-text-muted hover:text-app-text'}`}
              onClick={() => onSwitchView(v)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Week nav */}
        <div className="flex items-center justify-between w-full md:w-auto md:flex-1 md:justify-center md:gap-4 mt-2.5 mb-0 md:my-0">
          <button
            onClick={() => onNavigateWeek(-1)}
            aria-label="Previous week"
            className="bg-surface-2 border border-app-border rounded-[10px] px-3.5 py-2 text-app-text text-lg leading-none hover:bg-surface-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-football"
          >‹</button>
          <div className="text-base font-bold md:text-[15px]">
            {currentWeek ? formatWeekLabel(currentWeek) : ''}
          </div>
          <button
            onClick={() => onNavigateWeek(1)}
            aria-label="Next week"
            className="bg-surface-2 border border-app-border rounded-[10px] px-3.5 py-2 text-app-text text-lg leading-none hover:bg-surface-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-football"
          >›</button>
        </div>

        {/* Right-side controls (week view only) */}
        {view === 'week' && (
          <div className="flex items-center gap-3 ml-auto md:ml-0 shrink-0">
            <button
              onClick={onOpenEditModal}
              className="text-[11px] text-text-dim bg-transparent border-none cursor-pointer font-display hover:text-text-muted"
            >
              office days
            </button>

            {weekExists && (
              <>
                <button
                  onClick={onOpenAIModal}
                  aria-label="Adjust week with AI"
                  title="Adjust week with AI"
                  className="text-text-dim hover:text-app-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-football rounded"
                >
                  <SparkleIcon />
                </button>

                {confirming ? (
                  <span className="flex items-center gap-1.5">
                    <button
                      onClick={handleDeleteClick}
                      className="text-[11px] font-semibold font-display hover:opacity-80 transition-opacity"
                      style={{ color: 'var(--cancelled)' }}
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setConfirming(false)}
                      className="text-[11px] text-text-dim hover:text-text-muted font-display transition-colors"
                    >
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => setConfirming(true)}
                    aria-label="Delete this week"
                    title="Delete this week"
                    className="text-text-dim hover:text-cancelled transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-football rounded"
                  >
                    <TrashIcon />
                  </button>
                )}
              </>
            )}
          </div>
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

function SparkleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z" />
      <path d="M5 3l.75 2.75L8.5 6.5l-2.75.75L5 10l-.75-2.75L1.5 6.5l2.75-.75z" />
      <path d="M19 14l.75 2.75L22.5 17.5l-2.75.75L19 21l-.75-2.75L15.5 17.5l2.75-.75z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { CalendarDays, BarChart3 } from 'lucide-react'
import type { Session, Week, Stats } from './types'
import { api } from './lib/api'
import { currentMondayISO, addWeeks } from './lib/utils'
import LoadingScreen from './components/LoadingScreen'
import Header from './components/Header'
import WeekView from './components/WeekView'
import AIAdjustModal from './components/AIAdjustModal'

const HistoryView = lazy(() => import('./components/HistoryView'))

type View = 'week' | 'history'

export default function App() {
  const [currentWeek, setCurrentWeek] = useState('')
  const [sessions, setSessions] = useState<Session[]>([])
  const [officeDays, setOfficeDays] = useState<string[]>([])
  const [view, setView] = useState<View>('week')
  const [loading, setLoading] = useState(true)
  const [appError, setAppError] = useState(false)
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [weeks, setWeeks] = useState<Week[]>([])
  const [stats, setStats] = useState<Stats | null>(null)

  const loadWeek = useCallback(async (weekISO: string) => {
    setCurrentWeek(weekISO)
    history.replaceState(null, '', '?week=' + weekISO)

    const data = await api.getSessions(weekISO)
    if (!data.week_exists) {
      setSessions([])
      setOfficeDays([])
      if (weekISO >= currentMondayISO()) {
        setAiModalOpen(true)
      }
      return
    }

    setSessions(data.sessions)
    const odData = await api.getOfficeDays(weekISO)
    setOfficeDays(odData.office_days ?? [])
  }, [])

  useEffect(() => {
    async function init() {
      try {
        const paramWeek = new URLSearchParams(window.location.search).get('week')
        const result = await api.seedAuto()

        if (result.needs_setup && !paramWeek) {
          setCurrentWeek(result.week_start)
          setLoading(false)
          setAiModalOpen(true)
        } else {
          await loadWeek(paramWeek ?? result.week_start)
          setLoading(false)
        }
      } catch {
        setLoading(false)
        setAppError(true)
      }
    }
    init()
  }, [loadWeek])

  const navigateWeek = (direction: number) => {
    loadWeek(addWeeks(currentWeek, direction))
  }

  const updateSession = (updated: Session) => {
    setSessions(prev => prev.map(s => s.id === updated.id ? updated : s))
  }

  const loadHistory = useCallback(async () => {
    const [weeksData, statsData] = await Promise.all([api.getWeeks(), api.getStats()])
    setWeeks(weeksData.weeks ?? [])
    setStats(statsData)
  }, [])

  const handleSwitchView = (v: View) => {
    setView(v)
    if (v === 'history') loadHistory()
  }

  const handleDeleteWeek = async () => {
    try {
      await api.deleteWeek(currentWeek)
      setSessions([])
      setOfficeDays([])
    } catch {
      // week may already be gone — state is fine
    }
  }

  const handleAIApplied = (newSessions: Session[], newOfficeDays?: string[]) => {
    setSessions(newSessions)
    if (newOfficeDays !== undefined) setOfficeDays(newOfficeDays)
  }

  const headerHeight = 'calc(var(--safe-top) + 106px)'
  const cssVars = { '--header-h': headerHeight } as React.CSSProperties

  if (loading) return <LoadingScreen />

  return (
    <div className="flex flex-col h-full" style={cssVars}>
      <Header
        currentWeek={currentWeek}
        sessions={sessions}
        view={view}
        onNavigateWeek={navigateWeek}
        onSwitchView={handleSwitchView}
        onOpenAIModal={() => setAiModalOpen(true)}
        onDeleteWeek={handleDeleteWeek}
        weekExists={sessions.length > 0}
      />

      {/* Main content area */}
      <main
        className="flex-1 md:max-w-[1080px] md:mx-auto md:w-full"
        style={{
          paddingTop: headerHeight,
          paddingBottom: `calc(72px + var(--safe-bottom))`,
          overflow: 'auto',
        }}
      >
        {appError ? (
          <div className="text-center py-16 px-6 text-text-muted">
            <div className="text-4xl mb-3">⚠️</div>
            <div className="text-base">Could not connect to server.<br />Check your connection and reload.</div>
          </div>
        ) : view === 'week' ? (
          <WeekView
            currentWeek={currentWeek}
            sessions={sessions}
            officeDays={officeDays}
            onUpdateSession={updateSession}
          />
        ) : (
          <Suspense fallback={null}>
            <HistoryView weeks={weeks} stats={stats} />
          </Suspense>
        )}
      </main>

      {/* Bottom tab bar — mobile only */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50
          bg-surface border-t border-app-border flex md:hidden"
        style={{ paddingBottom: 'var(--safe-bottom)' }}
      >
        <TabBtn active={view === 'week'}    icon={<CalendarDays size={20} />} label="This Week" onClick={() => handleSwitchView('week')} />
        <TabBtn active={view === 'history'} icon={<BarChart3    size={20} />} label="All Time"  onClick={() => handleSwitchView('history')} />
      </div>

      <AIAdjustModal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        currentWeek={currentWeek}
        sessions={sessions}
        officeDays={officeDays}
        onApplied={handleAIApplied}
      />
    </div>
  )
}

function TabBtn({ active, icon, label, onClick }: {
  active: boolean; icon: React.ReactNode; label: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1
        bg-transparent border-none cursor-pointer text-[11px] font-semibold font-display
        transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-football
        ${active ? 'text-football' : 'text-text-dim hover:text-text-muted'}`}
    >
      <span aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </button>
  )
}

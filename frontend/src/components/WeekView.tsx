import { useState } from 'react'
import SessionCard from './SessionCard'
import SessionModal from './SessionModal'
import WeekSidebar from './WeekSidebar'
import { DAY_ORDER, dayDisplayName, dateForDay, todayDayName, currentMondayISO } from '@/lib/utils'
import type { Session } from '@/types'
import { useI18n } from '@/lib/i18n'

interface Props {
  currentWeek: string
  sessions: Session[]
  officeDays: string[]
  onUpdateSession: (s: Session) => void
}

export default function WeekView({ currentWeek, sessions, officeDays, onUpdateSession }: Props) {
  const { t, locale } = useI18n()
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const today = todayDayName()
  const isCurrentWeek = currentWeek === currentMondayISO()

  const grouped = sessions
    .filter(s => s.status !== 'cancelled')
    .reduce<Record<string, Session[]>>((acc, s) => {
      if (!acc[s.day]) acc[s.day] = []
      acc[s.day].push(s)
      return acc
    }, {})

  const handleUpdate = (updated: Session) => {
    onUpdateSession(updated)
    if (activeSession?.id === updated.id) setActiveSession(updated)
  }

  return (
    <>
      <div
        className="pt-3 md:grid md:gap-x-6 md:px-6 md:pt-6 md:items-start"
        style={{ gridTemplateColumns: '1fr 260px' }}
      >
        {/* Session list */}
        <div>
          {DAY_ORDER.map(day => {
            const daySessions = grouped[day] ?? []
            const isToday = isCurrentWeek && day === today
            const dateStr = dateForDay(currentWeek, day, locale)

            return (
              <div key={day} className="mb-5">
                {/* Day header */}
                <div className="flex items-center gap-2.5 px-4 mb-2 md:px-1">
                  <span
                    className={`font-mono text-[11px] font-medium tracking-[0.1em] uppercase
                      ${isToday ? 'text-app-text' : 'text-text-muted'}`}
                  >
                    {dayDisplayName(day, locale)}
                  </span>
                  {isToday && (
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full tracking-[0.05em]"
                      style={{
                        background: 'color-mix(in oklch, var(--football) 12%, transparent)',
                        color: 'var(--football)',
                      }}
                    >
                      {t('TODAY')}
                    </span>
                  )}
                  <span className="font-mono text-[11px] text-text-dim ml-auto">{dateStr}</span>
                </div>

                {/* Sessions or rest day */}
                {daySessions.length === 0 ? (
                  <div className="mx-4 mb-1 flex items-center gap-3 md:mx-1">
                    <div className="h-px flex-1 border-t border-dashed border-app-border" />
                    <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-text-dim shrink-0">{t('rest')}</span>
                    <div className="h-px flex-1 border-t border-dashed border-app-border" />
                  </div>
                ) : (
                  daySessions.map(s => (
                    <SessionCard
                      key={s.id}
                      session={s}
                      onOpen={() => setActiveSession(s)}
                      onUpdate={handleUpdate}
                    />
                  ))
                )}
              </div>
            )
          })}
        </div>

        <WeekSidebar sessions={sessions} officeDays={officeDays} />
      </div>

      <SessionModal
        session={activeSession}
        onClose={() => setActiveSession(null)}
        onUpdate={handleUpdate}
      />
    </>
  )
}

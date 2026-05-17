import { useState } from 'react'
import SessionCard from './SessionCard'
import WeekSidebar from './WeekSidebar'
import { DAY_ORDER, dayDisplayName, dateForDay, todayDayName, currentMondayISO } from '@/lib/utils'
import type { Session } from '@/types'

interface Props {
  currentWeek: string
  sessions: Session[]
  officeDays: string[]
  onUpdateSession: (s: Session) => void
}

export default function WeekView({ currentWeek, sessions, officeDays, onUpdateSession }: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const today = todayDayName()
  const isCurrentWeek = currentWeek === currentMondayISO()

  const grouped = sessions.reduce<Record<string, Session[]>>((acc, s) => {
    if (!acc[s.day]) acc[s.day] = []
    acc[s.day].push(s)
    return acc
  }, {})

  return (
    <div
      className="md:grid md:gap-x-6 md:px-6 md:pt-6 md:items-start"
      style={{ gridTemplateColumns: '1fr 260px' }}
    >
      {/* Session list */}
      <div>
        {DAY_ORDER.map(day => {
          const daySessions = grouped[day] ?? []
          const isToday = isCurrentWeek && day === today
          const dateStr = dateForDay(currentWeek, day)

          return (
            <div key={day} className="mb-6 md:mb-5">
              {/* Day header */}
              <div className="flex items-center gap-2.5 px-4 mb-2.5 md:px-1">
                <span
                  className={`font-mono text-[11px] font-medium tracking-[0.1em] uppercase
                    ${isToday ? 'text-app-text' : 'text-text-muted'}`}
                >
                  {dayDisplayName(day)}
                </span>
                {isToday && (
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full tracking-[0.05em]"
                    style={{
                      background: 'color-mix(in oklch, var(--football) 12%, transparent)',
                      color: 'var(--football)',
                    }}
                  >
                    TODAY
                  </span>
                )}
                <span className="font-mono text-[11px] text-text-dim ml-auto">{dateStr}</span>
              </div>

              {/* Sessions or rest day */}
              {daySessions.length === 0 ? (
                <div
                  className="mx-3 mb-2 py-2.5 px-3.5 rounded-xl border border-dashed border-app-border
                    text-[13px] text-text-dim md:mx-0"
                >
                  Rest day
                </div>
              ) : (
                daySessions.map(s => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    expanded={expandedId === s.id}
                    onToggle={() => setExpandedId(prev => prev === s.id ? null : s.id)}
                    onUpdate={onUpdateSession}
                  />
                ))
              )}
            </div>
          )
        })}
      </div>

      <WeekSidebar sessions={sessions} officeDays={officeDays} />
    </div>
  )
}

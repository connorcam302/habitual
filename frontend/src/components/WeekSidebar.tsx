import type { Session } from '@/types'
import { useI18n } from '@/lib/i18n'
import { CATEGORIES, CATEGORY_COLORS } from '@/lib/categories'

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
const SHORT: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri',
}

interface Props {
  sessions: Session[]
  officeDays: string[]
}

export default function WeekSidebar({ sessions, officeDays }: Props) {
  const { t } = useI18n()
  return (
    <aside className="hidden md:block sticky" style={{ top: 'var(--header-h)' }}>
      {/* By type */}
      <div className="bg-surface border border-app-border rounded-[14px] p-4 mb-3">
        <div className="font-mono text-[10px] tracking-[0.1em] text-text-dim uppercase mb-3.5">
          {t('By type')}
        </div>
        {sessions.length === 0 ? (
          <div className="text-sm text-text-dim">{t('Week not tracked')}</div>
        ) : (
          CATEGORIES.map(key => {
            const all = sessions.filter(s => s.category === key && s.status !== 'cancelled')
            if (all.length === 0) return null
            const color = CATEGORY_COLORS[key]
            const done = all.filter(s => s.status === 'done').length
            const pct = Math.round((done / all.length) * 100)
            return (
              <div key={key} className="mb-3 last:mb-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: color }} />
                  <span className="text-sm font-medium text-app-text flex-1">{t(key[0].toUpperCase() + key.slice(1))}</span>
                  <span className="font-mono text-[11px] text-text-muted">{done}/{all.length}</span>
                </div>
                <div className="h-[3px] bg-app-border rounded-sm overflow-hidden">
                  <div
                    className="h-full w-full rounded-sm transition-transform duration-[400ms]"
                    style={{ background: color, transform: `translateX(-${100 - pct}%)` }}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Office days */}
      <div className="bg-surface border border-app-border rounded-[14px] p-4">
        <div className="font-mono text-[10px] tracking-[0.1em] text-text-dim uppercase mb-3.5">
          {t('Office days')}
        </div>
        <div className="flex gap-1.5">
          {WEEKDAYS.map(d => (
            <span
              key={d}
              className="flex-1 py-2 px-1 rounded-lg text-[11px] font-semibold text-center font-display"
              style={officeDays.includes(d) ? {
                border: '1.5px solid color-mix(in oklch, var(--football) 30%, transparent)',
                background: 'color-mix(in oklch, var(--football) 6%, transparent)',
                color: 'var(--text-muted)',
              } : {
                border: '1.5px solid var(--border)',
                color: 'var(--text-dim)',
              }}
            >
              {t(SHORT[d])}
            </span>
          ))}
        </div>
      </div>
    </aside>
  )
}

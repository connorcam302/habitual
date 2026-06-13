import type { Week, Stats } from '@/types'
import type { FeltRating } from '@/types'
import { useI18n } from '@/lib/i18n'
import { CATEGORIES, CATEGORY_COLORS } from '@/lib/categories'

interface Props {
  weeks: Week[]
  stats: Stats | null
}

const FELT_META: { key: FeltRating; label: string }[] = [
  { key: 'great', label: 'Great' },
  { key: 'good',  label: 'Good'  },
  { key: 'okay',  label: 'Okay'  },
  { key: 'tough', label: 'Tough' },
]

function toInt(v: string | number | undefined): number {
  return parseInt(String(v ?? 0), 10) || 0
}

function completionColor(pct: number): string {
  if (pct >= 80) return 'var(--done)'
  if (pct >= 50) return 'var(--strength)'
  if (pct > 0)   return 'var(--football)'
  return 'var(--text-muted)'
}

export default function HistoryView({ weeks, stats }: Props) {
  const { t, locale } = useI18n()
  if (!stats) {
    return (
      <div className="flex justify-center pt-16">
        <div className="flex gap-1.5">
          <div className="loader-dot w-1.5 h-1.5 rounded-full bg-football" />
          <div className="loader-dot loader-dot-2 w-1.5 h-1.5 rounded-full bg-strength" />
          <div className="loader-dot loader-dot-3 w-1.5 h-1.5 rounded-full bg-chinese" />
        </div>
      </div>
    )
  }

  const feltTotal = Object.values(stats.felt_dist).reduce((sum, n) => sum + (n ?? 0), 0)
  const feltMax   = Math.max(...Object.values(stats.felt_dist).map(n => n ?? 0), 1)

  const activeTypes = CATEGORIES.filter(key => {
    const t = stats.by_type[key as keyof typeof stats.by_type]
    return t && t.total > 0
  })

  return (
    <div className="pt-1">
      {/* ── All-time stats ── */}
      <SectionLabel>{t('All Time')}</SectionLabel>

      <div className="grid grid-cols-2 gap-2.5 px-4 pb-4 md:grid-cols-4 md:px-6">
        <StatCard
          value={`${stats.completion_rate}%`}
          label={t('Completion rate')}
          valueColor={completionColor(stats.completion_rate)}
        />
        <StatCard value={String(stats.completed)}    label={t('Sessions done')} />
        <StatCard value={String(stats.weeks_tracked)} label={t('Weeks tracked')} />
        <StatCard
          value={stats.avg_per_week % 1 === 0
            ? String(stats.avg_per_week)
            : stats.avg_per_week.toFixed(1)}
          label={t('Avg per week')}
        />
      </div>

      {/* ── By type ── */}
      {activeTypes.length > 0 && (
        <>
          <SectionLabel>{t('By Type')}</SectionLabel>
          <div className="mx-3 mb-4 bg-surface border border-app-border rounded-[14px] p-4 md:mx-6">
            {activeTypes.map(key => {
              const typeStats = stats.by_type[key as keyof typeof stats.by_type]!
              const pct = typeStats.total > 0 ? Math.round((typeStats.done / typeStats.total) * 100) : 0
              const color = CATEGORY_COLORS[key]
              return (
                <div key={key} className="mb-3.5 last:mb-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: color }} />
                    <span className="text-sm font-medium text-app-text flex-1">{t(key[0].toUpperCase() + key.slice(1))}</span>
                    {typeStats.injured > 0 && (
                      <span
                        className="font-mono text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{
                          background: 'color-mix(in oklch, var(--injured) 10%, transparent)',
                          color: 'var(--injured)',
                        }}
                      >
                        {typeStats.injured} injured
                      </span>
                    )}
                    <span className="font-mono text-[11px] text-text-muted tabular-nums">
                      {typeStats.done}/{typeStats.total}
                    </span>
                    <span
                      className="font-mono text-[11px] w-8 text-right tabular-nums"
                      style={{ color: completionColor(pct) }}
                    >
                      {pct}%
                    </span>
                  </div>
                  <div className="h-[3px] bg-app-border rounded-sm overflow-hidden">
                    <div
                      className="h-full rounded-sm transition-[width] duration-[400ms]"
                      style={{ background: color, width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── Felt quality ── */}
      {feltTotal >= 3 && (
        <>
          <SectionLabel>{t('How It Felt')}</SectionLabel>
          <div className="mx-3 mb-4 bg-surface border border-app-border rounded-[14px] p-4 md:mx-6">
            {FELT_META.map(({ key, label }) => {
              const count = stats.felt_dist[key] ?? 0
              const barW  = feltMax > 0 ? Math.round((count / feltMax) * 100) : 0
              return (
                <div key={key} className="flex items-center gap-3 mb-2.5 last:mb-0">
                  <span className="font-mono text-[11px] text-text-muted w-9 shrink-0">{t(label)}</span>
                  <div className="flex-1 h-[3px] bg-app-border rounded-sm overflow-hidden">
                    <div
                      className="h-full rounded-sm bg-strength transition-[width] duration-[400ms]"
                      style={{ width: `${barW}%` }}
                    />
                  </div>
                  <span className="font-mono text-[11px] text-text-dim w-4 text-right tabular-nums">
                    {count}
                  </span>
                </div>
              )
            })}
            <div className="mt-3 pt-3 border-t border-app-border">
              <span className="font-mono text-[10px] text-text-dim">
                {feltTotal} of {stats.completed} sessions rated
              </span>
            </div>
          </div>
        </>
      )}

      {/* ── Past weeks ── */}
      {weeks.length > 0 ? (
        <>
          <SectionLabel>{t('Past Weeks')}</SectionLabel>
          <div className="md:grid md:grid-cols-2 md:gap-2.5 md:px-6 md:pb-6">
            {weeks.map(w => {
              const total     = toInt(w.total)
              const done      = toInt(w.done)
              const injured   = toInt(w.injured)
              const cancelled = toInt(w.cancelled)
              const skipped   = toInt(w.skipped)
              const pct = total > 0 ? Math.round((done / total) * 100) : 0

              const dateStr = String(w.week_start).slice(0, 10)
              const mon = new Date(dateStr + 'T00:00:00')
              const sun = new Date(mon)
              sun.setDate(mon.getDate() + 6)
              const language = locale === 'zh-CN' ? 'zh-CN' : 'en-GB'
              const label = `${mon.toLocaleDateString(language, { day: 'numeric', month: 'short' })} – ${sun.toLocaleDateString(language, { day: 'numeric', month: 'short', year: 'numeric' })}`

              return (
                <div
                  key={w.id}
                  className="mx-3 mb-2.5 bg-surface border border-app-border rounded-[14px] p-3.5 md:mx-0"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-text-muted">{label}</span>
                    <span className="font-mono text-xs font-medium" style={{ color: completionColor(pct) }}>{pct}%</span>
                  </div>
                  <div className="h-1 bg-app-border rounded-sm overflow-hidden mb-2">
                    <div className="h-full rounded-sm bg-gradient-bar" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Pill color="done"      label={`${done} done`} />
                    {injured   > 0 && <Pill color="injured"   label={`${injured} injured`} />}
                    {cancelled > 0 && <Pill color="cancelled" label={`${cancelled} cancelled`} />}
                    {skipped   > 0 && <Pill color="skipped"   label={`${skipped} skipped`} />}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <div className="text-center py-6 px-6 text-base text-text-dim">
          {t('No history yet')}
        </div>
      )}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[11px] tracking-[0.1em] text-text-dim uppercase px-4 pt-4 pb-2 md:px-6">
      {children}
    </div>
  )
}

function StatCard({ value, label, valueColor }: { value: string; label: string; valueColor?: string }) {
  return (
    <div className="bg-surface border border-app-border rounded-[14px] p-3.5">
      <div className="font-mono text-[28px] font-bold leading-none" style={{ color: valueColor ?? 'var(--text)' }}>
        {value}
      </div>
      <div className="text-xs text-text-muted mt-1">{label}</div>
    </div>
  )
}

const PILL_COLORS: Record<string, string> = {
  done:      'var(--done)',
  injured:   'var(--injured)',
  cancelled: 'var(--cancelled)',
  skipped:   'var(--skipped)',
}

function Pill({ color, label }: { color: string; label: string }) {
  const c = PILL_COLORS[color]
  return (
    <span
      className="text-[11px] font-semibold px-2 py-[3px] rounded-full"
      style={{
        background: `color-mix(in oklch, ${c} 9%, transparent)`,
        color: c,
      }}
    >
      {label}
    </span>
  )
}

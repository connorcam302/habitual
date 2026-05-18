import type { Week, Stats } from '@/types'

interface Props {
  weeks: Week[]
  stats: Stats | null
}

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

  return (
    <div>
      {/* Section label */}
      <div className="font-mono text-[11px] tracking-[0.1em] text-text-dim uppercase px-4 pt-4 pb-2 md:px-6 md:pt-6">
        All Time
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2.5 px-4 pb-4 md:grid-cols-4 md:px-6">
        <StatCard value={`${stats.completion_rate}%`} label="Completion rate" valueColor={completionColor(stats.completion_rate)} />
        <StatCard value={String(stats.weeks_tracked)} label="Weeks tracked" />
        <StatCard value={String(stats.completed)} label="Sessions done" />
        <StatCard
          value={String(stats.injured)}
          label={
            stats.most_injured_type
              ? `Injured\n${stats.most_injured_type}`
              : 'Injured'
          }
          valueColor="var(--injured)"
        />
      </div>

      {/* Week list */}
      {weeks.length > 0 ? (
        <>
          <div className="font-mono text-[11px] tracking-[0.1em] text-text-dim uppercase px-4 pt-2 pb-2 md:px-6">
            Past Weeks
          </div>
          <div className="md:grid md:grid-cols-2 md:gap-2.5 md:px-6 md:pb-6">
            {weeks.map(w => {
              const total  = toInt(w.total)
              const done   = toInt(w.done)
              const injured   = toInt(w.injured)
              const cancelled = toInt(w.cancelled)
              const skipped   = toInt(w.skipped)
              const pct = total > 0 ? Math.round((done / total) * 100) : 0

              const mon = new Date(w.week_start + 'T00:00:00')
              const sun = new Date(mon)
              sun.setDate(mon.getDate() + 6)
              const label = `${mon.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${sun.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`

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
          No history yet
        </div>
      )}
    </div>
  )
}

function StatCard({ value, label, valueColor }: { value: string; label: string; valueColor?: string }) {
  const lines = label.split('\n')
  return (
    <div className="bg-surface border border-app-border rounded-[14px] p-3.5">
      <div className="font-mono text-[28px] font-bold leading-none" style={{ color: valueColor ?? 'var(--text)' }}>
        {value}
      </div>
      <div className="text-xs text-text-muted mt-1">
        {lines[0]}
        {lines[1] && <><br /><span className="text-[11px] opacity-70">{lines[1]}</span></>}
      </div>
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

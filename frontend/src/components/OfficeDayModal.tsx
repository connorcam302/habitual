import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import type { Session, DiffChange } from '@/types'

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const
const DAY_LABEL: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri',
}
const DAY_LONG: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri',
  saturday: 'Sat', sunday: 'Sun',
}

interface Props {
  open: boolean
  onClose: () => void
  isEditing: boolean
  currentWeek: string
  currentOfficeDays: string[]
  onLoadWeek: (week: string) => Promise<void>
  onRescheduled: (sessions: Session[], officeDays: string[]) => void
}

type Step = 'picker' | 'diff'

export default function OfficeDayModal({
  open, onClose, isEditing, currentWeek, currentOfficeDays,
  onLoadWeek, onRescheduled,
}: Props) {
  const [selected, setSelected] = useState<string[]>(isEditing ? currentOfficeDays : [])
  const [step, setStep] = useState<Step>('picker')
  const [changes, setChanges] = useState<DiffChange[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  // Reset when modal opens
  const handleOpenChange = (o: boolean) => {
    if (o) {
      setSelected(isEditing ? [...currentOfficeDays] : [])
      setStep('picker')
      setError(false)
    } else {
      onClose()
    }
  }

  const toggleDay = (day: string) => {
    setSelected(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day],
    )
  }

  const handleSubmit = async () => {
    setBusy(true)
    setError(false)
    try {
      if (!isEditing) {
        // New week: save office days then seed
        await api.setOfficeDays(currentWeek, selected)
        await api.seed(currentWeek)
        onClose()
        await onLoadWeek(currentWeek)
      } else {
        // Editing: preview changes first
        const { changes: diffs } = await api.reschedulePreview(currentWeek, selected)
        if (!diffs || diffs.length === 0) {
          await api.setOfficeDays(currentWeek, selected)
          onClose()
          await onLoadWeek(currentWeek)
        } else {
          setChanges(diffs)
          setStep('diff')
        }
      }
    } catch {
      setError(true)
    } finally {
      setBusy(false)
    }
  }

  const handleConfirm = async () => {
    setBusy(true)
    setError(false)
    try {
      const result = await api.rescheduleApply(currentWeek, selected)
      onRescheduled(result.sessions, selected)
      onClose()
    } catch {
      setError(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit office days' : 'Set up this week'}
          </DialogTitle>
          <DialogDescription>
            {step === 'picker'
              ? isEditing
                ? 'Which days are you in the office this week?'
                : 'Which days are you in the office?'
              : `${changes.length} session${changes.length === 1 ? '' : 's'} would change.`}
          </DialogDescription>
        </DialogHeader>

        {step === 'picker' ? (
          <>
            {/* Day toggles */}
            <div className="flex gap-2 mb-4">
              {WEEKDAYS.map(day => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className="flex-1 py-3 px-1 rounded-xl text-sm font-semibold font-display text-center
                    border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-football"
                  style={selected.includes(day) ? {
                    borderColor: 'var(--football)',
                    background: 'color-mix(in oklch, var(--football) 9%, transparent)',
                    color: 'var(--football)',
                  } : {
                    borderColor: 'var(--border)',
                    background: 'var(--surface-3)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {DAY_LABEL[day]}
                </button>
              ))}
            </div>

            {/* Note */}
            <div className="text-xs text-text-dim px-3 py-2.5 bg-surface-3 border border-app-border rounded-[10px] mb-5">
              Pimsleur commute sessions appear on office days (Wed, Thu, Fri).
              Exercise sessions shift to evenings when you're in the office.
            </div>

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={busy}
            >
              {busy ? (isEditing ? 'Checking…' : 'Setting up…')
                : error ? 'Error — try again'
                : isEditing ? 'Preview changes'
                : 'Start week'}
            </Button>
          </>
        ) : (
          <>
            {/* Diff list */}
            <div className="border border-app-border rounded-xl overflow-hidden mb-5">
              {changes.map((c, i) => (
                <DiffItem key={i} change={c} />
              ))}
            </div>

            <div className="flex gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep('picker')}
                disabled={busy}
              >
                ← Back
              </Button>
              <Button
                className="flex-1"
                onClick={handleConfirm}
                disabled={busy}
              >
                {busy ? 'Applying…' : error ? 'Error — try again' : 'Confirm changes'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function DiffItem({ change: c }: { change: DiffChange }) {
  const badgeStyle =
    c.type === 'add' ? { bg: 'color-mix(in oklch, var(--cardio) 9%, transparent)', color: 'var(--cardio)', label: 'Add' }
    : c.type === 'remove' ? { bg: 'color-mix(in oklch, var(--cancelled) 9%, transparent)', color: 'var(--cancelled)', label: 'Remove' }
    : { bg: 'color-mix(in oklch, var(--football) 9%, transparent)', color: 'var(--football)', label: 'Shift' }

  return (
    <div className="flex items-start gap-2.5 px-3.5 py-2.5 border-b border-app-border last:border-b-0">
      <span
        className="font-mono text-[9px] font-medium tracking-[0.08em] uppercase px-1.5 py-0.5 rounded shrink-0 mt-0.5"
        style={{ background: badgeStyle.bg, color: badgeStyle.color }}
      >
        {badgeStyle.label}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-app-text mb-0.5">{c.name}</div>
        <div className="font-mono text-[10px] tracking-[0.08em] uppercase text-text-dim mb-1">
          {DAY_LONG[c.day] ?? c.day}
        </div>
        <div className="font-mono text-[11px] text-text-muted flex items-center gap-1.5 flex-wrap">
          {c.type === 'update' && (
            <>
              <span className="line-through text-text-dim">{c.old_slot}</span>
              <span style={{ color: 'var(--football)' }}>→</span>
              <span className="text-app-text">{c.new_slot}</span>
            </>
          )}
          {c.type === 'add' && <span>{c.new_slot}</span>}
          {c.type === 'remove' && <span>{c.old_slot}</span>}
        </div>
      </div>
    </div>
  )
}

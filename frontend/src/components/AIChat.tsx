import { useState, useRef, useEffect } from 'react'
import type { Session } from '@/types'

interface SessionUpdate {
  session_id: number
  name: string
  day: string
  current_status: string
  current_time: string
  status?: string
  time_slot?: string
  notes?: string
}

interface NewSession {
  day: string
  type: string
  name: string
  time_slot?: string
}

interface Proposal {
  summary: string
  office_days?: string[]
  session_updates: SessionUpdate[]
  new_sessions?: NewSession[]
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  proposal?: Proposal
  applied?: boolean
}

interface Props {
  currentWeek: string
  sessions: Session[]
  officeDays: string[]
  onApplied: (sessions: Session[], officeDays?: string[]) => void
}

const STATUS_COLOR: Record<string, string> = {
  done:      'var(--done)',
  injured:   'var(--injured)',
  cancelled: 'var(--cancelled)',
  skipped:   'var(--skipped)',
  pending:   'var(--text-muted)',
}

const DAY_SHORT: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
  thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
}

export default function AIChat({ currentWeek, sessions, officeDays, onApplied }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! Tell me what's going on this week — office days, any injuries, schedule changes — and I'll propose updates to your plan.",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    // Build history excluding un-applied proposal cards (they're UI-only)
    const history = [...messages, userMsg].map(m => ({
      role: m.role,
      content: m.content,
    }))

    try {
      const r = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, week_start: currentWeek, sessions, office_days: officeDays }),
      })
      const data = await r.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message ?? '',
        proposal: data.proposal ?? undefined,
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Something went wrong — please try again.',
      }])
    } finally {
      setLoading(false)
    }
  }

  const applyProposal = async (idx: number, proposal: Proposal) => {
    setApplying(idx)
    try {
      const r = await fetch('/api/ai/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposal, week_start: currentWeek }),
      })
      const data = await r.json()
      onApplied(data.sessions, data.office_days)
      setMessages(prev => prev.map((m, i) => i === idx ? { ...m, applied: true } : m))
    } catch {
      // leave proposal visible so user can retry
    } finally {
      setApplying(null)
    }
  }

  const dismissProposal = (idx: number) => {
    setMessages(prev => prev.map((m, i) => i === idx ? { ...m, proposal: undefined } : m))
  }

  return (
    <div className="flex flex-col" style={{ height: '100%' }}>
      {/* Message thread */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i}>
            <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] px-4 py-3 text-[14px] leading-relaxed
                  ${msg.role === 'user'
                    ? 'rounded-2xl rounded-br-sm text-white'
                    : 'rounded-2xl rounded-bl-sm bg-surface-2 border border-app-border text-app-text'}`}
                style={msg.role === 'user' ? { background: 'var(--football)' } : undefined}
              >
                {msg.content}
              </div>
            </div>

            {/* Proposal card */}
            {msg.proposal && !msg.applied && (
              <div className="mt-2 max-w-[90%]">
                <ProposalCard
                  proposal={msg.proposal}
                  applying={applying === i}
                  onApply={() => applyProposal(i, msg.proposal!)}
                  onDismiss={() => dismissProposal(i)}
                />
              </div>
            )}
            {msg.applied && (
              <p className="text-[12px] text-text-dim mt-1 ml-1">✓ Changes applied</p>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-surface-2 border border-app-border rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1.5">
                <div className="loader-dot w-1.5 h-1.5 rounded-full bg-football" />
                <div className="loader-dot loader-dot-2 w-1.5 h-1.5 rounded-full bg-strength" />
                <div className="loader-dot loader-dot-3 w-1.5 h-1.5 rounded-full bg-chinese" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-app-border px-4 py-3 flex gap-2 items-end"
        style={{ paddingBottom: 'max(12px, var(--safe-bottom))' }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
          }}
          placeholder="e.g. 'In the office Mon & Wed, injured my knee at Tuesday football'"
          rows={2}
          className="flex-1 resize-none rounded-xl px-3 py-2.5 text-[14px] font-display
            bg-surface-2 border border-app-border text-app-text
            placeholder:text-text-dim outline-none transition-colors
            focus:border-[color-mix(in_oklch,var(--football)_30%,transparent)]"
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          className="px-4 py-2.5 rounded-xl text-white text-[14px] font-semibold font-display
            shrink-0 disabled:opacity-40 transition-opacity hover:opacity-90"
          style={{ background: 'var(--gradient-cta)' }}
        >
          Send
        </button>
      </div>
    </div>
  )
}

function ProposalCard({
  proposal, applying, onApply, onDismiss,
}: {
  proposal: Proposal
  applying: boolean
  onApply: () => void
  onDismiss: () => void
}) {
  return (
    <div className="bg-surface border border-app-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-app-border">
        <div className="font-mono text-[10px] tracking-[0.1em] text-text-dim uppercase mb-1">
          Proposed changes
        </div>
        <div className="text-[13px] text-app-text">{proposal.summary}</div>
      </div>

      {/* Office days row */}
      {proposal.office_days !== undefined && (
        <div className="px-4 py-3 border-b border-app-border">
          <div className="font-mono text-[10px] tracking-[0.08em] text-text-dim uppercase mb-2">
            Office days → {proposal.office_days.length > 0 ? proposal.office_days.map(d => DAY_SHORT[d]).join(', ') : 'none'}
          </div>
          <div className="flex gap-1.5">
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map(d => {
              const active = proposal.office_days!.includes(d)
              return (
                <span
                  key={d}
                  className="flex-1 text-center py-1.5 rounded-lg text-[11px] font-semibold font-display"
                  style={active ? {
                    border: '1.5px solid color-mix(in oklch, var(--football) 35%, transparent)',
                    background: 'color-mix(in oklch, var(--football) 10%, transparent)',
                    color: 'var(--football)',
                  } : {
                    border: '1.5px solid var(--border)',
                    color: 'var(--text-dim)',
                  }}
                >
                  {DAY_SHORT[d]}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Session updates */}
      {proposal.session_updates.map((u, i) => (
        <div
          key={i}
          className="flex items-start gap-3 px-4 py-2.5 border-b border-app-border last:border-b-0"
        >
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-app-text truncate">{u.name}</div>
            <div className="font-mono text-[10px] tracking-[0.08em] text-text-dim uppercase">
              {DAY_SHORT[u.day] ?? u.day}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 text-[11px] shrink-0">
            {u.status && u.status !== u.current_status && (
              <div className="flex items-center gap-1.5">
                <span className="text-text-dim line-through">{u.current_status}</span>
                <span className="text-text-dim">→</span>
                <span className="font-semibold" style={{ color: STATUS_COLOR[u.status] ?? 'var(--text)' }}>
                  {u.status}
                </span>
              </div>
            )}
            {u.time_slot && u.time_slot !== u.current_time && (
              <div className="flex items-center gap-1.5 font-mono">
                {u.current_time && <span className="text-text-dim line-through">{u.current_time}</span>}
                {u.current_time && <span className="text-text-dim">→</span>}
                <span className="text-app-text">{u.time_slot}</span>
              </div>
            )}
            {u.notes && (
              <span className="text-text-muted italic">{u.notes}</span>
            )}
          </div>
        </div>
      ))}

      {/* New sessions being added */}
      {(proposal.new_sessions ?? []).map((ns, i) => (
        <div
          key={`new-${i}`}
          className="flex items-start gap-3 px-4 py-2.5 border-b border-app-border last:border-b-0"
        >
          <span
            className="font-mono text-[9px] font-medium tracking-[0.08em] uppercase px-1.5 py-0.5 rounded shrink-0 mt-0.5"
            style={{
              background: 'color-mix(in oklch, var(--cardio) 9%, transparent)',
              color: 'var(--cardio)',
            }}
          >
            Add
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-app-text truncate">{ns.name}</div>
            <div className="font-mono text-[10px] tracking-[0.08em] text-text-dim uppercase">
              {DAY_SHORT[ns.day] ?? ns.day}
              {ns.time_slot && <span className="ml-2 normal-case tracking-normal">{ns.time_slot}</span>}
            </div>
          </div>
        </div>
      ))}

      {/* Actions */}
      <div className="flex gap-2 px-4 py-3 border-t border-app-border">
        <button
          onClick={onApply}
          disabled={applying}
          className="flex-1 py-2 rounded-xl text-white text-[13px] font-semibold font-display
            disabled:opacity-50 transition-opacity hover:opacity-90"
          style={{ background: 'var(--gradient-cta)' }}
        >
          {applying ? 'Applying…' : 'Apply changes'}
        </button>
        <button
          onClick={onDismiss}
          disabled={applying}
          className="px-4 py-2 rounded-xl border border-app-border text-text-muted
            text-[13px] font-semibold font-display
            hover:border-[var(--text-muted)] hover:text-app-text transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}

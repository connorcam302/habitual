import type { Session, Week, Stats, DiffChange } from '../types'

async function req<T>(url: string, opts?: RequestInit): Promise<T> {
  const r = await fetch(url, opts)
  if (!r.ok) throw new Error(`API error: ${r.status}`)
  return r.json() as Promise<T>
}

export const api = {
  seedAuto: () =>
    req<{ seeded: boolean; needs_setup?: boolean; week_start: string }>(
      '/api/seed-auto',
      { method: 'POST' },
    ),

  getSessions: (week: string) =>
    req<{ sessions: Session[]; week_exists: boolean }>(`/api/sessions?week=${week}`),

  seed: (week: string) =>
    req<{ sessions: Session[] }>(`/api/seed?week=${week}`, { method: 'POST' }),

  setOfficeDays: (week_start: string, days: string[]) =>
    req<{ week_id: number; already_seeded: boolean }>('/api/office-days', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ week_start, days }),
    }),

  getOfficeDays: (week: string) =>
    req<{ office_days: string[] }>(`/api/office-days?week=${week}`),

  patchSession: (
    id: number,
    data: Partial<Pick<Session, 'status' | 'felt' | 'notes' | 'time_slot'>>,
  ) =>
    req<{ session: Session }>(`/api/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  deleteWeek: (week: string) =>
    req<{ message: string }>(`/api/weeks?week=${week}`, { method: 'DELETE' }),

  getWeeks: () => req<{ weeks: Week[] }>('/api/weeks'),

  getStats: () => req<Stats>('/api/stats'),

  reschedulePreview: (week_start: string, days: string[]) =>
    req<{ changes: DiffChange[] }>('/api/reschedule-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ week_start, days }),
    }),

  rescheduleApply: (week_start: string, days: string[]) =>
    req<{ sessions: Session[] }>('/api/reschedule-apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ week_start, days }),
    }),
}

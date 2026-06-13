import type { Session, Week, Stats, User, Locale, UserProfile } from '../types'

async function req<T>(url: string, opts?: RequestInit): Promise<T> {
  const r = await fetch(url, opts)
  if (!r.ok) {
    const data = await r.json().catch(() => null)
    throw new Error(data?.error ?? `API error: ${r.status}`)
  }
  if (r.status === 204) return undefined as T
  return r.json() as Promise<T>
}

export const api = {
  authStatus: () => req<{ needs_setup: boolean; user: User | null }>('/api/auth/status'),
  setup: (data: { username: string; display_name: string; password: string; locale: Locale }) =>
    req<{ user: User }>('/api/auth/setup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  login: (username: string, password: string) =>
    req<{ user: User }>('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) }),
  logout: () => req<void>('/api/auth/logout', { method: 'POST' }),
  updateMe: (data: { locale?: Locale; display_name?: string }) =>
    req<{ user: User }>('/api/auth/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  addUser: (data: { username: string; display_name: string; password: string; locale: Locale }) =>
    req<{ user: User }>('/api/auth/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  createWidgetToken: () => req<{ token: string }>('/api/auth/widget-token', { method: 'POST' }),
  getProfile: () => req<{ profile: UserProfile; completed_at: string | null; updated_at: string | null }>('/api/profile'),
  saveProfile: (profile: UserProfile) =>
    req<{ profile: UserProfile; completed_at: string; updated_at: string }>('/api/profile', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile),
    }),
  weekStatus: () =>
    req<{ seeded: boolean; needs_setup?: boolean; week_start: string }>(
      '/api/week-status',
    ),

  getSessions: (week: string) =>
    req<{ sessions: Session[]; week_exists: boolean }>(`/api/sessions?week=${week}`),

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

}

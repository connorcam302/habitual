export type SessionStatus = 'pending' | 'done' | 'injured' | 'cancelled' | 'skipped'
export type SessionType = 'football' | 'strength' | 'speed' | 'cardio' | 'chinese'
export type FeltRating = 'great' | 'good' | 'okay' | 'tough'

export interface Session {
  id: number
  week_id: number
  day: string
  type: SessionType
  name: string
  time_slot: string | null
  is_commute: boolean
  status: SessionStatus
  felt: FeltRating | null
  notes: string | null
  sort_order: number
}

export interface Week {
  id: number
  week_start: string
  total: string | number
  done: string | number
  injured: string | number
  cancelled: string | number
  skipped: string | number
  pending: string | number
}

export interface Stats {
  total_sessions: number
  completed: number
  completion_rate: number
  injured: number
  cancelled: number
  skipped: number
  weeks_tracked: number
  most_injured_type: string | null
}

export interface DiffChange {
  type: 'add' | 'remove' | 'update'
  session_id?: number
  name: string
  day: string
  old_slot?: string
  new_slot?: string
}

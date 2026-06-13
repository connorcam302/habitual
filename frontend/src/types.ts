export type SessionStatus = 'pending' | 'done' | 'injured' | 'cancelled' | 'skipped'
export type SessionType = string
export type ActivityCategory = 'strength' | 'cardio' | 'sport' | 'mobility' | 'recovery' | 'learning' | 'lifestyle' | 'other'
export type FeltRating = 'great' | 'good' | 'okay' | 'tough'
export type Locale = 'en' | 'zh-CN'

export interface User {
  id: number
  username: string
  display_name: string
  locale: Locale
  is_owner: boolean
  profile_complete: boolean
}

export interface UserProfile {
  version: 1
  goals: Array<{ description: string; priority: 'high' | 'medium' | 'low'; weekly_target: number | null; deadline: string | null }>
  activities: Array<{ name: string; category: ActivityCategory; weekly_frequency: number; duration_minutes: number; notes: string }>
  commitments: Array<{ activity_name: string; day: string; start_time: string; duration_minutes: number; fixed: boolean }>
  availability: Array<{ day: string; start_time: string; end_time: string }>
  equipment: string[]
  limitations: string[]
  disliked_activities: string[]
  notes: string
}

export interface Session {
  id: number
  week_id: number
  day: string
  type: SessionType
  category: ActivityCategory
  name: string
  time_slot: string | null
  is_commute: boolean
  status: SessionStatus
  felt: FeltRating | null
  notes: string | null
  sort_order: number
  brief: string | null
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
  avg_per_week: number
  by_type: Partial<Record<ActivityCategory, { done: number; injured: number; total: number }>>
  felt_dist: Partial<Record<FeltRating, number>>
}

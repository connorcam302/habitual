import type { ActivityCategory } from '@/types'

export const CATEGORIES: ActivityCategory[] = ['strength', 'cardio', 'sport', 'mobility', 'recovery', 'learning', 'lifestyle', 'other']

export const CATEGORY_COLORS: Record<ActivityCategory, string> = {
  strength: 'var(--strength)',
  cardio: 'var(--cardio)',
  sport: 'var(--football)',
  mobility: 'var(--speed)',
  recovery: 'var(--injured)',
  learning: 'var(--chinese)',
  lifestyle: 'var(--text-muted)',
  other: 'var(--border)',
}

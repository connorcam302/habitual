import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const DAY_OFFSETS: Record<string, number> = {
  monday: 0, tuesday: 1, wednesday: 2, thursday: 3,
  friday: 4, saturday: 5, sunday: 6,
}

export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function formatISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function currentMondayISO(): string {
  return formatISO(getMondayOfWeek(new Date()))
}

export function addWeeks(isoDate: string, n: number): string {
  const d = new Date(isoDate + 'T00:00:00')
  d.setDate(d.getDate() + n * 7)
  return formatISO(d)
}

export function formatWeekLabel(mondayISO: string, locale = 'en'): string {
  const mon = new Date(mondayISO + 'T00:00:00')
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  const language = locale === 'zh-CN' ? 'zh-CN' : 'en-GB'
  return `${mon.toLocaleDateString(language, opts)} – ${sun.toLocaleDateString(language, opts)}`
}

export function todayDayName(): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[new Date().getDay()]
}

export function dayDisplayName(day: string, locale = 'en'): string {
  const map: Record<string, string> = {
    monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
    thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
  }
  if (locale === 'zh-CN') {
    const chinese: Record<string, string> = {
      monday: '星期一', tuesday: '星期二', wednesday: '星期三',
      thursday: '星期四', friday: '星期五', saturday: '星期六', sunday: '星期日',
    }
    return chinese[day] ?? day
  }
  return map[day] ?? day
}

export function dayShortName(day: string): string {
  const map: Record<string, string> = {
    monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
    thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
  }
  return map[day] ?? day
}

export function dateForDay(mondayISO: string, day: string, locale = 'en'): string {
  const d = new Date(mondayISO + 'T00:00:00')
  d.setDate(d.getDate() + (DAY_OFFSETS[day] ?? 0))
  return d.toLocaleDateString(locale === 'zh-CN' ? 'zh-CN' : 'en-GB', { day: 'numeric', month: 'short' })
}

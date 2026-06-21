import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { CATEGORIES } from '@/lib/categories'
import { useI18n } from '@/lib/i18n'
import type { ActivityCategory, UserProfile } from '@/types'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const EMPTY: UserProfile = {
  version: 1, goals: [], activities: [], commitments: [], availability: [],
  equipment: [], limitations: [], disliked_activities: [], notes: '',
}
const STARTER_GOAL: UserProfile['goals'][number] = { description: '', priority: 'high', weekly_target: null, deadline: null }
const STARTER_ACTIVITY: UserProfile['activities'][number] = { name: '', category: 'other', weekly_frequency: 1, duration_minutes: 30, notes: '' }
const STARTER_AVAILABILITY: UserProfile['availability'][number] = { day: 'monday', start_time: '18:00', end_time: '20:00' }

export default function ProfileEditor({ required = false, onSaved, onCancel }: {
  required?: boolean; onSaved: () => void; onCancel?: () => void
}) {
  const { t } = useI18n()
  const [profile, setProfile] = useState<UserProfile>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getProfile()
      .then(data => setProfile(required ? withStarterRows(data.profile) : data.profile))
      .catch(err => setError(err instanceof Error ? err.message : t('Could not load profile')))
      .finally(() => setLoading(false))
  }, [required, t])
  const save = async () => {
    setSaving(true); setError('')
    const errors = []
    if (!profile.goals.some(goal => goal.description.trim())) errors.push(t('Add at least one goal'))
    if (!profile.activities.some(activity => activity.name.trim())) errors.push(t('Add at least one preferred activity'))
    const activityNames = profile.activities.map(activity => activity.name.trim().toLocaleLowerCase()).filter(Boolean)
    if (new Set(activityNames).size !== activityNames.length) errors.push(t('Preferred activity names must be unique'))
    if (profile.availability.length === 0 && profile.commitments.length === 0) errors.push(t('Add at least one availability window or recurring commitment'))
    if (errors.length > 0) {
      setError(errors.join('. '))
      setSaving(false)
      return
    }
    try { await api.saveProfile(profile); onSaved() }
    catch (err) { setError(err instanceof Error ? t(err.message) : t('Could not save profile')) }
    finally { setSaving(false) }
  }
  const listText = (key: 'equipment' | 'limitations' | 'disliked_activities', value: string) =>
    setProfile({ ...profile, [key]: value.split('\n') })

  function updateAt<K extends 'goals' | 'activities' | 'commitments' | 'availability'>(key: K, index: number, value: UserProfile[K][number]) {
    const values = [...profile[key]] as UserProfile[K]
    values[index] = value as never
    setProfile({ ...profile, [key]: values })
  }

  if (loading) return <div className="p-8 text-center text-text-muted">{t('Loading profile…')}</div>
  return <div className={required ? 'h-full overflow-y-auto px-4 pt-6' : ''}>
    <div className={required ? 'max-w-2xl mx-auto' : ''}>
      {required && <><div className="font-mono text-[11px] tracking-[0.2em] text-text-muted mb-4">HABITUAL</div>
        <h1 className="text-2xl font-bold">{t('Build your profile')}</h1>
        <p className="text-sm text-text-muted mt-1 mb-4">{t('Fill in what you know now. The planner only needs the marked basics to start, and you can refine everything later.')}</p>
        <div className="mb-6 rounded-[14px] border border-app-border bg-surface p-4">
          <div className="mb-3 text-xs font-bold text-text-muted">{t('Required to start')}</div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Requirement label={t('One goal')} done={profile.goals.some(goal => goal.description.trim())} />
            <Requirement label={t('One activity')} done={profile.activities.some(activity => activity.name.trim())} />
            <Requirement label={t('Availability or commitment')} done={profile.availability.length > 0 || profile.commitments.length > 0} />
          </div>
        </div>
      </>}

      <Section title={t('Goals')} hint={t('Add at least one goal and put the most important first.')}>
        {profile.goals.map((goal, i) => <Row key={i} onRemove={() => setProfile({ ...profile, goals: profile.goals.filter((_, x) => x !== i) })}>
          <FieldLabel label={t('Goal description')} wide><input value={goal.description} onChange={e => updateAt('goals', i, { ...goal, description: e.target.value })} placeholder={t('For example, move more consistently')} className="field w-full" /></FieldLabel>
          <FieldLabel label={t('Priority')}><select value={goal.priority} onChange={e => updateAt('goals', i, { ...goal, priority: e.target.value as 'high' | 'medium' | 'low' })} className="field w-full">
            {['high', 'medium', 'low'].map(p => <option key={p} value={p}>{t(p[0].toUpperCase() + p.slice(1) + ' priority')}</option>)}
          </select></FieldLabel>
          <FieldLabel label={t('Weekly target')}><input type="number" min="1" max="21" value={goal.weekly_target ?? ''} onChange={e => updateAt('goals', i, { ...goal, weekly_target: e.target.value ? Number(e.target.value) : null })} className="field w-full" /></FieldLabel>
          <FieldLabel label={t('Optional deadline')} wide><input type="date" value={goal.deadline ?? ''} onChange={e => updateAt('goals', i, { ...goal, deadline: e.target.value || null })} className="field w-full" /></FieldLabel>
        </Row>)}
        <Add label={t('Add goal')} onClick={() => setProfile({ ...profile, goals: [...profile.goals, { description: '', priority: 'high', weekly_target: null, deadline: null }] })} />
      </Section>

      <Section title={t('Preferred activities')} hint={t('Add anything you want the planner to schedule.')}>
        {profile.activities.map((activity, i) => <Row key={i} onRemove={() => setProfile({ ...profile, activities: profile.activities.filter((_, x) => x !== i) })}>
          <FieldLabel label={t('Activity name')} wide><input value={activity.name} onChange={e => updateAt('activities', i, { ...activity, name: e.target.value })} placeholder={t('Walk, piano, Pilates…')} className="field w-full" /></FieldLabel>
          <FieldLabel label={t('Category')}><select value={activity.category} onChange={e => updateAt('activities', i, { ...activity, category: e.target.value as ActivityCategory })} className="field w-full">
            {CATEGORIES.map(category => <option key={category} value={category}>{t(cap(category))}</option>)}
          </select></FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            <FieldLabel label={t('Times per week')}><input type="number" min="1" max="21" value={activity.weekly_frequency} onChange={e => updateAt('activities', i, { ...activity, weekly_frequency: Number(e.target.value) })} className="field w-full" /></FieldLabel>
            <FieldLabel label={t('Minutes')}><input type="number" min="5" max="360" step="5" value={activity.duration_minutes} onChange={e => updateAt('activities', i, { ...activity, duration_minutes: Number(e.target.value) })} className="field w-full" /></FieldLabel>
          </div>
          <FieldLabel label={t('Activity notes')} wide><input value={activity.notes} onChange={e => updateAt('activities', i, { ...activity, notes: e.target.value })} placeholder={t('Anything the planner should consider')} className="field w-full" /></FieldLabel>
        </Row>)}
        <Add label={t('Add activity')} onClick={() => setProfile({ ...profile, activities: [...profile.activities, { name: '', category: 'other', weekly_frequency: 1, duration_minutes: 30, notes: '' }] })} />
      </Section>

      <Section title={t('Recurring commitments')} hint={t('Fixed activities are anchors in the weekly plan.')}>
        {profile.commitments.map((commitment, i) => <Row key={i} onRemove={() => setProfile({ ...profile, commitments: profile.commitments.filter((_, x) => x !== i) })}>
          <FieldLabel label={t('Activity')} wide><select value={commitment.activity_name} onChange={e => updateAt('commitments', i, { ...commitment, activity_name: e.target.value })} className="field w-full">
            <option value="">{t('Choose activity')}</option>{profile.activities.filter(a => a.name).map(a => <option key={a.name}>{a.name}</option>)}
          </select></FieldLabel>
          <FieldLabel label={t('Day')}><select value={commitment.day} onChange={e => updateAt('commitments', i, { ...commitment, day: e.target.value })} className="field w-full">{DAYS.map(day => <option key={day} value={day}>{t(cap(day))}</option>)}</select></FieldLabel>
          <div className="grid grid-cols-2 gap-2"><FieldLabel label={t('Start time')}><input type="time" value={commitment.start_time} onChange={e => updateAt('commitments', i, { ...commitment, start_time: e.target.value })} className="field w-full" /></FieldLabel><FieldLabel label={t('Duration minutes')}><input type="number" min="5" step="5" value={commitment.duration_minutes} onChange={e => updateAt('commitments', i, { ...commitment, duration_minutes: Number(e.target.value) })} className="field w-full" /></FieldLabel></div>
          <label className="col-span-2 text-xs text-text-muted inline-flex items-center gap-2"><input type="checkbox" checked={commitment.fixed} onChange={e => updateAt('commitments', i, { ...commitment, fixed: e.target.checked })} />{t('Treat as fixed')}</label>
        </Row>)}
        <Add label={t('Add commitment')} onClick={() => setProfile({ ...profile, commitments: [...profile.commitments, { activity_name: '', day: 'monday', start_time: '18:00', duration_minutes: 60, fixed: true }] })} />
      </Section>

      <Section title={t('Normal availability')} hint={t('Add the times the planner can normally use.')}>
        {profile.availability.map((window, i) => <Row key={i} onRemove={() => setProfile({ ...profile, availability: profile.availability.filter((_, x) => x !== i) })}>
          <FieldLabel label={t('Day')} wide><select value={window.day} onChange={e => updateAt('availability', i, { ...window, day: e.target.value })} className="field w-full">{DAYS.map(day => <option key={day} value={day}>{t(cap(day))}</option>)}</select></FieldLabel>
          <FieldLabel label={t('Start time')}><input type="time" value={window.start_time} onChange={e => updateAt('availability', i, { ...window, start_time: e.target.value })} className="field w-full" /></FieldLabel>
          <FieldLabel label={t('End time')}><input type="time" value={window.end_time} onChange={e => updateAt('availability', i, { ...window, end_time: e.target.value })} className="field w-full" /></FieldLabel>
        </Row>)}
        <Add label={t('Add availability')} onClick={() => setProfile({ ...profile, availability: [...profile.availability, { day: 'monday', start_time: '18:00', end_time: '20:00' }] })} />
      </Section>

      <Section title={t('Planning details')} hint={t('One item per line. These fields are optional.')}>
        <FieldLabel label={t('Equipment available')}><textarea value={profile.equipment.join('\n')} onChange={e => listText('equipment', e.target.value)} rows={2} placeholder={t('Mat, bike, piano…')} className="field w-full" /></FieldLabel>
        <FieldLabel label={t('Persistent limitations')}><textarea value={profile.limitations.join('\n')} onChange={e => listText('limitations', e.target.value)} rows={2} placeholder={t('Anything to work around')} className="field w-full" /></FieldLabel>
        <FieldLabel label={t('Activities to avoid')}><textarea value={profile.disliked_activities.join('\n')} onChange={e => listText('disliked_activities', e.target.value)} rows={2} placeholder={t('Anything you do not want suggested')} className="field w-full" /></FieldLabel>
        <FieldLabel label={t('Anything else the planner should know')}><textarea value={profile.notes} onChange={e => setProfile({ ...profile, notes: e.target.value })} rows={3} placeholder={t('Context, preferences, or planning notes')} className="field w-full" /></FieldLabel>
      </Section>
      {error && <p className="text-sm mb-3" style={{ color: 'var(--cancelled)' }}>{error}</p>}
      <div className={`sticky bottom-0 z-10 flex gap-2 py-4 border-t border-app-border bg-bg/95 backdrop-blur-sm ${required ? 'pb-[calc(1rem+var(--safe-bottom))]' : ''}`}>
        {onCancel && <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-[10px] border border-app-border text-text-muted">{t('Cancel')}</button>}
        <button type="button" onClick={save} disabled={saving} className="flex-[2] py-3 rounded-[10px] font-semibold text-app-text disabled:opacity-50" style={{ background: 'var(--gradient-cta)' }}>{saving ? t('Saving…') : t(required ? 'Start planning' : 'Save profile')}</button>
      </div>
    </div>
  </div>
}

function cap(value: string) { return value[0].toUpperCase() + value.slice(1) }
function withStarterRows(profile: UserProfile): UserProfile {
  return {
    ...profile,
    goals: profile.goals.length > 0 ? profile.goals : [{ ...STARTER_GOAL }],
    activities: profile.activities.length > 0 ? profile.activities : [{ ...STARTER_ACTIVITY }],
    availability: profile.availability.length > 0 || profile.commitments.length > 0 ? profile.availability : [{ ...STARTER_AVAILABILITY }],
  }
}
function Requirement({ label, done }: { label: string; done: boolean }) {
  return <div className="flex items-center gap-2 rounded-[10px] bg-surface-2 px-3 py-2 text-xs text-text-muted">
    <span className="h-2 w-2 rounded-full" style={{ background: done ? 'var(--done)' : 'var(--border)' }} />
    <span>{label}</span>
  </div>
}
function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return <section className="mb-6"><h2 className="text-base font-bold">{title}</h2><p className="text-xs text-text-dim mt-1 mb-3">{hint}</p><div className="space-y-2">{children}</div></section>
}
function Row({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  const { t } = useI18n()
  return <div className="relative grid grid-cols-2 gap-3 p-3 pr-10 rounded-[12px] bg-surface border border-app-border">{children}<button type="button" onClick={onRemove} aria-label={t('Remove')} className="absolute right-2 top-2 p-2 text-text-dim"><Trash2 size={14} /></button></div>
}
function Add({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="w-full py-2.5 rounded-[10px] border border-dashed border-app-border text-sm text-text-muted inline-flex justify-center items-center gap-2"><Plus size={14} />{label}</button>
}
function FieldLabel({ label, wide = false, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return <label className={`${wide ? 'col-span-2' : ''} block min-w-0 text-[11px] font-semibold text-text-muted`}>
    <span className="block mb-1.5">{label}</span>{children}
  </label>
}

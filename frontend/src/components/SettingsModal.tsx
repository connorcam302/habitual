import { useState } from 'react'
import { CalendarClock, ChevronRight, Pencil, Target } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { api } from '@/lib/api'
import { useI18n, type Locale } from '@/lib/i18n'
import type { User, UserProfile } from '@/types'
import ProfileEditor from '@/components/ProfileEditor'

export default function SettingsModal({ open, user, profile, onClose, onUser, onLogout, onProfileSaved }: {
  open: boolean; user: User; profile: UserProfile | null; onClose: () => void; onUser: (u: User) => void; onLogout: () => void; onProfileSaved: () => void
}) {
  const { t } = useI18n()
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ display_name: '', username: '', password: '', locale: 'zh-CN' as Locale })
  const [message, setMessage] = useState('')
  const [widgetToken, setWidgetToken] = useState('')
  const [editingProfile, setEditingProfile] = useState(false)

  const setLocale = async (locale: Locale) => {
    const result = await api.updateMe({ locale })
    onUser(result.user)
  }
  const addPerson = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.addUser(form)
      setMessage('Account created')
      setAdding(false)
      setForm({ display_name: '', username: '', password: '', locale: 'zh-CN' })
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not create account')
    }
  }

  return <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
    <DialogContent className="max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>{editingProfile ? t('Edit profile') : t('Profile and settings')}</DialogTitle></DialogHeader>
      {editingProfile ? <ProfileEditor onSaved={() => { onProfileSaved(); setEditingProfile(false) }} onCancel={() => setEditingProfile(false)} /> :
      <div className="space-y-5">
        <ProfileOverview user={user} profile={profile} onEdit={() => setEditingProfile(true)} />
        <div className="h-px bg-app-border" />
        <div>
          <div className="text-xs text-text-dim mb-2">{t('Language')}</div>
          <div className="grid grid-cols-2 gap-2">
            {([['en', 'English'], ['zh-CN', 'Simplified Chinese']] as const).map(([locale, label]) =>
              <button key={locale} onClick={() => setLocale(locale)}
                className="py-2.5 rounded-[10px] border text-sm font-semibold"
                style={user.locale === locale ? { borderColor: 'var(--football)', color: 'var(--football)' } : { borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                {t(label)}
              </button>)}
          </div>
        </div>
        {user.is_owner && <div>
          <button onClick={() => setAdding(v => !v)} className="text-sm font-semibold text-app-text">{t('Add person')}</button>
          {adding && <form onSubmit={addPerson} className="mt-3 space-y-2">
            {(['display_name', 'username', 'password'] as const).map(key => {
              const label = t(key === 'display_name' ? 'Name' : key === 'username' ? 'Username' : 'Password')
              return <label key={key} className="block text-xs font-semibold text-text-muted">{label}
              <input required minLength={key === 'password' ? 8 : 1} type={key === 'password' ? 'password' : 'text'}
                value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                className="mt-1.5 w-full rounded-[10px] bg-surface-3 border border-app-border px-3 py-2.5 text-sm text-app-text" /></label>})}
            <div>
              <div className="text-xs font-semibold text-text-muted mb-1.5">{t('New user language')}</div>
              <div className="grid grid-cols-2 gap-2">
                {([['en', 'English'], ['zh-CN', 'Simplified Chinese']] as const).map(([locale, label]) =>
                  <button type="button" key={locale} onClick={() => setForm({ ...form, locale })}
                    className="py-2 rounded-[10px] border text-xs font-semibold"
                    style={form.locale === locale ? { borderColor: 'var(--football)', color: 'var(--football)' } : { borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                    {t(label)}
                  </button>)}
              </div>
            </div>
            <button type="submit" className="sticky bottom-0 w-full py-2.5 rounded-[10px] font-semibold text-app-text" style={{ background: 'var(--gradient-cta)' }}>{t('Create account')}</button>
          </form>}
          {message && <div className="mt-2 text-xs text-text-muted">{message}</div>}
        </div>}
        <div>
          <div className="text-xs text-text-dim mb-2">{t('Widget token')}</div>
          <button onClick={async () => setWidgetToken((await api.createWidgetToken()).token)}
            className="w-full py-2.5 rounded-[10px] border border-app-border text-sm text-text-muted">
            {t('Generate widget token')}
          </button>
          {widgetToken && <code className="block mt-2 p-2 rounded-[8px] bg-surface-3 text-[10px] break-all text-text-muted">{widgetToken}</code>}
        </div>
        <button onClick={onLogout} className="w-full py-2.5 rounded-[10px] border border-app-border text-sm text-text-muted">{t('Sign out')}</button>
      </div>
      }
    </DialogContent>
  </Dialog>
}

function ProfileOverview({ user, profile, onEdit }: { user: User; profile: UserProfile | null; onEdit: () => void }) {
  const { t } = useI18n()
  const initials = user.display_name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase()

  return <section aria-labelledby="profile-heading">
    <div className="flex items-center gap-3">
      <div className="h-12 w-12 shrink-0 rounded-full bg-surface-3 border border-app-border inline-flex items-center justify-center font-mono text-sm font-bold">
        {initials || '?'}
      </div>
      <div className="min-w-0 flex-1">
        <h2 id="profile-heading" className="truncate text-base font-bold">{user.display_name}</h2>
        <p className="truncate text-xs text-text-dim">@{user.username}</p>
      </div>
      <button onClick={onEdit}
        className="h-10 px-3 rounded-[10px] border border-app-border bg-surface-3 inline-flex items-center gap-2
          text-xs font-semibold text-app-text hover:border-text-dim transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-football">
        <Pencil size={13} />{t('Edit profile')}
      </button>
    </div>

    {profile ? <div className="mt-5 space-y-4">
      <ProfileList icon={<Target size={14} />} title={t('Goals')} empty={t('No goals added')}>
        {profile.goals.filter(goal => goal.description.trim()).map((goal, index) =>
          <li key={`${goal.description}-${index}`} className="flex items-start gap-2 text-sm text-app-text">
            <ChevronRight size={13} className="mt-1 shrink-0 text-text-dim" />
            <span>{goal.description}</span>
          </li>)}
      </ProfileList>

      <ProfileList icon={<CalendarClock size={14} />} title={t('Preferred activities')} empty={t('No activities added')}>
        {profile.activities.filter(activity => activity.name.trim()).map((activity, index) =>
          <li key={`${activity.name}-${index}`} className="inline-flex items-center gap-1.5 rounded-full border border-app-border bg-surface-3 px-2.5 py-1 text-xs text-app-text">
            {activity.name}
            <span className="text-text-dim">· {activity.weekly_frequency}×</span>
          </li>)}
      </ProfileList>

      <div className="grid grid-cols-2 gap-2">
        <ProfileCount value={profile.commitments.length} label={t('Recurring commitments')} />
        <ProfileCount value={profile.availability.length} label={t('Availability windows')} />
      </div>
    </div> : <p className="mt-5 text-sm text-text-muted">{t('Loading profile…')}</p>}
  </section>
}

function ProfileList({ icon, title, empty, children }: { icon: React.ReactNode; title: string; empty: string; children: React.ReactNode }) {
  const items = Array.isArray(children) ? children : [children]
  return <div>
    <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-text-muted">{icon}{title}</div>
    <ul className="flex flex-wrap gap-2">{items.length > 0 ? children : <li className="text-xs text-text-dim">{empty}</li>}</ul>
  </div>
}

function ProfileCount({ value, label }: { value: number; label: string }) {
  return <div className="rounded-[10px] border border-app-border bg-surface px-3 py-2.5">
    <div className="font-mono text-sm font-bold text-app-text">{value}</div>
    <div className="mt-0.5 text-[11px] leading-tight text-text-dim">{label}</div>
  </div>
}

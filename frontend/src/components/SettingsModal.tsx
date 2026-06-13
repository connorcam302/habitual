import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { api } from '@/lib/api'
import { useI18n, type Locale } from '@/lib/i18n'
import type { User } from '@/types'
import ProfileEditor from '@/components/ProfileEditor'

export default function SettingsModal({ open, user, onClose, onUser, onLogout, onProfileSaved }: {
  open: boolean; user: User; onClose: () => void; onUser: (u: User) => void; onLogout: () => void; onProfileSaved: () => void
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
      <DialogHeader><DialogTitle>{editingProfile ? t('Edit profile') : t('Settings')}</DialogTitle></DialogHeader>
      {editingProfile ? <ProfileEditor onSaved={() => { onProfileSaved(); setEditingProfile(false) }} onCancel={() => setEditingProfile(false)} /> :
      <div className="space-y-5">
        <button onClick={() => setEditingProfile(true)} className="w-full py-2.5 rounded-[10px] border border-app-border text-sm font-semibold text-app-text">{t('Edit profile')}</button>
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
            {(['display_name', 'username', 'password'] as const).map(key =>
              <input key={key} required minLength={key === 'password' ? 8 : 1} type={key === 'password' ? 'password' : 'text'}
                placeholder={t(key === 'display_name' ? 'Name' : key === 'username' ? 'Username' : 'Password')}
                value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                className="w-full rounded-[10px] bg-surface-3 border border-app-border px-3 py-2.5 text-sm text-app-text" />)}
            <button className="w-full py-2.5 rounded-[10px] font-semibold text-app-text" style={{ background: 'var(--gradient-cta)' }}>{t('Create account')}</button>
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

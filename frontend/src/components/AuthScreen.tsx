import { useState } from 'react'
import { api } from '@/lib/api'
import { translate } from '@/lib/i18n'
import type { Locale, User } from '@/types'

export default function AuthScreen({ needsSetup, onAuthenticated }: {
  needsSetup: boolean
  onAuthenticated: (user: User) => void
}) {
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [locale, setLocale] = useState<Locale>('en')
  const t = (value: string) => translate(locale, value)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = needsSetup
        ? await api.setup({ username, display_name: displayName, password, locale })
        : await api.login(username, password)
      onAuthenticated(result.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-full grid place-items-center px-5 py-10">
      <form onSubmit={submit} className="w-full max-w-sm bg-surface border border-app-border rounded-[20px] p-6">
        <div className="font-mono text-[11px] tracking-[0.2em] text-text-muted mb-5">HABITUAL</div>
        <h1 className="text-xl font-bold text-app-text mb-1">{t(needsSetup ? 'Welcome to Habitual' : 'Sign in')}</h1>
        {needsSetup && <p className="text-sm text-text-muted mb-5">{t('Set up the owner account to keep existing data.')}</p>}
        <div className="space-y-3">
          {needsSetup && <Field label={t('Name')} value={displayName} onChange={setDisplayName} autoComplete="name" />}
          <Field label={t('Username')} value={username} onChange={setUsername} autoComplete="username" />
          <Field label={t('Password')} value={password} onChange={setPassword} type="password" autoComplete={needsSetup ? 'new-password' : 'current-password'} />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {([['en', 'English'], ['zh-CN', 'Simplified Chinese']] as const).map(([value, label]) =>
            <button type="button" key={value} onClick={() => setLocale(value)}
              className="py-2 rounded-[10px] border text-xs font-semibold"
              style={locale === value ? { borderColor: 'var(--football)', color: 'var(--football)' } : { borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
              {translate(locale, label)}
            </button>)}
        </div>
        {error && <p className="text-sm mt-3" style={{ color: 'var(--cancelled)' }}>{error}</p>}
        <button disabled={busy} className="w-full mt-5 py-3 rounded-[10px] font-semibold text-app-text disabled:opacity-50" style={{ background: 'var(--gradient-cta)' }}>
          {busy ? '…' : t(needsSetup ? 'Create owner account' : 'Sign in')}
        </button>
      </form>
    </main>
  )
}

function Field({ label, value, onChange, type = 'text', autoComplete }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; autoComplete: string
}) {
  return <label className="block text-xs font-semibold text-text-muted">
    {label}
    <input required minLength={type === 'password' ? 8 : 1} type={type} value={value} autoComplete={autoComplete}
      onChange={e => onChange(e.target.value)}
      className="mt-1.5 w-full rounded-[10px] bg-surface-3 border border-app-border px-3 py-2.5 text-sm text-app-text outline-none focus:border-football" />
  </label>
}

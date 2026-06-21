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
  const [mode, setMode] = useState<'login' | 'register'>('register')
  const t = (value: string) => translate(locale, value)
  const isRegister = needsSetup || mode === 'register'

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = needsSetup
        ? await api.setup({ username, display_name: displayName, password, locale })
        : isRegister
          ? await api.register({ username, display_name: displayName, password, locale })
          : await api.login(username, password)
      onAuthenticated(result.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="h-full overflow-y-auto grid items-start sm:items-center justify-items-center px-5 pt-5 pb-[calc(1.25rem+var(--safe-bottom))] sm:py-10">
      <form onSubmit={submit} className="w-full max-w-sm bg-surface border border-app-border rounded-[20px] p-6">
        <div className="font-mono text-[11px] tracking-[0.2em] text-text-muted mb-5">HABITUAL</div>
        {!needsSetup && <div className="grid grid-cols-2 gap-1 rounded-[12px] bg-surface-3 p-1 mb-5" aria-label={t('Account action')}>
          {([['login', 'Sign in'], ['register', 'Create account']] as const).map(([value, label]) =>
            <button
              key={value}
              type="button"
              aria-label={t(value === 'login' ? 'Show sign in form' : 'Show create account form')}
              onClick={() => { setMode(value); setError('') }}
              className={`min-h-10 rounded-[9px] px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-football ${
                mode === value ? 'bg-surface text-app-text border border-app-border' : 'text-text-muted hover:text-app-text'
              }`}>
              {t(label)}
            </button>)}
        </div>}
        <h1 className="text-xl font-bold text-app-text mb-1">{t(needsSetup ? 'Welcome to Habitual' : isRegister ? 'Create your account' : 'Sign in')}</h1>
        {needsSetup && <p className="text-sm text-text-muted mb-5">{t('Set up the owner account to keep existing data.')}</p>}
        {isRegister && !needsSetup && <p className="text-sm text-text-muted mb-5">{t('Set up your private profile after creating your account.')}</p>}
        <div className="space-y-3">
          {isRegister && <Field label={t('Name')} value={displayName} onChange={setDisplayName} autoComplete="name" />}
          <Field label={t('Username')} value={username} onChange={setUsername} autoComplete="username" />
          <Field label={t('Password')} value={password} onChange={setPassword} type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} />
        </div>
        <div className="mt-3">
          <div className="text-xs font-semibold text-text-muted mb-1.5">{t('Language')}</div>
          <div className="grid grid-cols-2 gap-2">
            {([['en', 'English'], ['zh-CN', 'Simplified Chinese']] as const).map(([value, label]) =>
              <button type="button" key={value} onClick={() => setLocale(value)}
                className="py-2 rounded-[10px] border text-xs font-semibold"
                style={locale === value ? { borderColor: 'var(--football)', color: 'var(--football)' } : { borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                {translate(locale, label)}
              </button>)}
          </div>
        </div>
        {error && <p className="text-sm mt-3" style={{ color: 'var(--cancelled)' }}>{error}</p>}
        <div className="sticky bottom-0 -mx-2 mt-3 px-2 pt-2 pb-1 bg-surface/95 backdrop-blur-sm">
          <button type="submit" disabled={busy} className="w-full py-3 rounded-[10px] font-semibold text-app-text disabled:opacity-50" style={{ background: 'var(--gradient-cta)' }}>
            {busy ? '…' : t(needsSetup ? 'Create owner account' : isRegister ? 'Create account' : 'Sign in')}
          </button>
          {!needsSetup && <button
            type="button"
            onClick={() => { setMode(isRegister ? 'login' : 'register'); setError('') }}
            className="mt-3 w-full text-center text-xs font-semibold text-text-muted hover:text-app-text"
          >
            {t(isRegister ? 'Already have an account? Sign in' : 'New here? Create account')}
          </button>}
        </div>
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

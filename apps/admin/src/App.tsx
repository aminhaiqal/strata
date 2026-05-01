import { startTransition, useEffect, useState } from 'react'
import {
  hydrateAdminShell,
  loginAdmin,
  logoutAdmin,
  type AdminShellState,
} from './application/admin-shell'
import './App.css'

type LoginFormState = {
  residenceId: string
  email: string
  password: string
}

const INITIAL_FORM: LoginFormState = {
  residenceId: '',
  email: '',
  password: '',
}

function App() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [shell, setShell] = useState<AdminShellState | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState<LoginFormState>(INITIAL_FORM)

  useEffect(() => {
    let cancelled = false

    void hydrateAdminShell()
      .then((nextShell) => {
        if (cancelled) {
          return
        }

        setShell(nextShell)
        setStatus('ready')
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return
        }

        setErrorMessage(error instanceof Error ? error.message : 'Unknown API error')
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [])

  function updateField<Key extends keyof LoginFormState>(key: Key, value: LoginFormState[Key]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  async function handleLoginSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const residenceId = Number(form.residenceId)
    if (!Number.isInteger(residenceId) || residenceId <= 0) {
      setErrorMessage('Residence ID must be a positive number.')
      setStatus('error')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)
    setStatus('loading')

    try {
      const nextShell = await loginAdmin({
        residence_id: residenceId,
        email: form.email,
        password: form.password,
      })

      startTransition(() => {
        setShell(nextShell)
        setStatus('ready')
      })
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to sign in.')
      setStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleLogout() {
    logoutAdmin()
    setShell({ status: 'signed_out' })
    setStatus('ready')
    setErrorMessage(null)
    setForm(INITIAL_FORM)
  }

  const signedOut = shell?.status === 'signed_out' || shell === null

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Strata Admin</p>
          <h1>Sign in before the dashboard UI exists.</h1>
          <p className="summary">
            This screen only handles access. The data layer is already split into admin auth,
            residences, blocks, units, residents, and imports modules behind the scenes.
          </p>
        </div>

        {signedOut ? (
          <div className="panel login-panel">
            <div className="panel-header">
              <h2>Admin login</h2>
              <p>Use residence admin credentials from the API.</p>
            </div>

            <form className="login-form" onSubmit={handleLoginSubmit}>
              <label className="field">
                <span>Residence ID</span>
                <input
                  type="number"
                  min="1"
                  inputMode="numeric"
                  value={form.residenceId}
                  onChange={(event) => updateField('residenceId', event.target.value)}
                  placeholder="1"
                  required
                />
              </label>

              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  placeholder="admin@example.com"
                  required
                />
              </label>

              <label className="field">
                <span>Password</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => updateField('password', event.target.value)}
                  placeholder="••••••••"
                  required
                />
              </label>

              {status === 'loading' ? <p className="status-note">Signing in...</p> : null}
              {status === 'error' && errorMessage ? <p className="error">{errorMessage}</p> : null}

              <button className="submit-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </div>
        ) : (
          <div className="panel session-panel">
            <div className="panel-header">
              <h2>Session ready</h2>
              <p>The login flow is live. Dashboard UI can be layered on top next.</p>
            </div>

            <div className="session-meta">
              <div>
                <span className="meta-label">Admin</span>
                <strong>{shell.session.user.name}</strong>
              </div>
              <div>
                <span className="meta-label">Residence</span>
                <strong>{shell.session.user.residence_id}</strong>
              </div>
              <div>
                <span className="meta-label">Role</span>
                <strong>{shell.session.user.role}</strong>
              </div>
            </div>

            {status === 'error' && errorMessage ? <p className="error">{errorMessage}</p> : null}

            <pre>{JSON.stringify(shell.data, null, 2)}</pre>

            <button className="secondary-button" type="button" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        )}
      </section>
    </main>
  )
}

export default App

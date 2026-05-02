import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { hydrateAdminShell, loginAdmin } from '../application/admin-shell'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import { Button } from '../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'

type LoginFormState = {
  email: string
  password: string
}

const INITIAL_FORM: LoginFormState = {
  email: '',
  password: '',
}

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const shell = await hydrateAdminShell()

    if (shell.status === 'ready') {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate({ from: '/login' })
  const [form, setForm] = useState<LoginFormState>(INITIAL_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  function updateField<Key extends keyof LoginFormState>(key: Key, value: LoginFormState[Key]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const nextShell = await loginAdmin({
        email: form.email,
        password: form.password,
      })

      if (nextShell.status !== 'ready') {
        return
      }

      void navigate({ to: '/dashboard' })
    } catch (error: unknown) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to sign in.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-stone-100 text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-5 py-8 sm:px-8">
        <section className="flex w-full items-center justify-center animate-in fade-in zoom-in-95 duration-500">
          <Card className="w-full max-w-xl rounded-[0.75rem] border border-stone-200 bg-white py-0 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
            <CardHeader className="gap-5 border-b border-stone-200 px-7 py-8 sm:px-9">
              <div className="flex items-center gap-4">
                <ShieldCheck className="size-5" />
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Administrative access
                </p>
              </div>
              <div className="space-y-2 text-left">
                <CardTitle className="text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                  Sign in to Strata
                </CardTitle>
                <CardDescription className="max-w-md text-sm leading-6 text-slate-600">
                  Secure access for authorized residence administrators.
                </CardDescription>
              </div>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-5 px-7 py-7 sm:px-9">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-xs uppercase tracking-[0.22em] text-slate-500"
                  >
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField('email', event.target.value)}
                    placeholder="admin@example.com"
                    autoComplete="email"
                    required
                    disabled={isSubmitting}
                    className="h-11 rounded-lg border-slate-200 bg-white px-3.5 text-slate-950 shadow-none placeholder:text-slate-400 focus-visible:border-slate-950 focus-visible:ring-slate-950/10"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-xs uppercase tracking-[0.22em] text-slate-500"
                  >
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(event) => updateField('password', event.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    disabled={isSubmitting}
                    className="h-11 rounded-lg border-slate-200 bg-white px-3.5 text-slate-950 shadow-none placeholder:text-slate-400 focus-visible:border-slate-950 focus-visible:ring-slate-950/10"
                  />
                </div>

                {isSubmitting ? (
                  <Alert className="border-slate-200 bg-stone-50 text-slate-950">
                    <AlertTitle>Signing in</AlertTitle>
                    <AlertDescription className="text-slate-600">
                      Please wait while we verify your credentials.
                    </AlertDescription>
                  </Alert>
                ) : null}

                {submitError ? (
                  <Alert variant="destructive" className="border-red-200 bg-red-50">
                    <AlertTitle>Sign-in failed</AlertTitle>
                    <AlertDescription>{submitError}</AlertDescription>
                  </Alert>
                ) : null}
              </CardContent>

              <CardContent className="space-y-3 border-t border-stone-200 px-7 py-6 sm:px-9">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="h-11 w-full rounded-lg bg-slate-950 text-sm font-medium text-white shadow-none hover:bg-slate-800"
                >
                  {isSubmitting ? 'Signing in...' : 'Enter workspace'}
                  <ArrowRight className="size-4" />
                </Button>

                <p className="text-center text-[11px] uppercase tracking-[0.18em] text-slate-500 pt-3 pb-6">
                  Authorized residence administrators only
                </p>
              </CardContent>
            </form>
          </Card>
        </section>
      </div>
    </main>
  )
}

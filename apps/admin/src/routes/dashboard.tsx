import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { ArrowUpRight, Building2, LogOut, Upload, Users, WalletCards } from 'lucide-react'
import { hydrateAdminShell, logoutAdmin } from '../application/admin-shell'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const shell = await hydrateAdminShell()

    if (shell.status !== 'ready') {
      throw redirect({ to: '/login' })
    }
  },
  loader: async () => {
    const shell = await hydrateAdminShell()

    if (shell.status !== 'ready') {
      throw redirect({ to: '/login' })
    }

    return shell
  },
  component: DashboardPage,
})

function DashboardPage() {
  const navigate = useNavigate({ from: '/dashboard' })
  const shell = Route.useLoaderData()
  const residence = shell.data.residences[0]
  const stats = [
    {
      label: 'Units tracked',
      value: shell.data.blocks.length * 12 || 48,
      hint: 'Portfolio coverage',
      icon: Building2,
    },
    {
      label: 'Residents',
      value: shell.data.residents.length,
      hint: 'Linked accounts',
      icon: Users,
    },
    {
      label: 'Blocks',
      value: shell.data.blocks.length,
      hint: 'Active buildings',
      icon: WalletCards,
    },
  ]
  const navItems = ['Overview', 'Units', 'Residents', 'Imports']

  function handleLogout() {
    logoutAdmin()
    void navigate({ to: '/login' })
  }

  return (
    <main className="min-h-screen bg-stone-100 text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-5 sm:px-8 sm:py-7">
        <header className="border border-stone-200 bg-white">
          <div className="flex flex-col gap-5 border-b border-stone-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center border border-slate-950 bg-slate-950 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                  AS
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Axelyn Strata Finance
                  </p>
                  <h1 className="m-0 text-xl font-semibold tracking-[-0.04em] text-slate-950">
                    Admin dashboard
                  </h1>
                </div>
              </div>
              <p className="text-sm leading-6 text-slate-600">
                {residence?.name ?? 'Current residence'} workspace for units, residents, and
                imports.
              </p>
            </div>

            <div className="flex items-center gap-3 border border-stone-200 bg-stone-50 px-4 py-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Signed in
                </p>
                <p className="truncate text-sm font-medium text-slate-950">
                  {shell.session.user.name}
                </p>
              </div>
              <button
                className="inline-flex h-10 items-center gap-2 border border-stone-300 bg-white px-4 text-sm font-medium text-slate-950 transition hover:bg-stone-100"
                type="button"
                onClick={handleLogout}
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </div>
          </div>

          <nav className="flex flex-wrap gap-2 px-5 py-3 sm:px-7">
            {navItems.map((item) => (
              <button
                key={item}
                type="button"
                className={
                  item === 'Overview'
                    ? 'inline-flex h-10 items-center border border-slate-950 bg-slate-950 px-4 text-sm font-medium text-white'
                    : 'inline-flex h-10 items-center border border-transparent px-4 text-sm font-medium text-slate-600 transition hover:border-stone-200 hover:bg-stone-50 hover:text-slate-950'
                }
              >
                {item}
              </button>
            ))}
          </nav>
        </header>

        <section className="grid gap-5 pt-5 lg:grid-cols-[1.75fr_1fr]">
          <div className="space-y-5">
            <section className="border border-stone-200 bg-white p-5 sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Overview
                  </p>
                  <div className="space-y-2">
                    <h2 className="m-0 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                      Collection operations at a glance
                    </h2>
                    <p className="max-w-2xl text-sm leading-6 text-slate-600">
                      This is a lightweight placeholder dashboard. The structure is ready for
                      real collections, payment verification, and reporting once those APIs are
                      added.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-px border border-stone-200 bg-stone-200 sm:min-w-[280px]">
                  <div className="bg-stone-50 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                      Residence
                    </p>
                    <p className="pt-2 text-sm font-medium text-slate-950">
                      {residence?.name ?? `#${shell.session.user.residence_id}`}
                    </p>
                  </div>
                  <div className="bg-stone-50 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Role</p>
                    <p className="pt-2 text-sm font-medium text-slate-950">
                      {shell.session.user.role}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
              {stats.map((stat) => {
                const Icon = stat.icon

                return (
                  <article key={stat.label} className="border border-stone-200 bg-white p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                          {stat.label}
                        </p>
                        <p className="pt-4 text-4xl font-semibold tracking-[-0.06em] text-slate-950">
                          {stat.value}
                        </p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center border border-stone-200 bg-stone-50 text-slate-700">
                        <Icon className="size-4" />
                      </div>
                    </div>
                    <p className="pt-5 text-sm text-slate-600">{stat.hint}</p>
                  </article>
                )
              })}
            </section>

            <section className="border border-stone-200 bg-white">
              <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4 sm:px-7">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Activity queue
                  </p>
                  <h2 className="m-0 pt-2 text-lg font-semibold tracking-[-0.03em] text-slate-950">
                    Priority items
                  </h2>
                </div>
                <button className="inline-flex h-10 items-center gap-2 border border-stone-300 bg-white px-4 text-sm font-medium text-slate-950 transition hover:bg-stone-100">
                  Open workspace
                  <ArrowUpRight className="size-4" />
                </button>
              </div>

              <div className="grid gap-px bg-stone-200">
                {[
                  ['Resident onboarding', 'Review new resident accounts and assign unit links.'],
                  ['Unit maintenance', 'Keep occupancy and owner records current by block.'],
                  ['Import cleanup', 'Validate CSV uploads and resolve failed rows quickly.'],
                ].map(([title, description]) => (
                  <div
                    key={title}
                    className="flex flex-col gap-3 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-950">{title}</p>
                      <p className="pt-1 text-sm leading-6 text-slate-600">{description}</p>
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Placeholder
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="border border-stone-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Shortcuts
                  </p>
                  <h2 className="m-0 pt-2 text-lg font-semibold tracking-[-0.03em] text-slate-950">
                    Frequent actions
                  </h2>
                </div>
                <Upload className="size-4 text-slate-500" />
              </div>

              <div className="grid gap-3 pt-5">
                {['Add unit', 'Create resident', 'Upload import'].map((action) => (
                  <button
                    key={action}
                    className="flex h-12 items-center justify-between border border-stone-200 bg-stone-50 px-4 text-sm font-medium text-slate-950 transition hover:bg-stone-100"
                    type="button"
                  >
                    {action}
                    <ArrowUpRight className="size-4 text-slate-500" />
                  </button>
                ))}
              </div>
            </section>

            <section className="border border-stone-200 bg-slate-950 p-5 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Scope
              </p>
              <h2 className="m-0 pt-2 text-lg font-semibold tracking-[-0.03em] text-white">
                Current implemented areas
              </h2>
              <div className="grid gap-3 pt-5 text-sm text-slate-300">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span>Residences</span>
                  <span>Ready</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span>Blocks</span>
                  <span>Ready</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span>Units</span>
                  <span>Ready</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Residents & imports</span>
                  <span>Ready</span>
                </div>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  )
}

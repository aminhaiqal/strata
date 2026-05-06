import { createFileRoute, redirect } from '@tanstack/react-router'
import { Building2, CircleAlert, Users, WalletCards } from 'lucide-react'
import { hydrateAdminShell } from '../application/admin-shell'
import { AdminLayout } from '../components/admin-layout'

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
    {
      label: 'Pending follow-ups',
      value: 7,
      hint: 'Due for action today',
      icon: CircleAlert,
    },
  ]

  return (
    <AdminLayout
      shell={shell}
      title="Dashboard"
      description={`${
        residence?.name ?? 'Current residence'
      } collection workspace for balances, arrears, payment verification, and follow-up actions.`}
    >
      <section className="grid gap-5 lg:grid-cols-[1.75fr_1fr]">
        <div className="space-y-5">
          <section className="rounded-[4px] border border-black bg-white p-5 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-black/55">
                  Overview
                </p>
                <div className="space-y-2">
                  <h2 className="m-0 text-3xl font-semibold tracking-[-0.05em] text-black">
                    Collection operations at a glance
                  </h2>
                  <p className="max-w-2xl text-sm leading-6 text-black/65">
                    The admin shell is now structured around the finance module workflow so the
                    next API integrations can plug into charges, payments, installment plans,
                    follow-ups, reports, and audit history without reshaping navigation again.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[4px] border border-black bg-black sm:min-w-[280px]">
                <div className="bg-white px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-black/55">
                    Residence
                  </p>
                  <p className="pt-2 text-sm font-medium text-black">
                    {residence?.name ?? `#${shell.session.user.residence_id}`}
                  </p>
                </div>
                <div className="bg-white px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-black/55">Role</p>
                  <p className="pt-2 text-sm font-medium text-black">
                    {shell.session.user.role}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon

              return (
                <article
                  key={stat.label}
                  className="rounded-[4px] border border-black bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/55">
                        {stat.label}
                      </p>
                      <p className="pt-4 text-4xl font-semibold tracking-[-0.06em] text-black">
                        {stat.value}
                      </p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-[4px] border border-black bg-black text-white">
                      <Icon className="size-4" />
                    </div>
                  </div>
                  <p className="pt-5 text-sm text-black/65">{stat.hint}</p>
                </article>
              )
            })}
          </section>

          <section className="overflow-hidden rounded-[4px] border border-black bg-white">
            <div className="flex items-center justify-between border-b border-black px-5 py-4 sm:px-7">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/55">
                  Activity queue
                </p>
                <h2 className="m-0 pt-2 text-lg font-semibold tracking-[-0.03em] text-black">
                  Priority items
                </h2>
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/55">
                Admin queue
              </span>
            </div>

            <div className="grid gap-px bg-black">
              {[
                ['Payment verification', 'Review new payment proofs and approve valid submissions.'],
                ['Debtor follow-ups', 'Contact overdue units and record the latest collection actions.'],
                ['Installment reviews', 'Check active repayment plans and missed schedule items.'],
              ].map(([title, description]) => (
                <div
                  key={title}
                  className="flex flex-col gap-3 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7"
                >
                  <div>
                    <p className="text-sm font-medium text-black">{title}</p>
                    <p className="pt-1 text-sm leading-6 text-black/65">{description}</p>
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/55">
                    Placeholder
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-[4px] border border-black bg-white p-5 sm:p-6">
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/55">
                Collection posture
              </p>
              <h2 className="m-0 text-lg font-semibold tracking-[-0.03em] text-black">
                What this shell is ready for
              </h2>
            </div>

            <div className="grid gap-px bg-black pt-5">
              {[
                ['Residences', shell.data.residences.length],
                ['Blocks', shell.data.blocks.length],
                ['Residents', shell.data.residents.length],
                ['Default route', 'Dashboard'],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between bg-white px-4 py-3 text-sm text-black/75"
                >
                  <span>{label}</span>
                  <span className="font-medium text-black">{value}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[4px] border border-black bg-black p-5 text-white sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">
              Navigation
            </p>
            <h2 className="m-0 pt-3 text-lg font-semibold tracking-[-0.03em] text-white">
              Cleaner finance workspace
            </h2>
            <p className="pt-3 text-sm leading-6 text-white/75">
              The admin shell now uses a more restrained sidebar system so the navigation feels
              structured, professional, and easier to scan during daily finance operations.
            </p>
          </section>
        </aside>
      </section>
    </AdminLayout>
  )
}

import { createFileRoute, redirect } from '@tanstack/react-router'
import { hydrateAdminShell } from '../application/admin-shell'
import { AdminPage } from '../components/admin-page'

export const Route = createFileRoute('/reports')({
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
  component: ReportsPage,
})

function ReportsPage() {
  return (
    <AdminPage
      shell={Route.useLoaderData()}
      title="Reports"
      description="Generate arrears, collection, verification, and installment reporting for admin review."
      eyebrow="Reporting"
      summary="Reports should answer who owes what, since when, and what action has already been taken. This route is where that reporting workflow will live."
      bullets={[
        'Arrears report for outstanding balances and overdue duration.',
        'Collection summary and payment verification reporting for operational review.',
        'Export-ready reporting for never-paid units, long-overdue units, and installment plans.',
      ]}
    />
  )
}

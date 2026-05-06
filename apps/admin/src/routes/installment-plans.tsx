import { createFileRoute, redirect } from '@tanstack/react-router'
import { hydrateAdminShell } from '../application/admin-shell'
import { AdminPage } from '../components/admin-page'

export const Route = createFileRoute('/installment-plans')({
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
  component: InstallmentPlansPage,
})

function InstallmentPlansPage() {
  return (
    <AdminPage
      shell={Route.useLoaderData()}
      title="Installment Plans"
      description="Create repayment plans, review schedules, and track missed installments."
      eyebrow="Repayment"
      summary="This route represents the repayment agreement workflow for overdue units that need structured collection without losing schedule visibility."
      bullets={[
        'Create installment plans with start date, end date, and total agreed amount.',
        'Monitor installment schedules with pending, partially paid, paid, and missed statuses.',
        'Surface active plans during classification and collection follow-up work.',
      ]}
    />
  )
}

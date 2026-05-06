import { createFileRoute, redirect } from '@tanstack/react-router'
import { hydrateAdminShell } from '../application/admin-shell'
import { AdminPage } from '../components/admin-page'

export const Route = createFileRoute('/payments')({
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
  component: PaymentsPage,
})

function PaymentsPage() {
  return (
    <AdminPage
      shell={Route.useLoaderData()}
      title="Payments"
      description="Review submissions, verify payment proofs, reject invalid claims, and manage payment records."
      eyebrow="Verification"
      summary="The payments module is where admins process resident proof submissions and turn them into verified allocations without affecting balances prematurely."
      bullets={[
        'Review pending verification items submitted by residents.',
        'Record manual payments and maintain reference numbers and methods.',
        'Verify or reject payment proofs before balance allocations are applied.',
      ]}
    />
  )
}

import { createFileRoute, redirect } from '@tanstack/react-router'
import { hydrateAdminShell } from '../application/admin-shell'
import { AdminPage } from '../components/admin-page'

export const Route = createFileRoute('/charges')({
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
  component: ChargesPage,
})

function ChargesPage() {
  return (
    <AdminPage
      shell={Route.useLoaderData()}
      title="Charges"
      description="Create maintenance fees, sinking funds, special charges, and bulk monthly billings."
      eyebrow="Billing"
      summary="This workspace is aligned to charge creation and monthly charge generation in the finance module requirements."
      bullets={[
        'Create individual charges with billing month, due date, and charge type.',
        'Bulk-generate monthly charges for residence-wide recurring fees.',
        'Track charge status such as pending, partially paid, paid, waived, and overdue.',
      ]}
    />
  )
}

import { createFileRoute, redirect } from '@tanstack/react-router'
import { hydrateAdminShell } from '../application/admin-shell'
import { AdminPage } from '../components/admin-page'

export const Route = createFileRoute('/audit-logs')({
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
  component: AuditLogsPage,
})

function AuditLogsPage() {
  return (
    <AdminPage
      shell={Route.useLoaderData()}
      title="Audit Logs"
      description="Review sensitive financial changes, actors, timestamps, and before-and-after records."
      eyebrow="Compliance"
      summary="Audit logs are required for charge, payment, installment, classification, import, and role changes so collection data remains defensible."
      bullets={[
        'Track who created, verified, rejected, or updated sensitive financial records.',
        'Store before and after state for high-risk operations.',
        'Maintain residence-scoped audit visibility for compliance and dispute handling.',
      ]}
    />
  )
}

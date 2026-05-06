import { createFileRoute, redirect } from '@tanstack/react-router'
import { hydrateAdminShell } from '../application/admin-shell'
import { AdminPage } from '../components/admin-page'

export const Route = createFileRoute('/units')({
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
  component: UnitsPage,
})

function UnitsPage() {
  return (
    <AdminPage
      shell={Route.useLoaderData()}
      title="Units"
      description="Manage unit records, occupancy, owners, tenants, and residence-linked access."
      eyebrow="Residence management"
      summary="This section maps to the unit management scope in the requirements, including owner and tenant records, block assignment, and occupancy status."
      bullets={[
        'Create and edit unit records for each residence and block.',
        'Store owner and tenant contact details with clear occupancy status.',
        'Link residents to units for resident portal access and payment visibility.',
      ]}
    />
  )
}

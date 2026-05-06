import { createFileRoute, redirect } from '@tanstack/react-router'
import { hydrateAdminShell } from '../application/admin-shell'
import { AdminPage } from '../components/admin-page'

export const Route = createFileRoute('/settings')({
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
  component: SettingsPage,
})

function SettingsPage() {
  return (
    <AdminPage
      shell={Route.useLoaderData()}
      title="Settings"
      description="Manage admin access, residence-level setup, and finance workspace configuration."
      eyebrow="Administration"
      summary="This section is reserved for role-based management and configuration items that should remain outside day-to-day collection actions."
      bullets={[
        'Manage admin users according to the role permission matrix.',
        'Configure residence-level settings such as billing cycle and operating status.',
        'Keep sensitive configuration separate from finance operations routes.',
      ]}
    />
  )
}

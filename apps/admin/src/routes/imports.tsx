import { createFileRoute, redirect } from '@tanstack/react-router'
import { hydrateAdminShell } from '../application/admin-shell'
import { AdminPage } from '../components/admin-page'

export const Route = createFileRoute('/imports')({
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
  component: ImportsPage,
})

function ImportsPage() {
  return (
    <AdminPage
      shell={Route.useLoaderData()}
      title="Imports"
      description="Upload spreadsheets, validate batch rows, and confirm controlled data imports."
      eyebrow="Migration"
      summary="This section is for bringing existing spreadsheet records into the system with previews, errors, and import batch tracking."
      bullets={[
        'Import units, opening balances, historical payments, and monthly charges.',
        'Review validation results before confirming record creation.',
        'Track batch status from upload through completion or failure.',
      ]}
    />
  )
}

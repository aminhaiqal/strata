import { createFileRoute, redirect } from '@tanstack/react-router'
import { hydrateAdminShell } from '../application/admin-shell'
import { AdminPage } from '../components/admin-page'

export const Route = createFileRoute('/follow-ups')({
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
  component: FollowUpsPage,
})

function FollowUpsPage() {
  return (
    <AdminPage
      shell={Route.useLoaderData()}
      title="Follow-Ups"
      description="Track debtor contact attempts, next actions, reminders, and internal collection notes."
      eyebrow="Collections actions"
      summary="This area corresponds to follow-up records and admin notes so overdue units can be worked systematically instead of through spreadsheets and chat history."
      bullets={[
        'Log WhatsApp, phone, email, notice letter, and legal warning actions.',
        'Set next follow-up dates and track promised-to-pay or escalated outcomes.',
        'Maintain residence-scoped internal notes for collection context.',
      ]}
    />
  )
}

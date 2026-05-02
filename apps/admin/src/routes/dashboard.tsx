import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { hydrateAdminShell, logoutAdmin } from '../application/admin-shell'

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
  const navigate = useNavigate({ from: '/dashboard' })
  const shell = Route.useLoaderData()

  function handleLogout() {
    logoutAdmin()
    void navigate({ to: '/login' })
  }

  return (
    <div className="panel session-panel">
      <div className="panel-header">
        <h2>Session ready</h2>
        <p>The login flow is live. Dashboard UI can be layered on top next.</p>
      </div>

      <div className="session-meta">
        <div>
          <span className="meta-label">Admin</span>
          <strong>{shell.session.user.name}</strong>
        </div>
        <div>
          <span className="meta-label">Residence</span>
          <strong>{shell.session.user.residence_id}</strong>
        </div>
        <div>
          <span className="meta-label">Role</span>
          <strong>{shell.session.user.role}</strong>
        </div>
      </div>

      <pre>{JSON.stringify(shell.data, null, 2)}</pre>

      <button className="secondary-button" type="button" onClick={handleLogout}>
        Sign out
      </button>
    </div>
  )
}

import { createFileRoute, redirect } from '@tanstack/react-router'
import { hydrateAdminShell } from '../application/admin-shell'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const shell = await hydrateAdminShell()

    throw redirect({
      to: shell.status === 'ready' ? '/dashboard' : '/login',
    })
  },
})

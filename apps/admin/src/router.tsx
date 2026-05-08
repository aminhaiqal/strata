import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from '@tanstack/react-router'
import {
  getAdminSection,
  getAdminSubsection,
} from '@/lib/admin-navigation'
import AdminSectionPage from '@/pages/admin-section/page'
import DashboardPage from '@/pages/dashboard/page'
import LoginPage from '@/pages/login'

const rootRoute = createRootRoute({
  component: Outlet,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/login' })
  },
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'login',
  component: LoginPage,
})

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'dashboard',
  component: DashboardPage,
})

const dashboardSectionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'dashboard/$section',
  beforeLoad: ({ params }) => {
    if (!getAdminSection(params.section)) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: AdminSectionPage,
})

const dashboardSubsectionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'dashboard/$section/$subsection',
  beforeLoad: ({ params }) => {
    const section = getAdminSection(params.section)

    if (!section) {
      throw redirect({ to: '/dashboard' })
    }

    if (!getAdminSubsection(params.section, params.subsection)) {
      throw redirect({ to: section.url })
    }
  },
  component: AdminSectionPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  dashboardRoute,
  dashboardSectionRoute,
  dashboardSubsectionRoute,
])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

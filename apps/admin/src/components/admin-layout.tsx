import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { ChevronRight, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useState } from 'react'
import { logoutAdmin, type AdminShellState } from '../application/admin-shell'
import { cn } from '../lib/utils'
import { adminNavGroups } from '../navigation/admin-nav'
import { Button } from './ui/button'

type AdminLayoutProps = {
  shell: Extract<AdminShellState, { status: 'ready' }>
  title: string
  description: string
  children: React.ReactNode
}

export function AdminLayout({ shell, title, description, children }: AdminLayoutProps) {
  const navigate = useNavigate()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const residence = shell.data.residences[0]

  function handleLogout() {
    logoutAdmin()
    void navigate({ to: '/login' })
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="flex min-h-screen">
        <aside
          className={cn(
            'hidden border-r border-black bg-white transition-[width] duration-200 lg:flex lg:flex-col',
            collapsed ? 'lg:w-24' : 'lg:w-[18.5rem]',
          )}
        >
          <SidebarContent
            shell={shell}
            pathname={pathname}
            collapsed={collapsed}
            onCollapseToggle={() => setCollapsed((current) => !current)}
            onNavigate={undefined}
            onLogout={handleLogout}
          />
        </aside>

        {mobileOpen ? (
          <div
            className="fixed inset-0 z-40 bg-black/20 lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <aside
              className="h-full w-[18.5rem] max-w-[85vw] border-r border-black bg-white"
              onClick={(event) => event.stopPropagation()}
            >
              <SidebarContent
                shell={shell}
                pathname={pathname}
                collapsed={false}
                onCollapseToggle={undefined}
                onNavigate={() => setMobileOpen(false)}
                onLogout={handleLogout}
              />
            </aside>
          </div>
        ) : null}

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="border-b border-black bg-white">
            <div className="flex items-start justify-between gap-4 px-5 py-4 sm:px-7">
              <div className="flex items-start gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="mt-1 rounded-[4px] border-black bg-white text-black hover:bg-black hover:text-white lg:hidden"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open navigation"
                >
                  <Menu className="size-4" />
                </Button>
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-black/55">
                    Axelyn Strata Finance
                  </p>
                  <div className="space-y-1">
                    <h1 className="m-0 text-[1.85rem] font-semibold tracking-[-0.05em] text-black">
                      {title}
                    </h1>
                    <p className="max-w-3xl text-sm leading-6 text-black/65">{description}</p>
                  </div>
                </div>
              </div>

              <div className="hidden min-w-0 items-center gap-3 rounded-[4px] border border-black bg-white px-4 py-3 sm:flex">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/55">
                    Active residence
                  </p>
                  <p className="truncate text-sm font-medium text-black">
                    {residence?.name ?? `Residence #${shell.session.user.residence_id}`}
                  </p>
                </div>
                <div className="h-10 w-px bg-black" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/55">
                    Signed in
                  </p>
                  <p className="truncate text-sm font-medium text-black">
                    {shell.session.user.name}
                  </p>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-5 py-5 sm:px-7 sm:py-7">{children}</main>
        </div>
      </div>
    </div>
  )
}

type SidebarContentProps = {
  shell: Extract<AdminShellState, { status: 'ready' }>
  pathname: string
  collapsed: boolean
  onCollapseToggle?: () => void
  onNavigate?: () => void
  onLogout: () => void
}

function SidebarContent({
  shell,
  pathname,
  collapsed,
  onCollapseToggle,
  onNavigate,
  onLogout,
}: SidebarContentProps) {
  const residence = shell.data.residences[0]

  return (
    <div className="flex h-full flex-col p-4">
      <div className="border-b border-black pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className={cn('min-w-0', collapsed ? 'flex w-full justify-center' : 'space-y-3')}>
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] border border-black bg-black text-[10px] font-semibold uppercase tracking-[0.28em] text-white">
                AS
              </div>
              <div className={cn('min-w-0', collapsed && 'hidden')}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-black/55">
                  Axelyn Strata
                </p>
                <p className="truncate pt-1 text-base font-semibold tracking-[-0.03em] text-black">
                  Finance Admin
                </p>
              </div>
            </div>

            <div
              className={cn(
                'rounded-[4px] border border-black bg-white px-3 py-3',
                collapsed && 'hidden',
              )}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-black/55">
                Residence
              </p>
              <p className="truncate pt-1 text-sm font-medium text-black">
                {residence?.name ?? 'Axelyn Strata'}
              </p>
            </div>
          </div>

          {onCollapseToggle ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0 rounded-[4px] border-black bg-white text-black hover:bg-black hover:text-white"
              onClick={onCollapseToggle}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <PanelLeftOpen className="size-4" />
              ) : (
                <PanelLeftClose className="size-4" />
              )}
            </Button>
          ) : null}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-5">
        <div className="space-y-5">
          {adminNavGroups.map((group) => (
            <section key={group.label} className="space-y-2">
              <p
                className={cn(
                  'px-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-black/45',
                  collapsed && 'px-0 text-center',
                )}
              >
                {collapsed ? group.label.slice(0, 1) : group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.to

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={onNavigate}
                      title={item.description}
                      className={cn(
                        'flex items-center gap-3 rounded-[4px] border px-3 py-2.5 transition',
                        isActive
                          ? 'border-black bg-black text-white'
                          : 'border-transparent text-black/70 hover:border-black hover:bg-white hover:text-black',
                        collapsed && 'justify-center px-2',
                      )}
                    >
                      <div
                        className={cn(
                          'flex size-8 shrink-0 items-center justify-center rounded-[4px] border transition',
                          isActive
                            ? 'border-white bg-white text-black'
                            : 'border-black bg-white text-black',
                        )}
                      >
                        <Icon className="size-4 shrink-0" />
                      </div>
                      <div className={cn('min-w-0', collapsed && 'hidden')}>
                        <p className="text-sm font-medium">{item.label}</p>
                      </div>
                      {!collapsed ? (
                        <ChevronRight
                          className={cn(
                            'ml-auto size-4 shrink-0 transition',
                            isActive ? 'text-white/70' : 'text-black/25',
                          )}
                        />
                      ) : null}
                    </Link>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </nav>

      <div className="border-t border-black pt-4">
        <div
          className={cn(
            'rounded-[4px] border border-black bg-white p-3',
            collapsed && 'p-2',
          )}
        >
          <div className={cn('space-y-1', collapsed && 'hidden')}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-black/55">
              Signed in
            </p>
            <p className="text-sm font-medium text-black">{shell.session.user.name}</p>
            <p className="text-xs text-black/55">{shell.session.user.role}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            className={cn(
              'mt-3 w-full justify-center rounded-[4px] border-black bg-white text-black hover:bg-black hover:text-white',
              collapsed && 'mt-0',
            )}
            onClick={onLogout}
          >
            Sign out
          </Button>
        </div>
      </div>
    </div>
  )
}

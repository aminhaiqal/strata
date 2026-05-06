import { ArrowUpRight } from 'lucide-react'
import { type AdminShellState } from '../application/admin-shell'
import { AdminLayout } from './admin-layout'

type AdminPageProps = {
  shell: Extract<AdminShellState, { status: 'ready' }>
  title: string
  description: string
  eyebrow: string
  summary: string
  bullets: string[]
}

export function AdminPage({
  shell,
  title,
  description,
  eyebrow,
  summary,
  bullets,
}: AdminPageProps) {
  return (
    <AdminLayout shell={shell} title={title} description={description}>
      <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <section className="space-y-5">
          <article className="rounded-[4px] border border-black bg-white p-6 sm:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-black/55">
              {eyebrow}
            </p>
            <h2 className="pt-3 text-3xl font-semibold tracking-[-0.05em] text-black">
              {title}
            </h2>
            <p className="max-w-3xl pt-3 text-sm leading-6 text-black/65">{summary}</p>
          </article>

          <article className="overflow-hidden rounded-[4px] border border-black bg-white">
            <div className="border-b border-black px-6 py-4 sm:px-7">
              <h3 className="text-lg font-semibold tracking-[-0.03em] text-black">
                Planned workspace
              </h3>
            </div>
            <div className="grid gap-px bg-black">
              {bullets.map((bullet) => (
                <div key={bullet} className="bg-white px-6 py-4 text-sm leading-6 text-black/75 sm:px-7">
                  {bullet}
                </div>
              ))}
            </div>
          </article>
        </section>

        <aside className="space-y-5">
          <article className="rounded-[4px] border border-black bg-white p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/55">
              Status
            </p>
            <p className="pt-3 text-2xl font-semibold tracking-[-0.04em] text-black">
              Ready for API wiring
            </p>
            <p className="pt-3 text-sm leading-6 text-black/65">
              This route is now part of the authenticated admin shell and can be connected to the
              corresponding finance APIs next.
            </p>
          </article>

          <article className="rounded-[4px] border border-black bg-white p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/55">
                  Next integration
                </p>
                <p className="pt-2 text-sm font-medium text-black">Bind live module data</p>
              </div>
              <ArrowUpRight className="size-4 text-black/55" />
            </div>
            <p className="pt-3 text-sm leading-6 text-black/65">
              Use the existing admin APIs and role checks so each section displays residence-scoped
              records after login.
            </p>
          </article>
        </aside>
      </div>
    </AdminLayout>
  )
}

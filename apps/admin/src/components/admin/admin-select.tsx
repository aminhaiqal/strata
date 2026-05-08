import type { ComponentProps } from "react"

export function AdminSelect(props: ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      {...props}
    />
  )
}

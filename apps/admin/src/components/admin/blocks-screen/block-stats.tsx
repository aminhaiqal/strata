import {
  Building2Icon,
  PencilIcon,
  Rows3Icon,
} from "lucide-react"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type BlockStatsProps = {
  isLoading: boolean
  visibleBlocksCount: number
  totalBlocksCount: number
  describedBlocksCount: number
}

export function BlockStats({
  isLoading,
  visibleBlocksCount,
  totalBlocksCount,
  describedBlocksCount,
}: BlockStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardDescription>Visible blocks</CardDescription>
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-3xl font-semibold">
              {isLoading ? "--" : visibleBlocksCount}
            </CardTitle>
            <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
              <Rows3Icon className="size-4" />
            </div>
          </div>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Total block records</CardDescription>
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-3xl font-semibold">
              {isLoading ? "--" : totalBlocksCount}
            </CardTitle>
            <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
              <Building2Icon className="size-4" />
            </div>
          </div>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Described blocks</CardDescription>
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-3xl font-semibold">
              {isLoading ? "--" : describedBlocksCount}
            </CardTitle>
            <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
              <PencilIcon className="size-4" />
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  )
}

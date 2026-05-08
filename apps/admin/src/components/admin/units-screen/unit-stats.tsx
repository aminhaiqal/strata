import {
  Building2Icon,
  HomeIcon,
  UsersIcon,
} from "lucide-react"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type UnitStatsProps = {
  isLoadingUnits: boolean
  visibleUnitsCount: number
  activeUnitsCount: number
  occupiedUnitsCount: number
}

export function UnitStats({
  isLoadingUnits,
  visibleUnitsCount,
  activeUnitsCount,
  occupiedUnitsCount,
}: UnitStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardDescription>Visible units</CardDescription>
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-3xl font-semibold">
              {isLoadingUnits ? "--" : visibleUnitsCount}
            </CardTitle>
            <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
              <HomeIcon className="size-4" />
            </div>
          </div>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Active units</CardDescription>
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-3xl font-semibold">
              {isLoadingUnits ? "--" : activeUnitsCount}
            </CardTitle>
            <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
              <Building2Icon className="size-4" />
            </div>
          </div>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Occupied units</CardDescription>
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-3xl font-semibold">
              {isLoadingUnits ? "--" : occupiedUnitsCount}
            </CardTitle>
            <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
              <UsersIcon className="size-4" />
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  )
}

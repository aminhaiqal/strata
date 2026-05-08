import {
  Building2Icon,
  CalendarIcon,
  MapPinIcon,
} from "lucide-react"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type ResidenceStatsProps = {
  isLoading: boolean
  totalResidences: number
  activeResidencesCount: number
}

export function ResidenceStats({
  isLoading,
  totalResidences,
  activeResidencesCount,
}: ResidenceStatsProps) {
  const visibleTotal = isLoading ? "--" : totalResidences
  const visibleActiveCount = isLoading ? "--" : activeResidencesCount

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardDescription>Accessible residences</CardDescription>
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-3xl font-semibold">
              {visibleTotal}
            </CardTitle>
            <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
              <Building2Icon className="size-4" />
            </div>
          </div>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Active residences</CardDescription>
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-3xl font-semibold">
              {visibleActiveCount}
            </CardTitle>
            <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
              <MapPinIcon className="size-4" />
            </div>
          </div>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Billing profiles</CardDescription>
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-3xl font-semibold">
              {visibleTotal}
            </CardTitle>
            <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
              <CalendarIcon className="size-4" />
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  )
}

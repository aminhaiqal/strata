import { PencilIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  formatTimestamp,
} from "@/lib/admin-screen-utils"

import {
  statusVariant,
} from "./model"
import type { ResidenceRecord } from "./model"

type ResidenceListProps = {
  isLoading: boolean
  loadError: string | null
  residences: ResidenceRecord[]
  onEdit: (residenceId: number) => void
}

export function ResidenceList({
  isLoading,
  loadError,
  residences,
  onEdit,
}: ResidenceListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Residence settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loadError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm leading-6 text-destructive">
            {loadError}
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid gap-4">
            {[0, 1].map((item) => (
              <Card key={item}>
                <CardContent className="space-y-3 py-5">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}

        {!isLoading && !loadError && residences.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-10 text-center">
            <p className="text-sm font-medium">
              No residences are available for this admin account.
            </p>
          </div>
        ) : null}

        {!isLoading && !loadError && residences.length > 0 ? (
          <div className="grid gap-4">
            {residences.map((residence) => (
              <Card key={residence.id}>
                <CardContent className="flex flex-col gap-5 py-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold">{residence.name}</p>
                      <Badge variant={statusVariant(residence.status)}>
                        {residence.status}
                      </Badge>
                    </div>

                    <div className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <p className="font-medium text-foreground">Address</p>
                        <p>{residence.address}</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Timezone</p>
                        <p>{residence.timezone}</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Currency</p>
                        <p>{residence.currency}</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          Billing cycle day
                        </p>
                        <p>{residence.billing_cycle_day}</p>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Last updated {formatTimestamp(residence.updated_at)}.
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        onEdit(residence.id)
                      }}
                    >
                      <PencilIcon />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

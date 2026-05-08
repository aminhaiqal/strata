import { PencilIcon, PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { formatTimestamp } from "@/lib/admin-screen-utils"

import type { BlockRecord } from "./model"

type BlockListProps = {
  search: string
  isLoading: boolean
  loadError: string | null
  visibleBlocks: BlockRecord[]
  onSearchChange: (value: string) => void
  onCreate: () => void
  onEdit: (blockId: number) => void
}

export function BlockList({
  search,
  isLoading,
  loadError,
  visibleBlocks,
  onSearchChange,
  onCreate,
  onEdit,
}: BlockListProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle>Blocks & buildings</CardTitle>
          </div>
          <Button onClick={onCreate}>
            <PlusIcon />
            Add block
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Field orientation="horizontal">
          <Input
            id="block-search"
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tower A, podium, annex"
          />
          <Button>Search</Button>
        </Field>

        {loadError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm leading-6 text-destructive">
            {loadError}
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid gap-4">
            {[0, 1, 2].map((item) => (
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

        {!isLoading && !loadError && visibleBlocks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-10 text-center">
            <p className="text-sm font-medium">
              No blocks match the current search.
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Adjust the filter or create the first block for this residence.
            </p>
          </div>
        ) : null}

        {!isLoading && !loadError && visibleBlocks.length > 0 ? (
          <div className="grid gap-4">
            {visibleBlocks.map((block) => (
              <Card key={block.id}>
                <CardContent className="flex flex-col gap-5 py-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div>
                      <p className="text-base font-semibold">{block.name}</p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {block.description ?? "No description added yet."}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Last updated {formatTimestamp(block.updated_at)}.
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        onEdit(block.id)
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

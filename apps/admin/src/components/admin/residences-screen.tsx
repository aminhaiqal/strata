import { useEffect, useState, type FormEvent } from "react"
import { useRouter } from "@tanstack/react-router"

import {
  adminApiJson,
  UnauthorizedApiError,
} from "@/lib/auth"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  getErrorMessage,
} from "@/lib/admin-screen-utils"
import { EditResidenceSheet } from "./residences-screen/edit-residence-sheet"
import {
  buildResidencePayload,
  defaultFormState,
  residenceToForm,
} from "./residences-screen/model"
import type {
  ResidenceFormState,
  ResidenceRecord,
} from "./residences-screen/model"
import { ResidenceList } from "./residences-screen/residence-list"
import { ResidenceStats } from "./residences-screen/residence-stats"

export function ResidencesScreen() {
  const router = useRouter()
  const [residences, setResidences] = useState<ResidenceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingResidenceId, setEditingResidenceId] = useState<number | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [form, setForm] = useState(defaultFormState)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitNotice, setSubmitNotice] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadResidences() {
      setIsLoading(true)
      setLoadError(null)

      try {
        const nextResidences =
          await adminApiJson<ResidenceRecord[]>("/admin/residences")

        if (cancelled) {
          return
        }

        setResidences(nextResidences)
      } catch (error) {
        if (cancelled) {
          return
        }

        if (error instanceof UnauthorizedApiError) {
          await router.invalidate()
          await router.navigate({ to: "/login" })
          return
        }

        setLoadError(
          getErrorMessage(error, "Unable to load residence settings."),
        )
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadResidences()

    return () => {
      cancelled = true
    }
  }, [refreshKey, router])

  function handleSheetOpenChange(open: boolean) {
    setIsSheetOpen(open)

    if (!open) {
      setEditingResidenceId(null)
      setIsLoadingDetail(false)
      setForm(defaultFormState)
      setSubmitError(null)
      setIsSubmitting(false)
    }
  }

  function updateForm<K extends keyof ResidenceFormState>(
    key: K,
    value: ResidenceFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function openEditSheet(residenceId: number) {
    setEditingResidenceId(residenceId)
    setIsLoadingDetail(true)
    setSubmitError(null)
    setSubmitNotice(null)
    setIsSheetOpen(true)

    try {
      const residence = await adminApiJson<ResidenceRecord>(
        `/admin/residences/${residenceId}`,
      )
      setForm(residenceToForm(residence))
    } catch (error) {
      if (error instanceof UnauthorizedApiError) {
        await router.invalidate()
        await router.navigate({ to: "/login" })
        return
      }

      setSubmitError(
        getErrorMessage(error, "Unable to load this residence for editing."),
      )
    } finally {
      setIsLoadingDetail(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (editingResidenceId === null) {
      return
    }

    setSubmitError(null)
    setSubmitNotice(null)
    setIsSubmitting(true)

    try {
      await adminApiJson<ResidenceRecord>(
        `/admin/residences/${editingResidenceId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(buildResidencePayload(form)),
        },
      )

      setSubmitNotice(`Residence ${form.name.trim()} updated.`)
      handleSheetOpenChange(false)
      setRefreshKey((current) => current + 1)
    } catch (error) {
      if (error instanceof UnauthorizedApiError) {
        await router.invalidate()
        await router.navigate({ to: "/login" })
        return
      }

      setSubmitError(
        getErrorMessage(error, "Unable to save this residence right now."),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const activeResidencesCount = residences.filter(
    (residence) => residence.status === "active",
  ).length

  return (
    <div className="space-y-6">
      <ResidenceStats
        isLoading={isLoading}
        totalResidences={residences.length}
        activeResidencesCount={activeResidencesCount}
      />

      {submitNotice ? (
        <Card className="border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20">
          <CardContent className="py-4 text-sm text-emerald-800 dark:text-emerald-300">
            {submitNotice}
          </CardContent>
        </Card>
      ) : null}

      <ResidenceList
        isLoading={isLoading}
        loadError={loadError}
        residences={residences}
        onEdit={(residenceId) => {
          void openEditSheet(residenceId)
        }}
      />

      <EditResidenceSheet
        open={isSheetOpen}
        form={form}
        isLoadingDetail={isLoadingDetail}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onOpenChange={handleSheetOpenChange}
        onSubmit={handleSubmit}
        onFormChange={updateForm}
      />
    </div>
  )
}

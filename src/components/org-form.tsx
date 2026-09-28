"use client"

import { useActionState } from "react"

import { createOrganization, type OrgState } from "@/app/orgs/actions"
import { Field, FormNote } from "@/components/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function OrgForm() {
  const [state, formAction, pending] = useActionState<OrgState, FormData>(
    createOrganization,
    null,
  )

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Organization name" htmlFor="new-org-name">
        <Input id="new-org-name" name="name" required minLength={2} />
      </Field>
      <FormNote message={state?.error} />
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Creating…" : "Create organization"}
      </Button>
    </form>
  )
}

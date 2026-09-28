"use client"

import { useActionState } from "react"

import { updateProfile, type ProfileState } from "@/app/account/actions"
import { Field, FormNote } from "@/components/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function ProfileForm({ displayName }: { displayName: string }) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    updateProfile,
    null,
  )

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Display name" htmlFor="displayName">
        <Input id="displayName" name="displayName" defaultValue={displayName} required />
      </Field>
      <FormNote message={state?.error} />
      <FormNote message={state?.saved ? "Saved." : undefined} tone="muted" />
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  )
}

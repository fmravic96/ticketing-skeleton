"use client"

import { useActionState } from "react"

import { updateProfile, type ProfileState } from "@/app/account/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ProfileForm({ displayName }: { displayName: string }) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    updateProfile,
    null,
  )

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          name="displayName"
          defaultValue={displayName}
          required
        />
      </div>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state?.saved ? <p className="text-sm text-muted-foreground">Saved.</p> : null}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  )
}

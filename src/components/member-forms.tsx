"use client"

import { useActionState } from "react"

import { inviteMember, renameOrganization, type OrgState } from "@/app/orgs/actions"
import { Field, FormNote, Select } from "@/components/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { OrgRole } from "@/lib/org"

export function RenameOrgForm({ name }: { name: string }) {
  const [state, formAction, pending] = useActionState<OrgState, FormData>(
    renameOrganization,
    null,
  )

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Name" htmlFor="org-name">
        <Input id="org-name" name="name" defaultValue={name} required minLength={2} />
      </Field>
      <FormNote message={state?.error} />
      <FormNote message={state?.message} tone="muted" />
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Save name"}
      </Button>
    </form>
  )
}

export function InviteMemberForm({ role }: { role: OrgRole }) {
  const [state, formAction, pending] = useActionState<OrgState, FormData>(inviteMember, null)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" required />
      </Field>
      <Field label="Role" htmlFor="role">
        <Select id="role" name="role" defaultValue="member">
          <option value="member">Member</option>
          {role === "owner" ? <option value="admin">Admin</option> : null}
        </Select>
      </Field>
      <FormNote message={state?.error} />
      <FormNote message={state?.message} tone="muted" />
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Sending…" : "Add or invite"}
      </Button>
    </form>
  )
}

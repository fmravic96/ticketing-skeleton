"use client"

import { useActionState } from "react"

import { signIn, signUp, type AuthState } from "@/app/auth/actions"
import { Field, FormNote } from "@/components/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function AuthForm({
  mode,
  nextPath,
}: {
  mode: "sign-in" | "sign-up"
  nextPath?: string
}) {
  const action = mode === "sign-in" ? signIn : signUp
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, null)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {mode === "sign-up" ? (
        <>
          <Field label="Organization" htmlFor="organizationName">
            <Input
              id="organizationName"
              name="organizationName"
              autoComplete="organization"
              required
              minLength={2}
            />
          </Field>
          <Field label="Your name" htmlFor="displayName">
            <Input id="displayName" name="displayName" autoComplete="name" />
          </Field>
        </>
      ) : null}
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          minLength={6}
          required
        />
      </Field>
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
      <FormNote message={state?.error} />
      <Button type="submit" disabled={pending}>
        {pending ? "Working…" : mode === "sign-in" ? "Sign in" : "Create account"}
      </Button>
    </form>
  )
}

"use client"

import { useActionState } from "react"

import { signIn, signUp, type AuthState } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
        <div className="flex flex-col gap-2">
          <Label htmlFor="displayName">Display name</Label>
          <Input id="displayName" name="displayName" autoComplete="name" />
        </div>
      ) : null}
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          minLength={6}
          required
        />
      </div>
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Working…" : mode === "sign-in" ? "Sign in" : "Create account"}
      </Button>
    </form>
  )
}

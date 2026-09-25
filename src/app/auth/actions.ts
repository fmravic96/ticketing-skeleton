"use server"

import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

export type AuthState = { error: string } | null

function safeNext(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "/events"
  if (value.startsWith("/events") || value.startsWith("/account")) return value
  return "/events"
}

export async function signUp(_state: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")
  const displayName = String(formData.get("displayName") ?? "").trim()

  if (!email || password.length < 6) {
    return { error: "Use a valid email and a password of at least 6 characters." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: displayName ? { display_name: displayName } : undefined,
    },
  })

  if (error) return { error: error.message }
  redirect("/events")
}

export async function signIn(_state: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")
  const next = safeNext(formData.get("next"))

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }
  redirect(next)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/")
}

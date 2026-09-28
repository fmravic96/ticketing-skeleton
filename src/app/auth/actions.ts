"use server"

import { redirect } from "next/navigation"

import { cookies } from "next/headers"

import { getClaims } from "@/lib/auth"
import { clearCurrentOrg, currentOrgCookie, listMemberships, setCurrentOrg } from "@/lib/org"
import { createClient } from "@/lib/supabase/server"

export type AuthState = { error: string } | null

function safeNext(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/events"
  }
  if (
    value.startsWith("/events") ||
    value.startsWith("/members") ||
    value.startsWith("/account")
  ) {
    return value
  }
  return "/events"
}

async function rememberOrg() {
  const claims = await getClaims()
  if (!claims?.sub) return
  const memberships = await listMemberships(claims.sub)
  const existing = (await cookies()).get(currentOrgCookie)?.value
  const chosen =
    memberships.find((membership) => membership.slug === existing) ??
    memberships.find((membership) => membership.role === "owner") ??
    memberships[0]
  if (chosen) await setCurrentOrg(chosen.slug)
}

export async function signUp(_state: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")
  const displayName = String(formData.get("displayName") ?? "").trim()
  const organizationName = String(formData.get("organizationName") ?? "").trim()

  if (!email || password.length < 6) {
    return { error: "Use a valid email and a password of at least 6 characters." }
  }
  if (organizationName.length < 2) {
    return { error: "Organization name must be at least 2 characters." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        organization_name: organizationName,
        ...(displayName ? { display_name: displayName } : {}),
      },
    },
  })

  if (error) return { error: error.message }
  await rememberOrg()
  redirect("/events")
}

export async function signIn(_state: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")
  const next = safeNext(formData.get("next"))

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }
  await rememberOrg()
  redirect(next)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  await clearCurrentOrg()
  redirect("/")
}

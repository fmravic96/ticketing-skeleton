import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

export async function getClaims() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  return data?.claims ?? null
}

export async function requireUser() {
  const claims = await getClaims()
  if (!claims?.sub) redirect("/login")
  return claims
}
